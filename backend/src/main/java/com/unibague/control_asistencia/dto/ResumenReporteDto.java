package com.unibague.control_asistencia.dto;

import java.util.List;

public record ResumenReporteDto(
        long totalSesiones,
        double asistenciaPromedio,
        long totalEstudiantes,
        List<EstudianteEnRiesgoDto> estudiantesEnRiesgo
) {
}
