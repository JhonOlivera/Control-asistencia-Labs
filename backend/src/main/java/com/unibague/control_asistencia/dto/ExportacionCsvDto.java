package com.unibague.control_asistencia.dto;

public record ExportacionCsvDto(
        String nombreArchivo,
        byte[] contenido
) {
}
