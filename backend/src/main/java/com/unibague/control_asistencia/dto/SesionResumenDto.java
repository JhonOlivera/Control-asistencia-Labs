package com.unibague.control_asistencia.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record SesionResumenDto(
        Long id,
        Long cursoId,
        String cursoNombre,
        String cursoGrupo,
        Long laboratorioId,
        String laboratorioNombre,
        LocalDate fecha,
        LocalTime hora,
        String tema,
        String estado,
        long estudiantesMarcados
) {
}
