package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SesionRepository extends JpaRepository<Sesion, Long> {

    boolean existsByLaboratorioIdAndFechaAndHoraAndEstado(Long laboratorioId, LocalDate fecha, LocalTime hora, EstadoSesion estado);

    @Query("select s.curso.id as cursoId, count(s) as total from Sesion s where s.estado = :estado group by s.curso.id")
    List<ConteoPorCurso> contarPorCursoYEstado(@Param("estado") EstadoSesion estado);

    @Query("""
            select s from Sesion s join fetch s.curso c join fetch s.laboratorio
            where s.estado = :estado
              and c.id in (select c2.id from Curso c2 join c2.estudiantes e where e.id = :estudianteId)
            """)
    List<Sesion> findByEstadoEnCursosDelEstudiante(@Param("estado") EstadoSesion estado,
                                                   @Param("estudianteId") Long estudianteId);

    interface ConteoPorCurso {
        Long getCursoId();
        Long getTotal();
    }
}
