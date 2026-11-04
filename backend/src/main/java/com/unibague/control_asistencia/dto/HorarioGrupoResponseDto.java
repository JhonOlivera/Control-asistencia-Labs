package com.unibague.control_asistencia.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record HorarioGrupoResponseDto(
        Long id,
        Long cursoId,
        String cursoNombre,
        String cursoGrupo,
        Long laboratorioId,
        String laboratorioNombre,
        DayOfWeek diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin,
        boolean activo
) {
}
