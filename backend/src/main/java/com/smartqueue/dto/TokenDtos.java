package com.smartqueue.dto;

import com.smartqueue.domain.PriorityType;
import com.smartqueue.domain.TokenStatus;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public final class TokenDtos {
  private TokenDtos() {}

  public record CreateTokenRequest(@NotNull UUID serviceId, PriorityType priorityType) {}

  public record PriorityRequest(@NotNull PriorityType priorityType, @NotNull String reason) {}

  public record TokenResponse(
      UUID id,
      Integer tokenNumber,
      UUID serviceId,
      String serviceName,
      TokenStatus status,
      PriorityType priorityType,
      Integer position,
      Integer estimatedWaitMinutes,
      Instant createdAt,
      Instant calledAt,
      Instant completedAt,
      Instant cancelledAt
  ) {}
}
