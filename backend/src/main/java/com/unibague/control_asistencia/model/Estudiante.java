package com.unibague.control_asistencia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.ManyToMany;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "estudiantes",
    uniqueConstraints = @UniqueConstraint(columnNames = "codigo")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Estudiante extends Usuario {

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private boolean activo;

    @ManyToMany(mappedBy = "estudiantes")
    private Set<Curso> cursos;
}
