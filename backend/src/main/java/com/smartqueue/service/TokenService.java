package com.smartqueue.service;

import com.smartqueue.domain.*;
import com.smartqueue.dto.TokenDtos;
import com.smartqueue.repository.QueueSessionRepository;
import com.smartqueue.repository.TokenRepository;
import com.smartqueue.websocket.QueueEventPublisher;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {
  private static final List<TokenStatus> ACTIVE = List.of(TokenStatus.WAITING, TokenStatus.CALLED, TokenStatus.SERVING);
  private final ServiceQueueService serviceQueues;
  private final QueueSessionRepository sessions;
  private final TokenRepository tokens;
  private final QueueAuditService audit;
  private final QueueMapper mapper;
  private final QueueEventPublisher publisher;

  public TokenService(ServiceQueueService serviceQueues, QueueSessionRepository sessions,
      TokenRepository tokens, QueueAuditService audit, QueueMapper mapper, QueueEventPublisher publisher) {
    this.serviceQueues = serviceQueues;
    this.sessions = sessions;
    this.tokens = tokens;
    this.audit = audit;
    this.mapper = mapper;
    this.publisher = publisher;
  }

  @Transactional
  public TokenDtos.TokenResponse create(TokenDtos.CreateTokenRequest request, AppUser user) {
    ServiceQueue service = serviceQueues.require(request.serviceId());
    if (service.getStatus() != ServiceStatus.ACTIVE) {
      throw new BadRequestException("Service is inactive");
    }
    QueueSession session = sessions.findByServiceIdAndStatus(service.getId(), QueueSessionStatus.OPEN)
        .orElseThrow(() -> new BadRequestException("Queue is closed"));
    if (tokens.existsByUserIdAndQueueSessionIdAndStatusIn(user.getId(), session.getId(), ACTIVE)) {
      throw new BadRequestException("User already has an active token for this queue");
    }
    Token token = new Token();
    token.setUser(user);
    token.setService(service);
    token.setQueueSession(session);
    token.setTokenNumber(nextNumber(session.getId()));
    token.setPriorityType(request.priorityType() == null ? PriorityType.NORMAL : request.priorityType());
    token.setStatus(TokenStatus.WAITING);
    tokens.save(token);
    recalculate(session);
    audit.record(token, QueueEventType.TOKEN_CREATED, user, "Token created");
    TokenDtos.TokenResponse response = mapper.token(token);
    publisher.queueChanged("TOKEN_CREATED", service.getId(), token.getId(), response);
    publisher.userTokenChanged("TOKEN_CREATED", service.getId(), user.getId(), token.getId(), response);
    return response;
  }

  public List<TokenDtos.TokenResponse> myTokens(AppUser user) {
    return tokens.findByUserIdOrderByCreatedAtDesc(user.getId()).stream().map(mapper::token).toList();
  }

  public TokenDtos.TokenResponse detail(UUID tokenId, AppUser user) {
    Token token = require(tokenId);
    if (user.getRole() != UserRole.ADMIN && !token.getUser().getId().equals(user.getId())) {
      throw new ForbiddenException("Token is not owned by current user");
    }
    return mapper.token(token);
  }

  @Transactional
  public TokenDtos.TokenResponse cancel(UUID tokenId, AppUser user) {
    Token token = require(tokenId);
    if (!token.getUser().getId().equals(user.getId())) {
      throw new ForbiddenException("Token is not owned by current user");
    }
    if (token.getStatus() != TokenStatus.WAITING) {
      throw new BadRequestException("Only waiting tokens can be cancelled");
    }
    token.setStatus(TokenStatus.CANCELLED);
    token.setCancelledAt(Instant.now());
    recalculate(token.getQueueSession());
    audit.record(token, QueueEventType.TOKEN_CANCELLED, user, "User cancelled token");
    TokenDtos.TokenResponse response = mapper.token(token);
    publisher.queueChanged("TOKEN_CANCELLED", token.getService().getId(), token.getId(), response);
    publisher.userTokenChanged("TOKEN_CANCELLED", token.getService().getId(), user.getId(), token.getId(), response);
    return response;
  }

  Token require(UUID tokenId) {
    return tokens.findById(tokenId).orElseThrow(() -> new NotFoundException("Token not found"));
  }

  void recalculate(QueueSession session) {
    List<Token> ordered = mapper.orderedWaiting(tokens.findByQueueSessionIdAndStatusOrderByCreatedAtAsc(
        session.getId(), TokenStatus.WAITING));
    for (int index = 0; index < ordered.size(); index++) {
      Token token = ordered.get(index);
      token.setPositionSnapshot(index + 1);
      token.setEstimatedWaitMinutes(index * token.getService().getAverageServiceMinutes());
    }
    tokens.saveAll(ordered);
  }

  private int nextNumber(UUID sessionId) {
    return tokens.findFirstByQueueSessionIdOrderByTokenNumberDesc(sessionId)
        .map(Token::getTokenNumber).orElse(0) + 1;
  }
}
