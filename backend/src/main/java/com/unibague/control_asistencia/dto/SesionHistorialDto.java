package com.unibague.control_asistencia.dto;

import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import java.time.LocalDate;
import java.time.LocalTime;

public record SesionHistorialDto(
        Long sesionId,
        LocalDate fecha,
        LocalTime hora,
        String curso,
        String laboratorio,
        EstadoAsistencia estado
) {
}
