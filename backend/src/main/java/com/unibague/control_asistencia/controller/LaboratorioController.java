package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.LaboratorioRequestDto;
import com.unibague.control_asistencia.dto.LaboratorioResponseDto;
import com.unibague.control_asistencia.service.LaboratorioService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/laboratorios")
public class LaboratorioController {

    private final LaboratorioService laboratorioService;

    public LaboratorioController(LaboratorioService laboratorioService) {
        this.laboratorioService = laboratorioService;
    }

    @GetMapping
    public ResponseEntity<List<LaboratorioResponseDto>> listarLaboratorios() {
        return ResponseEntity.ok(laboratorioService.listarLaboratorios());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaboratorioResponseDto> obtenerLaboratorio(@PathVariable Long id) {
        return ResponseEntity.ok(laboratorioService.obtenerLaboratorio(id));
    }

    @PostMapping
    public ResponseEntity<LaboratorioResponseDto> crearLaboratorio(
            @Valid @RequestBody LaboratorioRequestDto request
    ) {
        LaboratorioResponseDto response = laboratorioService.crearLaboratorio(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaboratorioResponseDto> actualizarLaboratorio(
            @PathVariable Long id,
            @Valid @RequestBody LaboratorioRequestDto request
    ) {
        return ResponseEntity.ok(laboratorioService.actualizarLaboratorio(id, request));
    }

    @PatchMapping("/{id}/mantenimiento")
    public ResponseEntity<LaboratorioResponseDto> ponerEnMantenimiento(@PathVariable Long id) {
        return ResponseEntity.ok(laboratorioService.ponerEnMantenimiento(id));
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<LaboratorioResponseDto> activarLaboratorio(@PathVariable Long id) {
        return ResponseEntity.ok(laboratorioService.activarLaboratorio(id));
    }
}
