package com.example.yogurexpress.models;

import java.io.Serializable;
import java.util.List;

public class AdminSummary implements Serializable {
    private int pending;
    private int ready;
    private int completedToday;
    private List<Inventario> lowStock;

    public int getPending() { return pending; }
    public void setPending(int pending) { this.pending = pending; }

    public int getReady() { return ready; }
    public void setReady(int ready) { this.ready = ready; }

    public int getCompletedToday() { return completedToday; }
    public void setCompletedToday(int completedToday) { this.completedToday = completedToday; }

    public List<Inventario> getLowStock() { return lowStock; }
    public void setLowStock(List<Inventario> lowStock) { this.lowStock = lowStock; }
}
