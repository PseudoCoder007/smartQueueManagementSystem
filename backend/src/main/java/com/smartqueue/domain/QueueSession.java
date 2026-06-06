package com.smartqueue.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "queue_sessions")
public class QueueSession {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "service_id", nullable = false)
  private ServiceQueue service;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "queue_session_status")
  private QueueSessionStatus status = QueueSessionStatus.OPEN;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "opened_by")
  private AppUser openedBy;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "closed_by")
  private AppUser closedBy;

  @Column(name = "opened_at", nullable = false)
  private Instant openedAt = Instant.now();

  @Column(name = "closed_at")
  private Instant closedAt;

  public UUID getId() { return id; }
  public ServiceQueue getService() { return service; }
  public void setService(ServiceQueue service) { this.service = service; }
  public QueueSessionStatus getStatus() { return status; }
  public void setStatus(QueueSessionStatus status) { this.status = status; }
  public AppUser getOpenedBy() { return openedBy; }
  public void setOpenedBy(AppUser openedBy) { this.openedBy = openedBy; }
  public AppUser getClosedBy() { return closedBy; }
  public void setClosedBy(AppUser closedBy) { this.closedBy = closedBy; }
  public Instant getOpenedAt() { return openedAt; }
  public Instant getClosedAt() { return closedAt; }
  public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
}
