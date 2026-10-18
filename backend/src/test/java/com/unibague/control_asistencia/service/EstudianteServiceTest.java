package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.EstudianteRequestDto;
import com.unibague.control_asistencia.exception.ConflictoEstudianteException;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.UsuarioRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EstudianteServiceTest {

    @Mock
    private EstudianteRepository estudianteRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AsistenciaRepository asistenciaRepository;

    private EstudianteService estudianteService;

    private Estudiante estudianteExistente;

    @BeforeEach
    void setUp() {
        estudianteService = new EstudianteService(estudianteRepository, usuarioRepository, asistenciaRepository);

        estudianteExistente = new Estudiante();
        estudianteExistente.setId(1L);
        estudianteExistente.setNombre("Ana Pérez");
        estudianteExistente.setCorreo("ana.perez@unibague.edu.co");
        estudianteExistente.setCodigo("EST-001");
        estudianteExistente.setActivo(true);
    }

    @Test
    void crearEstudiante_debeFallarCuandoElCodigoYaExiste() {
        EstudianteRequestDto request = request("Carlos Ruiz", "carlos.ruiz@unibague.edu.co", "EST-001");
        when(estudianteRepository.findByCodigo("EST-001")).thenReturn(Optional.of(estudianteExistente));

        assertThatThrownBy(() -> estudianteService.crearEstudiante(request))
                .isInstanceOf(ConflictoEstudianteException.class)
                .hasMessage("Ya existe un estudiante con el código EST-001.");
    }

    @Test
    void actualizarEstudiante_debeFallarCuandoElCodigoYaLoTieneOtroEstudiante() {
        Estudiante otroEstudiante = new Estudiante();
        otroEstudiante.setId(2L);
        otroEstudiante.setCodigo("EST-002");

        EstudianteRequestDto request = request("Ana Pérez", "ana.perez@unibague.edu.co", "EST-002");

        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(estudianteRepository.findByCodigo("EST-002")).thenReturn(Optional.of(otroEstudiante));

        assertThatThrownBy(() -> estudianteService.actualizarEstudiante(1L, request))
                .isInstanceOf(ConflictoEstudianteException.class)
                .hasMessage("Ya existe un estudiante con el código EST-002.");
    }

    @Test
    void actualizarEstudiante_debePermitirMantenerElPropioCodigo() {
        EstudianteRequestDto request = request("Ana Pérez", "ana.perez@unibague.edu.co", "EST-001");

        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(estudianteRepository.findByCodigo("EST-001")).thenReturn(Optional.of(estudianteExistente));
        when(usuarioRepository.findByCorreo("ana.perez@unibague.edu.co"))
                .thenReturn(Optional.of(estudianteExistente));
        when(estudianteRepository.save(any(Estudiante.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        assertThat(estudianteService.actualizarEstudiante(1L, request)).isNotNull();
    }

    @Test
    void eliminarEstudiante_debeRechazarCuandoTieneAsistencias() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(asistenciaRepository.existsByEstudianteId(1L)).thenReturn(true);

        assertThatThrownBy(() -> estudianteService.eliminarEstudiante(1L))
                .isInstanceOf(ConflictoEstudianteException.class)
                .hasMessage("El estudiante tiene asistencias registradas; solo se puede inactivar, no eliminar.");

        verify(estudianteRepository, never()).delete(any(Estudiante.class));
    }

    @Test
    void eliminarEstudiante_debeEliminarCuandoNoTieneAsistencias() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(asistenciaRepository.existsByEstudianteId(1L)).thenReturn(false);

        estudianteService.eliminarEstudiante(1L);

        verify(estudianteRepository).delete(estudianteExistente);
    }

    @Test
    void inactivarEstudiante_debeMarcarloComoInactivo() {
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(estudianteRepository.save(any(Estudiante.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var response = estudianteService.inactivarEstudiante(1L);

        assertThat(response.activo()).isFalse();
    }

    @Test
    void activarEstudiante_debeMarcarloComoActivo() {
        estudianteExistente.setActivo(false);
        when(estudianteRepository.findById(1L)).thenReturn(Optional.of(estudianteExistente));
        when(estudianteRepository.save(any(Estudiante.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        var response = estudianteService.activarEstudiante(1L);

        assertThat(response.activo()).isTrue();
    }

    private EstudianteRequestDto request(String nombre, String correo, String codigo) {
        EstudianteRequestDto request = new EstudianteRequestDto();
        request.setNombre(nombre);
        request.setCorreo(correo);
        request.setCodigo(codigo);
        return request;
    }
}
