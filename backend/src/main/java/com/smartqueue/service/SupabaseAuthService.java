package com.smartqueue.service;

import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Service
public class SupabaseAuthService {
  private final RestTemplate restTemplate = new RestTemplate();
  private final String supabaseUrl;
  private final String anonKey;
  private final boolean devAuthEnabled;

  public SupabaseAuthService(@Value("${app.supabase.url}") String supabaseUrl,
      @Value("${app.supabase.anon-key}") String anonKey,
      @Value("${app.dev-auth.enabled}") boolean devAuthEnabled) {
    this.supabaseUrl = supabaseUrl;
    this.anonKey = anonKey;
    this.devAuthEnabled = devAuthEnabled;
  }

  public SupabaseUser validate(String accessToken) {
    if (devAuthEnabled && accessToken.startsWith("dev:")) {
      String email = accessToken.substring(4);
      return new SupabaseUser(UUID.nameUUIDFromBytes(email.getBytes()), email, email);
    }
    if (!StringUtils.hasText(supabaseUrl) || !StringUtils.hasText(anonKey)) {
      throw new BadRequestException("Supabase credentials are not configured");
    }
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(accessToken);
    headers.set("apikey", anonKey);
    var response = restTemplate.exchange(supabaseUrl + "/auth/v1/user", HttpMethod.GET,
        new HttpEntity<>(headers), Map.class);
    Map<?, ?> body = response.getBody();
    if (body == null || body.get("id") == null || body.get("email") == null) {
      throw new ForbiddenException("Invalid Supabase token");
    }
    String email = body.get("email").toString();
    return new SupabaseUser(UUID.fromString(body.get("id").toString()), email, email);
  }

  public record SupabaseUser(UUID id, String email, String name) {}
}
