package com.example.yogurexpress.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.OrderItem;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class OrderItemsAdapter extends RecyclerView.Adapter<OrderItemsAdapter.ItemVH> {

    private final List<OrderItem> items = new ArrayList<>();

    public OrderItemsAdapter(List<OrderItem> data) {
        if (data != null) items.addAll(data);
    }

    @NonNull
    @Override
    public ItemVH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_order_product, parent, false);
        return new ItemVH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ItemVH holder, int position) {
        OrderItem item = items.get(position);
        holder.tvName.setText(item.getProducto() != null ? item.getProducto().getNombre() : "Producto");
        holder.tvQty.setText("x" + item.getCantidad());
        holder.tvPrice.setText(String.format(Locale.getDefault(), "%.2f €", item.getPrecio_unit()));
    }

    @Override
    public int getItemCount() { return items.size(); }

    static class ItemVH extends RecyclerView.ViewHolder {
        TextView tvName, tvQty, tvPrice;
        ItemVH(@NonNull View itemView) {
            super(itemView);
            tvName = itemView.findViewById(R.id.tvItemName);
            tvQty = itemView.findViewById(R.id.tvItemQty);
            tvPrice = itemView.findViewById(R.id.tvItemPrice);
        }
    }
}
