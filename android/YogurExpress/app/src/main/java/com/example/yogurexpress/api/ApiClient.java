package com.example.yogurexpress.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import com.example.yogurexpress.models.AdminSummary;
import com.example.yogurexpress.models.Inventario;
import com.example.yogurexpress.models.Order;
import com.example.yogurexpress.models.Producto;
import com.example.yogurexpress.models.Promotion;
import com.example.yogurexpress.models.Usuario;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;

public class ApiClient {
    private static final String PREFS = "APP_PREFS";
    private static final String KEY_TOKEN = "auth_token";
    private static final String KEY_USER = "auth_user";
    private static final String BASE_URL = "http://10.0.2.2:3000/api";

    private final OkHttpClient client;
    private final Gson gson = new Gson();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final SharedPreferences prefs;

    public interface AuthCallback {
        void onSuccess(Usuario user);
        void onError(String msg);
    }
    public interface ProductsCallback {
        void onSuccess(List<Producto> productos);
        void onError(String msg);
    }
    public interface ProductCallback {
        void onSuccess(Producto producto);
        void onError(String msg);
    }
    public interface InventoryCallback {
        void onSuccess(List<Inventario> inventario);
        void onError(String msg);
    }
    public interface SimpleCallback {
        void onSuccess();
        void onError(String msg);
    }
    public interface PromotionsCallback {
        void onSuccess(List<Promotion> promotions);
        void onError(String msg);
    }
    public interface OrdersCallback {
        void onSuccess(List<Order> orders);
        void onError(String msg);
    }
    public interface OrderCallback {
        void onSuccess(Order order);
        void onError(String msg);
    }
    public interface SummaryCallback {
        void onSuccess(AdminSummary summary);
        void onError(String msg);
    }

    public ApiClient(Context ctx) {
        HttpLoggingInterceptor log = new HttpLoggingInterceptor();
        log.level(HttpLoggingInterceptor.Level.BODY);
        client = new OkHttpClient.Builder()
                .addInterceptor(log)
                .build();
        prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public Usuario getSavedUser() {
        String json = prefs.getString(KEY_USER, null);
        return json != null ? gson.fromJson(json, Usuario.class) : null;
    }

    private void saveSession(String token, Usuario user) {
        prefs.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_USER, gson.toJson(user))
                .apply();
    }

    public void clearSession() {
        prefs.edit().remove(KEY_TOKEN).remove(KEY_USER).apply();
    }

    private Headers authHeaders() {
        Headers.Builder hb = new Headers.Builder();
        hb.add("Content-Type", "application/json");
        String token = getToken();
        if (token != null) {
            hb.add("Authorization", "Bearer " + token);
        }
        return hb.build();
    }

    public void login(String email, String password, AuthCallback cb) {
        JsonObject payload = new JsonObject();
        payload.addProperty("email", email);
        payload.addProperty("password", password);
        Request req = new Request.Builder()
                .url(BASE_URL + "/auth/login")
                .post(RequestBody.create(payload.toString(), MediaType.get("application/json")))
                .build();
        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                main.post(() -> cb.onError(e.getMessage()));
            }
            @Override public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    main.post(() -> cb.onError("Credenciales inválidas"));
                    return;
                }
                String body = response.body().string();
                JsonObject obj = gson.fromJson(body, JsonObject.class);
                Usuario user = gson.fromJson(obj.get("user"), Usuario.class);
                if (user == null || user.getRol() == null || !"admin".equalsIgnoreCase(user.getRol())) {
                    main.post(() -> cb.onError("Se requiere rol administrador"));
                    return;
                }
                String token = obj.get("token").getAsString();
                saveSession(token, user);
                main.post(() -> cb.onSuccess(user));
            }
        });
    }

    // ─── Productos ───────────────────────────────────────────
    public void getProducts(ProductsCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/products")
                .headers(authHeaders())
                .get().build();
        enqueueList(req, new TypeToken<List<Producto>>(){}.getType(), cb);
    }

    public void createProduct(Producto p, ProductCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/products")
                .headers(authHeaders())
                .post(RequestBody.create(gson.toJson(p), MediaType.get("application/json")))
                .build();
        enqueueSingle(req, Producto.class, cb);
    }

    public void updateProduct(Producto p, ProductCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/products/" + p.getId_producto())
                .headers(authHeaders())
                .put(RequestBody.create(gson.toJson(p), MediaType.get("application/json")))
                .build();
        enqueueSingle(req, Producto.class, cb);
    }

    public void deleteProduct(Long id, SimpleCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/products/" + id)
                .headers(authHeaders())
                .delete()
                .build();
        enqueueVoid(req, cb);
    }

    // ─── Inventario ──────────────────────────────────────────
    public void getInventory(InventoryCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/inventory")
                .headers(authHeaders())
                .get().build();
        enqueueList(req, new TypeToken<List<Inventario>>(){}.getType(), cb);
    }

    public void updateInventory(Inventario inv, InventoryCallback cb) {
        JsonObject payload = new JsonObject();
        payload.addProperty("cantidad_disponible", inv.getCantidad_disponible());
        Request req = new Request.Builder()
                .url(BASE_URL + "/inventory/" + inv.getId_producto())
                .headers(authHeaders())
                .put(RequestBody.create(payload.toString(), MediaType.get("application/json")))
                .build();

        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                main.post(() -> cb.onError(e.getMessage()));
            }
            @Override public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    main.post(() -> cb.onError("HTTP " + response.code()));
                    return;
                }
                String body = response.body().string();
                Inventario updated = gson.fromJson(body, Inventario.class);
                main.post(() -> cb.onSuccess(java.util.Collections.singletonList(updated)));
            }
        });
    }

    // ─── Pedidos ─────────────────────────────────────────────
    public void getPendingOrders(OrdersCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/orders/pending")
                .headers(authHeaders())
                .get().build();
        enqueueList(req, new TypeToken<List<Order>>(){}.getType(), cb);
    }

    public void updateOrderStatus(long id, String status, OrderCallback cb) {
        JsonObject payload = new JsonObject();
        payload.addProperty("status", status);
        Request req = new Request.Builder()
                .url(BASE_URL + "/orders/" + id + "/status")
                .headers(authHeaders())
                .patch(RequestBody.create(payload.toString(), MediaType.get("application/json")))
                .build();
        enqueueSingle(req, Order.class, cb);
    }

    public void getAdminSummary(SummaryCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/orders/admin/summary")
                .headers(authHeaders())
                .get().build();
        enqueueSingle(req, AdminSummary.class, cb);
    }

    // ─── Promociones ─────────────────────────────────────────
    public void getPromotions(PromotionsCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/promotions")
                .headers(authHeaders())
                .get().build();
        enqueueList(req, new TypeToken<List<Promotion>>(){}.getType(), cb);
    }

    public void createPromotion(Promotion p, PromotionsCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/promotions")
                .headers(authHeaders())
                .post(RequestBody.create(gson.toJson(p), MediaType.get("application/json")))
                .build();
        enqueueList(req, new TypeToken<List<Promotion>>(){}.getType(), cb);
    }

    public void updatePromotion(Promotion p, PromotionsCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/promotions/" + p.getId_promocion())
                .headers(authHeaders())
                .put(RequestBody.create(gson.toJson(p), MediaType.get("application/json")))
                .build();
        enqueueList(req, new TypeToken<List<Promotion>>(){}.getType(), cb);
    }

    public void deletePromotion(Long id, SimpleCallback cb) {
        Request req = new Request.Builder()
                .url(BASE_URL + "/promotions/" + id)
                .headers(authHeaders())
                .delete()
                .build();
        enqueueVoid(req, cb);
    }

    // ─── Helpers ─────────────────────────────────────────────
    private <T> void enqueueList(Request req, Type type, Object cbObj) {
        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                main.post(() -> dispatchError(cbObj, e.getMessage()));
            }
            @Override public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    main.post(() -> dispatchError(cbObj, "HTTP " + response.code()));
                    return;
                }
                String body = response.body().string();
                List<T> list = gson.fromJson(body, type);
                main.post(() -> dispatchList(cbObj, list));
            }
        });
    }

    private <T> void enqueueSingle(Request req, Class<T> clazz, Object cbObj) {
        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                main.post(() -> dispatchError(cbObj, e.getMessage()));
            }
            @Override public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    main.post(() -> dispatchError(cbObj, "HTTP " + response.code()));
                    return;
                }
                String body = response.body().string();
                T obj = gson.fromJson(body, clazz);
                main.post(() -> dispatchSingle(cbObj, obj));
            }
        });
    }

    private void enqueueVoid(Request req, SimpleCallback cb) {
        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                main.post(() -> cb.onError(e.getMessage()));
            }
            @Override public void onResponse(Call call, Response response) {
                if (!response.isSuccessful()) {
                    main.post(() -> cb.onError("HTTP " + response.code()));
                } else {
                    main.post(cb::onSuccess);
                }
            }
        });
    }

    @SuppressWarnings("unchecked")
    private <T> void dispatchList(Object cbObj, List<T> list) {
        if (cbObj instanceof ProductsCallback) {
            ((ProductsCallback) cbObj).onSuccess((List<Producto>) list);
        } else if (cbObj instanceof InventoryCallback) {
            ((InventoryCallback) cbObj).onSuccess((List<Inventario>) list);
        } else if (cbObj instanceof PromotionsCallback) {
            ((PromotionsCallback) cbObj).onSuccess((List<Promotion>) list);
        } else if (cbObj instanceof OrdersCallback) {
            ((OrdersCallback) cbObj).onSuccess((List<Order>) list);
        }
    }

    private void dispatchSingle(Object cbObj, Object obj) {
        if (cbObj instanceof ProductCallback) {
            ((ProductCallback) cbObj).onSuccess((Producto) obj);
        } else if (cbObj instanceof OrderCallback) {
            ((OrderCallback) cbObj).onSuccess((Order) obj);
        } else if (cbObj instanceof SummaryCallback) {
            ((SummaryCallback) cbObj).onSuccess((AdminSummary) obj);
        }
    }

    private void dispatchError(Object cbObj, String msg) {
        if (cbObj instanceof ProductsCallback) {
            ((ProductsCallback) cbObj).onError(msg);
        } else if (cbObj instanceof InventoryCallback) {
            ((InventoryCallback) cbObj).onError(msg);
        } else if (cbObj instanceof PromotionsCallback) {
            ((PromotionsCallback) cbObj).onError(msg);
        } else if (cbObj instanceof OrdersCallback) {
            ((OrdersCallback) cbObj).onError(msg);
        } else if (cbObj instanceof OrderCallback) {
            ((OrderCallback) cbObj).onError(msg);
        } else if (cbObj instanceof ProductCallback) {
            ((ProductCallback) cbObj).onError(msg);
        } else if (cbObj instanceof SummaryCallback) {
            ((SummaryCallback) cbObj).onError(msg);
        }
    }
}
