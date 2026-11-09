package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.HorarioGrupo;
import java.time.DayOfWeek;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioGrupoRepository extends JpaRepository<HorarioGrupo, Long> {

    @EntityGraph(attributePaths = {"curso", "laboratorio"})
    List<HorarioGrupo> findByCursoIdOrderByDiaSemanaAscHoraInicioAsc(Long cursoId);

    List<HorarioGrupo> findByCursoIdAndActivoTrue(Long cursoId);

    List<HorarioGrupo> findByLaboratorioIdAndDiaSemanaAndActivoTrue(Long laboratorioId, DayOfWeek diaSemana);

    boolean existsByCursoId(Long cursoId);
}
