package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.AsistenciaResponseDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionAsistenciaException;
import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.TokenAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.TokenAsistenciaRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AsistenciaService {

    private final TokenAsistenciaRepository tokenAsistenciaRepository;
    private final AsistenciaRepository asistenciaRepository;
    private final long minutosTolerancia;

    public AsistenciaService(
            TokenAsistenciaRepository tokenAsistenciaRepository,
            AsistenciaRepository asistenciaRepository,
            @Value("${app.asistencia.minutos-tolerancia}") long minutosTolerancia
    ) {
        this.tokenAsistenciaRepository = tokenAsistenciaRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.minutosTolerancia = minutosTolerancia;
    }

    @Transactional
    public AsistenciaResponseDto marcarAsistencia(String valorToken) {
        TokenAsistencia token = tokenAsistenciaRepository.findByToken(valorToken)
                .orElseThrow(() -> new ResourceNotFoundException("Token de asistencia no encontrado."));
        LocalDateTime ahora = LocalDateTime.now();

        if (token.isUsado()) {
            throw new ValidacionAsistenciaException("El token de asistencia ya fue usado.");
        }
        if (!token.getFechaExpiracion().isAfter(ahora)) {
            throw new ValidacionAsistenciaException("El token de asistencia expiró.");
        }

        var sesion = token.getSesion();
        if (sesion.getEstado() != EstadoSesion.ABIERTA) {
            throw new ValidacionAsistenciaException("No se puede registrar asistencia porque la sesión no está ABIERTA.");
        }

        var estudiante = token.getEstudiante();
        if (asistenciaRepository.existsByEstudianteIdAndSesionId(estudiante.getId(), sesion.getId())) {
            throw new ValidacionAsistenciaException("La asistencia de este estudiante ya fue registrada para la sesión.");
        }

        LocalDateTime inicioSesion = LocalDateTime.of(sesion.getFecha(), sesion.getHora());
        EstadoAsistencia estado = ahora.isAfter(inicioSesion.plusMinutes(minutosTolerancia))
                ? EstadoAsistencia.TARDE
                : EstadoAsistencia.PRESENTE;

        Asistencia asistencia = new Asistencia();
        asistencia.setEstudiante(estudiante);
        asistencia.setSesion(sesion);
        asistencia.setHoraRegistro(ahora);
        asistencia.setEstado(estado);
        asistenciaRepository.save(asistencia);
        token.setUsado(true);

        return new AsistenciaResponseDto(
                estudiante.getNombre(),
                sesion.getLaboratorio().getNombre(),
                estado,
                "Asistencia registrada correctamente."
        );
    }
}
