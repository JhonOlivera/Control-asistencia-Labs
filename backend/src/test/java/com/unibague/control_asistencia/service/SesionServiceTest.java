package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.exception.ValidacionSesionException;
import com.unibague.control_asistencia.model.Administrador;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SesionServiceTest {

    // 2026-01-05 es lunes, dentro del horario de prueba "LUN-VIE 07:00-18:00".
    private static final LocalDate FECHA_VALIDA = LocalDate.of(2026, 1, 5);
    private static final LocalTime HORA_VALIDA = LocalTime.of(10, 0);

    @Mock
    private SesionRepository sesionRepository;
    @Mock
    private LaboratorioRepository laboratorioRepository;
    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private AdministradorRepository administradorRepository;
    @Mock
    private AsistenciaRepository asistenciaRepository;
    @Mock
    private EstudianteRepository estudianteRepository;

    private SesionService sesionService;

    private Curso curso;
    private Laboratorio laboratorio;
    private Administrador administrador;

    @BeforeEach
    void setUp() {
        sesionService = new SesionService(
                sesionRepository,
                laboratorioRepository,
                cursoRepository,
                administradorRepository,
                asistenciaRepository,
                estudianteRepository
        );

        curso = new Curso();
        curso.setId(1L);
        curso.setNombre("Programación I");
        curso.setGrupo("A");

        laboratorio = new Laboratorio();
        laboratorio.setId(2L);
        laboratorio.setNombre("Laboratorio de Sistemas");
        laboratorio.setUbicacion("Bloque 1");
        laboratorio.setCapacidad(30);
        laboratorio.setHorarioDisponible("LUN-VIE 07:00-18:00");
        laboratorio.setEstado(EstadoLaboratorio.ACTIVO);

        administrador = new Administrador();
        administrador.setId(3L);

        when(cursoRepository.findById(curso.getId())).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(laboratorio.getId())).thenReturn(Optional.of(laboratorio));
        when(administradorRepository.findById(administrador.getId())).thenReturn(Optional.of(administrador));
        when(sesionRepository.existsByLaboratorioIdAndFechaAndHoraAndEstado(any(), any(), any(), any()))
                .thenReturn(false);
    }

    @Test
    void crearSesion_debeFallarCuandoEstudiantesActivosSuperanLaCapacidad() {
        when(estudianteRepository.findActivosByCursoId(curso.getId()))
                .thenReturn(estudiantesActivos(35));

        assertThatThrownBy(() -> sesionService.crearSesion(request()))
                .isInstanceOf(ValidacionSesionException.class)
                .hasMessage("El curso tiene 35 estudiantes activos y el laboratorio solo admite 30.");
    }

    @Test
    void crearSesion_debePermitirCuandoEstudiantesActivosNoSuperanLaCapacidad() {
        when(estudianteRepository.findActivosByCursoId(curso.getId()))
                .thenReturn(estudiantesActivos(30));
        when(sesionRepository.save(any(Sesion.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        assertThat(sesionService.crearSesion(request())).isNotNull();
    }

    private SesionRequestDto request() {
        SesionRequestDto request = new SesionRequestDto();
        request.setCursoId(curso.getId());
        request.setLaboratorioId(laboratorio.getId());
        request.setAdministradorId(administrador.getId());
        request.setFecha(FECHA_VALIDA);
        request.setHora(HORA_VALIDA);
        request.setTema("Repaso de arreglos");
        return request;
    }

    private List<Estudiante> estudiantesActivos(int cantidad) {
        return IntStream.range(0, cantidad)
                .mapToObj(i -> new Estudiante())
                .toList();
    }
}
