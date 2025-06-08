// app/src/main/java/com/example/yogurexpress/ui/InventoryAdapter.java
package com.example.yogurexpress.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Inventario;

import java.util.List;

public class InventoryAdapter extends RecyclerView.Adapter<InventoryAdapter.VH> {

    private List<Inventario> items;
    public interface OnQtyClickListener {
        void onQtyClick(Inventario inv);
    }
    private OnQtyClickListener listener;

    public InventoryAdapter(List<Inventario> items, OnQtyClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    public void updateData(List<Inventario> newItems) {
        this.items = newItems;
        notifyDataSetChanged();
    }

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_inventory, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        Inventario inv = items.get(position);
        holder.name.setText(inv.getNombre());
        holder.qty.setText(inv.getCantidad_disponible().toString());
        holder.qty.setOnClickListener(v -> listener.onQtyClick(inv));
    }

    @Override public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class VH extends RecyclerView.ViewHolder {
        TextView name, qty;
        VH(@NonNull View itemView) {
            super(itemView);
            name = itemView.findViewById(R.id.tvInvName);
            qty  = itemView.findViewById(R.id.tvInvQty);
        }
    }
}
