package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.dto.SesionResponseDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionSesionException;
import com.unibague.control_asistencia.model.Administrador;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionService {

    private static final Pattern HORARIO_PATTERN = Pattern.compile("^([A-Z]{3})-([A-Z]{3})\\s+(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$");
    private static final Map<String, Integer> DIAS_MAP = Map.of(
            "LUN", 1,
            "MAR", 2,
            "MIE", 3,
            "JUE", 4,
            "VIE", 5,
            "SAB", 6,
            "DOM", 7
    );

    private final SesionRepository sesionRepository;
    private final LaboratorioRepository laboratorioRepository;
    private final CursoRepository cursoRepository;
    private final AdministradorRepository administradorRepository;

    public SesionService(SesionRepository sesionRepository,
                        LaboratorioRepository laboratorioRepository,
                        CursoRepository cursoRepository,
                        AdministradorRepository administradorRepository) {
        this.sesionRepository = sesionRepository;
        this.laboratorioRepository = laboratorioRepository;
        this.cursoRepository = cursoRepository;
        this.administradorRepository = administradorRepository;
    }

    @Transactional
    public SesionResponseDto crearSesion(SesionRequestDto request) {
        Curso curso = cursoRepository.findById(request.getCursoId())
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con id " + request.getCursoId()));

        Laboratorio laboratorio = laboratorioRepository.findById(request.getLaboratorioId())
                .orElseThrow(() -> new ResourceNotFoundException("Laboratorio no encontrado con id " + request.getLaboratorioId()));

        Administrador administrador = administradorRepository.findById(request.getAdministradorId())
                .orElseThrow(() -> new ResourceNotFoundException("Administrador no encontrado con id " + request.getAdministradorId()));

        validarLaboratorioActivo(laboratorio);
        validarHorarioDisponible(laboratorio.getHorarioDisponible(), request.getFecha(), request.getHora());
        validarSesionAbiertaDuplicada(laboratorio.getId(), request.getFecha(), request.getHora());

        Sesion sesion = new Sesion();
        sesion.setCurso(curso);
        sesion.setLaboratorio(laboratorio);
        sesion.setAdministrador(administrador);
        sesion.setFecha(request.getFecha());
        sesion.setHora(request.getHora());
        sesion.setTema(request.getTema());
        sesion.setEstado(EstadoSesion.ABIERTA);

        Sesion guardada = sesionRepository.save(sesion);
        return mapToResponse(guardada);
    }

    @Transactional
    public SesionResponseDto cerrarSesion(Long id) {
        Sesion sesion = sesionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con id " + id));

        if (sesion.getEstado() == EstadoSesion.CERRADA) {
            throw new ValidacionSesionException("La sesión ya está cerrada.");
        }

        sesion.setEstado(EstadoSesion.CERRADA);
        Sesion actualizada = sesionRepository.save(sesion);
        return mapToResponse(actualizada);
    }

    private void validarLaboratorioActivo(Laboratorio laboratorio) {
        if (laboratorio.getEstado() != EstadoLaboratorio.ACTIVO) {
            throw new ValidacionSesionException("El laboratorio debe estar ACTIVO para abrir una sesión.");
        }
    }

    private void validarSesionAbiertaDuplicada(Long laboratorioId, LocalDate fecha, LocalTime hora) {
        boolean existe = sesionRepository.existsByLaboratorioIdAndFechaAndHoraAndEstado(
                laboratorioId, fecha, hora, EstadoSesion.ABIERTA
        );

        if (existe) {
            throw new ValidacionSesionException(
                    "Ya existe otra sesión abierta en el mismo laboratorio para la misma fecha y hora."
            );
        }
    }

    private void validarHorarioDisponible(String horarioDisponible, LocalDate fecha, LocalTime hora) {
        if (horarioDisponible == null || horarioDisponible.isBlank()) {
            throw new ValidacionSesionException("El laboratorio no tiene horario disponible configurado.");
        }

        Matcher matcher = HORARIO_PATTERN.matcher(horarioDisponible.trim());
        if (!matcher.matches()) {
            throw new ValidacionSesionException("El formato del horario disponible del laboratorio es inválido.");
        }

        String diaInicio = matcher.group(1);
        String diaFin = matcher.group(2);
        LocalTime inicio = LocalTime.parse(matcher.group(3));
        LocalTime fin = LocalTime.parse(matcher.group(4));

        Integer diaInicioNumero = DIAS_MAP.get(diaInicio);
        Integer diaFinNumero = DIAS_MAP.get(diaFin);

        if (diaInicioNumero == null || diaFinNumero == null) {
            throw new ValidacionSesionException("El horario disponible del laboratorio tiene días inválidos.");
        }

        DayOfWeek diaSemana = fecha.getDayOfWeek();
        int diaActual = diaSemana.getValue();

        if (diaActual < diaInicioNumero || diaActual > diaFinNumero) {
            throw new ValidacionSesionException("La fecha no se encuentra dentro del horario disponible del laboratorio.");
        }

        if (hora.isBefore(inicio) || hora.isAfter(fin)) {
            throw new ValidacionSesionException("La hora no se encuentra dentro del horario disponible del laboratorio.");
        }
    }

    private SesionResponseDto mapToResponse(Sesion sesion) {
        return new SesionResponseDto(
                sesion.getId(),
                sesion.getCurso().getId(),
                sesion.getLaboratorio().getId(),
                sesion.getAdministrador().getId(),
                sesion.getFecha(),
                sesion.getHora(),
                sesion.getTema(),
                sesion.getEstado().name()
        );
    }
}
