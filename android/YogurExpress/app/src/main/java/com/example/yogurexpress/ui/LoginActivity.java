package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.example.yogurexpress.R;
import com.example.yogurexpress.api.ApiClient;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText etEmail, etPassword;
    private MaterialButton btnLogin;
    private ApiClient api;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        api = new ApiClient(this);

        btnLogin.setOnClickListener(v -> {
            String email = etEmail.getText() != null ? etEmail.getText().toString().trim() : "";
            String pass = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";
            if (email.isEmpty() || pass.isEmpty()) {
                Toast.makeText(this, "Introduce email y contraseña", Toast.LENGTH_SHORT).show();
                return;
            }
            btnLogin.setEnabled(false);
            api.login(email, pass, new ApiClient.AuthCallback() {
                @Override public void onSuccess(com.example.yogurexpress.models.Usuario user) {
                    btnLogin.setEnabled(true);
                    goToAdmin();
                }
                @Override public void onError(String msg) {
                    btnLogin.setEnabled(true);
                    Toast.makeText(LoginActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            });
        });
    }

    private void goToAdmin() {
        Intent intent = new Intent(this, AdminActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        moveTaskToBack(true);
    }
}
