package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.AsistenciaEstudianteDto;
import com.unibague.control_asistencia.dto.ExportacionCsvDto;
import com.unibague.control_asistencia.dto.ParticipanteDto;
import com.unibague.control_asistencia.dto.ResumenParticipantesDto;
import com.unibague.control_asistencia.dto.SesionParticipantesResponseDto;
import com.unibague.control_asistencia.dto.SesionPorFechaDto;
import com.unibague.control_asistencia.dto.SesionRequestDto;
import com.unibague.control_asistencia.dto.SesionResponseDto;
import com.unibague.control_asistencia.dto.SesionResumenDto;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionSesionException;
import com.unibague.control_asistencia.model.Administrador;
import com.unibague.control_asistencia.model.Asistencia;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.Sesion;
import com.unibague.control_asistencia.model.enums.EstadoAsistencia;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.model.enums.EstadoSesion;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.AsistenciaRepository;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import com.unibague.control_asistencia.repository.SesionRepository;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionService {

    private static final Pattern HORARIO_PATTERN = Pattern.compile("^([A-Z]{3})-([A-Z]{3})\\s+(\\d{2}:\\d{2})-(\\d{2}:\\d{2})$");
    private static final String ESTADO_PENDIENTE = "PENDIENTE";
    private static final String ESTADO_MATRICULA_ACTIVA = "ACTIVA";
    private static final String ESTADO_MATRICULA_INACTIVA = "INACTIVA";
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
    private final AsistenciaRepository asistenciaRepository;
    private final EstudianteRepository estudianteRepository;

    public SesionService(SesionRepository sesionRepository,
                        LaboratorioRepository laboratorioRepository,
                        CursoRepository cursoRepository,
                        AdministradorRepository administradorRepository,
                        AsistenciaRepository asistenciaRepository,
                        EstudianteRepository estudianteRepository) {
        this.sesionRepository = sesionRepository;
        this.laboratorioRepository = laboratorioRepository;
        this.cursoRepository = cursoRepository;
        this.administradorRepository = administradorRepository;
        this.asistenciaRepository = asistenciaRepository;
        this.estudianteRepository = estudianteRepository;
    }

    @Transactional(readOnly = true)
    public List<SesionResumenDto> listarSesiones(String estadoFiltro, LocalDate fechaFiltro) {
        EstadoSesion estado = parseEstadoSesion(estadoFiltro);

        Map<Long, Long> marcadosPorSesion = asistenciaRepository
                .contarPorSesion(List.of(EstadoAsistencia.PRESENTE, EstadoAsistencia.TARDE))
                .stream()
                .collect(Collectors.toMap(
                        AsistenciaRepository.ConteoPorSesion::getSesionId,
                        AsistenciaRepository.ConteoPorSesion::getTotal
                ));

        return sesionRepository.findAllByOrderByFechaDescHoraDescIdDesc().stream()
                .filter(sesion -> estado == null || sesion.getEstado() == estado)
                .filter(sesion -> fechaFiltro == null || sesion.getFecha().equals(fechaFiltro))
                .map(sesion -> new SesionResumenDto(
                        sesion.getId(),
                        sesion.getCurso().getId(),
                        sesion.getCurso().getNombre(),
                        sesion.getCurso().getGrupo(),
                        sesion.getLaboratorio().getId(),
                        sesion.getLaboratorio().getNombre(),
                        sesion.getFecha(),
                        sesion.getHora(),
                        sesion.getTema(),
                        sesion.getEstado().name(),
                        marcadosPorSesion.getOrDefault(sesion.getId(), 0L)
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AsistenciaEstudianteDto> listarAsistencias(Long sesionId) {
        Sesion sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con id " + sesionId));

        Map<Long, Asistencia> asistenciasPorEstudiante = asistenciaRepository.findBySesionId(sesionId).stream()
                .collect(Collectors.toMap(asistencia -> asistencia.getEstudiante().getId(), Function.identity()));

        List<AsistenciaEstudianteDto> resultado = new ArrayList<>();
        for (Estudiante estudiante : estudianteRepository.findActivosByCursoId(sesion.getCurso().getId())) {
            Asistencia asistencia = asistenciasPorEstudiante.remove(estudiante.getId());
            resultado.add(asistencia != null
                    ? mapToAsistenciaEstudiante(asistencia)
                    : new AsistenciaEstudianteDto(estudiante.getId(), estudiante.getNombre(), estudiante.getCodigo(),
                            estudiante.getCorreo(), ESTADO_PENDIENTE, null));
        }
        // Registros de estudiantes que ya no están activos en el curso: se muestran para no perder el historial.
        asistenciasPorEstudiante.values().forEach(asistencia -> resultado.add(mapToAsistenciaEstudiante(asistencia)));

        resultado.sort(Comparator.comparing(AsistenciaEstudianteDto::nombre, String.CASE_INSENSITIVE_ORDER));
        return resultado;
    }

    @Transactional(readOnly = true)
    public SesionParticipantesResponseDto obtenerParticipantes(Long sesionId, String asistenciaFiltro, String matriculaFiltro) {
        Sesion sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con id " + sesionId));

        List<ParticipanteDto> todos = construirParticipantes(sesion);
        ResumenParticipantesDto resumen = new ResumenParticipantesDto(
                todos.size(),
                contarPorAsistencia(todos, EstadoAsistencia.PRESENTE),
                contarPorAsistencia(todos, EstadoAsistencia.TARDE),
                contarPorAsistencia(todos, EstadoAsistencia.AUSENTE)
        );

        List<ParticipanteDto> filtrados = todos.stream()
                .filter(p -> asistenciaFiltro == null || asistenciaFiltro.isBlank()
                        || p.asistencia().equalsIgnoreCase(asistenciaFiltro.trim()))
                .filter(p -> matriculaFiltro == null || matriculaFiltro.isBlank()
                        || p.estadoMatricula().equalsIgnoreCase(matriculaFiltro.trim()))
                .sorted(Comparator.comparing(ParticipanteDto::nombre, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new SesionParticipantesResponseDto(
                sesion.getId(),
                sesion.getCurso().getId(),
                sesion.getCurso().getNombre(),
                sesion.getCurso().getGrupo(),
                sesion.getLaboratorio().getId(),
                sesion.getLaboratorio().getNombre(),
                sesion.getFecha(),
                sesion.getHora(),
                sesion.getEstado().name(),
                resumen,
                filtrados
        );
    }

    @Transactional(readOnly = true)
    public List<SesionPorFechaDto> listarPorFecha(LocalDate fecha) {
        return sesionRepository.findByFechaOrderByHoraAscIdAsc(fecha).stream()
                .map(sesion -> {
                    List<ParticipanteDto> participantes = construirParticipantes(sesion);
                    return new SesionPorFechaDto(
                            sesion.getId(),
                            sesion.getCurso().getId(),
                            sesion.getCurso().getNombre(),
                            sesion.getCurso().getGrupo(),
                            sesion.getLaboratorio().getId(),
                            sesion.getLaboratorio().getNombre(),
                            sesion.getFecha(),
                            sesion.getHora(),
                            sesion.getEstado().name(),
                            contarPorAsistencia(participantes, EstadoAsistencia.PRESENTE),
                            contarPorAsistencia(participantes, EstadoAsistencia.TARDE),
                            contarPorAsistencia(participantes, EstadoAsistencia.AUSENTE)
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ExportacionCsvDto exportarParticipantesCsv(Long sesionId, boolean incluirAusentes) {
        Sesion sesion = sesionRepository.findById(sesionId)
                .orElseThrow(() -> new ResourceNotFoundException("Sesión no encontrada con id " + sesionId));

        List<ParticipanteDto> participantes = construirParticipantes(sesion).stream()
                .filter(p -> incluirAusentes || !p.asistencia().equals(EstadoAsistencia.AUSENTE.name()))
                .sorted(Comparator.comparing(ParticipanteDto::nombre, String.CASE_INSENSITIVE_ORDER))
                .toList();

        StringWriter writer = new StringWriter();
        writer.write('﻿');
        try (CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder()
                .setHeader("codigo", "nombre", "estado", "horaRegistro")
                .get())) {
            for (ParticipanteDto participante : participantes) {
                printer.printRecord(
                        participante.codigo(),
                        participante.nombre(),
                        participante.asistencia(),
                        participante.horaRegistro() == null ? "" : participante.horaRegistro().toString()
                );
            }
        } catch (IOException e) {
            throw new ValidacionSesionException("No se pudo generar el archivo CSV de asistencia.");
        }

        String nombreArchivo = "asistencia-" + sanitizarParaArchivo(sesion.getCurso().getNombre())
                + "-" + sanitizarParaArchivo(sesion.getCurso().getGrupo())
                + "-" + sesion.getFecha() + ".csv";

        return new ExportacionCsvDto(nombreArchivo, writer.toString().getBytes(StandardCharsets.UTF_8));
    }

    private List<ParticipanteDto> construirParticipantes(Sesion sesion) {
        Map<Long, Asistencia> asistenciaPorEstudiante = asistenciaRepository.findBySesionId(sesion.getId()).stream()
                .collect(Collectors.toMap(asistencia -> asistencia.getEstudiante().getId(), Function.identity()));

        return estudianteRepository.findByCursoId(sesion.getCurso().getId()).stream()
                .map(estudiante -> {
                    Asistencia asistencia = asistenciaPorEstudiante.get(estudiante.getId());
                    String estadoAsistencia = asistencia != null
                            ? asistencia.getEstado().name()
                            : EstadoAsistencia.AUSENTE.name();
                    LocalDateTime horaRegistro = asistencia != null ? asistencia.getHoraRegistro() : null;
                    String estadoMatricula = estudiante.isActivo() ? ESTADO_MATRICULA_ACTIVA : ESTADO_MATRICULA_INACTIVA;

                    return new ParticipanteDto(estudiante.getId(), estudiante.getCodigo(), estudiante.getNombre(),
                            estudiante.getCorreo(), estadoMatricula, estadoAsistencia, horaRegistro);
                })
                .toList();
    }

    private long contarPorAsistencia(List<ParticipanteDto> participantes, EstadoAsistencia estado) {
        return participantes.stream().filter(p -> p.asistencia().equals(estado.name())).count();
    }

    private EstadoSesion parseEstadoSesion(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        try {
            return EstadoSesion.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidacionSesionException("El estado debe ser ABIERTA o CERRADA.");
        }
    }

    private String sanitizarParaArchivo(String texto) {
        String sinTildes = Normalizer.normalize(texto, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return sinTildes.replaceAll("[^A-Za-z0-9]+", "-").replaceAll("^-+|-+$", "");
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
        validarCapacidadLaboratorio(curso, laboratorio);

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
        registrarAusentes(actualizada);
        return mapToResponse(actualizada);
    }

    private void registrarAusentes(Sesion sesion) {
        Set<Long> estudiantesConRegistro = asistenciaRepository.findBySesionId(sesion.getId()).stream()
                .map(asistencia -> asistencia.getEstudiante().getId())
                .collect(Collectors.toSet());
        // horaRegistro es obligatoria en la entidad; para los ausentes es el momento del cierre.
        LocalDateTime ahora = LocalDateTime.now();

        List<Asistencia> ausentes = estudianteRepository.findActivosByCursoId(sesion.getCurso().getId()).stream()
                .filter(estudiante -> !estudiantesConRegistro.contains(estudiante.getId()))
                .map(estudiante -> {
                    Asistencia asistencia = new Asistencia();
                    asistencia.setEstudiante(estudiante);
                    asistencia.setSesion(sesion);
                    asistencia.setHoraRegistro(ahora);
                    asistencia.setEstado(EstadoAsistencia.AUSENTE);
                    return asistencia;
                })
                .toList();
        asistenciaRepository.saveAll(ausentes);
    }

    private AsistenciaEstudianteDto mapToAsistenciaEstudiante(Asistencia asistencia) {
        Estudiante estudiante = asistencia.getEstudiante();
        return new AsistenciaEstudianteDto(
                estudiante.getId(),
                estudiante.getNombre(),
                estudiante.getCodigo(),
                estudiante.getCorreo(),
                asistencia.getEstado().name(),
                asistencia.getHoraRegistro()
        );
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

    private void validarCapacidadLaboratorio(Curso curso, Laboratorio laboratorio) {
        int estudiantesActivos = estudianteRepository.findActivosByCursoId(curso.getId()).size();
        if (estudiantesActivos > laboratorio.getCapacidad()) {
            throw new ValidacionSesionException(
                    "El curso tiene " + estudiantesActivos + " estudiantes activos y el laboratorio solo admite "
                            + laboratorio.getCapacidad() + "."
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
