package com.smartqueue.dto;

import java.util.List;
import java.util.UUID;

public final class StatsDtos {
  private StatsDtos() {}

  public record OverviewStats(long totalTokens, long activeQueues, long completedTokens,
      long skippedTokens, long cancelledTokens, double averageWaitMinutes) {}

  public record ServiceStats(UUID serviceId, String serviceName, long tokenCount, boolean queueOpen) {}

  public record DailyStats(List<ServiceStats> services) {}
}
