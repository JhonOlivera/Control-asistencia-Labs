package com.unibague.control_asistencia.service;

import com.unibague.control_asistencia.dto.HorarioGrupoRequestDto;
import com.unibague.control_asistencia.dto.HorarioGrupoResponseDto;
import com.unibague.control_asistencia.exception.ConflictoHorarioGrupoException;
import com.unibague.control_asistencia.exception.ResourceNotFoundException;
import com.unibague.control_asistencia.exception.ValidacionHorarioGrupoException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.HorarioGrupo;
import com.unibague.control_asistencia.model.Laboratorio;
import com.unibague.control_asistencia.model.enums.EstadoLaboratorio;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.HorarioGrupoRepository;
import com.unibague.control_asistencia.repository.LaboratorioRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HorarioGrupoService {

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

    private final HorarioGrupoRepository horarioGrupoRepository;
    private final CursoRepository cursoRepository;
    private final LaboratorioRepository laboratorioRepository;

    public HorarioGrupoService(HorarioGrupoRepository horarioGrupoRepository,
                                CursoRepository cursoRepository,
                                LaboratorioRepository laboratorioRepository) {
        this.horarioGrupoRepository = horarioGrupoRepository;
        this.cursoRepository = cursoRepository;
        this.laboratorioRepository = laboratorioRepository;
    }

    @Transactional(readOnly = true)
    public List<HorarioGrupoResponseDto> listarPorCurso(Long cursoId) {
        buscarCurso(cursoId);
        return horarioGrupoRepository.findByCursoIdOrderByDiaSemanaAscHoraInicioAsc(cursoId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public HorarioGrupoResponseDto crearHorario(HorarioGrupoRequestDto request) {
        Curso curso = buscarCurso(request.getCursoId());
        Laboratorio laboratorio = buscarLaboratorio(request.getLaboratorioId());

        validarHorario(laboratorio, request.getDiaSemana(), request.getHoraInicio(), request.getHoraFin());
        validarSinDuplicado(request.getCursoId(), request.getLaboratorioId(), request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin(), null);
        validarSinSolapamiento(request.getLaboratorioId(), request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin(), null);

        HorarioGrupo horario = new HorarioGrupo();
        horario.setCurso(curso);
        horario.setLaboratorio(laboratorio);
        horario.setDiaSemana(request.getDiaSemana());
        horario.setHoraInicio(request.getHoraInicio());
        horario.setHoraFin(request.getHoraFin());
        horario.setActivo(true);

        return mapToResponse(horarioGrupoRepository.save(horario));
    }

    @Transactional
    public HorarioGrupoResponseDto actualizarHorario(Long id, HorarioGrupoRequestDto request) {
        HorarioGrupo horario = buscarHorario(id);
        Curso curso = buscarCurso(request.getCursoId());
        Laboratorio laboratorio = buscarLaboratorio(request.getLaboratorioId());

        validarHorario(laboratorio, request.getDiaSemana(), request.getHoraInicio(), request.getHoraFin());
        validarSinDuplicado(request.getCursoId(), request.getLaboratorioId(), request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin(), id);
        validarSinSolapamiento(request.getLaboratorioId(), request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin(), id);

        horario.setCurso(curso);
        horario.setLaboratorio(laboratorio);
        horario.setDiaSemana(request.getDiaSemana());
        horario.setHoraInicio(request.getHoraInicio());
        horario.setHoraFin(request.getHoraFin());

        return mapToResponse(horarioGrupoRepository.save(horario));
    }

    @Transactional
    public HorarioGrupoResponseDto desactivarHorario(Long id) {
        HorarioGrupo horario = buscarHorario(id);

        if (!horario.isActivo()) {
            throw new ValidacionHorarioGrupoException("El horario ya está inactivo.");
        }

        horario.setActivo(false);
        return mapToResponse(horarioGrupoRepository.save(horario));
    }

    private Curso buscarCurso(Long id) {
        return cursoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Curso no encontrado con id " + id));
    }

    private Laboratorio buscarLaboratorio(Long id) {
        return laboratorioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratorio no encontrado con id " + id));
    }

    private HorarioGrupo buscarHorario(Long id) {
        return horarioGrupoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Horario no encontrado con id " + id));
    }

    private void validarHorario(Laboratorio laboratorio, DayOfWeek diaSemana, LocalTime horaInicio, LocalTime horaFin) {
        validarRangoHoras(horaInicio, horaFin);
        validarLaboratorioActivo(laboratorio);
        validarDentroDeDisponibilidad(laboratorio.getHorarioDisponible(), diaSemana, horaInicio, horaFin);
    }

    private void validarRangoHoras(LocalTime horaInicio, LocalTime horaFin) {
        if (!horaFin.isAfter(horaInicio)) {
            throw new ValidacionHorarioGrupoException("La hora de fin debe ser posterior a la hora de inicio.");
        }
    }

    private void validarLaboratorioActivo(Laboratorio laboratorio) {
        if (laboratorio.getEstado() != EstadoLaboratorio.ACTIVO) {
            throw new ValidacionHorarioGrupoException("El laboratorio debe estar ACTIVO para asignarle un horario.");
        }
    }

    private void validarDentroDeDisponibilidad(String horarioDisponible, DayOfWeek diaSemana,
                                                 LocalTime horaInicio, LocalTime horaFin) {
        if (horarioDisponible == null || horarioDisponible.isBlank()) {
            throw new ValidacionHorarioGrupoException("El laboratorio no tiene horario disponible configurado.");
        }

        Matcher matcher = HORARIO_PATTERN.matcher(horarioDisponible.trim());
        if (!matcher.matches()) {
            throw new ValidacionHorarioGrupoException("El formato del horario disponible del laboratorio es inválido.");
        }

        Integer diaInicioNumero = DIAS_MAP.get(matcher.group(1));
        Integer diaFinNumero = DIAS_MAP.get(matcher.group(2));
        if (diaInicioNumero == null || diaFinNumero == null) {
            throw new ValidacionHorarioGrupoException("El horario disponible del laboratorio tiene días inválidos.");
        }

        LocalTime inicioDisponible = LocalTime.parse(matcher.group(3));
        LocalTime finDisponible = LocalTime.parse(matcher.group(4));

        int diaActual = diaSemana.getValue();
        if (diaActual < diaInicioNumero || diaActual > diaFinNumero) {
            throw new ValidacionHorarioGrupoException(
                    "El día no se encuentra dentro del horario disponible del laboratorio.");
        }

        if (horaInicio.isBefore(inicioDisponible) || horaFin.isAfter(finDisponible)) {
            throw new ValidacionHorarioGrupoException(
                    "El rango de horas no se encuentra dentro del horario disponible del laboratorio.");
        }
    }

    private void validarSinDuplicado(Long cursoId, Long laboratorioId, DayOfWeek diaSemana,
                                       LocalTime horaInicio, LocalTime horaFin, Long idExcluido) {
        boolean duplicado = horarioGrupoRepository.findByCursoIdAndActivoTrue(cursoId).stream()
                .filter(existente -> !existente.getId().equals(idExcluido))
                .anyMatch(existente -> existente.getLaboratorio().getId().equals(laboratorioId)
                        && existente.getDiaSemana() == diaSemana
                        && existente.getHoraInicio().equals(horaInicio)
                        && existente.getHoraFin().equals(horaFin));

        if (duplicado) {
            throw new ConflictoHorarioGrupoException("El curso ya tiene registrado ese horario.");
        }
    }

    private void validarSinSolapamiento(Long laboratorioId, DayOfWeek diaSemana,
                                          LocalTime horaInicio, LocalTime horaFin, Long idExcluido) {
        boolean solapa = horarioGrupoRepository.findByLaboratorioIdAndDiaSemanaAndActivoTrue(laboratorioId, diaSemana).stream()
                .filter(existente -> !existente.getId().equals(idExcluido))
                .anyMatch(existente -> horaInicio.isBefore(existente.getHoraFin())
                        && existente.getHoraInicio().isBefore(horaFin));

        if (solapa) {
            throw new ConflictoHorarioGrupoException(
                    "Ya existe un horario activo que se solapa en ese laboratorio y día.");
        }
    }

    private HorarioGrupoResponseDto mapToResponse(HorarioGrupo horario) {
        return new HorarioGrupoResponseDto(
                horario.getId(),
                horario.getCurso().getId(),
                horario.getCurso().getNombre(),
                horario.getCurso().getGrupo(),
                horario.getLaboratorio().getId(),
                horario.getLaboratorio().getNombre(),
                horario.getDiaSemana(),
                horario.getHoraInicio(),
                horario.getHoraFin(),
                horario.isActivo()
        );
    }
}
