package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SesionRepository extends JpaRepository<Sesion, Long> {
}
