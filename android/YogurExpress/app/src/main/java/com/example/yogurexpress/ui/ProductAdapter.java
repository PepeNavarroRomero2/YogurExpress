package com.example.yogurexpress.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Producto;

import java.util.List;

public class ProductAdapter extends RecyclerView.Adapter<ProductAdapter.VH> {

    private List<Producto> items;
    private OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(Producto p);
    }

    public ProductAdapter(List<Producto> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    public List<Producto> getItems() { return items; }

    public void updateData(List<Producto> newItems) {
        this.items = newItems;
        notifyDataSetChanged();
    }

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_product, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        Producto p = items.get(position);
        holder.name.setText(p.getNombre());
        holder.type.setText(p.getTipo());
        holder.price.setText(String.format("€ %.2f", p.getPrecio()));
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onItemClick(p);
        });
    }

    @Override public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class VH extends RecyclerView.ViewHolder {
        TextView name, type, price;
        VH(@NonNull View itemView) {
            super(itemView);
            name  = itemView.findViewById(R.id.tvProductName);
            type  = itemView.findViewById(R.id.tvProductType);
            price = itemView.findViewById(R.id.tvProductPrice);
        }
    }
}
