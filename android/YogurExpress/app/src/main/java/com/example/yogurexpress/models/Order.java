package com.example.yogurexpress.models;

import java.io.Serializable;
import java.util.List;

public class Order implements Serializable {
    private Long id_pedido;
    private String codigo_pedido;
    private String hora_recogida;
    private String fecha_hora;
    private String estado;
    private Double total;
    private List<OrderItem> items;

    public Long getId_pedido() { return id_pedido; }
    public void setId_pedido(Long id_pedido) { this.id_pedido = id_pedido; }

    public String getCodigo_pedido() { return codigo_pedido; }
    public void setCodigo_pedido(String codigo_pedido) { this.codigo_pedido = codigo_pedido; }

    public String getHora_recogida() { return hora_recogida; }
    public void setHora_recogida(String hora_recogida) { this.hora_recogida = hora_recogida; }

    public String getFecha_hora() { return fecha_hora; }
    public void setFecha_hora(String fecha_hora) { this.fecha_hora = fecha_hora; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
