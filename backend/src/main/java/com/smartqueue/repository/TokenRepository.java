package com.smartqueue.repository;

import com.smartqueue.domain.Token;
import com.smartqueue.domain.TokenStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TokenRepository extends JpaRepository<Token, UUID> {
  List<Token> findByUserIdOrderByCreatedAtDesc(UUID userId);
  List<Token> findByQueueSessionIdOrderByCreatedAtAsc(UUID queueSessionId);
  List<Token> findByQueueSessionIdAndStatusOrderByCreatedAtAsc(UUID queueSessionId, TokenStatus status);
  List<Token> findByQueueSessionIdAndStatusInOrderByCreatedAtAsc(UUID queueSessionId, Collection<TokenStatus> statuses);
  Optional<Token> findFirstByQueueSessionIdOrderByTokenNumberDesc(UUID queueSessionId);
  boolean existsByUserIdAndQueueSessionIdAndStatusIn(UUID userId, UUID queueSessionId, Collection<TokenStatus> statuses);
  long countByQueueSessionIdAndStatus(UUID queueSessionId, TokenStatus status);
  long countByServiceId(UUID serviceId);
  long countByStatus(TokenStatus status);

  @Query("""
      select count(t) from Token t
      where t.service.id = :serviceId and t.createdAt >= :start and t.createdAt < :end
      """)
  long countForServiceBetween(@Param("serviceId") UUID serviceId, @Param("start") java.time.Instant start,
      @Param("end") java.time.Instant end);

  @Query("""
      select coalesce(avg(t.estimatedWaitMinutes), 0)
      from Token t
      where t.status = com.smartqueue.domain.TokenStatus.COMPLETED
      and t.estimatedWaitMinutes is not null
      """)
  double averageWaitMinutes();
}
