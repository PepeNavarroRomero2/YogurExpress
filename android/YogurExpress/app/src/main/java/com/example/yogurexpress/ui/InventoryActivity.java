package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Inventario;
import com.example.yogurexpress.supabase.SupabaseHelper;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.util.ArrayList;
import java.util.List;

public class InventoryActivity extends AppCompatActivity {

    private SupabaseHelper supa;
    private RecyclerView rv;
    private InventoryAdapter adapter;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        setContentView(R.layout.activity_inventory);

        MaterialToolbar toolbar = findViewById(R.id.topAppBarInventory);

        toolbar.setNavigationOnClickListener(v -> finish());

        rv    = findViewById(R.id.rvInventory);
        supa  = new SupabaseHelper();

        adapter = new InventoryAdapter(new ArrayList<>(), inv -> {
            EditText input = new EditText(this);
            input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            input.setText(inv.getCantidad_disponible().toString());

            new MaterialAlertDialogBuilder(this)
                    .setTitle("Editar cantidad")
                    .setView(input)
                    .setPositiveButton("Guardar", (d,i) -> {
                        inv.setCantidad_disponible(
                                Integer.parseInt(input.getText().toString()));
                        supa.updateInventario(inv, new SupabaseHelper.UpdateInventoryCallback() {
                            @Override public void onSuccess() {
                                runOnUiThread(() -> {
                                    Toast.makeText(InventoryActivity.this,
                                            "Cantidad actualizada", Toast.LENGTH_SHORT).show();
                                    loadInventory();
                                });
                            }
                            @Override public void onError(String err) {
                                runOnUiThread(() ->
                                        Toast.makeText(InventoryActivity.this,
                                                "Error: " + err, Toast.LENGTH_LONG).show());
                            }
                        });
                    })
                    .setNegativeButton("Cancelar", null)
                    .show();
        });

        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadInventory();
    }

    private void loadInventory() {
        supa.fetchInventario(new SupabaseHelper.InventarioCallback() {
            @Override public void onSuccess(List<Inventario> items) {
                adapter.updateData(items);
            }
            @Override public void onError(String e) {
                Toast.makeText(InventoryActivity.this, e, Toast.LENGTH_LONG).show();
            }
        });
    }
}
