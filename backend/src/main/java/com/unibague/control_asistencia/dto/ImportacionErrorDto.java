package com.unibague.control_asistencia.dto;

public record ImportacionErrorDto(
        int numeroFila,
        String codigo,
        String motivo
) {
}
