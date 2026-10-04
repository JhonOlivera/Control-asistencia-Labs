package com.unibague.control_asistencia.dto;

// porcentaje es null cuando el curso aún no tiene sesiones cerradas.
public record PorcentajeCursoDto(
        Long cursoId,
        String curso,
        Double porcentaje,
        long sesionesAsistidas,
        long sesionesTotales
) {
}
