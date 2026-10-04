package com.unibague.control_asistencia.controller;

import com.unibague.control_asistencia.dto.UsuarioAutenticadoDto;
import com.unibague.control_asistencia.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<UsuarioAutenticadoDto> obtenerUsuarioActual(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(new UsuarioAutenticadoDto(
                jwt.getClaim(JwtService.CLAIM_ID),
                jwt.getSubject(),
                jwt.getClaimAsString(JwtService.CLAIM_NOMBRE),
                jwt.getClaimAsString(JwtService.CLAIM_ROL)
        ));
    }
}
