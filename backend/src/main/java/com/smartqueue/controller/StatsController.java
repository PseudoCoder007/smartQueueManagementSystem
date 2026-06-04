package com.smartqueue.controller;

import com.smartqueue.dto.StatsDtos;
import com.smartqueue.service.StatsService;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stats")
public class StatsController {
  private final StatsService stats;

  public StatsController(StatsService stats) {
    this.stats = stats;
  }

  @GetMapping("/overview")
  public StatsDtos.OverviewStats overview() {
    return stats.overview();
  }

  @GetMapping("/services/{serviceId}")
  public StatsDtos.ServiceStats service(@PathVariable UUID serviceId) {
    return stats.service(serviceId);
  }

  @GetMapping("/daily")
  public StatsDtos.DailyStats daily() {
    return stats.daily();
  }
}
