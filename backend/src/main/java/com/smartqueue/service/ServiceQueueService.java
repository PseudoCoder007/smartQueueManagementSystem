package com.smartqueue.service;

import com.smartqueue.domain.*;
import com.smartqueue.dto.ServiceDtos;
import com.smartqueue.repository.ServiceQueueRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceQueueService {
  private final ServiceQueueRepository services;
  private final QueueMapper mapper;

  public ServiceQueueService(ServiceQueueRepository services, QueueMapper mapper) {
    this.services = services;
    this.mapper = mapper;
  }

  public List<ServiceDtos.ServiceResponse> activeServices() {
    return services.findByStatusOrderByNameAsc(ServiceStatus.ACTIVE).stream().map(mapper::service).toList();
  }

  public ServiceDtos.ServiceResponse activeService(UUID id) {
    ServiceQueue service = services.findById(id)
        .filter(item -> item.getStatus() == ServiceStatus.ACTIVE)
        .orElseThrow(() -> new NotFoundException("Active service not found"));
    return mapper.service(service);
  }

  public List<ServiceDtos.ServiceResponse> adminServices() {
    return services.findAllByOrderByNameAsc().stream().map(mapper::service).toList();
  }

  @Transactional
  public ServiceDtos.ServiceResponse create(ServiceDtos.ServiceRequest request, AppUser actor) {
    ServiceQueue service = new ServiceQueue();
    apply(service, request);
    service.setCreatedBy(actor);
    return mapper.service(services.save(service));
  }

  @Transactional
  public ServiceDtos.ServiceResponse update(UUID id, ServiceDtos.ServiceRequest request) {
    ServiceQueue service = services.findById(id).orElseThrow(() -> new NotFoundException("Service not found"));
    apply(service, request);
    return mapper.service(services.save(service));
  }

  @Transactional
  public ServiceDtos.ServiceResponse setStatus(UUID id, ServiceStatus status) {
    ServiceQueue service = services.findById(id).orElseThrow(() -> new NotFoundException("Service not found"));
    service.setStatus(status);
    return mapper.service(services.save(service));
  }

  public ServiceQueue require(UUID id) {
    return services.findById(id).orElseThrow(() -> new NotFoundException("Service not found"));
  }

  private void apply(ServiceQueue service, ServiceDtos.ServiceRequest request) {
    service.setName(request.name().trim());
    service.setDescription(request.description());
    service.setAverageServiceMinutes(request.averageServiceMinutes() == null ? 5 : request.averageServiceMinutes());
    service.setStatus(request.status() == null ? ServiceStatus.ACTIVE : request.status());
  }
}
