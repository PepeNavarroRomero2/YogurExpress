package com.example.yogurexpress.ui;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Promotion;
import com.example.yogurexpress.supabase.SupabaseHelper;
import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.util.ArrayList;
import java.util.List;

public class PromotionsActivity extends AppCompatActivity {

    private SupabaseHelper supa;
    private RecyclerView rv;
    private PromotionAdapter adapter;
    private FloatingActionButton fab;

    @Override protected void onCreate(Bundle s) {
        super.onCreate(s);
        setContentView(R.layout.activity_promotions);

        MaterialToolbar toolbar = findViewById(R.id.topAppBarPromo);
        toolbar.setNavigationOnClickListener(v -> finish());

        rv   = findViewById(R.id.rvPromotions);
        supa = new SupabaseHelper();

        adapter = new PromotionAdapter(new ArrayList<>(), promo -> {
            Intent i = new Intent(this, AddPromotionActivity.class);
            i.putExtra("promo", promo);
            startActivity(i);
        });
        rv.setLayoutManager(new LinearLayoutManager(this));
        rv.setAdapter(adapter);

        new ItemTouchHelper(new ItemTouchHelper.SimpleCallback(0,
                ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT) {
            @Override public boolean onMove(RecyclerView r, RecyclerView.ViewHolder v, RecyclerView.ViewHolder t) {
                return false;
            }
            @Override public void onSwiped(RecyclerView.ViewHolder vh, int dir) {
                int pos = vh.getAdapterPosition();
                Promotion p = adapter.getItems().get(pos);
                supa.deletePromotion(p.getId_promocion(), new SupabaseHelper.DeletePromotionCallback() {
                    @Override public void onSuccess() {
                        runOnUiThread(() -> {
                            Toast.makeText(PromotionsActivity.this,
                                    "Promoción borrada", Toast.LENGTH_SHORT).show();
                            loadPromotions();
                        });
                    }
                    @Override public void onError(String e) {
                        runOnUiThread(() -> {
                            Toast.makeText(PromotionsActivity.this,
                                    "Error al borrar: " + e, Toast.LENGTH_LONG).show();
                            adapter.notifyItemChanged(pos);
                        });
                    }
                });
            }
        }).attachToRecyclerView(rv);

        fab = findViewById(R.id.fabAddPromo);
        fab.setOnClickListener(v ->
                startActivity(new Intent(this, AddPromotionActivity.class))
        );
    }

    @Override protected void onResume() {
        super.onResume();
        loadPromotions();
    }

    private void loadPromotions() {
        supa.fetchPromotions(new SupabaseHelper.PromotionsCallback() {
            @Override public void onSuccess(List<Promotion> promos) {
                adapter.updateData(promos);
            }
            @Override public void onError(String e) {
                Toast.makeText(PromotionsActivity.this, e, Toast.LENGTH_LONG).show();
            }
        });
    }
}
