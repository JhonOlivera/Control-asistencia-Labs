package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import com.unibague.control_asistencia.repository.TokenAsistenciaRepository;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class NotificacionServiceTest {

    private static final String CLAVE_SECRETA_DE_PRUEBA = "xkeysib-no-debe-aparecer-en-logs";

    @Mock
    private SesionRepository sesionRepository;
    @Mock
    private EstudianteRepository estudianteRepository;
    @Mock
    private TokenAsistenciaRepository tokenAsistenciaRepository;
    @Mock
    private JavaMailSender mailSender;
    @Mock
    private BrevoEmailService brevoEmailService;

    private NotificacionService notificacionService;

    private Sesion sesion;
    private Estudiante ana;
    private Estudiante beto;

    @BeforeEach
    void setUp() {
        notificacionService = new NotificacionService(
                sesionRepository,
                estudianteRepository,
                tokenAsistenciaRepository,
                mailSender,
                brevoEmailService,
                "http://localhost:4200",
                "no-reply@test.com",
                120
        );

        Curso curso = new Curso();
        curso.setId(1L);

        Laboratorio laboratorio = new Laboratorio();
        laboratorio.setNombre("Laboratorio de Sistemas");

        sesion = new Sesion();
        sesion.setId(10L);
        sesion.setCurso(curso);
        sesion.setLaboratorio(laboratorio);
        sesion.setFecha(LocalDate.of(2026, 1, 5));
        sesion.setHora(LocalTime.of(10, 0));
        sesion.setEstado(EstadoSesion.ABIERTA);

        ana = new Estudiante();
        ana.setId(100L);
        ana.setNombre("Ana Pérez");
        ana.setCorreo("ana@test.com");

        beto = new Estudiante();
        beto.setId(101L);
        beto.setNombre("Beto Gómez");
        beto.setCorreo("beto@test.com");

        when(sesionRepository.findById(sesion.getId())).thenReturn(Optional.of(sesion));
        when(estudianteRepository.findActivosByCursoId(curso.getId())).thenReturn(List.of(ana, beto));
    }

    @Test
    void enviarEnlacesDeSesion_debeUsarBrevoCuandoEstaConfigurado() throws Exception {
        when(brevoEmailService.estaConfigurado()).thenReturn(true);

        notificacionService.enviarEnlacesDeSesion(sesion.getId());

        verify(brevoEmailService).enviar(eq("ana@test.com"), eq("Ana Pérez"), anyString(), anyString());
        verify(brevoEmailService).enviar(eq("beto@test.com"), eq("Beto Gómez"), anyString(), anyString());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void enviarEnlacesDeSesion_debeUsarSmtpCuandoBrevoNoEstaConfigurado() {
        when(brevoEmailService.estaConfigurado()).thenReturn(false);

        notificacionService.enviarEnlacesDeSesion(sesion.getId());

        verify(mailSender, times(2)).send(any(SimpleMailMessage.class));
    }

    @Test
    void enviarEnlacesDeSesion_debeRegistrarErrorDeBrevoSinExponerLaClaveYSeguirConLosDemas() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(NotificacionService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        when(brevoEmailService.estaConfigurado()).thenReturn(true);
        doThrow(new IOException("Brevo respondió con estado 401: {\"message\":\"Unauthorized\"}"))
                .when(brevoEmailService).enviar(eq("ana@test.com"), any(), any(), any());

        try {
            notificacionService.enviarEnlacesDeSesion(sesion.getId());
        } finally {
            logger.detachAppender(appender);
        }

        verify(brevoEmailService).enviar(eq("ana@test.com"), any(), any(), any());
        verify(brevoEmailService).enviar(eq("beto@test.com"), any(), any(), any());

        assertThat(appender.list).anySatisfy(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.ERROR);
            assertThat(event.getFormattedMessage()).doesNotContain(CLAVE_SECRETA_DE_PRUEBA);
            assertThat(event.getThrowableProxy().getMessage()).doesNotContain(CLAVE_SECRETA_DE_PRUEBA);
        });
    }
}
