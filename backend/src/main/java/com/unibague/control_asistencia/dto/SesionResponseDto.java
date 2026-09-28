package com.unibague.control_asistencia.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class SesionResponseDto {

    private Long id;
    private Long cursoId;
    private Long laboratorioId;
    private Long administradorId;
    private LocalDate fecha;
    private LocalTime hora;
    private String tema;
    private String estado;

    public SesionResponseDto() {
    }

    public SesionResponseDto(Long id, Long cursoId, Long laboratorioId, Long administradorId,
                            LocalDate fecha, LocalTime hora, String tema, String estado) {
        this.id = id;
        this.cursoId = cursoId;
        this.laboratorioId = laboratorioId;
        this.administradorId = administradorId;
        this.fecha = fecha;
        this.hora = hora;
        this.tema = tema;
        this.estado = estado;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCursoId() {
        return cursoId;
    }

    public void setCursoId(Long cursoId) {
        this.cursoId = cursoId;
    }

    public Long getLaboratorioId() {
        return laboratorioId;
    }

    public void setLaboratorioId(Long laboratorioId) {
        this.laboratorioId = laboratorioId;
    }

    public Long getAdministradorId() {
        return administradorId;
    }

    public void setAdministradorId(Long administradorId) {
        this.administradorId = administradorId;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public LocalTime getHora() {
        return hora;
    }

    public void setHora(LocalTime hora) {
        this.hora = hora;
    }

    public String getTema() {
        return tema;
    }

    public void setTema(String tema) {
        this.tema = tema;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
