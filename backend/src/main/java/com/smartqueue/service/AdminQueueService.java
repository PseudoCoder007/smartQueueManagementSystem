package com.smartqueue.service;

import com.smartqueue.domain.*;
import com.smartqueue.dto.QueueDtos;
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
public class AdminQueueService {
  private final ServiceQueueService serviceQueues;
  private final QueueSessionRepository sessions;
  private final TokenRepository tokens;
  private final TokenService tokenService;
  private final QueueAuditService audit;
  private final QueueMapper mapper;
  private final QueueEventPublisher publisher;

  public AdminQueueService(ServiceQueueService serviceQueues, QueueSessionRepository sessions,
      TokenRepository tokens, TokenService tokenService, QueueAuditService audit,
      QueueMapper mapper, QueueEventPublisher publisher) {
    this.serviceQueues = serviceQueues;
    this.sessions = sessions;
    this.tokens = tokens;
    this.tokenService = tokenService;
    this.audit = audit;
    this.mapper = mapper;
    this.publisher = publisher;
  }

  @Transactional
  public QueueDtos.QueueStateResponse open(UUID serviceId, AppUser actor) {
    ServiceQueue service = serviceQueues.require(serviceId);
    QueueSession session = sessions.findByServiceIdAndStatus(serviceId, QueueSessionStatus.OPEN).orElseGet(() -> {
      QueueSession created = new QueueSession();
      created.setService(service);
      created.setOpenedBy(actor);
      return sessions.save(created);
    });
    audit.recordSession(session, QueueEventType.QUEUE_OPENED, actor, "Queue opened");
    publisher.queueChanged("QUEUE_UPDATED", serviceId, null, state(serviceId));
    return state(serviceId);
  }

  @Transactional
  public QueueDtos.QueueStateResponse close(UUID serviceId, AppUser actor) {
    QueueSession session = openSession(serviceId);
    session.setStatus(QueueSessionStatus.CLOSED);
    session.setClosedBy(actor);
    session.setClosedAt(Instant.now());
    audit.recordSession(session, QueueEventType.QUEUE_CLOSED, actor, "Queue closed");
    publisher.queueChanged("QUEUE_UPDATED", serviceId, null, state(serviceId));
    return state(serviceId);
  }

  public QueueDtos.QueueStateResponse state(UUID serviceId) {
    ServiceQueue service = serviceQueues.require(serviceId);
    QueueSession session = sessions.findByServiceIdAndStatus(serviceId, QueueSessionStatus.OPEN).orElse(null);
    if (session == null) {
      return new QueueDtos.QueueStateResponse(serviceId, service.getName(), false, null, 0,
          List.of(), List.of(), List.of(), List.of(), List.of());
    }
    List<Token> all = tokens.findByQueueSessionIdOrderByCreatedAtAsc(session.getId());
    Integer current = all.stream().filter(t -> t.getStatus() == TokenStatus.SERVING).findFirst()
        .map(Token::getTokenNumber).orElse(null);
    return new QueueDtos.QueueStateResponse(serviceId, service.getName(), true, current,
        all.stream().filter(t -> t.getStatus() == TokenStatus.WAITING).count(),
        mapped(all, TokenStatus.WAITING), mapped(all, TokenStatus.SERVING),
        mapped(all, TokenStatus.SKIPPED), mapped(all, TokenStatus.COMPLETED), mapped(all, TokenStatus.CANCELLED));
  }

  @Transactional
  public TokenDtos.TokenResponse callNext(UUID serviceId, AppUser actor) {
    QueueSession session = openSession(serviceId);
    Token next = mapper.orderedWaiting(tokens.findByQueueSessionIdAndStatusOrderByCreatedAtAsc(
        session.getId(), TokenStatus.WAITING)).stream()
        .findFirst().orElseThrow(() -> new BadRequestException("No waiting tokens"));
    return call(next, actor);
  }

  @Transactional
  public TokenDtos.TokenResponse callSpecific(UUID tokenId, AppUser actor) {
    Token token = tokenService.require(tokenId);
    if (token.getStatus() != TokenStatus.WAITING && token.getStatus() != TokenStatus.SKIPPED) {
      throw new BadRequestException("Only waiting or skipped tokens can be called");
    }
    return call(token, actor);
  }

  @Transactional
  public TokenDtos.TokenResponse complete(UUID tokenId, AppUser actor) {
    Token token = tokenService.require(tokenId);
    if (token.getStatus() != TokenStatus.SERVING && token.getStatus() != TokenStatus.CALLED) {
      throw new BadRequestException("Only called or serving tokens can be completed");
    }
    token.setStatus(TokenStatus.COMPLETED);
    token.setCompletedAt(Instant.now());
    tokenService.recalculate(token.getQueueSession());
    return changed(token, QueueEventType.TOKEN_COMPLETED, actor, "Token completed");
  }

  @Transactional
  public TokenDtos.TokenResponse skip(UUID tokenId, AppUser actor) {
    Token token = tokenService.require(tokenId);
    if (token.getStatus() != TokenStatus.SERVING && token.getStatus() != TokenStatus.CALLED) {
      throw new BadRequestException("Only called or serving tokens can be skipped");
    }
    token.setStatus(TokenStatus.SKIPPED);
    tokenService.recalculate(token.getQueueSession());
    return changed(token, QueueEventType.TOKEN_SKIPPED, actor, "Token skipped");
  }

  @Transactional
  public TokenDtos.TokenResponse recall(UUID tokenId, AppUser actor) {
    Token token = tokenService.require(tokenId);
    if (token.getStatus() != TokenStatus.SKIPPED) {
      throw new BadRequestException("Only skipped tokens can be recalled");
    }
    token.setStatus(TokenStatus.WAITING);
    tokenService.recalculate(token.getQueueSession());
    return changed(token, QueueEventType.TOKEN_RECALLED, actor, "Token recalled");
  }

  @Transactional
  public TokenDtos.TokenResponse priority(UUID tokenId, TokenDtos.PriorityRequest request, AppUser actor) {
    Token token = tokenService.require(tokenId);
    token.setPriorityType(request.priorityType());
    token.setPriorityReason(request.reason());
    tokenService.recalculate(token.getQueueSession());
    return changed(token, QueueEventType.PRIORITY_UPDATED, actor, request.reason());
  }

  private TokenDtos.TokenResponse call(Token token, AppUser actor) {
    if (tokens.countByQueueSessionIdAndStatus(token.getQueueSession().getId(), TokenStatus.SERVING) > 0) {
      throw new BadRequestException("Complete or skip the current serving token first");
    }
    token.setStatus(TokenStatus.SERVING);
    token.setCalledAt(Instant.now());
    token.setServingStartedAt(Instant.now());
    token.setPositionSnapshot(0);
    token.setEstimatedWaitMinutes(0);
    tokenService.recalculate(token.getQueueSession());
    return changed(token, QueueEventType.TOKEN_CALLED, actor, "Token called");
  }

  private TokenDtos.TokenResponse changed(Token token, QueueEventType type, AppUser actor, String notes) {
    audit.record(token, type, actor, notes);
    TokenDtos.TokenResponse response = mapper.token(token);
    publisher.queueChanged(type.name(), token.getService().getId(), token.getId(), response);
    publisher.userTokenChanged(type.name(), token.getService().getId(), token.getUser().getId(), token.getId(), response);
    return response;
  }

  private QueueSession openSession(UUID serviceId) {
    return sessions.findByServiceIdAndStatus(serviceId, QueueSessionStatus.OPEN)
        .orElseThrow(() -> new BadRequestException("Queue is closed"));
  }

  private List<TokenDtos.TokenResponse> mapped(List<Token> all, TokenStatus status) {
    return all.stream().filter(token -> token.getStatus() == status).map(mapper::token).toList();
  }
}
