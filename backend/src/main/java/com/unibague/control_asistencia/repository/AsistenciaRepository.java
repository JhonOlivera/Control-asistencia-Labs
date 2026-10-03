package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Asistencia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    boolean existsByEstudianteIdAndSesionId(Long estudianteId, Long sesionId);
}
