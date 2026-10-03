package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByEstudianteIdAndSesionId(Long estudianteId, Long sesionId);

    @EntityGraph(attributePaths = "estudiante")
    List<Asistencia> findBySesionId(Long sesionId);

    @Query("select a.sesion.id as sesionId, count(a) as total from Asistencia a "
            + "where a.estado in :estados group by a.sesion.id")
    List<ConteoPorSesion> contarPorSesion(@Param("estados") Collection<EstadoAsistencia> estados);

    interface ConteoPorSesion {
        Long getSesionId();
        Long getTotal();
    }
}
