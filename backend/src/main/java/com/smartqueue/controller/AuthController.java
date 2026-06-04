package com.smartqueue.controller;

import com.smartqueue.dto.AuthDtos;
import com.smartqueue.service.AuthService;
import com.smartqueue.service.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService auth;
  private final CurrentUser currentUser;

  public AuthController(AuthService auth, CurrentUser currentUser) {
    this.auth = auth;
    this.currentUser = currentUser;
  }

  @PostMapping("/user/supabase-sync")
  public AuthDtos.UserSyncResponse sync(@Valid @RequestBody AuthDtos.SupabaseSyncRequest request) {
    return auth.syncSupabaseUser(request.supabaseAccessToken());
  }

  @PostMapping("/admin/login")
  public AuthDtos.AdminLoginResponse adminLogin(@Valid @RequestBody AuthDtos.AdminLoginRequest request) {
    return auth.loginAdmin(request);
  }

  @GetMapping("/me")
  public AuthDtos.UserProfile me() {
    return auth.profile(currentUser.requireUser());
  }
}
