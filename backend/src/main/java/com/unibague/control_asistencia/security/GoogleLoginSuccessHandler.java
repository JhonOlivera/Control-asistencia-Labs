package com.unibague.control_asistencia.security;

import com.unibague.control_asistencia.dto.UsuarioAutenticadoDto;
import com.unibague.control_asistencia.repository.AdministradorRepository;
import com.unibague.control_asistencia.repository.DocenteRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleLoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(GoogleLoginSuccessHandler.class);

    private final AdministradorRepository administradorRepository;
    private final DocenteRepository docenteRepository;
    private final JwtService jwtService;
    private final String frontendUrl;

    public GoogleLoginSuccessHandler(
            AdministradorRepository administradorRepository,
            DocenteRepository docenteRepository,
            JwtService jwtService,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.administradorRepository = administradorRepository;
        this.docenteRepository = docenteRepository;
        this.jwtService = jwtService;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User usuarioGoogle = (OAuth2User) authentication.getPrincipal();
        String correo = usuarioGoogle.getAttribute("email");
        boolean correoVerificado = Boolean.TRUE.equals(usuarioGoogle.getAttribute("email_verified"));

        // La sesión HTTP solo se usó para el intercambio con Google; la API trabaja con el JWT.
        SecurityContextHolder.clearContext();
        HttpSession sesionHttp = request.getSession(false);
        if (sesionHttp != null) {
            sesionHttp.invalidate();
        }

        Optional<UsuarioAutenticadoDto> usuario = correoVerificado ? buscarUsuario(correo) : Optional.empty();
        if (usuario.isEmpty()) {
            logger.warn("Intento de inicio de sesión con un correo no autorizado: {}", correo);
            response.sendRedirect(frontendUrl + "/login?error=no_autorizado");
            return;
        }

        String destino = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/auth/callback")
                .queryParam("token", jwtService.generarToken(usuario.get()))
                .build()
                .toUriString();
        response.sendRedirect(destino);
    }

    private Optional<UsuarioAutenticadoDto> buscarUsuario(String correo) {
        if (correo == null) {
            return Optional.empty();
        }
        return administradorRepository.findByCorreo(correo)
                .map(admin -> new UsuarioAutenticadoDto(admin.getCorreo(), admin.getNombre(), Rol.ADMINISTRADOR.name()))
                .or(() -> docenteRepository.findByCorreo(correo)
                        .map(docente -> new UsuarioAutenticadoDto(docente.getCorreo(), docente.getNombre(), Rol.DOCENTE.name())));
    }
}
