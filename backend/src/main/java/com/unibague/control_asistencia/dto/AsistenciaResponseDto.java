package com.unibague.control_asistencia.dto;

import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import java.time.LocalDateTime;

public record AsistenciaResponseDto(
        String nombreEstudiante,
        String laboratorio,
        EstadoAsistencia estadoRegistrado,
        LocalDateTime horaRegistro,
        String mensaje
) {
}
