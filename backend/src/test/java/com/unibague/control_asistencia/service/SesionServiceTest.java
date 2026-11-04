package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.ExportacionCsvDto;
import com.unibague.control_asistencia.dto.ParticipanteDto;
import com.unibague.control_asistencia.dto.SesionParticipantesResponseDto;
import com.unibague.control_asistencia.dto.SesionPorFechaDto;
import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.dto.SesionResumenDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionSesionException;
import com.unibague.control_asistencia.model.Administrador;
import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    }

    @Test
    void crearSesion_debeFallarCuandoEstudiantesActivosSuperanLaCapacidad() {
        stubDependenciasCrearSesion();
        when(estudianteRepository.findActivosByCursoId(curso.getId()))
                .thenReturn(estudiantesActivos(35));

        assertThatThrownBy(() -> sesionService.crearSesion(request()))
                .isInstanceOf(ValidacionSesionException.class)
                .hasMessage("El curso tiene 35 estudiantes activos y el laboratorio solo admite 30.");
    }

    @Test
    void crearSesion_debePermitirCuandoEstudiantesActivosNoSuperanLaCapacidad() {
        stubDependenciasCrearSesion();
        when(estudianteRepository.findActivosByCursoId(curso.getId()))
                .thenReturn(estudiantesActivos(30));
        when(sesionRepository.save(any(Sesion.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        assertThat(sesionService.crearSesion(request())).isNotNull();
    }

    private void stubDependenciasCrearSesion() {
        when(cursoRepository.findById(curso.getId())).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(laboratorio.getId())).thenReturn(Optional.of(laboratorio));
        when(administradorRepository.findById(administrador.getId())).thenReturn(Optional.of(administrador));
        when(sesionRepository.existsByLaboratorioIdAndFechaAndHoraAndEstado(any(), any(), any(), any()))
                .thenReturn(false);
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

    @Test
    void obtenerParticipantes_debeCalcularResumenIncluyendoAusentesYEstadoMatricula() {
        Sesion sesion = construirSesion(50L, HORA_VALIDA, EstadoSesion.ABIERTA);
        when(sesionRepository.findById(sesion.getId())).thenReturn(Optional.of(sesion));

        Estudiante presente = estudiante(10L, "Ana Pérez", "A01", true);
        Estudiante ausenteActivo = estudiante(11L, "Beto Gómez", "A02", true);
        Estudiante ausenteInactivo = estudiante(12L, "Carla Ruiz", "A03", false);
        when(estudianteRepository.findByCursoId(curso.getId()))
                .thenReturn(List.of(presente, ausenteActivo, ausenteInactivo));
        when(asistenciaRepository.findBySesionId(sesion.getId()))
                .thenReturn(List.of(asistencia(presente, EstadoAsistencia.PRESENTE,
                        LocalDateTime.of(2026, 1, 5, 10, 5))));

        SesionParticipantesResponseDto respuesta = sesionService.obtenerParticipantes(sesion.getId(), null, null);

        assertThat(respuesta.resumen().matriculados()).isEqualTo(3);
        assertThat(respuesta.resumen().presentes()).isEqualTo(1);
        assertThat(respuesta.resumen().tarde()).isEqualTo(0);
        assertThat(respuesta.resumen().ausentes()).isEqualTo(2);
        assertThat(respuesta.participantes()).extracting(ParticipanteDto::nombre)
                .containsExactly("Ana Pérez", "Beto Gómez", "Carla Ruiz");

        ParticipanteDto carla = respuesta.participantes().stream()
                .filter(p -> p.estudianteId().equals(12L))
                .findFirst()
                .orElseThrow();
        assertThat(carla.estadoMatricula()).isEqualTo("INACTIVA");
        assertThat(carla.asistencia()).isEqualTo("AUSENTE");
        assertThat(carla.horaRegistro()).isNull();
    }

    @Test
    void obtenerParticipantes_debeFiltrarPorAsistenciaYPorEstadoDeMatricula() {
        Sesion sesion = construirSesion(50L, HORA_VALIDA, EstadoSesion.ABIERTA);
        when(sesionRepository.findById(sesion.getId())).thenReturn(Optional.of(sesion));

        Estudiante presente = estudiante(10L, "Ana Pérez", "A01", true);
        Estudiante ausenteActivo = estudiante(11L, "Beto Gómez", "A02", true);
        Estudiante ausenteInactivo = estudiante(12L, "Carla Ruiz", "A03", false);
        when(estudianteRepository.findByCursoId(curso.getId()))
                .thenReturn(List.of(presente, ausenteActivo, ausenteInactivo));
        when(asistenciaRepository.findBySesionId(sesion.getId()))
                .thenReturn(List.of(asistencia(presente, EstadoAsistencia.PRESENTE,
                        LocalDateTime.of(2026, 1, 5, 10, 5))));

        SesionParticipantesResponseDto soloAusentes = sesionService.obtenerParticipantes(sesion.getId(), "ausente", null);
        assertThat(soloAusentes.participantes()).extracting(ParticipanteDto::estudianteId)
                .containsExactlyInAnyOrder(11L, 12L);
        assertThat(soloAusentes.resumen().matriculados()).isEqualTo(3);

        SesionParticipantesResponseDto soloInactivos = sesionService.obtenerParticipantes(sesion.getId(), null, "INACTIVA");
        assertThat(soloInactivos.participantes()).extracting(ParticipanteDto::estudianteId)
                .containsExactly(12L);
    }

    @Test
    void obtenerParticipantes_debeLanzarExcepcionCuandoSesionNoExiste() {
        when(sesionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sesionService.obtenerParticipantes(99L, null, null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listarPorFecha_debeCalcularConteosPorSesionOrdenadasPorHora() {
        Sesion sesionTemprano = construirSesion(100L, LocalTime.of(8, 0), EstadoSesion.ABIERTA);
        Sesion sesionTarde = construirSesion(101L, LocalTime.of(10, 0), EstadoSesion.ABIERTA);
        when(sesionRepository.findByFechaOrderByHoraAscIdAsc(FECHA_VALIDA))
                .thenReturn(List.of(sesionTemprano, sesionTarde));

        Estudiante estudiante = estudiante(20L, "Dana Torres", "D01", true);
        when(estudianteRepository.findByCursoId(curso.getId())).thenReturn(List.of(estudiante));
        when(asistenciaRepository.findBySesionId(100L))
                .thenReturn(List.of(asistencia(estudiante, EstadoAsistencia.PRESENTE, LocalDateTime.of(2026, 1, 5, 8, 2))));
        when(asistenciaRepository.findBySesionId(101L)).thenReturn(List.of());

        List<SesionPorFechaDto> resultado = sesionService.listarPorFecha(FECHA_VALIDA);

        assertThat(resultado).hasSize(2);
        assertThat(resultado.get(0).sesionId()).isEqualTo(100L);
        assertThat(resultado.get(0).presentes()).isEqualTo(1);
        assertThat(resultado.get(0).ausentes()).isEqualTo(0);
        assertThat(resultado.get(1).sesionId()).isEqualTo(101L);
        assertThat(resultado.get(1).ausentes()).isEqualTo(1);
    }

    @Test
    void exportarParticipantesCsv_debeExcluirAusentesPorDefecto() {
        Sesion sesion = construirSesion(50L, HORA_VALIDA, EstadoSesion.CERRADA);
        when(sesionRepository.findById(sesion.getId())).thenReturn(Optional.of(sesion));

        Estudiante presente = estudiante(10L, "Ana Pérez", "A01", true);
        Estudiante ausente = estudiante(11L, "Beto Gómez", "A02", true);
        when(estudianteRepository.findByCursoId(curso.getId())).thenReturn(List.of(presente, ausente));
        when(asistenciaRepository.findBySesionId(sesion.getId()))
                .thenReturn(List.of(asistencia(presente, EstadoAsistencia.PRESENTE,
                        LocalDateTime.of(2026, 1, 5, 10, 5))));

        ExportacionCsvDto csv = sesionService.exportarParticipantesCsv(sesion.getId(), false);
        String contenido = new String(csv.contenido(), StandardCharsets.UTF_8);

        assertThat(contenido).startsWith("﻿");
        assertThat(contenido).contains("A01,Ana Pérez,PRESENTE");
        assertThat(contenido).doesNotContain("Beto");
        assertThat(csv.nombreArchivo()).isEqualTo("asistencia-Programacion-I-A-2026-01-05.csv");
    }

    @Test
    void exportarParticipantesCsv_debeIncluirAusentesCuandoSeSolicita() {
        Sesion sesion = construirSesion(50L, HORA_VALIDA, EstadoSesion.CERRADA);
        when(sesionRepository.findById(sesion.getId())).thenReturn(Optional.of(sesion));

        Estudiante presente = estudiante(10L, "Ana Pérez", "A01", true);
        Estudiante ausente = estudiante(11L, "Beto Gómez", "A02", true);
        when(estudianteRepository.findByCursoId(curso.getId())).thenReturn(List.of(presente, ausente));
        when(asistenciaRepository.findBySesionId(sesion.getId()))
                .thenReturn(List.of(asistencia(presente, EstadoAsistencia.PRESENTE,
                        LocalDateTime.of(2026, 1, 5, 10, 5))));

        ExportacionCsvDto csv = sesionService.exportarParticipantesCsv(sesion.getId(), true);
        String contenido = new String(csv.contenido(), StandardCharsets.UTF_8);

        assertThat(contenido).contains("A02,Beto Gómez,AUSENTE");
    }

    @Test
    void listarSesiones_debeFiltrarPorEstadoYFecha() {
        when(asistenciaRepository.contarPorSesion(any())).thenReturn(List.of());

        Sesion abiertaHoy = construirSesionConFecha(200L, FECHA_VALIDA, EstadoSesion.ABIERTA);
        Sesion cerradaHoy = construirSesionConFecha(201L, FECHA_VALIDA, EstadoSesion.CERRADA);
        Sesion abiertaOtroDia = construirSesionConFecha(202L, FECHA_VALIDA.plusDays(1), EstadoSesion.ABIERTA);
        when(sesionRepository.findAllByOrderByFechaDescHoraDescIdDesc())
                .thenReturn(List.of(abiertaHoy, cerradaHoy, abiertaOtroDia));

        List<SesionResumenDto> resultado = sesionService.listarSesiones("abierta", FECHA_VALIDA);

        assertThat(resultado).extracting(SesionResumenDto::id).containsExactly(200L);
    }

    @Test
    void listarSesiones_debeLanzarExcepcionConEstadoInvalido() {
        assertThatThrownBy(() -> sesionService.listarSesiones("no-existe", null))
                .isInstanceOf(ValidacionSesionException.class);
    }

    private Sesion construirSesion(Long id, LocalTime hora, EstadoSesion estadoSesion) {
        return construirSesionConFecha(id, FECHA_VALIDA, estadoSesion, hora);
    }

    private Sesion construirSesionConFecha(Long id, LocalDate fecha, EstadoSesion estadoSesion) {
        return construirSesionConFecha(id, fecha, estadoSesion, HORA_VALIDA);
    }

    private Sesion construirSesionConFecha(Long id, LocalDate fecha, EstadoSesion estadoSesion, LocalTime hora) {
        Sesion sesion = new Sesion();
        sesion.setId(id);
        sesion.setCurso(curso);
        sesion.setLaboratorio(laboratorio);
        sesion.setAdministrador(administrador);
        sesion.setFecha(fecha);
        sesion.setHora(hora);
        sesion.setTema("Repaso de arreglos");
        sesion.setEstado(estadoSesion);
        return sesion;
    }

    private Estudiante estudiante(Long id, String nombre, String codigo, boolean activo) {
        Estudiante estudiante = new Estudiante();
        estudiante.setId(id);
        estudiante.setNombre(nombre);
        estudiante.setCodigo(codigo);
        estudiante.setCorreo(codigo.toLowerCase(java.util.Locale.ROOT) + "@estudiantesunibague.edu.co");
        estudiante.setActivo(activo);
        return estudiante;
    }

    private Asistencia asistencia(Estudiante estudiante, EstadoAsistencia estado, LocalDateTime horaRegistro) {
        Asistencia asistencia = new Asistencia();
        asistencia.setEstudiante(estudiante);
        asistencia.setEstado(estado);
        asistencia.setHoraRegistro(horaRegistro);
        return asistencia;
    }
}
