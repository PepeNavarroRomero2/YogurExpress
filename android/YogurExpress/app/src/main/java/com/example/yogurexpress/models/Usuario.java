package com.example.yogurexpress.models;

import java.io.Serializable;

public class Usuario implements Serializable {
    private Long id_usuario;
    private String nombre;
    private String email;
    private String contraseña;
    private String rol;
    private Integer puntos;

    public Usuario() {}

    public Long getId_usuario() { return id_usuario; }
    public void setId_usuario(Long id_usuario) { this.id_usuario = id_usuario; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getContraseña() { return contraseña; }
    public void setContraseña(String contraseña) { this.contraseña = contraseña; }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }

    public Integer getPuntos() { return puntos; }
    public void setPuntos(Integer puntos) { this.puntos = puntos; }
}
