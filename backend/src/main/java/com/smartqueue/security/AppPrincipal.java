package com.smartqueue.security;

import com.smartqueue.domain.UserRole;
import java.util.UUID;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

public record AppPrincipal(UUID userId, String email, UserRole role) {
  public SimpleGrantedAuthority authority() {
    return new SimpleGrantedAuthority("ROLE_" + role.name());
  }
}
