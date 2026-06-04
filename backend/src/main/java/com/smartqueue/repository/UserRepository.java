package com.smartqueue.repository;

import com.smartqueue.domain.AppUser;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, UUID> {
  Optional<AppUser> findByEmailIgnoreCase(String email);
  Optional<AppUser> findBySupabaseUserId(UUID supabaseUserId);
}
