package com.unibague.control_asistencia.dto;

public record UsuarioAutenticadoDto(
        String correo,
        String nombre,
        String rol
) {
}
