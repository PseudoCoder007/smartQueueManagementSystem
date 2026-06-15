package com.smartqueue.service;

import com.smartqueue.domain.TokenStatus;
import com.smartqueue.repository.QueueSessionRepository;
import com.smartqueue.repository.ServiceQueueRepository;
import com.smartqueue.repository.TokenRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StatsServiceTest {
  @Test
  void overviewDefaultsAverageWaitToZeroWhenNoCompletedTokensExist() {
    TokenRepository tokens = mock(TokenRepository.class);
    ServiceQueueRepository services = mock(ServiceQueueRepository.class);
    QueueSessionRepository sessions = mock(QueueSessionRepository.class);
    StatsService stats = new StatsService(tokens, services, sessions);

    when(services.findAll()).thenReturn(List.of());
    when(tokens.count()).thenReturn(0L);
    when(tokens.countByStatus(TokenStatus.COMPLETED)).thenReturn(0L);
    when(tokens.countByStatus(TokenStatus.SKIPPED)).thenReturn(0L);
    when(tokens.countByStatus(TokenStatus.CANCELLED)).thenReturn(0L);
    when(tokens.averageWaitMinutes(TokenStatus.COMPLETED)).thenReturn(null);

    assertThat(stats.overview().averageWaitMinutes()).isZero();
  }
}
