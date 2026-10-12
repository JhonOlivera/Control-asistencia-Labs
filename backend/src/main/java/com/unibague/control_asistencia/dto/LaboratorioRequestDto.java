package com.unibague.control_asistencia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public class LaboratorioRequestDto {

    private static final String HORARIO_REGEX =
            "^([A-Z]{3})-([A-Z]{3})\\s+(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$";

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @NotBlank(message = "La ubicación es obligatoria")
    private String ubicacion;

    @Positive(message = "La capacidad debe ser mayor que 0")
    private int capacidad;

    @NotBlank(message = "El horario disponible es obligatorio")
    @Pattern(
            regexp = HORARIO_REGEX,
            message = "El formato del horario debe ser, por ejemplo, LUN-VIE 07:00-18:00"
    )
    private String horarioDisponible;

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public int getCapacidad() {
        return capacidad;
    }

    public void setCapacidad(int capacidad) {
        this.capacidad = capacidad;
    }

    public String getHorarioDisponible() {
        return horarioDisponible;
    }

    public void setHorarioDisponible(String horarioDisponible) {
        this.horarioDisponible = horarioDisponible;
    }
}
