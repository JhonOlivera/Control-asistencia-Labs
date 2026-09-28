package com.unibague.control_asistencia.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ediciones_auditoria")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EdicionAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000)
    private String valorAnterior;

    @Column(length = 1000)
    private String valorNuevo;

    @Column(nullable = false)
    private LocalDateTime fechaEdicion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asistencia_id", nullable = false)
    private Asistencia asistencia;
}
