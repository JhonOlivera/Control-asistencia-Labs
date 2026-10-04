package com.unibague.control_asistencia.dto;

import java.util.List;

public record HistorialEstudianteDto(
        Long id,
        String nombre,
        String codigo,
        List<SesionHistorialDto> sesiones,
        List<PorcentajeCursoDto> porcentajesPorCurso
) {
}
