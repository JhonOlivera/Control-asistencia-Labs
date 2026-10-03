package com.unibague.control_asistencia.dto;

import com.unibague.control_asistencia.model.enums.EstadoAsistencia;

public record AsistenciaResponseDto(
        String nombreEstudiante,
        String laboratorio,
        EstadoAsistencia estadoRegistrado,
        String mensaje
) {
}
