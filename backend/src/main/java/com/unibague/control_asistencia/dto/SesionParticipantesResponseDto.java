package com.unibague.control_asistencia.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record SesionParticipantesResponseDto(
        Long sesionId,
        Long cursoId,
        String cursoNombre,
        String cursoGrupo,
        Long laboratorioId,
        String laboratorioNombre,
        LocalDate fecha,
        LocalTime horaInicio,
        String estado,
        ResumenParticipantesDto resumen,
        List<ParticipanteDto> participantes
) {
}
