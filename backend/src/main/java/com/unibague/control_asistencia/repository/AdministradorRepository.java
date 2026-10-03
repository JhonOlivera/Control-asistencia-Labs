package com.unibague.control_asistencia.repository;

import com.unibague.control_asistencia.model.Administrador;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministradorRepository extends JpaRepository<Administrador, Long> {
    Optional<Administrador> findByCorreo(String correo);
    Optional<Administrador> findByNombre(String nombre);
}
