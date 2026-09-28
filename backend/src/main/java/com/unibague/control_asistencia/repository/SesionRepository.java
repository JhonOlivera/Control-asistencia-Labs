package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SesionRepository extends JpaRepository<Sesion, Long> {

    boolean existsByLaboratorioIdAndFechaAndHoraAndEstado(Long laboratorioId, LocalDate fecha, LocalTime hora, EstadoSesion estado);
}
