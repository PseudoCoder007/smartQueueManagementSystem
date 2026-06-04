package com.smartqueue.service;

import com.smartqueue.domain.QueueSession;
import com.smartqueue.domain.Token;
import com.smartqueue.domain.TokenStatus;
import com.smartqueue.dto.ServiceDtos;
import com.smartqueue.dto.TokenDtos;
import com.smartqueue.repository.QueueSessionRepository;
import com.smartqueue.repository.TokenRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class QueueMapper {
  private final QueueSessionRepository sessions;
  private final TokenRepository tokens;

  public QueueMapper(QueueSessionRepository sessions, TokenRepository tokens) {
    this.sessions = sessions;
    this.tokens = tokens;
  }

  public ServiceDtos.ServiceResponse service(com.smartqueue.domain.ServiceQueue service) {
    QueueSession session = sessions.findByServiceIdAndStatus(service.getId(),
        com.smartqueue.domain.QueueSessionStatus.OPEN).orElse(null);
    long queueLength = session == null ? 0 : tokens.countByQueueSessionIdAndStatus(session.getId(), TokenStatus.WAITING);
    Integer current = session == null ? null : tokens.findByQueueSessionIdAndStatusOrderByCreatedAtAsc(
        session.getId(), TokenStatus.SERVING).stream().findFirst().map(Token::getTokenNumber).orElse(null);
    return new ServiceDtos.ServiceResponse(service.getId(), service.getName(), service.getDescription(),
        service.getAverageServiceMinutes(), service.getStatus(), session != null, current, queueLength,
        (int) queueLength * service.getAverageServiceMinutes());
  }

  public TokenDtos.TokenResponse token(Token token) {
    return new TokenDtos.TokenResponse(token.getId(), token.getTokenNumber(), token.getService().getId(),
        token.getService().getName(), token.getStatus(), token.getPriorityType(), token.getPositionSnapshot(),
        token.getEstimatedWaitMinutes(), token.getCreatedAt(), token.getCalledAt(), token.getCompletedAt(),
        token.getCancelledAt());
  }

  public List<Token> orderedWaiting(List<Token> waiting) {
    return waiting.stream().sorted(Comparator
        .comparingInt((Token token) -> token.getPriorityType().ordinal())
        .thenComparing(Token::getCreatedAt)).toList();
  }
}
