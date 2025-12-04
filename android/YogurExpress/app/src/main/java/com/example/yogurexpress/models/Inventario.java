package com.example.yogurexpress.models;

import java.io.Serializable;

public class Inventario implements Serializable {
    private Long id_producto;
    private Integer cantidad_disponible;
    private Producto productos;
    private String productName;

    public Inventario() {}

    public Long getId_producto() {
        return id_producto;
    }
    public void setId_producto(Long id_producto) {
        this.id_producto = id_producto;
    }

    public Integer getCantidad_disponible() {
        return cantidad_disponible;
    }
    public void setCantidad_disponible(Integer cantidad_disponible) {
        this.cantidad_disponible = cantidad_disponible;
    }

    public Producto getProductos() {
        return productos;
    }
    public void setProductos(Producto productos) {
        this.productos = productos;
    }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getNombre() {
        if (productName != null) return productName;
        return productos != null ? productos.getNombre() : "";
    }
}
