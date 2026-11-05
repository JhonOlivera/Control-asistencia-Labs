package com.unibague.control_asistencia.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BrevoEmailServiceTest {

    private static final String API_KEY = "xkeysib-test-secret-key";

    private HttpServer servidorFalso;
    private String cuerpoRecibido;
    private String apiKeyRecibida;
    private String metodoRecibido;
    private int codigoRespuesta;
    private String cuerpoRespuesta;

    @BeforeEach
    void setUp() throws IOException {
        servidorFalso = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        servidorFalso.createContext("/v3/smtp/email", this::manejarPeticion);
        servidorFalso.start();
    }

    @AfterEach
    void tearDown() {
        servidorFalso.stop(0);
    }

    private void manejarPeticion(HttpExchange exchange) throws IOException {
        metodoRecibido = exchange.getRequestMethod();
        apiKeyRecibida = exchange.getRequestHeaders().getFirst("api-key");
        cuerpoRecibido = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

        byte[] respuesta = cuerpoRespuesta.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(codigoRespuesta, respuesta.length);
        exchange.getResponseBody().write(respuesta);
        exchange.close();
    }

    private BrevoEmailService crearServicio() {
        return new BrevoEmailService(
                API_KEY,
                "remitente@test.com",
                "Remitente Test",
                "http://localhost:" + servidorFalso.getAddress().getPort() + "/v3/smtp/email"
        );
    }

    @Test
    void enviar_debeArmarPayloadCorrectoYEnviarHeaderApiKey() throws Exception {
        codigoRespuesta = 201;
        cuerpoRespuesta = "{\"messageId\":\"abc-123\"}";
        BrevoEmailService servicio = crearServicio();

        servicio.enviar("juan@test.com", "Juan Pérez", "Asunto de prueba", "Cuerpo del mensaje");

        assertThat(metodoRecibido).isEqualTo("POST");
        assertThat(apiKeyRecibida).isEqualTo(API_KEY);
        assertThat(cuerpoRecibido)
                .contains("\"sender\"")
                .contains("\"email\": \"remitente@test.com\"")
                .contains("\"name\": \"Remitente Test\"")
                .contains("\"to\"")
                .contains("\"email\": \"juan@test.com\"")
                .contains("\"name\": \"Juan Pérez\"")
                .contains("\"subject\": \"Asunto de prueba\"")
                .contains("\"textContent\": \"Cuerpo del mensaje\"");
    }

    @Test
    void enviar_debePropagarErrorSinExponerLaApiKey() {
        codigoRespuesta = 401;
        cuerpoRespuesta = "{\"message\":\"Unauthorized\",\"code\":\"unauthorized\"}";
        BrevoEmailService servicio = crearServicio();

        assertThatThrownBy(() -> servicio.enviar("juan@test.com", "Juan Pérez", "Asunto", "Cuerpo"))
                .isInstanceOf(IOException.class)
                .hasMessageContaining("401")
                .hasMessageNotContaining(API_KEY);
    }
}
