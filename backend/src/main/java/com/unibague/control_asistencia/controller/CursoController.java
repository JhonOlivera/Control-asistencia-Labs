package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.CursoDto;
import com.unibague.control_asistencia.dto.ImportacionEstudiantesResponseDto;
import com.unibague.control_asistencia.service.CursoService;
import com.unibague.control_asistencia.service.ImportacionEstudiantesService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    private final CursoService cursoService;
    private final ImportacionEstudiantesService importacionEstudiantesService;

    public CursoController(CursoService cursoService, ImportacionEstudiantesService importacionEstudiantesService) {
        this.cursoService = cursoService;
        this.importacionEstudiantesService = importacionEstudiantesService;
    }

    @GetMapping
    public ResponseEntity<List<CursoDto>> listarCursos() {
        return ResponseEntity.ok(cursoService.listarCursos());
    }

    @PostMapping("/{cursoId}/importar-estudiantes")
    public ResponseEntity<ImportacionEstudiantesResponseDto> importarEstudiantes(
            @PathVariable Long cursoId,
            @RequestParam("archivo") MultipartFile archivo
    ) {
        return ResponseEntity.ok(importacionEstudiantesService.importarEstudiantes(cursoId, archivo));
    }
}
