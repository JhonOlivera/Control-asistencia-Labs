package com.unibague.control_asistencia.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BrevoEmailService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String apiUrl;
    private final String apiKey;
    private final String remitenteCorreo;
    private final String remitenteNombre;

    public BrevoEmailService(
            @Value("${app.brevo.api-key}") String apiKey,
            @Value("${app.brevo.sender-email}") String remitenteCorreo,
            @Value("${app.brevo.sender-name}") String remitenteNombre,
            @Value("${app.brevo.api-url:https://api.brevo.com/v3/smtp/email}") String apiUrl
    ) {
        this.apiKey = apiKey;
        this.remitenteCorreo = remitenteCorreo;
        this.remitenteNombre = remitenteNombre;
        this.apiUrl = apiUrl;
    }

    public boolean estaConfigurado() {
        return apiKey != null && !apiKey.isBlank();
    }

    public void enviar(String destinatarioCorreo, String destinatarioNombre, String asunto, String textoPlano)
            throws IOException, InterruptedException {
        String cuerpo = """
                {
                  "sender": {"email": "%s", "name": "%s"},
                  "to": [{"email": "%s", "name": "%s"}],
                  "subject": "%s",
                  "textContent": "%s"
                }
                """.formatted(
                escapar(remitenteCorreo), escapar(remitenteNombre),
                escapar(destinatarioCorreo), escapar(destinatarioNombre),
                escapar(asunto), escapar(textoPlano));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(15))
                .header("api-key", apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(cuerpo))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("Brevo respondió con estado " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapar(String texto) {
        if (texto == null) {
            return "";
        }
        return texto
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
