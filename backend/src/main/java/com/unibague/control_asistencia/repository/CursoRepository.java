package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Curso;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    Optional<Curso> findByNombreAndGrupo(String nombre, String grupo);

    @Query("""
            select c.id as cursoId, c.nombre as cursoNombre, c.grupo as cursoGrupo,
                   e.id as estudianteId, e.nombre as estudianteNombre, e.codigo as estudianteCodigo
            from Curso c join c.estudiantes e
            where e.activo = true
            """)
    List<Matricula> findMatriculasDeEstudiantesActivos();

    List<Curso> findAllByOrderByNombreAscGrupoAsc();

    interface Matricula {
        Long getCursoId();
        String getCursoNombre();
        String getCursoGrupo();
        Long getEstudianteId();
        String getEstudianteNombre();
        String getEstudianteCodigo();
    }
}
