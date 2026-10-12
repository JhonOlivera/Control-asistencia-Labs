package com.unibague.control_asistencia.dto;

public record LaboratorioResponseDto(
        Long id,
        String nombre,
        String ubicacion,
        int capacidad,
        String horarioDisponible,
        String estado
) {
}
