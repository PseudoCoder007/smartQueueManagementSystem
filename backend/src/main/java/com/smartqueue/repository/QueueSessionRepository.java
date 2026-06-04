package com.smartqueue.repository;

import com.smartqueue.domain.QueueSession;
import com.smartqueue.domain.QueueSessionStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QueueSessionRepository extends JpaRepository<QueueSession, UUID> {
  Optional<QueueSession> findByServiceIdAndStatus(UUID serviceId, QueueSessionStatus status);
  boolean existsByServiceIdAndStatus(UUID serviceId, QueueSessionStatus status);
}
