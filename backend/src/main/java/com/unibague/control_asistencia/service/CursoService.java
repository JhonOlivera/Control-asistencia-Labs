package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.CursoDto;
import com.unibague.control_asistencia.dto.CursoRequestDto;
import com.unibague.control_asistencia.exception.ConflictoCursoException;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.HorarioGrupoRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CursoService {

    private final CursoRepository cursoRepository;
    private final SesionRepository sesionRepository;
    private final HorarioGrupoRepository horarioGrupoRepository;

    public CursoService(CursoRepository cursoRepository,
                         SesionRepository sesionRepository,
                         HorarioGrupoRepository horarioGrupoRepository) {
        this.cursoRepository = cursoRepository;
        this.sesionRepository = sesionRepository;
        this.horarioGrupoRepository = horarioGrupoRepository;
    }

    @Transactional(readOnly = true)
    public List<CursoDto> listarCursos() {
        return cursoRepository.findAllByOrderByNombreAscGrupoAsc().stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public CursoDto crearCurso(CursoRequestDto request) {
        String nombre = request.getNombre().trim();
        String grupo = request.getGrupo().trim();
        validarSinDuplicado(nombre, grupo, null);

        Curso curso = new Curso();
        curso.setNombre(nombre);
        curso.setGrupo(grupo);

        return mapToDto(cursoRepository.save(curso));
    }

    @Transactional
    public CursoDto actualizarCurso(Long id, CursoRequestDto request) {
        Curso curso = buscarCurso(id);
        String nombre = request.getNombre().trim();
        String grupo = request.getGrupo().trim();
        validarSinDuplicado(nombre, grupo, id);

        curso.setNombre(nombre);
        curso.setGrupo(grupo);

        return mapToDto(cursoRepository.save(curso));
    }

    @Transactional
    public void eliminarCurso(Long id) {
        Curso curso = buscarCurso(id);

        if (sesionRepository.existsByCursoId(id)) {
            throw new ConflictoCursoException("El grupo tiene sesiones registradas; no se puede eliminar.");
        }
        if (horarioGrupoRepository.existsByCursoId(id)) {
            throw new ConflictoCursoException("El grupo tiene horarios registrados; no se puede eliminar.");
        }
        if (!curso.getEstudiantes().isEmpty()) {
            throw new ConflictoCursoException("El grupo tiene estudiantes matriculados; no se puede eliminar.");
        }

        cursoRepository.delete(curso);
    }

    private Curso buscarCurso(Long id) {
        return cursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con id " + id));
    }

    private void validarSinDuplicado(String nombre, String grupo, Long idExcluido) {
        cursoRepository.findByNombreAndGrupo(nombre, grupo)
                .filter(curso -> !curso.getId().equals(idExcluido))
                .ifPresent(curso -> {
                    throw new ConflictoCursoException(
                            "Ya existe un grupo con el nombre \"" + nombre + "\" y grupo \"" + grupo + "\".");
                });
    }

    private CursoDto mapToDto(Curso curso) {
        return new CursoDto(curso.getId(), curso.getNombre(), curso.getGrupo());
    }
}
