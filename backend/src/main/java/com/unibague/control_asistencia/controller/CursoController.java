package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.CursoDto;
import com.unibague.control_asistencia.service.CursoService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    private final CursoService cursoService;

    public CursoController(CursoService cursoService) {
        this.cursoService = cursoService;
    }

    @GetMapping
    public ResponseEntity<List<CursoDto>> listarCursos() {
        return ResponseEntity.ok(cursoService.listarCursos());
    }
}
