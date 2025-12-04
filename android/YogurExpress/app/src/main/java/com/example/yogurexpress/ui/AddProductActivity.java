package com.example.yogurexpress.ui;

import android.os.Bundle;
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
            etName.setText(editing.getNombre());
            etType.setText(editing.getTipo());
            etPrice.setText(editing.getPrecio().toString());
            etDesc.setText(editing.getDescripcion());
            etAllergens.setText(editing.getAlergenos());
            etImageUrl.setText(editing.getImagen_url());
            btnSubmit.setText("Guardar Cambios");
        }

        btnSubmit.setOnClickListener(v -> {
            if (etName.getText().toString().isEmpty() ||
                    etType.getText().toString().isEmpty() ||
                    etPrice.getText().toString().isEmpty()) {
                Toast.makeText(this, "Nombre, Tipo y Precio son obligatorios", Toast.LENGTH_SHORT).show();
                return;
            }

            Producto p = (editing != null) ? editing : new Producto();
            p.setNombre(etName.getText().toString());
            p.setTipo(etType.getText().toString());
            p.setPrecio(Double.parseDouble(etPrice.getText().toString()));
            p.setDescripcion(etDesc.getText().toString());
            p.setAlergenos(etAllergens.getText().toString());
            p.setImagen_url(etImageUrl.getText().toString());

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
