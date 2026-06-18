package com.smartqueue.service;

import com.smartqueue.domain.AppUser;
import com.smartqueue.domain.UserRole;
import com.smartqueue.dto.AuthDtos;
import com.smartqueue.repository.UserRepository;
import com.smartqueue.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository users;
  private final SupabaseAuthService supabaseAuth;
  private final JwtService jwtService;
  private final PasswordEncoder passwordEncoder;
  private final EmailService emailService;

  public AuthService(UserRepository users, SupabaseAuthService supabaseAuth,
      JwtService jwtService, PasswordEncoder passwordEncoder, EmailService emailService) {
    this.users = users;
    this.supabaseAuth = supabaseAuth;
    this.jwtService = jwtService;
    this.passwordEncoder = passwordEncoder;
    this.emailService = emailService;
  }

  @Transactional
  public AuthDtos.UserSyncResponse syncSupabaseUser(String token) {
    SupabaseAuthService.SupabaseUser supabaseUser = supabaseAuth.validate(token);
    AppUser user = users.findBySupabaseUserId(supabaseUser.id())
        .or(() -> users.findByEmailIgnoreCase(supabaseUser.email()))
        .orElseGet(AppUser::new);
    boolean isNewUser = user.getId() == null;
    user.setSupabaseUserId(supabaseUser.id());
    user.setEmail(supabaseUser.email().toLowerCase());
    user.setName(supabaseUser.name());
    user.setRole(UserRole.USER);
    user.setPasswordHash(null);
    users.save(user);
    if (isNewUser) {
      emailService.sendWelcomeEmail(user.getEmail(), user.getName());
    } else {
      emailService.sendSignInNotification(user.getEmail(), user.getName());
    }
    return new AuthDtos.UserSyncResponse(user.getId(), user.getEmail(), user.getName(),
        user.getRole(), jwtService.createToken(user));
  }

  public AuthDtos.AdminLoginResponse loginAdmin(AuthDtos.AdminLoginRequest request) {
    AppUser admin = users.findByEmailIgnoreCase(request.email())
        .orElseThrow(() -> new ForbiddenException("No admin account found for that email address"));
    if (admin.getRole() != UserRole.ADMIN) {
      throw new ForbiddenException("No admin account found for that email address");
    }
    if (admin.getPasswordHash() == null || !passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
      throw new ForbiddenException("Incorrect password");
    }
    emailService.sendSignInNotification(admin.getEmail(), admin.getName());
    var profile = new AuthDtos.UserProfile(admin.getId(), admin.getEmail(), admin.getName(), admin.getRole());
    return new AuthDtos.AdminLoginResponse(jwtService.createToken(admin), admin.getRole(), profile);
  }

  public AuthDtos.UserProfile profile(AppUser user) {
    return new AuthDtos.UserProfile(user.getId(), user.getEmail(), user.getName(), user.getRole());
  }
}
