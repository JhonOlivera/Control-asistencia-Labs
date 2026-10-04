package com.unibague.control_asistencia.dto;

import java.time.LocalDateTime;

/**
 * Estado de un estudiante en una sesión. {@code estado} es un valor de EstadoAsistencia,
 * o PENDIENTE si el estudiante todavía no ha marcado (en ese caso horaRegistro es null).
 */
public record AsistenciaEstudianteDto(
        Long estudianteId,
        String nombre,
        String codigo,
        String correo,
        String estado,
        LocalDateTime horaRegistro
) {
}
