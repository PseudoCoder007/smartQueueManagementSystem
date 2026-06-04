package com.smartqueue.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "queue_events")
public class QueueEvent {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "token_id")
  private Token token;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_id")
  private ServiceQueue service;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "queue_session_id")
  private QueueSession queueSession;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_type", nullable = false, columnDefinition = "queue_event_type")
  private QueueEventType eventType;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "actor_user_id")
  private AppUser actorUser;

  private String notes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  public UUID getId() { return id; }
  public Token getToken() { return token; }
  public void setToken(Token token) { this.token = token; }
  public ServiceQueue getService() { return service; }
  public void setService(ServiceQueue service) { this.service = service; }
  public QueueSession getQueueSession() { return queueSession; }
  public void setQueueSession(QueueSession queueSession) { this.queueSession = queueSession; }
  public QueueEventType getEventType() { return eventType; }
  public void setEventType(QueueEventType eventType) { this.eventType = eventType; }
  public AppUser getActorUser() { return actorUser; }
  public void setActorUser(AppUser actorUser) { this.actorUser = actorUser; }
  public String getNotes() { return notes; }
  public void setNotes(String notes) { this.notes = notes; }
  public Instant getCreatedAt() { return createdAt; }
}
