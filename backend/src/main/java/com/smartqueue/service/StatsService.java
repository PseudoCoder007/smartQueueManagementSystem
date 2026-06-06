package com.smartqueue.service;

import com.smartqueue.domain.QueueSessionStatus;
import com.smartqueue.domain.TokenStatus;
import com.smartqueue.dto.StatsDtos;
import com.smartqueue.repository.QueueSessionRepository;
import com.smartqueue.repository.ServiceQueueRepository;
import com.smartqueue.repository.TokenRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class StatsService {
  private final TokenRepository tokens;
  private final ServiceQueueRepository services;
  private final QueueSessionRepository sessions;

  public StatsService(TokenRepository tokens, ServiceQueueRepository services, QueueSessionRepository sessions) {
    this.tokens = tokens;
    this.services = services;
    this.sessions = sessions;
  }

  public StatsDtos.OverviewStats overview() {
    long activeQueues = services.findAll().stream()
        .filter(service -> sessions.existsByServiceIdAndStatus(service.getId(), QueueSessionStatus.OPEN))
        .count();
    Double averageWaitMinutes = tokens.averageWaitMinutes();
    return new StatsDtos.OverviewStats(tokens.count(), activeQueues, tokens.countByStatus(TokenStatus.COMPLETED),
        tokens.countByStatus(TokenStatus.SKIPPED), tokens.countByStatus(TokenStatus.CANCELLED),
        averageWaitMinutes == null ? 0 : averageWaitMinutes);
  }

  public StatsDtos.ServiceStats service(UUID serviceId) {
    var service = services.findById(serviceId).orElseThrow(() -> new NotFoundException("Service not found"));
    return new StatsDtos.ServiceStats(service.getId(), service.getName(),
        tokens.countByServiceId(serviceId),
        sessions.existsByServiceIdAndStatus(service.getId(), QueueSessionStatus.OPEN));
  }

  public StatsDtos.DailyStats daily() {
    Instant start = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
    Instant end = start.plusSeconds(86400);
    var rows = services.findAllByOrderByNameAsc().stream()
        .map(service -> new StatsDtos.ServiceStats(service.getId(), service.getName(),
            tokens.countForServiceBetween(service.getId(), start, end),
            sessions.existsByServiceIdAndStatus(service.getId(), QueueSessionStatus.OPEN)))
        .toList();
    return new StatsDtos.DailyStats(rows);
  }
}
