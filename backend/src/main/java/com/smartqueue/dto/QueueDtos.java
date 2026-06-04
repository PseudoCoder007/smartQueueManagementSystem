package com.smartqueue.dto;

import java.util.List;
import java.util.UUID;

public final class QueueDtos {
  private QueueDtos() {}

  public record QueueStateResponse(
      UUID serviceId,
      String serviceName,
      boolean open,
      Integer currentServingToken,
      long queueLength,
      List<TokenDtos.TokenResponse> waiting,
      List<TokenDtos.TokenResponse> serving,
      List<TokenDtos.TokenResponse> skipped,
      List<TokenDtos.TokenResponse> completed,
      List<TokenDtos.TokenResponse> cancelled
  ) {}

  public record QueueEventMessage(String type, UUID serviceId, UUID tokenId, Object payload) {}
}
