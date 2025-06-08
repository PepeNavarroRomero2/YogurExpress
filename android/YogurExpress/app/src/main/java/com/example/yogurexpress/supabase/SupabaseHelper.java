package com.example.yogurexpress.supabase;

import android.os.Handler;
import android.os.Looper;

import com.example.yogurexpress.models.Inventario;
import com.example.yogurexpress.models.Promotion;
import com.example.yogurexpress.models.Producto;
import com.example.yogurexpress.models.Usuario;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.UnknownHostException;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.Headers;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class SupabaseHelper {
    private static final String SUPABASE_URL = "https://lhiqakhxftxgtsxogbvn.supabase.co";
    private static final String ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoaXFha2h4ZnR4Z3RzeG9nYnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MzgwNTAsImV4cCI6MjA2MjIxNDA1MH0.h71lUMqw4-giLER9KOLpzmFlxkBMHLxRHsRjVhrGGyY";

    private final OkHttpClient client = new OkHttpClient();
    private final Gson gson = new Gson();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    // --- Auth callback ---
    public interface AuthTableCallback {
        void onSuccess(Usuario user);
        void onError(String errorMessage);
    }

    // --- Productos callbacks ---
    public interface ProductosCallback {
        void onSuccess(List<Producto> productos);
        void onError(String errorMessage);
    }
    public interface InsertCallback {
        void onSuccess();
        void onError(String errorMessage);
    }
    public interface UpdateCallback {
        void onSuccess();
        void onError(String errorMessage);
    }
    public interface DeleteCallback {
        void onSuccess();
        void onError(String errorMessage);
    }

    // --- Inventario callbacks ---
    public interface InventarioCallback {
        void onSuccess(List<Inventario> items);
        void onError(String errorMessage);
    }
    public interface UpdateInventoryCallback {
        void onSuccess();
        void onError(String errorMessage);
    }

    // --- Promociones callbacks ---
    public interface PromotionsCallback {
        void onSuccess(List<Promotion> promotions);
        void onError(String errorMessage);
    }
    public interface InsertPromotionCallback {
        void onSuccess();
        void onError(String errorMessage);
    }
    public interface UpdatePromotionCallback {
        void onSuccess();
        void onError(String errorMessage);
    }
    public interface DeletePromotionCallback {
        void onSuccess();
        void onError(String errorMessage);
    }

    // --- LOGIN contra tabla usuarios ---
    public void loginTable(String email, String password, AuthTableCallback cb) {
        HttpUrl url = HttpUrl.parse(SUPABASE_URL + "/rest/v1/usuarios")
                .newBuilder()
                .addQueryParameter("select", "id_usuario,nombre,email,rol,puntos")
                .addQueryParameter("email",    "eq." + email)
                .addQueryParameter("contraseña","eq." + password)
                .build();

        Request req = new Request.Builder()
                .url(url)
                .headers(Headers.of(
                        "apikey",        ANON_KEY,
                        "Authorization", "Bearer " + ANON_KEY,
                        "Accept",        "application/json"
                ))
                .get()
                .build();

        client.newCall(req).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                String msg = (e instanceof UnknownHostException)
                        ? "Comprueba tu conexión a Internet."
                        : e.getMessage();
                mainHandler.post(() -> cb.onError(msg));
            }
            @Override public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    mainHandler.post(() -> cb.onError("HTTP " + response.code()));
                    return;
                }
                String body = response.body().string();
                Type listType = new TypeToken<List<Usuario>>(){}.getType();
                List<Usuario> lista = gson.fromJson(body, listType);
                if (lista.isEmpty()) {
                    mainHandler.post(() -> cb.onError("Credenciales inválidas"));
                } else {
                    Usuario u = lista.get(0);
                    if (!"admin".equalsIgnoreCase(u.getRol())) {
                        mainHandler.post(() -> cb.onError("No eres administrador"));
                    } else {
                        mainHandler.post(() -> cb.onSuccess(u));
                    }
                }
            }
        });
    }

    // --- PRODUCTOS ---
    public void fetchProductos(ProductosCallback cb) {
        HttpUrl url = HttpUrl.parse(SUPABASE_URL + "/rest/v1/productos")
                .newBuilder().addQueryParameter("select","*").build();
        Request req = new Request.Builder()
                .url(url)
                .headers(jsonHeaders())
                .get().build();
        client.newCall(req).enqueue(wrapList(cb, new TypeToken<List<Producto>>(){}.getType()));
    }

    public void insertProducto(Producto p, InsertCallback cb) {
        postJson("/rest/v1/productos", gson.toJson(p), cb);
    }
    public void updateProducto(Producto p, UpdateCallback cb) {
        JsonObject obj = new JsonObject();
        obj.addProperty("nombre", p.getNombre());
        obj.addProperty("tipo",   p.getTipo());
        obj.addProperty("precio", p.getPrecio());
        if (p.getDescripcion()!=null) obj.addProperty("descripcion", p.getDescripcion());
        if (p.getAlergenos()!=null)   obj.addProperty("alergenos",   p.getAlergenos());
        if (p.getImagen_url()!=null)  obj.addProperty("imagen_url",  p.getImagen_url());

        postJson(
                "/rest/v1/productos?id_producto=eq." + p.getId_producto(),
                gson.toJson(obj),
                cb,
                "PATCH",
                "Prefer", "return=representation"
        );
    }
    public void deleteProducto(Long id, DeleteCallback cb) {
        postJson("/rest/v1/productos?id_producto=eq." + id, "", cb, "DELETE");
    }

    // --- INVENTARIO ---
    public void fetchInventario(InventarioCallback cb) {
        HttpUrl url = HttpUrl.parse(SUPABASE_URL + "/rest/v1/inventario")
                .newBuilder()
                .addQueryParameter("select","id_producto,cantidad_disponible,productos(nombre)")
                .build();
        Request req = new Request.Builder()
                .url(url)
                .headers(jsonHeaders())
                .get().build();
        client.newCall(req).enqueue(wrapList(cb, new TypeToken<List<Inventario>>(){}.getType()));
    }
    public void updateInventario(Inventario inv, UpdateInventoryCallback cb) {
        JsonObject obj = new JsonObject();
        obj.addProperty("cantidad_disponible", inv.getCantidad_disponible());
        postJson(
                "/rest/v1/inventario?id_producto=eq." + inv.getId_producto(),
                gson.toJson(obj),
                cb,
                "PATCH"
        );
    }

    // --- PROMOCIONES ---
    public void fetchPromotions(PromotionsCallback cb) {
        HttpUrl url = HttpUrl.parse(SUPABASE_URL + "/rest/v1/promociones")
                .newBuilder().addQueryParameter("select","*").build();
        Request req = new Request.Builder()
                .url(url)
                .headers(jsonHeaders())
                .get().build();
        client.newCall(req).enqueue(wrapList(cb, new TypeToken<List<Promotion>>(){}.getType()));
    }
    public void insertPromotion(Promotion p, InsertPromotionCallback cb) {
        postJson("/rest/v1/promociones", gson.toJson(p), cb);
    }
    public void updatePromotion(Promotion p, UpdatePromotionCallback cb) {
        JsonObject obj = new JsonObject();
        obj.addProperty("codigo",      p.getCodigo());
        obj.addProperty("descripcion", p.getDescripcion());
        obj.addProperty("descuento",   p.getDescuento());
        obj.addProperty("condiciones", p.getCondiciones());

        postJson(
                "/rest/v1/promociones?id_promocion=eq." + p.getId_promocion(),
                gson.toJson(obj),
                cb,
                "PATCH",
                "Prefer", "return=representation"
        );
    }
    public void deletePromotion(Long id, DeletePromotionCallback cb) {
        postJson("/rest/v1/promociones?id_promocion=eq." + id, "", cb, "DELETE");
    }

    // --- Helpers ---
    private Headers jsonHeaders() {
        return Headers.of(
                "apikey",        ANON_KEY,
                "Authorization", "Bearer " + ANON_KEY,
                "Accept",        "application/json"
        );
    }

    private <T> Callback wrapList(Object cbObj, Type type) {
        return new Callback() {
            @Override public void onFailure(Call c, IOException e) {
                String msg = (e instanceof UnknownHostException)
                        ? "Comprueba tu conexión."
                        : e.getMessage();
                mainHandler.post(() -> {
                    if (cbObj instanceof ProductosCallback) {
                        ((ProductosCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof InventarioCallback) {
                        ((InventarioCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof PromotionsCallback) {
                        ((PromotionsCallback) cbObj).onError(msg);
                    }
                });
            }
            @Override public void onResponse(Call c, Response r) throws IOException {
                if (!r.isSuccessful()) {
                    String msg = "HTTP " + r.code();
                    mainHandler.post(() -> {
                        if (cbObj instanceof ProductosCallback) {
                            ((ProductosCallback) cbObj).onError(msg);
                        } else if (cbObj instanceof InventarioCallback) {
                            ((InventarioCallback) cbObj).onError(msg);
                        } else if (cbObj instanceof PromotionsCallback) {
                            ((PromotionsCallback) cbObj).onError(msg);
                        }
                    });
                    return;
                }
                String body = r.body().string();
                Object list = gson.fromJson(body, type);
                mainHandler.post(() -> {
                    if (cbObj instanceof ProductosCallback) {
                        ((ProductosCallback) cbObj).onSuccess((List<Producto>) list);
                    } else if (cbObj instanceof InventarioCallback) {
                        ((InventarioCallback) cbObj).onSuccess((List<Inventario>) list);
                    } else if (cbObj instanceof PromotionsCallback) {
                        ((PromotionsCallback) cbObj).onSuccess((List<Promotion>) list);
                    }
                });
            }
        };
    }

    // 3-arg overload para POST por defecto
    private void postJson(String path, String jsonBody, Object cbObj) {
        postJson(path, jsonBody, cbObj, "POST");
    }

    // Método general con varargs de headers y método HTTP
    private void postJson(
            String path,
            String jsonBody,
            Object cbObj,
            String method,
            String... extraHeaderPairs
    ) {
        Headers.Builder hb = new Headers.Builder()
                .add("apikey",        ANON_KEY)
                .add("Authorization", "Bearer " + ANON_KEY)
                .add("Content-Type",  "application/json");
        for (int i = 0; i+1 < extraHeaderPairs.length; i += 2) {
            hb.add(extraHeaderPairs[i], extraHeaderPairs[i+1]);
        }
        RequestBody body = jsonBody.isEmpty()
                ? RequestBody.create(new byte[0], null)
                : RequestBody.create(jsonBody, MediaType.get("application/json"));

        HttpUrl url = HttpUrl.parse(SUPABASE_URL + path).newBuilder().build();
        Request.Builder rb = new Request.Builder()
                .url(url)
                .headers(hb.build());

        switch (method) {
            case "PATCH":  rb.patch(body); break;
            case "DELETE": rb.delete();    break;
            default:       rb.post(body);  break;
        }

        client.newCall(rb.build()).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                String msg = (e instanceof UnknownHostException)
                        ? "Comprueba tu conexión."
                        : e.getMessage();
                mainHandler.post(() -> {
                    if (cbObj instanceof InsertCallback) {
                        ((InsertCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof UpdateCallback) {
                        ((UpdateCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof DeleteCallback) {
                        ((DeleteCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof UpdateInventoryCallback) {
                        ((UpdateInventoryCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof InsertPromotionCallback) {
                        ((InsertPromotionCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof UpdatePromotionCallback) {
                        ((UpdatePromotionCallback) cbObj).onError(msg);
                    } else if (cbObj instanceof DeletePromotionCallback) {
                        ((DeletePromotionCallback) cbObj).onError(msg);
                    }
                });
            }
            @Override public void onResponse(Call call, Response response) {
                mainHandler.post(() -> {
                    if (cbObj instanceof InsertCallback) {
                        ((InsertCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof UpdateCallback) {
                        ((UpdateCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof DeleteCallback) {
                        ((DeleteCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof UpdateInventoryCallback) {
                        ((UpdateInventoryCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof InsertPromotionCallback) {
                        ((InsertPromotionCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof UpdatePromotionCallback) {
                        ((UpdatePromotionCallback) cbObj).onSuccess();
                    } else if (cbObj instanceof DeletePromotionCallback) {
                        ((DeletePromotionCallback) cbObj).onSuccess();
                    }
                });
            }
        });
    }
}
