package com.unibague.control_asistencia.security;

import com.unibague.control_asistencia.dto.UsuarioAutenticadoDto;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public static final String CLAIM_ID = "id";
    public static final String CLAIM_NOMBRE = "nombre";
    public static final String CLAIM_ROL = "rol";

    private final JwtEncoder jwtEncoder;
    private final long expiracionHoras;

    public JwtService(JwtEncoder jwtEncoder, @Value("${app.jwt.expiracion-horas}") long expiracionHoras) {
        this.jwtEncoder = jwtEncoder;
        this.expiracionHoras = expiracionHoras;
    }

    public String generarToken(UsuarioAutenticadoDto usuario) {
        Instant ahora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("control-asistencia")
                .subject(usuario.correo())
                .claim(CLAIM_ID, usuario.id())
                .claim(CLAIM_NOMBRE, usuario.nombre())
                .claim(CLAIM_ROL, usuario.rol())
                .issuedAt(ahora)
                .expiresAt(ahora.plus(expiracionHoras, ChronoUnit.HOURS))
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
