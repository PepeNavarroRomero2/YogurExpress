package com.example.yogurexpress.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import com.example.yogurexpress.models.AdminSummary;
import com.example.yogurexpress.models.Inventario;
import com.example.yogurexpress.models.Order;
import com.example.yogurexpress.models.Producto;
import com.example.yogurexpress.models.Usuario;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParseException;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Collections;
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
    private static String BASE_URL = "http://192.168.18.165:3000/api";

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

    public static void setBaseUrl(String baseUrl) {
        if (baseUrl != null && !baseUrl.trim().isEmpty()) {
            BASE_URL = baseUrl;
        }
    }

    public static String getBaseUrl() {
        return BASE_URL;
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
                String body = response.body().string();
                if (!response.isSuccessful()) {
                    String serverMsg = "Credenciales inválidas";
                    try {
                        JsonObject err = gson.fromJson(body, JsonObject.class);
                        if (err != null && err.has("error")) serverMsg = err.get("error").getAsString();
                    } catch (Exception ignored) {}
                    final String msg = serverMsg;
                    main.post(() -> cb.onError(msg));
                    return;
                }

                JsonObject obj = gson.fromJson(body, JsonObject.class);
                Usuario user = gson.fromJson(obj.get("user"), Usuario.class);
                String rol = user != null ? user.getRol() : null;
                boolean isAdmin = rol != null && ("admin".equalsIgnoreCase(rol) || "administrador".equalsIgnoreCase(rol));
                if (!isAdmin) {
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
                try {
                    JsonElement element = JsonParser.parseString(body);
                    if (element.isJsonObject()) {
                        JsonObject obj = element.getAsJsonObject();
                        if (obj.has("error")) {
                            String message = obj.get("error").isJsonPrimitive() ? obj.get("error").getAsString() : "Error";
                            main.post(() -> dispatchError(cbObj, message));
                            return;
                        }
                        if (obj.has("data") && obj.get("data").isJsonArray()) {
                            List<T> list = gson.fromJson(obj.get("data"), type);
                            main.post(() -> dispatchList(cbObj, list != null ? list : Collections.emptyList()));
                            return;
                        }
                        if (obj.has("productos") && obj.get("productos").isJsonArray()) {
                            List<T> list = gson.fromJson(obj.get("productos"), type);
                            main.post(() -> dispatchList(cbObj, list != null ? list : Collections.emptyList()));
                            return;
                        }
                        // If object but not wrapped, try parsing entire object as list fallback to empty
                        List<T> list = gson.fromJson(obj, type);
                        main.post(() -> dispatchList(cbObj, list != null ? list : Collections.emptyList()));
                        return;
                    }

                    List<T> list = element.isJsonArray() ? gson.fromJson(element, type) : Collections.emptyList();
                    main.post(() -> dispatchList(cbObj, list != null ? list : Collections.emptyList()));
                } catch (JsonParseException ex) {
                    String parseMsg = (cbObj instanceof ProductsCallback)
                            ? "Error al interpretar productos"
                            : "Error de parseo";
                    main.post(() -> dispatchError(cbObj, parseMsg));
                }
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
                try {
                    T obj = gson.fromJson(body, clazz);
                    main.post(() -> dispatchSingle(cbObj, obj));
                } catch (Exception ex) {
                    main.post(() -> dispatchError(cbObj, "Error de parseo"));
                }
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
