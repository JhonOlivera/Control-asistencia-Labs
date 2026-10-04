package com.unibague.control_asistencia.dto;

public record UsuarioAutenticadoDto(
        Long id,
        String correo,
        String nombre,
        String rol
) {
}
