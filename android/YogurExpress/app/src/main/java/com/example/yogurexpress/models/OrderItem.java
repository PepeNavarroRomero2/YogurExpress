package com.example.yogurexpress.models;

import java.io.Serializable;

public class OrderItem implements Serializable {
    private Long id_producto;
    private Integer cantidad;
    private Double precio_unit;
    private Producto producto;

    public Long getId_producto() { return id_producto; }
    public void setId_producto(Long id_producto) { this.id_producto = id_producto; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Double getPrecio_unit() { return precio_unit; }
    public void setPrecio_unit(Double precio_unit) { this.precio_unit = precio_unit; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
}
