package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.AdminSummary;

import java.util.stream.Collectors;

public class AdminActivity extends AppCompatActivity {

    private ApiClient api;
    private TextView tvPending, tvReady, tvCompleted, tvLowStock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);

        api = new ApiClient(this);
        tvPending = findViewById(R.id.tvPending);
        tvReady = findViewById(R.id.tvReady);
        tvCompleted = findViewById(R.id.tvCompleted);
        tvLowStock = findViewById(R.id.tvLowStock);

        findViewById(R.id.btnProductos).setOnClickListener(v ->
                startActivity(new Intent(this, ListProductsActivity.class)));
        findViewById(R.id.btnInventario).setOnClickListener(v ->
                startActivity(new Intent(this, InventoryActivity.class)));
        findViewById(R.id.btnPromos).setOnClickListener(v ->
                startActivity(new Intent(this, PromotionsActivity.class)));
        findViewById(R.id.btnPedidos).setOnClickListener(v ->
                startActivity(new Intent(this, OrdersActivity.class)));

        findViewById(R.id.btnCerrarSesion).setOnClickListener(v -> {
            api.clearSession();
            Intent i = new Intent(this, LoginActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadSummary();
    }

    private void loadSummary() {
        api.getAdminSummary(new ApiClient.SummaryCallback() {
            @Override public void onSuccess(AdminSummary summary) {
                tvPending.setText("Pendientes: " + summary.getPending());
                tvReady.setText("Listos: " + summary.getReady());
                tvCompleted.setText("Completados hoy: " + summary.getCompletedToday());
                if (summary.getLowStock() != null && !summary.getLowStock().isEmpty()) {
                    String names = summary.getLowStock().stream()
                            .map(i -> i.getNombre() + " (" + i.getCantidad_disponible() + ")")
                            .collect(Collectors.joining(", "));
                    tvLowStock.setText("Stock bajo: " + names);
                } else {
                    tvLowStock.setText("Stock bajo: sin alertas");
                }
            }
            @Override public void onError(String msg) {
                Toast.makeText(AdminActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }
}
