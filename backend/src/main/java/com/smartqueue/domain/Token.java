package com.smartqueue.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tokens")
public class Token {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "token_number", nullable = false)
  private Integer tokenNumber;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_id", nullable = false)
  private ServiceQueue service;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "queue_session_id", nullable = false)
  private QueueSession queueSession;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, columnDefinition = "token_status")
  private TokenStatus status = TokenStatus.WAITING;

  @Enumerated(EnumType.STRING)
  @Column(name = "priority_type", nullable = false, columnDefinition = "priority_type")
  private PriorityType priorityType = PriorityType.NORMAL;

  @Column(name = "priority_reason")
  private String priorityReason;

  @Column(name = "position_snapshot")
  private Integer positionSnapshot;

  @Column(name = "estimated_wait_minutes")
  private Integer estimatedWaitMinutes;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "called_at")
  private Instant calledAt;

  @Column(name = "serving_started_at")
  private Instant servingStartedAt;

  @Column(name = "completed_at")
  private Instant completedAt;

  @Column(name = "cancelled_at")
  private Instant cancelledAt;

  public UUID getId() { return id; }
  public Integer getTokenNumber() { return tokenNumber; }
  public void setTokenNumber(Integer tokenNumber) { this.tokenNumber = tokenNumber; }
  public AppUser getUser() { return user; }
  public void setUser(AppUser user) { this.user = user; }
  public ServiceQueue getService() { return service; }
  public void setService(ServiceQueue service) { this.service = service; }
  public QueueSession getQueueSession() { return queueSession; }
  public void setQueueSession(QueueSession queueSession) { this.queueSession = queueSession; }
  public TokenStatus getStatus() { return status; }
  public void setStatus(TokenStatus status) { this.status = status; }
  public PriorityType getPriorityType() { return priorityType; }
  public void setPriorityType(PriorityType priorityType) { this.priorityType = priorityType; }
  public String getPriorityReason() { return priorityReason; }
  public void setPriorityReason(String priorityReason) { this.priorityReason = priorityReason; }
  public Integer getPositionSnapshot() { return positionSnapshot; }
  public void setPositionSnapshot(Integer positionSnapshot) { this.positionSnapshot = positionSnapshot; }
  public Integer getEstimatedWaitMinutes() { return estimatedWaitMinutes; }
  public void setEstimatedWaitMinutes(Integer estimatedWaitMinutes) { this.estimatedWaitMinutes = estimatedWaitMinutes; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getCalledAt() { return calledAt; }
  public void setCalledAt(Instant calledAt) { this.calledAt = calledAt; }
  public Instant getServingStartedAt() { return servingStartedAt; }
  public void setServingStartedAt(Instant servingStartedAt) { this.servingStartedAt = servingStartedAt; }
  public Instant getCompletedAt() { return completedAt; }
  public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
  public Instant getCancelledAt() { return cancelledAt; }
  public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
}
