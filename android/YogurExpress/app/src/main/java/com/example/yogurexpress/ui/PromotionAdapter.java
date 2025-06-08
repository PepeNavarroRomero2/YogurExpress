package com.example.yogurexpress.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.yogurexpress.R;
import com.example.yogurexpress.models.Promotion;

import java.util.List;

public class PromotionAdapter extends RecyclerView.Adapter<PromotionAdapter.VH> {

    public interface OnItemClickListener {
        void onItemClick(Promotion promo);
    }

    private List<Promotion> items;
    private OnItemClickListener listener;

    public PromotionAdapter(List<Promotion> items, OnItemClickListener listener) {
        this.items = items;
        this.listener = listener;
    }

    /** Permite acceder a la lista desde fuera */
    public List<Promotion> getItems() {
        return items;
    }

    public void updateData(List<Promotion> newItems) {
        this.items = newItems;
        notifyDataSetChanged();
    }

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_promotion, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        Promotion p = items.get(position);
        holder.code.setText(p.getCodigo());
        holder.desc.setText(p.getDescripcion());
        holder.discount.setText(String.format("Descuento: %.2f%%", p.getDescuento()));
        holder.conditions.setText(p.getCondiciones());
        holder.itemView.setOnClickListener(v -> listener.onItemClick(p));
    }

    @Override public int getItemCount() {
        return items != null ? items.size() : 0;
    }

    static class VH extends RecyclerView.ViewHolder {
        TextView code, desc, discount, conditions;
        VH(@NonNull View itemView) {
            super(itemView);
            code       = itemView.findViewById(R.id.tvPromoCode);
            desc       = itemView.findViewById(R.id.tvPromoDesc);
            discount   = itemView.findViewById(R.id.tvPromoDiscount);
            conditions = itemView.findViewById(R.id.tvPromoConditions);
        }
    }
}
