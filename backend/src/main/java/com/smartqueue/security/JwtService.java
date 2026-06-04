package com.smartqueue.security;

import com.smartqueue.domain.AppUser;
import com.smartqueue.domain.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final long ttlMinutes;

  public JwtService(@Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.ttl-minutes}") long ttlMinutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.ttlMinutes = ttlMinutes;
  }

  public String createToken(AppUser user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("email", user.getEmail())
        .claim("role", user.getRole().name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(ttlMinutes * 60)))
        .signWith(key)
        .compact();
  }

  public AppPrincipal parse(String token) {
    Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    return new AppPrincipal(
        UUID.fromString(claims.getSubject()),
        claims.get("email", String.class),
        UserRole.valueOf(claims.get("role", String.class))
    );
  }
}
