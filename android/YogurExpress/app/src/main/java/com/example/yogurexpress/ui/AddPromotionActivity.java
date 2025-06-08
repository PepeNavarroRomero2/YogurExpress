package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Promotion;
import com.example.yogurexpress.supabase.SupabaseHelper;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class AddPromotionActivity extends AppCompatActivity {

    private TextInputEditText etCode, etDescription, etDiscount, etConditions;
    private MaterialButton btnSubmit;
    private SupabaseHelper supa;
    private Promotion editing;  // Será no nulo si estamos editando

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_promotion);

        etCode        = findViewById(R.id.etCode);
        etDescription = findViewById(R.id.etDescription);
        etDiscount    = findViewById(R.id.etDiscount);
        etConditions  = findViewById(R.id.etConditions);
        btnSubmit     = findViewById(R.id.btnSubmitPromo);

        supa = new SupabaseHelper();

        // Si venimos con una promoción, es edición
        if (getIntent().hasExtra("promotion")) {
            editing = (Promotion) getIntent().getSerializableExtra("promotion");

            if (editing != null) {
                etCode.setText(editing.getCodigo());
                etDescription.setText(editing.getDescripcion());
                etDiscount.setText(String.valueOf(editing.getDescuento()));
                etConditions.setText(editing.getCondiciones());
                btnSubmit.setText("Guardar Cambios");
            }
        }

        // Guardar o actualizar
        btnSubmit.setOnClickListener(v -> {
            String code = etCode.getText().toString().trim();
            String desc = etDescription.getText().toString().trim();
            String disc = etDiscount.getText().toString().trim();
            String cond = etConditions.getText().toString().trim();

            if (code.isEmpty() || disc.isEmpty()) {
                Toast.makeText(this, "Código y descuento son obligatorios", Toast.LENGTH_SHORT).show();
                return;
            }

            double descuento;
            try {
                descuento = Double.parseDouble(disc);
            } catch (NumberFormatException e) {
                Toast.makeText(this, "Descuento inválido", Toast.LENGTH_SHORT).show();
                return;
            }

            Promotion p = (editing != null) ? editing : new Promotion();
            p.setCodigo(code);
            p.setDescripcion(desc);
            p.setDescuento(descuento);
            p.setCondiciones(cond);

            if (editing != null) {
                // Editar
                supa.updatePromotion(p, new SupabaseHelper.UpdatePromotionCallback() {
                    @Override public void onSuccess() {
                        runOnUiThread(() -> {
                            Toast.makeText(AddPromotionActivity.this, "Promoción actualizada", Toast.LENGTH_LONG).show();
                            finish();
                        });
                    }
                    @Override public void onError(String msg) {
                        runOnUiThread(() -> Toast.makeText(AddPromotionActivity.this, "Error: " + msg, Toast.LENGTH_LONG).show());
                    }
                });
            } else {
                // Crear
                supa.insertPromotion(p, new SupabaseHelper.InsertPromotionCallback() {
                    @Override public void onSuccess() {
                        runOnUiThread(() -> {
                            Toast.makeText(AddPromotionActivity.this, "Promoción añadida", Toast.LENGTH_LONG).show();
                            finish();
                        });
                    }

                    @Override public void onError(String msg) {
                        runOnUiThread(() -> Toast.makeText(AddPromotionActivity.this, "Error: " + msg, Toast.LENGTH_LONG).show());
                    }
                });
            }
        });
    }
}
