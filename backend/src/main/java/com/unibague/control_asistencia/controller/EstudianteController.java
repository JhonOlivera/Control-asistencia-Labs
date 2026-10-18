package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.EstudianteRequestDto;
import com.unibague.control_asistencia.dto.EstudianteResponseDto;
import com.unibague.control_asistencia.service.EstudianteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estudiantes")
public class EstudianteController {

    private final EstudianteService estudianteService;

    public EstudianteController(EstudianteService estudianteService) {
        this.estudianteService = estudianteService;
    }

    @GetMapping
    public ResponseEntity<List<EstudianteResponseDto>> listarEstudiantes(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Boolean activo
    ) {
        return ResponseEntity.ok(estudianteService.listarEstudiantes(texto, activo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstudianteResponseDto> obtenerEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.obtenerEstudiante(id));
    }

    @PostMapping
    public ResponseEntity<EstudianteResponseDto> crearEstudiante(
            @Valid @RequestBody EstudianteRequestDto request
    ) {
        EstudianteResponseDto response = estudianteService.crearEstudiante(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstudianteResponseDto> actualizarEstudiante(
            @PathVariable Long id,
            @Valid @RequestBody EstudianteRequestDto request
    ) {
        return ResponseEntity.ok(estudianteService.actualizarEstudiante(id, request));
    }

    @PatchMapping("/{id}/inactivar")
    public ResponseEntity<EstudianteResponseDto> inactivarEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.inactivarEstudiante(id));
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<EstudianteResponseDto> activarEstudiante(@PathVariable Long id) {
        return ResponseEntity.ok(estudianteService.activarEstudiante(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarEstudiante(@PathVariable Long id) {
        estudianteService.eliminarEstudiante(id);
        return ResponseEntity.noContent().build();
    }
}
