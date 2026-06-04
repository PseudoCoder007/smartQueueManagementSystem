package com.smartqueue.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "services")
public class ServiceQueue {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String name;

  private String description;

  @Column(name = "average_service_minutes", nullable = false)
  private Integer averageServiceMinutes = 5;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, columnDefinition = "service_status")
  private ServiceStatus status = ServiceStatus.ACTIVE;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by")
  private AppUser createdBy;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() { return id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public Integer getAverageServiceMinutes() { return averageServiceMinutes; }
  public void setAverageServiceMinutes(Integer averageServiceMinutes) { this.averageServiceMinutes = averageServiceMinutes; }
  public ServiceStatus getStatus() { return status; }
  public void setStatus(ServiceStatus status) { this.status = status; }
  public AppUser getCreatedBy() { return createdBy; }
  public void setCreatedBy(AppUser createdBy) { this.createdBy = createdBy; }
  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
