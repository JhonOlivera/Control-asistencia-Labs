package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Curso;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    Optional<Curso> findByNombreAndGrupo(String nombre, String grupo);
}
