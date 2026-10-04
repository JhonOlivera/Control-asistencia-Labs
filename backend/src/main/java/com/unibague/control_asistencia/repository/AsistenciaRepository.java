package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByEstudianteIdAndSesionId(Long estudianteId, Long sesionId);

    @Query("""
            select a.estudiante.id as estudianteId, a.sesion.curso.id as cursoId, count(a) as total
            from Asistencia a
            where a.sesion.estado = :estadoSesion and a.estado in :estados
            group by a.estudiante.id, a.sesion.curso.id
            """)
    List<ConteoPorEstudianteYCurso> contarPorEstudianteYCurso(@Param("estadoSesion") EstadoSesion estadoSesion,
                                                              @Param("estados") Collection<EstadoAsistencia> estados);

    @Query("""
            select a from Asistencia a
            join fetch a.sesion s join fetch s.curso join fetch s.laboratorio
            where a.estudiante.id = :estudianteId
            """)
    List<Asistencia> findByEstudianteIdConSesion(@Param("estudianteId") Long estudianteId);

    interface ConteoPorEstudianteYCurso {
        Long getEstudianteId();
        Long getCursoId();
        Long getTotal();
    }
}
