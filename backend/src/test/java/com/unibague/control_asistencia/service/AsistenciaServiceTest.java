package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.exception.ValidacionAsistenciaException;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.TokenAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.TokenAsistenciaRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AsistenciaServiceTest {

    @Mock
    private TokenAsistenciaRepository tokenAsistenciaRepository;
    @Mock
    private AsistenciaRepository asistenciaRepository;

    private AsistenciaService asistenciaService;

    @BeforeEach
    void setUp() {
        asistenciaService = new AsistenciaService(tokenAsistenciaRepository, asistenciaRepository, 15L);
    }

    @Test
    void marcarAsistencia_debeRechazarCuandoElEstudianteNoEstaActivo() {
        Laboratorio laboratorio = new Laboratorio();
        laboratorio.setNombre("Laboratorio de Sistemas");

        Sesion sesion = new Sesion();
        sesion.setId(10L);
        sesion.setEstado(EstadoSesion.ABIERTA);
        sesion.setFecha(LocalDate.now());
        sesion.setHora(LocalTime.now());
        sesion.setLaboratorio(laboratorio);

        Estudiante estudiante = new Estudiante();
        estudiante.setId(100L);
        estudiante.setNombre("Ana Pérez");
        estudiante.setActivo(false);

        TokenAsistencia token = new TokenAsistencia();
        token.setToken("token-123");
        token.setUsado(false);
        token.setFechaExpiracion(LocalDateTime.now().plusMinutes(30));
        token.setSesion(sesion);
        token.setEstudiante(estudiante);

        when(tokenAsistenciaRepository.findByToken("token-123")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> asistenciaService.marcarAsistencia("token-123"))
                .isInstanceOf(ValidacionAsistenciaException.class)
                .hasMessage("No se puede registrar asistencia porque el estudiante no está activo.");

        verify(asistenciaRepository, never()).save(any());
    }
}
