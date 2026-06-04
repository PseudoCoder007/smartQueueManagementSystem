package com.smartqueue.dto;

import com.smartqueue.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public final class AuthDtos {
  private AuthDtos() {}

  public record SupabaseSyncRequest(@NotBlank String supabaseAccessToken) {}

  public record AdminLoginRequest(@Email @NotBlank String email, @NotBlank String password) {}

  public record UserProfile(UUID id, String email, String name, UserRole role) {}

  public record UserSyncResponse(UUID id, String email, String name, UserRole role, String appToken) {}

  public record AdminLoginResponse(String token, UserRole role, UserProfile user) {}
}
