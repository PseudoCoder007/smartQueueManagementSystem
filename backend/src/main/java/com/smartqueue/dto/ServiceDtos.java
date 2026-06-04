package com.smartqueue.dto;

import com.smartqueue.domain.ServiceStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public final class ServiceDtos {
  private ServiceDtos() {}

  public record ServiceRequest(
      @NotBlank String name,
      String description,
      @Min(1) Integer averageServiceMinutes,
      ServiceStatus status
  ) {}

  public record ServiceResponse(
      UUID id,
      String name,
      String description,
      Integer averageServiceMinutes,
      ServiceStatus status,
      boolean queueOpen,
      Integer currentToken,
      long queueLength,
      Integer estimatedWaitMinutes
  ) {}
}
