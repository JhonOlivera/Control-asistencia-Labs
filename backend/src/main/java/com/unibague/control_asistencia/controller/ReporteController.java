package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.HistorialEstudianteDto;
import com.unibague.control_asistencia.dto.ResumenReporteDto;
import com.unibague.control_asistencia.service.ReporteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Protegido con JWT: SecurityConfig exige autenticación en toda ruta que no sea pública.
@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;

    public ReporteController(ReporteService reporteService) {
        this.reporteService = reporteService;
    }

    @GetMapping("/resumen")
    public ResponseEntity<ResumenReporteDto> obtenerResumen() {
        return ResponseEntity.ok(reporteService.obtenerResumen());
    }

    @GetMapping("/estudiantes/{id}/historial")
    public ResponseEntity<HistorialEstudianteDto> obtenerHistorial(@PathVariable Long id) {
        return ResponseEntity.ok(reporteService.obtenerHistorial(id));
    }
}
