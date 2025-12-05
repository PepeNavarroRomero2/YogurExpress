package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.AdminSummary;
import com.example.yogurexpress.models.Inventario;

import java.util.ArrayList;
import java.util.List;

public class AdminActivity extends AppCompatActivity {

    private ApiClient api;
    private TextView tvPending, tvReady, tvCompleted, tvLowStock;
    private OrderPollingManager orderPollingManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);

        api = new ApiClient(this);
        tvPending = findViewById(R.id.tvPending);
        tvReady = findViewById(R.id.tvReady);
        tvCompleted = findViewById(R.id.tvCompleted);
        tvLowStock = findViewById(R.id.tvLowStock);

        NotificationHelper.createNotificationChannel(this);
        NotificationHelper.requestNotificationPermissionIfNeeded(this);
        orderPollingManager = new OrderPollingManager(this);
        orderPollingManager.setListener(this::loadSummary);

        findViewById(R.id.btnProductos).setOnClickListener(v ->
                startActivity(new Intent(this, ListProductsActivity.class)));
        findViewById(R.id.btnInventario).setOnClickListener(v ->
                startActivity(new Intent(this, InventoryActivity.class)));
        findViewById(R.id.btnPedidos).setOnClickListener(v ->
                startActivity(new Intent(this, OrdersActivity.class)));

        findViewById(R.id.btnCerrarSesion).setOnClickListener(v -> {
            api.clearSession();
            Intent i = new Intent(this, LoginActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
            finish();
        });

        loadSummary();
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadSummary();
        if (orderPollingManager != null) {
            orderPollingManager.start(this);
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (orderPollingManager != null) {
            orderPollingManager.stop();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // No-op: if denied, notifications will simply be skipped
    }

    private void loadSummary() {
        api.getAdminSummary(new ApiClient.SummaryCallback() {
            @Override public void onSuccess(AdminSummary summary) {
                tvPending.setText("Pendientes: " + summary.getPending());
                tvReady.setText("Listos: " + summary.getReady());
                tvCompleted.setText("Completados hoy: " + summary.getCompletedToday());
                List<Inventario> lowStockList = summary.getLowStock();
                if (lowStockList == null) lowStockList = new ArrayList<>();
                if (!lowStockList.isEmpty()) {
                    StringBuilder builder = new StringBuilder();
                    for (int i = 0; i < lowStockList.size(); i++) {
                        Inventario inv = lowStockList.get(i);
                        builder.append(inv.getNombre()).append(" (").append(inv.getCantidad_disponible()).append(")");
                        if (i < lowStockList.size() - 1) {
                            builder.append(", ");
                        }
                    }
                    tvLowStock.setText("Stock bajo: " + builder.toString());
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
