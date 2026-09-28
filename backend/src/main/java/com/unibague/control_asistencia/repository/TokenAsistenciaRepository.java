package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.TokenAsistencia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenAsistenciaRepository extends JpaRepository<TokenAsistencia, Long> {
}
