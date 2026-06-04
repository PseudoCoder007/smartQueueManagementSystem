package com.smartqueue.config;

import com.smartqueue.domain.AppUser;
import com.smartqueue.domain.UserRole;
import com.smartqueue.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AdminSeedRunner implements ApplicationRunner {
  private final UserRepository users;
  private final PasswordEncoder passwordEncoder;
  private final String email;
  private final String name;
  private final String password;

  public AdminSeedRunner(UserRepository users, PasswordEncoder passwordEncoder,
      @Value("${app.admin-seed.email}") String email,
      @Value("${app.admin-seed.name}") String name,
      @Value("${app.admin-seed.password}") String password) {
    this.users = users;
    this.passwordEncoder = passwordEncoder;
    this.email = email;
    this.name = name;
    this.password = password;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
      return;
    }
    AppUser admin = users.findByEmailIgnoreCase(email).orElseGet(AppUser::new);
    admin.setEmail(email.toLowerCase());
    admin.setName(name);
    admin.setRole(UserRole.ADMIN);
    admin.setPasswordHash(passwordEncoder.encode(password));
    users.save(admin);
  }
}
