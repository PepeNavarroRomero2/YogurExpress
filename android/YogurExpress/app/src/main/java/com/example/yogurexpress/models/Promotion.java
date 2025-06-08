package com.example.yogurexpress.models;

import java.io.Serializable;

public class Promotion implements Serializable {
    private Long id_promocion;
    private String codigo;
    private String descripcion;
    private Double descuento;
    private String condiciones;

    public Promotion() {}

    public Long getId_promocion() {
        return id_promocion;
    }
    public void setId_promocion(Long id_promocion) {
        this.id_promocion = id_promocion;
    }

    public String getCodigo() {
        return codigo;
    }
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getDescripcion() {
        return descripcion;
    }
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Double getDescuento() {
        return descuento;
    }
    public void setDescuento(Double descuento) {
        this.descuento = descuento;
    }

    public String getCondiciones() {
        return condiciones;
    }
    public void setCondiciones(String condiciones) {
        this.condiciones = condiciones;
    }
}
