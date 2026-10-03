package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Docente;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocenteRepository extends JpaRepository<Docente, Long> {
    Optional<Docente> findByCorreo(String correo);
}
