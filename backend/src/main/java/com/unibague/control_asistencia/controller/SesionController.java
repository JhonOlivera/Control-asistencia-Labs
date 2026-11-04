package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.AsistenciaEstudianteDto;
import com.unibague.control_asistencia.dto.ExportacionCsvDto;
import com.unibague.control_asistencia.dto.SesionParticipantesResponseDto;
import com.unibague.control_asistencia.dto.SesionPorFechaDto;
import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.dto.SesionResponseDto;
import com.unibague.control_asistencia.dto.SesionResumenDto;
import com.unibague.control_asistencia.service.NotificacionService;
import com.unibague.control_asistencia.service.SesionService;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sesiones")
public class SesionController {

    private final SesionService sesionService;
    private final NotificacionService notificacionService;

    public SesionController(SesionService sesionService, NotificacionService notificacionService) {
        this.sesionService = sesionService;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<List<SesionResumenDto>> listarSesiones(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) LocalDate fecha
    ) {
        return ResponseEntity.ok(sesionService.listarSesiones(estado, fecha));
    }

    @GetMapping("/por-fecha")
    public ResponseEntity<List<SesionPorFechaDto>> listarPorFecha(@RequestParam LocalDate fecha) {
        return ResponseEntity.ok(sesionService.listarPorFecha(fecha));
    }

    @GetMapping("/{id}/asistencias")
    public ResponseEntity<List<AsistenciaEstudianteDto>> listarAsistencias(@PathVariable Long id) {
        return ResponseEntity.ok(sesionService.listarAsistencias(id));
    }

    @GetMapping("/{id}/participantes")
    public ResponseEntity<SesionParticipantesResponseDto> obtenerParticipantes(
            @PathVariable Long id,
            @RequestParam(required = false) String asistencia,
            @RequestParam(required = false) String matricula
    ) {
        return ResponseEntity.ok(sesionService.obtenerParticipantes(id, asistencia, matricula));
    }

    @GetMapping("/{id}/participantes/exportar")
    public ResponseEntity<byte[]> exportarParticipantes(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean incluirAusentes
    ) {
        ExportacionCsvDto archivo = sesionService.exportarParticipantesCsv(id, incluirAusentes);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(archivo.nombreArchivo(), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(archivo.contenido());
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

    @PostMapping("/{id}/enviar-enlaces")
    public ResponseEntity<Void> enviarEnlaces(@PathVariable Long id) {
        notificacionService.enviarEnlacesDeSesion(id);
        return ResponseEntity.ok().build();
    }
}
