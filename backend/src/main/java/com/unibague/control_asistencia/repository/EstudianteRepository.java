package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    Optional<Estudiante> findByCodigo(String codigo);
    Optional<Estudiante> findByCorreo(String correo);
    long countByActivoTrue();

    @Query("select e from Estudiante e join e.cursos c where c.id = :cursoId and e.activo = true")
    List<Estudiante> findActivosByCursoId(@Param("cursoId") Long cursoId);
}
