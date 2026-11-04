package com.unibague.control_asistencia.dto;

import java.util.List;

public record ImportacionEstudiantesResponseDto(
        int totalFilas,
        int creados,
        int yaExistentes,
        int matriculados,
        List<ImportacionErrorDto> errores
) {
}
