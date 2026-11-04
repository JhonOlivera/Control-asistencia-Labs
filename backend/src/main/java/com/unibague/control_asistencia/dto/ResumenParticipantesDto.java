package com.unibague.control_asistencia.dto;

public record ResumenParticipantesDto(
        long matriculados,
        long presentes,
        long tarde,
        long ausentes
) {
}
