package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.CursoDto;
import com.unibague.control_asistencia.repository.CursoRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CursoService {

    private final CursoRepository cursoRepository;

    public CursoService(CursoRepository cursoRepository) {
        this.cursoRepository = cursoRepository;
    }

    @Transactional(readOnly = true)
    public List<CursoDto> listarCursos() {
        return cursoRepository.findAllByOrderByNombreAscGrupoAsc().stream()
                .map(curso -> new CursoDto(curso.getId(), curso.getNombre(), curso.getGrupo()))
                .toList();
    }
}
