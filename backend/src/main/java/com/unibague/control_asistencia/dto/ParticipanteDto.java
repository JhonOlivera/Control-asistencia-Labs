package com.unibague.control_asistencia.dto;

import java.time.LocalDateTime;

/**
 * estadoMatricula es ACTIVA o INACTIVA (según Estudiante.activo); asistencia es
 * PRESENTE, TARDE o AUSENTE (AUSENTE = matriculado sin registro en la sesión).
 */
public record ParticipanteDto(
        Long estudianteId,
        String codigo,
        String nombre,
        String correo,
        String estadoMatricula,
        String asistencia,
        LocalDateTime horaRegistro
) {
}
