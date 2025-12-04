package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.text.TextUtils;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Producto;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class AddProductActivity extends AppCompatActivity {

    private TextInputEditText etName, etType, etPrice, etDesc, etAllergens, etImageUrl;
    private MaterialButton btnSubmit;
    private ApiClient api;
    private Producto editing;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_product);

        etName      = findViewById(R.id.etName);
        etType      = findViewById(R.id.etType);
        etPrice     = findViewById(R.id.etPrice);
        etDesc      = findViewById(R.id.etDescription);
        etAllergens = findViewById(R.id.etAllergens);
        etImageUrl  = findViewById(R.id.etImageUrl);
        btnSubmit   = findViewById(R.id.btnSubmit);

        api = new ApiClient(this);

        if (getIntent().hasExtra("producto")) {
            editing = (Producto) getIntent().getSerializableExtra("producto");
            if (editing != null) {
                if (editing.getNombre() != null) etName.setText(editing.getNombre());
                if (editing.getTipo() != null) etType.setText(editing.getTipo());
                if (editing.getPrecio() != null) etPrice.setText(String.valueOf(editing.getPrecio()));
                if (editing.getDescripcion() != null) etDesc.setText(editing.getDescripcion());
                if (editing.getAlergenos() != null) etAllergens.setText(editing.getAlergenos());
                if (editing.getImagen_url() != null) etImageUrl.setText(editing.getImagen_url());
                btnSubmit.setText("Guardar Cambios");
            }
        }

        btnSubmit.setOnClickListener(v -> {
            String nombre = etName.getText() != null ? etName.getText().toString().trim() : "";
            String tipo = etType.getText() != null ? etType.getText().toString().trim() : "";
            String precioStr = etPrice.getText() != null ? etPrice.getText().toString().trim() : "";

            if (TextUtils.isEmpty(nombre) || TextUtils.isEmpty(tipo) || TextUtils.isEmpty(precioStr)) {
                Toast.makeText(this, "Nombre, Tipo y Precio son obligatorios", Toast.LENGTH_SHORT).show();
                return;
            }

            Double precio;
            try {
                precio = Double.parseDouble(precioStr);
            } catch (NumberFormatException ex) {
                Toast.makeText(this, "Precio inválido", Toast.LENGTH_SHORT).show();
                return;
            }

            Producto p = (editing != null) ? editing : new Producto();
            p.setNombre(nombre);
            p.setTipo(tipo);
            p.setPrecio(precio);
            p.setDescripcion(etDesc.getText() != null ? etDesc.getText().toString() : "");
            p.setAlergenos(etAllergens.getText() != null ? etAllergens.getText().toString() : "");
            p.setImagen_url(etImageUrl.getText() != null ? etImageUrl.getText().toString() : "");

            if (editing != null) {
                api.updateProduct(p, new ApiClient.ProductCallback() {
                    @Override public void onSuccess(Producto producto) {
                        Toast.makeText(AddProductActivity.this,
                                "Producto actualizado", Toast.LENGTH_LONG).show();
                        finish();
                    }
                    @Override public void onError(String errorMessage) {
                        Toast.makeText(AddProductActivity.this,
                                "Error al actualizar: " + errorMessage, Toast.LENGTH_LONG).show();
                    }
                });
            } else {
                api.createProduct(p, new ApiClient.ProductCallback() {
                    @Override public void onSuccess(Producto producto) {
                        Toast.makeText(AddProductActivity.this,
                                "Producto agregado", Toast.LENGTH_LONG).show();
                        finish();
                    }
                    @Override public void onError(String errorMessage) {
                        Toast.makeText(AddProductActivity.this,
                                "Error al agregar: " + errorMessage, Toast.LENGTH_LONG).show();
                    }
                });
            }
        });
    }
}
