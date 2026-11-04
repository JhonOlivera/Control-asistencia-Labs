package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.HorarioGrupoRequestDto;
import com.unibague.control_asistencia.exception.ConflictoHorarioGrupoException;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionHorarioGrupoException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.HorarioGrupo;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.HorarioGrupoRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HorarioGrupoServiceTest {

    @Mock
    private HorarioGrupoRepository horarioGrupoRepository;
    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private LaboratorioRepository laboratorioRepository;

    private HorarioGrupoService horarioGrupoService;

    private Curso curso;
    private Laboratorio laboratorio;

    @BeforeEach
    void setUp() {
        horarioGrupoService = new HorarioGrupoService(horarioGrupoRepository, cursoRepository, laboratorioRepository);

        curso = new Curso();
        curso.setId(1L);
        curso.setNombre("Ingeniería de Software");
        curso.setGrupo("A");

        laboratorio = new Laboratorio();
        laboratorio.setId(1L);
        laboratorio.setNombre("Lab 1");
        laboratorio.setUbicacion("Bloque 1");
        laboratorio.setCapacidad(20);
        laboratorio.setHorarioDisponible("LUN-VIE 07:00-18:00");
        laboratorio.setEstado(EstadoLaboratorio.ACTIVO);
    }

    @Test
    void crearHorario_debeRegistrarCuandoTodoEsValido() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "08:00", "10:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));
        when(horarioGrupoRepository.findByCursoIdAndActivoTrue(1L)).thenReturn(List.of());
        when(horarioGrupoRepository.findByLaboratorioIdAndDiaSemanaAndActivoTrue(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of());
        when(horarioGrupoRepository.save(any(HorarioGrupo.class))).thenAnswer(invocacion -> {
            HorarioGrupo guardado = invocacion.getArgument(0);
            guardado.setId(10L);
            return guardado;
        });

        var response = horarioGrupoService.crearHorario(request);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.activo()).isTrue();
        assertThat(response.diaSemana()).isEqualTo(DayOfWeek.MONDAY);
    }

    @Test
    void crearHorario_debeFallarCuandoElCursoNoExiste() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "08:00", "10:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void crearHorario_debeFallarCuandoLaHoraFinNoEsPosteriorALaHoraInicio() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "10:00", "08:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ValidacionHorarioGrupoException.class)
                .hasMessage("La hora de fin debe ser posterior a la hora de inicio.");
    }

    @Test
    void crearHorario_debeFallarCuandoElLaboratorioNoEstaActivo() {
        laboratorio.setEstado(EstadoLaboratorio.EN_MANTENIMIENTO);
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "08:00", "10:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ValidacionHorarioGrupoException.class)
                .hasMessage("El laboratorio debe estar ACTIVO para asignarle un horario.");
    }

    @Test
    void crearHorario_debeFallarCuandoElDiaNoEstaDentroDeLaDisponibilidad() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.SATURDAY, "08:00", "10:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ValidacionHorarioGrupoException.class)
                .hasMessage("El día no se encuentra dentro del horario disponible del laboratorio.");
    }

    @Test
    void crearHorario_debeFallarCuandoElRangoDeHorasSaleDeLaDisponibilidad() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "06:00", "10:00");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ValidacionHorarioGrupoException.class)
                .hasMessage("El rango de horas no se encuentra dentro del horario disponible del laboratorio.");
    }

    @Test
    void crearHorario_debeFallarCuandoElCursoYaTieneEseHorario() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "08:00", "10:00");

        HorarioGrupo existente = new HorarioGrupo();
        existente.setId(5L);
        existente.setCurso(curso);
        existente.setLaboratorio(laboratorio);
        existente.setDiaSemana(DayOfWeek.MONDAY);
        existente.setHoraInicio(LocalTime.of(8, 0));
        existente.setHoraFin(LocalTime.of(10, 0));
        existente.setActivo(true);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));
        when(horarioGrupoRepository.findByCursoIdAndActivoTrue(1L)).thenReturn(List.of(existente));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ConflictoHorarioGrupoException.class)
                .hasMessage("El curso ya tiene registrado ese horario.");
    }

    @Test
    void crearHorario_debeFallarCuandoSeSolapaConOtroHorarioActivoEnElMismoLaboratorioYDia() {
        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "09:00", "11:00");

        Curso otroCurso = new Curso();
        otroCurso.setId(2L);
        otroCurso.setNombre("Bases de Datos");
        otroCurso.setGrupo("B");

        HorarioGrupo existente = new HorarioGrupo();
        existente.setId(5L);
        existente.setCurso(otroCurso);
        existente.setLaboratorio(laboratorio);
        existente.setDiaSemana(DayOfWeek.MONDAY);
        existente.setHoraInicio(LocalTime.of(8, 0));
        existente.setHoraFin(LocalTime.of(10, 0));
        existente.setActivo(true);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));
        when(horarioGrupoRepository.findByCursoIdAndActivoTrue(1L)).thenReturn(List.of());
        when(horarioGrupoRepository.findByLaboratorioIdAndDiaSemanaAndActivoTrue(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(existente));

        assertThatThrownBy(() -> horarioGrupoService.crearHorario(request))
                .isInstanceOf(ConflictoHorarioGrupoException.class)
                .hasMessage("Ya existe un horario activo que se solapa en ese laboratorio y día.");
    }

    @Test
    void actualizarHorario_debePermitirMantenerElMismoHorarioSinConflicto() {
        HorarioGrupo existente = new HorarioGrupo();
        existente.setId(5L);
        existente.setCurso(curso);
        existente.setLaboratorio(laboratorio);
        existente.setDiaSemana(DayOfWeek.MONDAY);
        existente.setHoraInicio(LocalTime.of(8, 0));
        existente.setHoraFin(LocalTime.of(10, 0));
        existente.setActivo(true);

        HorarioGrupoRequestDto request = request(1L, 1L, DayOfWeek.MONDAY, "08:00", "10:30");

        when(horarioGrupoRepository.findById(5L)).thenReturn(Optional.of(existente));
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(laboratorioRepository.findById(1L)).thenReturn(Optional.of(laboratorio));
        when(horarioGrupoRepository.findByCursoIdAndActivoTrue(1L)).thenReturn(List.of(existente));
        when(horarioGrupoRepository.findByLaboratorioIdAndDiaSemanaAndActivoTrue(1L, DayOfWeek.MONDAY))
                .thenReturn(List.of(existente));
        when(horarioGrupoRepository.save(any(HorarioGrupo.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var response = horarioGrupoService.actualizarHorario(5L, request);

        assertThat(response.horaFin()).isEqualTo(LocalTime.of(10, 30));
    }

    @Test
    void desactivarHorario_debeMarcarloComoInactivo() {
        HorarioGrupo existente = new HorarioGrupo();
        existente.setId(5L);
        existente.setActivo(true);
        existente.setCurso(curso);
        existente.setLaboratorio(laboratorio);
        existente.setDiaSemana(DayOfWeek.MONDAY);
        existente.setHoraInicio(LocalTime.of(8, 0));
        existente.setHoraFin(LocalTime.of(10, 0));

        when(horarioGrupoRepository.findById(5L)).thenReturn(Optional.of(existente));
        when(horarioGrupoRepository.save(any(HorarioGrupo.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var response = horarioGrupoService.desactivarHorario(5L);

        assertThat(response.activo()).isFalse();
    }

    @Test
    void desactivarHorario_debeFallarCuandoYaEstaInactivo() {
        HorarioGrupo existente = new HorarioGrupo();
        existente.setId(5L);
        existente.setActivo(false);

        when(horarioGrupoRepository.findById(5L)).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> horarioGrupoService.desactivarHorario(5L))
                .isInstanceOf(ValidacionHorarioGrupoException.class)
                .hasMessage("El horario ya está inactivo.");
    }

    private HorarioGrupoRequestDto request(Long cursoId, Long laboratorioId, DayOfWeek diaSemana,
                                             String horaInicio, String horaFin) {
        HorarioGrupoRequestDto request = new HorarioGrupoRequestDto();
        request.setCursoId(cursoId);
        request.setLaboratorioId(laboratorioId);
        request.setDiaSemana(diaSemana);
        request.setHoraInicio(LocalTime.parse(horaInicio));
        request.setHoraFin(LocalTime.parse(horaFin));
        return request;
    }
}
