package com.unibague.control_asistencia.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record SesionPorFechaDto(
        Long sesionId,
        Long cursoId,
        String cursoNombre,
        String cursoGrupo,
        Long laboratorioId,
        String laboratorioNombre,
        LocalDate fecha,
        LocalTime horaInicio,
        String estado,
        long presentes,
        long tarde,
        long ausentes
) {
}
