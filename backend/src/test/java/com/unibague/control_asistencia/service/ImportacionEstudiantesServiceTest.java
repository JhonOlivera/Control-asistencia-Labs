package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.unibague.control_asistencia.dto.ImportacionEstudiantesResponseDto;
import com.unibague.control_asistencia.exception.ValidacionImportacionException;
import com.unibague.control_asistencia.model.Curso;
import com.unibague.control_asistencia.model.Estudiante;
import com.unibague.control_asistencia.repository.CursoRepository;
import com.unibague.control_asistencia.repository.EstudianteRepository;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ImportacionEstudiantesServiceTest {

    @Mock
    private CursoRepository cursoRepository;
    @Mock
    private EstudianteRepository estudianteRepository;

    private ImportacionEstudiantesService importacionEstudiantesService;
    private Curso curso;

    @BeforeEach
    void setUp() {
        importacionEstudiantesService = new ImportacionEstudiantesService(cursoRepository, estudianteRepository);

        curso = new Curso();
        curso.setId(1L);
        curso.setNombre("Ingeniería de Software");
        curso.setGrupo("A");
        curso.setEstudiantes(new HashSet<>());
    }

    @Test
    void importar_debeCrearYMatricularEstudiantesNuevosDeUnCsvValido() {
        String csv = "codigo,nombre,correo\n"
                + "EST-100,Ana Pérez,ana.perez@unibague.edu.co\n"
                + "EST-101,Luis Gómez,luis.gomez@unibague.edu.co\n";
        MockMultipartFile archivo = archivoCsv(csv);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(estudianteRepository.findByCodigo(any())).thenReturn(Optional.empty());
        when(estudianteRepository.findByCorreo(any())).thenReturn(Optional.empty());
        when(estudianteRepository.save(any(Estudiante.class))).thenAnswer(invocacion -> {
            Estudiante guardado = invocacion.getArgument(0);
            guardado.setId((long) (curso.getEstudiantes().size() + 100));
            return guardado;
        });

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.totalFilas()).isEqualTo(2);
        assertThat(respuesta.creados()).isEqualTo(2);
        assertThat(respuesta.yaExistentes()).isEqualTo(0);
        assertThat(respuesta.matriculados()).isEqualTo(2);
        assertThat(respuesta.errores()).isEmpty();
    }

    @Test
    void importar_debeDetectarCabecerasConTildesYEspacios() {
        String csv = "Código;Nombre;Correo electrónico\n"
                + "EST-200;María Ruiz;maria.ruiz@unibague.edu.co\n";
        MockMultipartFile archivo = archivoCsv(csv);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(estudianteRepository.findByCodigo(any())).thenReturn(Optional.empty());
        when(estudianteRepository.findByCorreo(any())).thenReturn(Optional.empty());
        when(estudianteRepository.save(any(Estudiante.class))).thenAnswer(invocacion -> {
            Estudiante guardado = invocacion.getArgument(0);
            guardado.setId(200L);
            return guardado;
        });

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.creados()).isEqualTo(1);
        assertThat(respuesta.errores()).isEmpty();
    }

    @Test
    void importar_debeReutilizarEstudianteExistenteYMatricularloCuandoAunNoLoEsta() {
        String csv = "codigo,nombre,correo\nEST-300,Carlos Ruiz,carlos.ruiz@unibague.edu.co\n";
        MockMultipartFile archivo = archivoCsv(csv);

        Estudiante existente = new Estudiante();
        existente.setId(300L);
        existente.setCodigo("EST-300");
        existente.setNombre("Carlos Ruiz");
        existente.setCorreo("carlos.ruiz@unibague.edu.co");
        existente.setActivo(true);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(estudianteRepository.findByCodigo("EST-300")).thenReturn(Optional.of(existente));
        when(estudianteRepository.findByCorreo("carlos.ruiz@unibague.edu.co")).thenReturn(Optional.of(existente));

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.creados()).isEqualTo(0);
        assertThat(respuesta.yaExistentes()).isEqualTo(1);
        assertThat(respuesta.matriculados()).isEqualTo(1);
        assertThat(respuesta.errores()).isEmpty();
        assertThat(curso.getEstudiantes()).contains(existente);
    }

    @Test
    void importar_noDebeVolverAMatricularAUnEstudianteQueYaEstaEnElCurso() {
        String csv = "codigo,nombre,correo\nEST-400,Diana Lopez,diana.lopez@unibague.edu.co\n";
        MockMultipartFile archivo = archivoCsv(csv);

        Estudiante existente = new Estudiante();
        existente.setId(400L);
        existente.setCodigo("EST-400");
        existente.setNombre("Diana Lopez");
        existente.setCorreo("diana.lopez@unibague.edu.co");
        existente.setActivo(true);
        curso.getEstudiantes().add(existente);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(estudianteRepository.findByCodigo("EST-400")).thenReturn(Optional.of(existente));
        when(estudianteRepository.findByCorreo("diana.lopez@unibague.edu.co")).thenReturn(Optional.of(existente));

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.yaExistentes()).isEqualTo(1);
        assertThat(respuesta.matriculados()).isEqualTo(0);
        assertThat(respuesta.errores()).isEmpty();
    }

    @Test
    void importar_debeReportarErrorCuandoElCorreoEsInvalido() {
        String csv = "codigo,nombre,correo\nEST-500,Pedro Gil,no-es-un-correo\n";
        MockMultipartFile archivo = archivoCsv(csv);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.creados()).isEqualTo(0);
        assertThat(respuesta.errores()).hasSize(1);
        assertThat(respuesta.errores().get(0).motivo()).contains("correo");
    }

    @Test
    void importar_debeReportarErrorCuandoElEstudianteEstaInactivo() {
        String csv = "codigo,nombre,correo\nEST-600,Sofía Campos,sofia.campos@unibague.edu.co\n";
        MockMultipartFile archivo = archivoCsv(csv);

        Estudiante inactivo = new Estudiante();
        inactivo.setId(600L);
        inactivo.setCodigo("EST-600");
        inactivo.setNombre("Sofía Campos");
        inactivo.setCorreo("sofia.campos@unibague.edu.co");
        inactivo.setActivo(false);

        when(cursoRepository.findById(1L)).thenReturn(Optional.of(curso));
        when(estudianteRepository.findByCodigo("EST-600")).thenReturn(Optional.of(inactivo));
        when(estudianteRepository.findByCorreo("sofia.campos@unibague.edu.co")).thenReturn(Optional.of(inactivo));

        ImportacionEstudiantesResponseDto respuesta = importacionEstudiantesService.importarEstudiantes(1L, archivo);

        assertThat(respuesta.errores()).hasSize(1);
        assertThat(respuesta.errores().get(0).motivo()).contains("inactivo");
        assertThat(respuesta.matriculados()).isEqualTo(0);
        assertThat(curso.getEstudiantes()).isEmpty();
    }

    @Test
    void importar_debeFallarCuandoElArchivoEstaVacio() {
        MockMultipartFile archivo = new MockMultipartFile("archivo", "vacio.csv", "text/csv", new byte[0]);

        assertThatThrownBy(() -> importacionEstudiantesService.importarEstudiantes(1L, archivo))
                .isInstanceOf(ValidacionImportacionException.class)
                .hasMessage("El archivo está vacío.");
    }

    @Test
    void importar_debeFallarCuandoElFormatoNoEsSoportado() {
        MockMultipartFile archivo = new MockMultipartFile(
                "archivo", "estudiantes.txt", "text/plain", "codigo,nombre,correo".getBytes(StandardCharsets.UTF_8)
        );

        assertThatThrownBy(() -> importacionEstudiantesService.importarEstudiantes(1L, archivo))
                .isInstanceOf(ValidacionImportacionException.class)
                .hasMessage("Formato de archivo no soportado. Usa .csv o .xlsx.");
    }

    private MockMultipartFile archivoCsv(String contenido) {
        return new MockMultipartFile(
                "archivo", "estudiantes.csv", "text/csv", contenido.getBytes(StandardCharsets.UTF_8)
        );
    }
}
