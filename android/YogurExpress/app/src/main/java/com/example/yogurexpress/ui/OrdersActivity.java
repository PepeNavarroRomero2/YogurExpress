package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Order;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class OrdersActivity extends AppCompatActivity {

    private ApiClient api;
    private OrderAdapter adapter;
    private List<Order> all = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_orders);

        api = new ApiClient(this);
        RecyclerView rv = findViewById(R.id.rvOrders);
        rv.setLayoutManager(new LinearLayoutManager(this));
        adapter = new OrderAdapter(order -> {
            Intent i = new Intent(this, OrderDetailActivity.class);
            i.putExtra("order", order);
            startActivity(i);
        });
        rv.setAdapter(adapter);

        Spinner spinner = findViewById(R.id.spinnerEstado);
        ArrayAdapter<String> spAdapter = new ArrayAdapter<>(this,
                android.R.layout.simple_spinner_dropdown_item,
                new String[]{"todos", "pendiente", "listo", "completado", "rechazado"});
        spinner.setAdapter(spAdapter);
        findViewById(R.id.btnFiltrar).setOnClickListener(v -> applyFilter(spinner.getSelectedItem().toString()));

        findViewById(R.id.btnBack).setOnClickListener(v -> finish());
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadOrders();
    }

    private void loadOrders() {
        api.getPendingOrders(new ApiClient.OrdersCallback() {
            @Override public void onSuccess(List<Order> orders) {
                all = orders;
                adapter.setItems(orders);
            }
            @Override public void onError(String msg) {
                Toast.makeText(OrdersActivity.this, msg, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void applyFilter(String estado) {
        if (estado.equals("todos")) {
            adapter.setItems(all);
        } else {
            List<Order> filtered = all.stream()
                    .filter(o -> estado.equalsIgnoreCase(o.getEstado()))
                    .collect(Collectors.toList());
            adapter.setItems(filtered);
        }
    }
}
