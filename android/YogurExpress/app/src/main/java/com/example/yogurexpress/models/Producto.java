package com.example.yogurexpress.models;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;

public class Producto implements Serializable {
    @SerializedName("id_producto")
    private Long id_producto;
    @SerializedName("nombre")
    private String nombre;
    @SerializedName("tipo")
    private String tipo;
    @SerializedName("precio")
    private Double precio;
    @SerializedName("descripcion")
    private String descripcion;
    @SerializedName("alergenos")
    private String alergenos;
    @SerializedName("imagen_url")
    private String imagen_url;

    public Producto() {}

    public Long getId_producto() { return id_producto; }
    public void setId_producto(Long id_producto) { this.id_producto = id_producto; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getAlergenos() { return alergenos; }
    public void setAlergenos(String alergenos) { this.alergenos = alergenos; }

    public String getImagen_url() { return imagen_url; }
    public void setImagen_url(String imagen_url) { this.imagen_url = imagen_url; }
}
