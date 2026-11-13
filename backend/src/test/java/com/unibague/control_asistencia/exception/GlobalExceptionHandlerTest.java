package com.unibague.control_asistencia.exception;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleDataIntegrityViolation_debeDevolver409ConMensajeClaro() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException("violación de FK");

        ResponseEntity<ErrorResponse> respuesta = handler.handleDataIntegrityViolation(ex);

        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(respuesta.getBody()).isNotNull();
        assertThat(respuesta.getBody().message())
                .isEqualTo("No se pudo completar la operación porque hay datos relacionados.");
    }

    // Punto 1: excepciones del framework que implementan org.springframework.web.ErrorResponse
    // deben conservar su código HTTP real.

    @Test
    void handleExceptionGenerica_debeConservarElCodigoRealDeUnaResponseStatusException() throws Exception {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "detalle interno sensible");

        ResponseEntity<ErrorResponse> respuesta = handler.handleExceptionGenerica(ex);

        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(respuesta.getBody()).isNotNull();
        assertThat(respuesta.getBody().message()).doesNotContain("detalle interno sensible");
    }

    @Test
    void handleExceptionGenerica_debeConservarElCodigoRealDeExcepcionesDeErrorResponse() throws Exception {
        NoResourceFoundException noEncontrado =
                new NoResourceFoundException(HttpMethod.GET, "/no-existe", "detalle interno sensible");
        HttpRequestMethodNotSupportedException metodoNoPermitido =
                new HttpRequestMethodNotSupportedException("DELETE", List.of("GET", "POST"));

        ResponseEntity<ErrorResponse> respuestaNoEncontrado = handler.handleExceptionGenerica(noEncontrado);
        ResponseEntity<ErrorResponse> respuestaMetodoNoPermitido = handler.handleExceptionGenerica(metodoNoPermitido);

        assertThat(respuestaNoEncontrado.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(respuestaNoEncontrado.getBody()).isNotNull();
        assertThat(respuestaNoEncontrado.getBody().message()).doesNotContain("detalle interno sensible");

        assertThat(respuestaMetodoNoPermitido.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    // Punto 2: AccessDeniedException y AuthenticationException deben relanzarse para que
    // Spring Security las siga manejando (401/403), no convertirse aquí en un 500.

    @Test
    void handleExceptionGenerica_debeRelanzarAccessDeniedException() {
        AccessDeniedException ex = new AccessDeniedException("sin permisos");

        assertThatThrownBy(() -> handler.handleExceptionGenerica(ex)).isSameAs(ex);
    }

    @Test
    void handleExceptionGenerica_debeRelanzarAuthenticationException() {
        BadCredentialsException ex = new BadCredentialsException("credenciales inválidas");

        assertThatThrownBy(() -> handler.handleExceptionGenerica(ex)).isSameAs(ex);
    }

    // Punto 3: solo el resto de excepciones inesperadas se convierten en 500 genérico.

    @Test
    void handleExceptionGenerica_debeDevolver500SinExponerElDetalleReal() throws Exception {
        Exception ex = new NullPointerException("detalle interno sensible");

        ResponseEntity<ErrorResponse> respuesta = handler.handleExceptionGenerica(ex);

        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(respuesta.getBody()).isNotNull();
        assertThat(respuesta.getBody().message()).isEqualTo("Ocurrió un error inesperado");
        assertThat(respuesta.getBody().message()).doesNotContain("detalle interno sensible");
    }
}
