package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.EstudianteRequestDto;
import com.unibague.control_asistencia.dto.EstudianteResponseDto;
import com.unibague.control_asistencia.exception.ConflictoEstudianteException;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.UsuarioRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EstudianteService {

    private final EstudianteRepository estudianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final AsistenciaRepository asistenciaRepository;

    public EstudianteService(
            EstudianteRepository estudianteRepository,
            UsuarioRepository usuarioRepository,
            AsistenciaRepository asistenciaRepository
    ) {
        this.estudianteRepository = estudianteRepository;
        this.usuarioRepository = usuarioRepository;
        this.asistenciaRepository = asistenciaRepository;
    }

    @Transactional(readOnly = true)
    public List<EstudianteResponseDto> listarEstudiantes(String texto, Boolean activo) {
        String textoNormalizado = (texto == null || texto.isBlank()) ? null : texto.trim();
        return estudianteRepository.buscar(textoNormalizado, activo).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public EstudianteResponseDto obtenerEstudiante(Long id) {
        return mapToResponse(buscarEstudiante(id));
    }

    @Transactional
    public EstudianteResponseDto crearEstudiante(EstudianteRequestDto request) {
        validarCodigoUnico(request.getCodigo(), null);
        validarCorreoUnico(request.getCorreo(), null);

        Estudiante estudiante = new Estudiante();
        actualizarDatos(estudiante, request);
        estudiante.setActivo(true);

        return mapToResponse(estudianteRepository.save(estudiante));
    }

    @Transactional
    public EstudianteResponseDto actualizarEstudiante(Long id, EstudianteRequestDto request) {
        Estudiante estudiante = buscarEstudiante(id);
        validarCodigoUnico(request.getCodigo(), id);
        validarCorreoUnico(request.getCorreo(), id);
        actualizarDatos(estudiante, request);

        return mapToResponse(estudianteRepository.save(estudiante));
    }

    @Transactional
    public EstudianteResponseDto inactivarEstudiante(Long id) {
        Estudiante estudiante = buscarEstudiante(id);
        estudiante.setActivo(false);
        return mapToResponse(estudianteRepository.save(estudiante));
    }

    @Transactional
    public EstudianteResponseDto activarEstudiante(Long id) {
        Estudiante estudiante = buscarEstudiante(id);
        estudiante.setActivo(true);
        return mapToResponse(estudianteRepository.save(estudiante));
    }

    @Transactional
    public void eliminarEstudiante(Long id) {
        Estudiante estudiante = buscarEstudiante(id);
        if (asistenciaRepository.existsByEstudianteId(id)) {
            throw new ConflictoEstudianteException(
                    "El estudiante tiene asistencias registradas; solo se puede inactivar, no eliminar."
            );
        }
        estudianteRepository.delete(estudiante);
    }

    private Estudiante buscarEstudiante(Long id) {
        return estudianteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Estudiante no encontrado con id " + id));
    }

    private void validarCodigoUnico(String codigo, Long idExcluido) {
        estudianteRepository.findByCodigo(codigo)
                .filter(estudiante -> !estudiante.getId().equals(idExcluido))
                .ifPresent(estudiante -> {
                    throw new ConflictoEstudianteException(
                            "Ya existe un estudiante con el código " + codigo + "."
                    );
                });
    }

    private void validarCorreoUnico(String correo, Long idExcluido) {
        usuarioRepository.findByCorreo(correo)
                .filter(usuario -> !usuario.getId().equals(idExcluido))
                .ifPresent(usuario -> {
                    throw new ConflictoEstudianteException(
                            "Ya existe un usuario con el correo " + correo + "."
                    );
                });
    }

    private void actualizarDatos(Estudiante estudiante, EstudianteRequestDto request) {
        estudiante.setNombre(request.getNombre());
        estudiante.setCorreo(request.getCorreo());
        estudiante.setCodigo(request.getCodigo());
    }

    private EstudianteResponseDto mapToResponse(Estudiante estudiante) {
        return new EstudianteResponseDto(
                estudiante.getId(),
                estudiante.getNombre(),
                estudiante.getCorreo(),
                estudiante.getCodigo(),
                estudiante.isActivo()
        );
    }
}
