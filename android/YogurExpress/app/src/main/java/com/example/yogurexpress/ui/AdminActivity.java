package com.example.yogurexpress.ui;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.google.android.material.button.MaterialButton;

public class AdminActivity extends AppCompatActivity {

    private MaterialButton btnProductos, btnInventario, btnPromos, btnCerrarSesion;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);

        btnProductos = findViewById(R.id.btnProductos);
        btnInventario = findViewById(R.id.btnInventario);
        btnPromos = findViewById(R.id.btnPromos);
        btnCerrarSesion = findViewById(R.id.btnCerrarSesion);

        btnProductos.setOnClickListener(v -> {
            startActivity(new Intent(this, ListProductsActivity.class));
        });

        btnInventario.setOnClickListener(v -> {
            startActivity(new Intent(this, InventoryActivity.class));
        });

        btnPromos.setOnClickListener(v -> {
            startActivity(new Intent(this, PromotionsActivity.class));
        });

        btnCerrarSesion.setOnClickListener(v -> {
            SharedPreferences prefs = getSharedPreferences("APP_PREFS", MODE_PRIVATE);
            prefs.edit().clear().apply();
            Intent i = new Intent(this, LoginActivity.class);
            i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(i);
        });
    }
}
