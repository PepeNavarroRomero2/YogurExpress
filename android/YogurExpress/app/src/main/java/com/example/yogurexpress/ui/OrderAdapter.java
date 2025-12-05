package com.example.yogurexpress.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Order;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class OrderAdapter extends RecyclerView.Adapter<OrderAdapter.OrderVH> {

    public interface OnOrderClick {
        void onClick(Order order);
    }

    private final List<Order> items = new ArrayList<>();
    private final OnOrderClick listener;

    public OrderAdapter(OnOrderClick listener) {
        this.listener = listener;
    }

    public void setItems(List<Order> orders) {
        items.clear();
        if (orders != null) items.addAll(orders);
        notifyDataSetChanged();
    }

    public Order getItem(int pos) { return items.get(pos); }

    @NonNull
    @Override
    public OrderVH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_order, parent, false);
        return new OrderVH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull OrderVH holder, int position) {
        Order o = items.get(position);
        holder.tvCode.setText(o.getCodigo_pedido());
        holder.tvStatus.setText(o.getEstado());
        holder.tvPickup.setText(o.getHora_recogida());
        holder.tvTotal.setText(String.format(Locale.getDefault(), "%.2f €", o.getTotal()));
        holder.itemView.setOnClickListener(v -> listener.onClick(o));
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class OrderVH extends RecyclerView.ViewHolder {
        TextView tvCode, tvStatus, tvPickup, tvTotal;
        public OrderVH(@NonNull View itemView) {
            super(itemView);
            tvCode = itemView.findViewById(R.id.tvOrderCode);
            tvStatus = itemView.findViewById(R.id.tvOrderStatus);
            tvPickup = itemView.findViewById(R.id.tvOrderPickup);
            tvTotal = itemView.findViewById(R.id.tvOrderTotal);
        }
    }
}
