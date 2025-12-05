package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.text.TextUtils;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Producto;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;

public class AddProductActivity extends AppCompatActivity {

    private TextInputEditText etName, etPrice, etDesc, etAllergens, etImageUrl;
    private Spinner spinnerType;
    private MaterialButton btnSubmit;
    private ApiClient api;
    private Producto editing;
    private ArrayAdapter<String> typeAdapter;
    private final List<String> types = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_product);

        etName      = findViewById(R.id.etName);
        etPrice     = findViewById(R.id.etPrice);
        etDesc      = findViewById(R.id.etDescription);
        etAllergens = findViewById(R.id.etAllergens);
        etImageUrl  = findViewById(R.id.etImageUrl);
        spinnerType = findViewById(R.id.spinnerType);
        btnSubmit   = findViewById(R.id.btnSubmit);

        api = new ApiClient(this);

        typeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, types);
        spinnerType.setAdapter(typeAdapter);
        loadTypes();

        if (getIntent().hasExtra("producto")) {
            editing = (Producto) getIntent().getSerializableExtra("producto");
            if (editing != null) {
                if (editing.getNombre() != null) etName.setText(editing.getNombre());
                if (editing.getPrecio() != null) etPrice.setText(String.valueOf(editing.getPrecio()));
                if (editing.getDescripcion() != null) etDesc.setText(editing.getDescripcion());
                if (editing.getAlergenos() != null) etAllergens.setText(editing.getAlergenos());
                if (editing.getImagen_url() != null) etImageUrl.setText(editing.getImagen_url());
                btnSubmit.setText("Guardar Cambios");
            }
        }

        btnSubmit.setOnClickListener(v -> {
            String nombre = etName.getText() != null ? etName.getText().toString().trim() : "";
            String tipo = spinnerType.getSelectedItem() != null ? spinnerType.getSelectedItem().toString() : "";
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
            String allergensInput = etAllergens.getText() != null ? etAllergens.getText().toString().trim() : "";
            p.setAlergenos(allergensInput.isEmpty() ? null : allergensInput);
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

    private void loadTypes() {
        api.getProductTypes(new ApiClient.ProductTypesCallback() {
            @Override public void onSuccess(List<String> typeList) {
                types.clear();
                if (typeList != null) types.addAll(typeList);
                if (types.isEmpty()) {
                    // fallback default tipos conocidos
                    types.add("sabor");
                    types.add("topping");
                    types.add("tamano");
                }
                runOnUiThread(() -> {
                    typeAdapter.notifyDataSetChanged();
                    if (editing != null && editing.getTipo() != null) {
                        int pos = types.indexOf(editing.getTipo());
                        if (pos >= 0) spinnerType.setSelection(pos);
                    }
                });
            }

            @Override public void onError(String msg) {
                runOnUiThread(() -> {
                    Toast.makeText(AddProductActivity.this,
                            "No se pudieron cargar los tipos: " + msg,
                            Toast.LENGTH_LONG).show();
                    if (types.isEmpty()) {
                        types.add("sabor");
                        types.add("topping");
                        types.add("tamano");
                        typeAdapter.notifyDataSetChanged();
                        if (editing != null && editing.getTipo() != null) {
                            int pos = types.indexOf(editing.getTipo());
                            if (pos >= 0) spinnerType.setSelection(pos);
                        }
                    }
                });
            }
        });
    }
}
