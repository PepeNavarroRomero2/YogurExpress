package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Producto;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.ArrayList;
import java.util.List;

public class ListProductsActivity extends AppCompatActivity {

    private ApiClient api;
    private RecyclerView rv;
    private ProductAdapter adapter;
    private FloatingActionButton fab;

    @Override
    protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_list_products);

        MaterialToolbar toolbar = findViewById(R.id.topAppBarList);
        toolbar.setNavigationOnClickListener(v -> finish());

        rv = findViewById(R.id.rvProducts);
        api = new ApiClient(this);

        adapter = new ProductAdapter(new ArrayList<>(), p -> {
            Intent i = new Intent(this, AddProductActivity.class);
            i.putExtra("producto", p);
            startActivity(i);
        });
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        new ItemTouchHelper(new ItemTouchHelper.SimpleCallback(0,
                ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT) {
            @Override public boolean onMove(RecyclerView rvH, RecyclerView.ViewHolder vh, RecyclerView.ViewHolder t) {
                return false;
            }
            @Override public void onSwiped(RecyclerView.ViewHolder vh, int dir) {
                int pos = vh.getAdapterPosition();
                Producto toDelete = adapter.getItemAt(pos);
                if (toDelete == null || toDelete.getId_producto() == null) {
                    Toast.makeText(ListProductsActivity.this,
                            "No se pudo borrar el producto seleccionado",
                            Toast.LENGTH_LONG).show();
                    adapter.notifyItemChanged(pos);
                    return;
                }
                api.deleteProduct(toDelete.getId_producto(), new ApiClient.SimpleCallback() {
                    @Override public void onSuccess() {
                        runOnUiThread(() -> {
                            Toast.makeText(ListProductsActivity.this,
                                    "Producto borrado", Toast.LENGTH_SHORT).show();
                            loadProducts();
                        });
                    }
                    @Override public void onError(String errorMessage) {
                        runOnUiThread(() -> {
                            Toast.makeText(ListProductsActivity.this,
                                    "Error al borrar: " + errorMessage,
                                    Toast.LENGTH_LONG).show();
                            adapter.notifyItemChanged(pos);
                        });
                    }
                });
            }
        }).attachToRecyclerView(rv);

        fab = findViewById(R.id.fabAddProduct);
        fab.setOnClickListener(v ->
                startActivity(new Intent(this, AddProductActivity.class))
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadProducts();
    }

    private void loadProducts() {
        api.getProducts(new ApiClient.ProductsCallback() {
            @Override public void onSuccess(List<Producto> productos) {
                if (productos == null) productos = new ArrayList<>();
                adapter.updateData(productos);
            }
            @Override public void onError(String e) {
                Toast.makeText(ListProductsActivity.this,
                        e, Toast.LENGTH_LONG).show();
                adapter.updateData(new ArrayList<>());
            }
        });
    }
}
