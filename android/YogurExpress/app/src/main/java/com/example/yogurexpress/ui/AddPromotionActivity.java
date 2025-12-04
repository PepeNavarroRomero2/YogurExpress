package com.example.yogurexpress.ui;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.example.yogurexpress.models.Promotion;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class AddPromotionActivity extends AppCompatActivity {

    private TextInputEditText etCode, etDesc, etDiscount, etCond;
    private MaterialButton btnSave;
    private ApiClient api;
    private Promotion editing;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_promotion);

        etCode = findViewById(R.id.etCode);
        etDesc = findViewById(R.id.etDescriptionPromo);
        etDiscount = findViewById(R.id.etDiscount);
        etCond = findViewById(R.id.etConditions);
        btnSave = findViewById(R.id.btnSavePromo);
        api = new ApiClient(this);

        if (getIntent().hasExtra("promo")) {
            editing = (Promotion) getIntent().getSerializableExtra("promo");
            etCode.setText(editing.getCodigo());
            etDesc.setText(editing.getDescripcion());
            etDiscount.setText(String.valueOf(editing.getDescuento()));
            etCond.setText(editing.getCondiciones());
            btnSave.setText("Guardar cambios");
        }

        btnSave.setOnClickListener(v -> {
            String code = etCode.getText().toString().trim();
            String discountStr = etDiscount.getText().toString().trim();
            if (code.isEmpty() || discountStr.isEmpty()) {
                Toast.makeText(this, "Código y descuento son obligatorios", Toast.LENGTH_SHORT).show();
                return;
            }
            double discount = Double.parseDouble(discountStr);
            Promotion p = editing != null ? editing : new Promotion();
            p.setCodigo(code);
            p.setDescripcion(etDesc.getText().toString());
            p.setDescuento(discount);
            p.setCondiciones(etCond.getText().toString());

            ApiClient.PromotionsCallback callback = new ApiClient.PromotionsCallback() {
                @Override public void onSuccess(java.util.List<Promotion> promotions) {
                    Toast.makeText(AddPromotionActivity.this,
                            "Promoción guardada", Toast.LENGTH_SHORT).show();
                    finish();
                }
                @Override public void onError(String msg) {
                    Toast.makeText(AddPromotionActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            };

            if (editing != null) {
                api.updatePromotion(p, callback);
            } else {
                api.createPromotion(p, callback);
            }
        });
    }
}
