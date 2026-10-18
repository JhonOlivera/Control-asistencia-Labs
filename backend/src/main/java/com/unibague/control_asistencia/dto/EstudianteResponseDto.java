package com.unibague.control_asistencia.dto;

public record EstudianteResponseDto(
        Long id,
        String nombre,
        String correo,
        String codigo,
        boolean activo
) {
}
