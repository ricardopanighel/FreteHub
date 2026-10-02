package com.fretehub.security;

import com.fretehub.domain.Enums.UserRole;
import com.fretehub.user.UserAccount;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private static final Logger log = LoggerFactory.getLogger(JwtService.class);
  private static final int MIN_SECRET_BYTES = 32;

  private final JwtProperties properties;
  private final SecretKey key;

  public JwtService(JwtProperties properties, Environment environment) {
    this.properties = properties;
    this.key = resolveKey(properties.secret(), environment);
  }

  private static SecretKey resolveKey(String secret, Environment environment) {
    if (secret == null || secret.isBlank()) {
      if (environment.acceptsProfiles(Profiles.of("prod"))) {
        throw new IllegalStateException(
            "Defina a variavel de ambiente JWT_SECRET (32+ caracteres) em producao.");
      }
      log.warn(
          "JWT_SECRET nao definido: gerando chave efemera de desenvolvimento. "
              + "As sessoes nao sobrevivem a reinicializacao. Defina JWT_SECRET para persisti-las.");
      return Jwts.SIG.HS256.key().build();
    }
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    if (bytes.length < MIN_SECRET_BYTES) {
      throw new IllegalStateException("JWT_SECRET precisa de ao menos 32 caracteres.");
    }
    return Keys.hmacShaKeyFor(bytes);
  }

  public String createToken(UserAccount user) {
    Instant now = Instant.now();
    Instant exp = now.plusSeconds(properties.expirationHours() * 3600L);
    return Jwts.builder()
        .subject(user.getId())
        .claim("name", user.getName())
        .claim("email", user.getEmail())
        .claim("role", user.getRole().name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .signWith(key)
        .compact();
  }

  public AuthUser parse(String token) {
    Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    return new AuthUser(
        claims.getSubject(),
        claims.get("name", String.class),
        claims.get("email", String.class),
        UserRole.valueOf(claims.get("role", String.class)));
  }
}
