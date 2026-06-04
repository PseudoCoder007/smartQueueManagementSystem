package com.smartqueue.controller;

import com.smartqueue.dto.ServiceDtos;
import com.smartqueue.service.ServiceQueueService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
public class UserServiceController {
  private final ServiceQueueService services;

  public UserServiceController(ServiceQueueService services) {
    this.services = services;
  }

  @GetMapping
  public List<ServiceDtos.ServiceResponse> list() {
    return services.activeServices();
  }

  @GetMapping("/{serviceId}")
  public ServiceDtos.ServiceResponse detail(@PathVariable UUID serviceId) {
    return services.activeService(serviceId);
  }
}
