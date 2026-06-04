package com.smartqueue.service;

import com.smartqueue.domain.AppUser;
import com.smartqueue.repository.UserRepository;
import com.smartqueue.security.AppPrincipal;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUser {
  private final UserRepository users;

  public CurrentUser(UserRepository users) {
    this.users = users;
  }

  public AppUser requireUser() {
    AppPrincipal principal = principal();
    return users.findById(principal.userId()).orElseThrow(() -> new IllegalStateException("User not found"));
  }

  public UUID userId() {
    return principal().userId();
  }

  private AppPrincipal principal() {
    Object value = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    if (value instanceof AppPrincipal principal) {
      return principal;
    }
    throw new IllegalStateException("Authentication required");
  }
}
