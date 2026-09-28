package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.EdicionAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EdicionAuditoriaRepository extends JpaRepository<EdicionAuditoria, Long> {
}
