package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionSesionException;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.TokenAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import com.unibague.control_asistencia.repository.TokenAsistenciaRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificacionService {

    private static final Logger logger = LoggerFactory.getLogger(NotificacionService.class);

    private final SesionRepository sesionRepository;
    private final EstudianteRepository estudianteRepository;
    private final TokenAsistenciaRepository tokenAsistenciaRepository;
    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String remitente;
    private final long expiracionMinutos;

    public NotificacionService(
            SesionRepository sesionRepository,
            EstudianteRepository estudianteRepository,
            TokenAsistenciaRepository tokenAsistenciaRepository,
            JavaMailSender mailSender,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${spring.mail.username}") String remitente,
            @Value("${app.token.expiracion-minutos}") long expiracionMinutos
    ) {
        this.sesionRepository = sesionRepository;
        this.estudianteRepository = estudianteRepository;
        this.tokenAsistenciaRepository = tokenAsistenciaRepository;
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.remitente = remitente;
        this.expiracionMinutos = expiracionMinutos;
    }

    @Transactional
    public void enviarEnlacesDeSesion(Long sesionId) {
        Sesion sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con id " + sesionId));
        if (sesion.getEstado() != EstadoSesion.ABIERTA) {
            throw new ValidacionSesionException("No se pueden enviar enlaces porque la sesión no está ABIERTA.");
        }
        var estudiantes = estudianteRepository.findActivosByCursoId(sesion.getCurso().getId());
        LocalDateTime fechaHoraSesion = LocalDateTime.of(sesion.getFecha(), sesion.getHora());

        for (Estudiante estudiante : estudiantes) {
            TokenAsistencia token = new TokenAsistencia();
            token.setToken(UUID.randomUUID().toString());
            token.setUsado(false);
            token.setFechaExpiracion(LocalDateTime.now().plusMinutes(expiracionMinutos));
            token.setEstudiante(estudiante);
            token.setSesion(sesion);
            tokenAsistenciaRepository.save(token);

            String enlace = frontendUrl + "/asistencia/confirmar?token=" + token.getToken();
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(estudiante.getCorreo());
            mensaje.setSubject("Enlace para registrar asistencia");
            mensaje.setText("Hola " + estudiante.getNombre() + ",\n\n"
                    + "Laboratorio: " + sesion.getLaboratorio().getNombre() + "\n"
                    + "Fecha y hora: " + fechaHoraSesion + "\n\n"
                    + "Registra tu asistencia en el siguiente enlace:\n" + enlace);

            try {
                mailSender.send(mensaje);
            } catch (MailException ex) {
                logger.error("No se pudo enviar el enlace de asistencia al estudiante {} para la sesión {}",
                        estudiante.getId(), sesionId, ex);
            }
        }
    }
}
