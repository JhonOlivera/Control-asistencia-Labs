package com.unibague.control_asistencia.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "coordinadores")
@Getter
@Setter
@NoArgsConstructor
public class Coordinador extends Usuario {
}
