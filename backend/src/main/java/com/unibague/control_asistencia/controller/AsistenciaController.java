package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.AsistenciaResponseDto;
import com.unibague.control_asistencia.service.AsistenciaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/asistencia")
public class AsistenciaController {

    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    @GetMapping("/marcar")
    public ResponseEntity<AsistenciaResponseDto> marcarAsistencia(@RequestParam String token) {
        return ResponseEntity.ok(asistenciaService.marcarAsistencia(token));
    }
}
