package com.smartqueue.controller;

import com.smartqueue.domain.ServiceStatus;
import com.smartqueue.dto.ServiceDtos;
import com.smartqueue.service.CurrentUser;
import com.smartqueue.service.ServiceQueueService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/services")
public class AdminServiceController {
  private final ServiceQueueService services;
  private final CurrentUser currentUser;

  public AdminServiceController(ServiceQueueService services, CurrentUser currentUser) {
    this.services = services;
    this.currentUser = currentUser;
  }

  @PostMapping
  public ServiceDtos.ServiceResponse create(@Valid @RequestBody ServiceDtos.ServiceRequest request) {
    return services.create(request, currentUser.requireUser());
  }

  @GetMapping
  public List<ServiceDtos.ServiceResponse> list() {
    return services.adminServices();
  }

  @PutMapping("/{serviceId}")
  public ServiceDtos.ServiceResponse update(@PathVariable UUID serviceId,
      @Valid @RequestBody ServiceDtos.ServiceRequest request) {
    return services.update(serviceId, request);
  }

  @PostMapping("/{serviceId}/activate")
  public ServiceDtos.ServiceResponse activate(@PathVariable UUID serviceId) {
    return services.setStatus(serviceId, ServiceStatus.ACTIVE);
  }

  @PostMapping("/{serviceId}/deactivate")
  public ServiceDtos.ServiceResponse deactivate(@PathVariable UUID serviceId) {
    return services.setStatus(serviceId, ServiceStatus.INACTIVE);
  }
}
