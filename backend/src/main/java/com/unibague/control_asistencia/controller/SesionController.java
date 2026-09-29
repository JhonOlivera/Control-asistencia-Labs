package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.dto.SesionResponseDto;
import com.unibague.control_asistencia.service.SesionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sesiones")
public class SesionController {

    private final SesionService sesionService;

    public SesionController(SesionService sesionService) {
        this.sesionService = sesionService;
    }

    @PostMapping
    public ResponseEntity<SesionResponseDto> crearSesion(@Valid @RequestBody SesionRequestDto request) {
        SesionResponseDto response = sesionService.crearSesion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{id}/cerrar")
    public ResponseEntity<SesionResponseDto> cerrarSesion(@PathVariable Long id) {
        SesionResponseDto response = sesionService.cerrarSesion(id);
        return ResponseEntity.ok(response);
    }
}
