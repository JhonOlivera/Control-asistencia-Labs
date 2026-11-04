package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.HorarioGrupoRequestDto;
import com.unibague.control_asistencia.dto.HorarioGrupoResponseDto;
import com.unibague.control_asistencia.service.HorarioGrupoService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/horarios-grupo")
public class HorarioGrupoController {

    private final HorarioGrupoService horarioGrupoService;

    public HorarioGrupoController(HorarioGrupoService horarioGrupoService) {
        this.horarioGrupoService = horarioGrupoService;
    }

    @GetMapping
    public ResponseEntity<List<HorarioGrupoResponseDto>> listarPorCurso(@RequestParam Long cursoId) {
        return ResponseEntity.ok(horarioGrupoService.listarPorCurso(cursoId));
    }

    @PostMapping
    public ResponseEntity<HorarioGrupoResponseDto> crearHorario(@Valid @RequestBody HorarioGrupoRequestDto request) {
        HorarioGrupoResponseDto response = horarioGrupoService.crearHorario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HorarioGrupoResponseDto> actualizarHorario(
            @PathVariable Long id,
            @Valid @RequestBody HorarioGrupoRequestDto request
    ) {
        return ResponseEntity.ok(horarioGrupoService.actualizarHorario(id, request));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<HorarioGrupoResponseDto> desactivarHorario(@PathVariable Long id) {
        return ResponseEntity.ok(horarioGrupoService.desactivarHorario(id));
    }
}
