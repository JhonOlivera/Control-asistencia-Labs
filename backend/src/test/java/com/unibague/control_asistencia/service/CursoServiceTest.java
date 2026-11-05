package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.CursoRequestDto;
import com.unibague.control_asistencia.exception.ConflictoCursoException;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.HorarioGrupoRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CursoServiceTest {

    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private SesionRepository sesionRepository;
    @Mock
    private HorarioGrupoRepository horarioGrupoRepository;

    private CursoService cursoService;

    private Curso curso;

    @BeforeEach
    void setUp() {
        cursoService = new CursoService(cursoRepository, sesionRepository, horarioGrupoRepository);

        curso = new Curso();
        curso.setId(1L);
        curso.setNombre("Ingeniería de Software");
        curso.setGrupo("A");
    }

    private CursoRequestDto request(String nombre, String grupo) {
        CursoRequestDto request = new CursoRequestDto();
        request.setNombre(nombre);
        request.setGrupo(grupo);
        return request;
    }

    @Test
    void crearCurso_debeRegistrarCuandoNoHayDuplicado() {
        CursoRequestDto request = request("Bases de Datos", "B");

        when(cursoRepository.findByNombreAndGrupo("Bases de Datos", "B")).thenReturn(Optional.empty());
        when(cursoRepository.save(any(Curso.class))).thenAnswer(invocacion -> {
            Curso guardado = invocacion.getArgument(0);
            guardado.setId(10L);
            return guardado;
        });

        var response = cursoService.crearCurso(request);

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.nombre()).isEqualTo("Bases de Datos");
        assertThat(response.grupo()).isEqualTo("B");
    }

    @Test
    void crearCurso_debeFallarCuandoYaExisteElMismoNombreYGrupo() {
        CursoRequestDto request = request("Ingeniería de Software", "A");

        when(cursoRepository.findByNombreAndGrupo("Ingeniería de Software", "A")).thenReturn(Optional.of(curso));

        assertThatThrownBy(() -> cursoService.crearCurso(request))
                .isInstanceOf(ConflictoCursoException.class);
    }

    @Test
    void actualizarCurso_debeFallarCuandoElCursoNoExiste() {
        CursoRequestDto request = request("Bases de Datos", "B");

        when(cursoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cursoService.actualizarCurso(1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void actualizarCurso_debePermitirConservarElMismoNombreYGrupo() {
        CursoRequestDto request = request("Ingeniería de Software", "A");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(cursoRepository.findByNombreAndGrupo("Ingeniería de Software", "A")).thenReturn(Optional.of(curso));
        when(cursoRepository.save(any(Curso.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var response = cursoService.actualizarCurso(1L, request);

        assertThat(response.id()).isEqualTo(1L);
    }

    @Test
    void actualizarCurso_debeFallarCuandoElNombreYGrupoYaLosTieneOtroCurso() {
        CursoRequestDto request = request("Bases de Datos", "B");

        Curso otroCurso = new Curso();
        otroCurso.setId(2L);
        otroCurso.setNombre("Bases de Datos");
        otroCurso.setGrupo("B");

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(cursoRepository.findByNombreAndGrupo("Bases de Datos", "B")).thenReturn(Optional.of(otroCurso));

        assertThatThrownBy(() -> cursoService.actualizarCurso(1L, request))
                .isInstanceOf(ConflictoCursoException.class);
    }

    @Test
    void eliminarCurso_debeFallarCuandoElCursoNoExiste() {
        when(cursoRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> cursoService.eliminarCurso(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void eliminarCurso_debeFallarCuandoTieneSesionesRegistradas() {
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(sesionRepository.existsByCursoId(1L)).thenReturn(true);

        assertThatThrownBy(() -> cursoService.eliminarCurso(1L))
                .isInstanceOf(ConflictoCursoException.class);

        verify(cursoRepository, never()).delete(any(Curso.class));
    }

    @Test
    void eliminarCurso_debeFallarCuandoTieneHorariosRegistrados() {
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(sesionRepository.existsByCursoId(1L)).thenReturn(false);
        when(horarioGrupoRepository.existsByCursoId(1L)).thenReturn(true);

        assertThatThrownBy(() -> cursoService.eliminarCurso(1L))
                .isInstanceOf(ConflictoCursoException.class);

        verify(cursoRepository, never()).delete(any(Curso.class));
    }

    @Test
    void eliminarCurso_debeFallarCuandoTieneEstudiantesMatriculados() {
        curso.getEstudiantes().add(new com.unibague.control_asistencia.model.Estudiante());

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(sesionRepository.existsByCursoId(1L)).thenReturn(false);
        when(horarioGrupoRepository.existsByCursoId(1L)).thenReturn(false);

        assertThatThrownBy(() -> cursoService.eliminarCurso(1L))
                .isInstanceOf(ConflictoCursoException.class);

        verify(cursoRepository, never()).delete(any(Curso.class));
    }

    @Test
    void eliminarCurso_debeEliminarCuandoNoTieneDependencias() {
        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(sesionRepository.existsByCursoId(1L)).thenReturn(false);
        when(horarioGrupoRepository.existsByCursoId(1L)).thenReturn(false);

        cursoService.eliminarCurso(1L);

        verify(cursoRepository).delete(curso);
    }
}
