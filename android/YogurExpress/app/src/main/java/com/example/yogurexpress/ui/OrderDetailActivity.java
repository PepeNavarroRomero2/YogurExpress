package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Order;
import com.example.yogurexpress.models.OrderItem;

import java.util.Locale;

public class OrderDetailActivity extends AppCompatActivity {

    private Order order;
    private ApiClient api;
    private TextView tvCode, tvPickup, tvEstado, tvTotal, tvAlergenos;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_order_detail);

        api = new ApiClient(this);
        order = (Order) getIntent().getSerializableExtra("order");

        tvCode = findViewById(R.id.tvOrderCodeDetail);
        tvPickup = findViewById(R.id.tvOrderPickupDetail);
        tvEstado = findViewById(R.id.tvOrderEstadoDetail);
        tvTotal = findViewById(R.id.tvOrderTotalDetail);
        tvAlergenos = findViewById(R.id.tvOrderAlergenos);

        RecyclerView rvItems = findViewById(R.id.rvOrderItems);
        rvItems.setLayoutManager(new LinearLayoutManager(this));
        rvItems.setAdapter(new OrderItemsAdapter(order != null ? order.getItems() : null));

        findViewById(R.id.btnRechazar).setOnClickListener(v -> updateStatus("rechazado"));
        findViewById(R.id.btnCompletar).setOnClickListener(v -> updateStatus("completado"));
        findViewById(R.id.btnBackDetail).setOnClickListener(v -> finish());

        bind();
    }

    private void bind() {
        if (order == null) return;
        tvCode.setText(order.getCodigo_pedido());
        tvPickup.setText(order.getHora_recogida());
        tvEstado.setText(order.getEstado());
        tvTotal.setText(String.format(Locale.getDefault(), "%.2f €", order.getTotal()));
        StringBuilder alerg = new StringBuilder();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                String al = item.getProducto() != null ? item.getProducto().getAlergenos() : null;
                if (al != null && !al.isEmpty()) {
                    if (alerg.length() > 0) alerg.append(", ");
                    alerg.append(al);
                }
            }
        }
        tvAlergenos.setText(alerg.length() == 0 ? "Sin alérgenos registrados" : alerg.toString());
    }

    private void updateStatus(String status) {
        if (order == null) return;
        api.updateOrderStatus(order.getId_pedido(), status, new ApiClient.OrderCallback() {
            @Override public void onSuccess(Order updated) {
                order = updated;
                bind();
                Toast.makeText(OrderDetailActivity.this, "Estado actualizado", Toast.LENGTH_SHORT).show();
            }
            @Override public void onError(String msg) {
                Toast.makeText(OrderDetailActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }
}
