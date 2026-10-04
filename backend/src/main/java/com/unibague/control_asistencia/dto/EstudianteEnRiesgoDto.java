package com.unibague.control_asistencia.dto;

public record EstudianteEnRiesgoDto(
        Long id,
        String nombre,
        String codigo,
        String curso,
        double porcentaje,
        long sesionesAsistidas,
        long sesionesTotales
) {
}
