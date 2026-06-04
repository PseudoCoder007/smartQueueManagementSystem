package com.smartqueue.controller;

import com.smartqueue.dto.QueueDtos;
import com.smartqueue.dto.TokenDtos;
import com.smartqueue.service.AdminQueueService;
import com.smartqueue.service.CurrentUser;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminQueueController {
  private final AdminQueueService queues;
  private final CurrentUser currentUser;

  public AdminQueueController(AdminQueueService queues, CurrentUser currentUser) {
    this.queues = queues;
    this.currentUser = currentUser;
  }

  @PostMapping("/queues/{serviceId}/open")
  public QueueDtos.QueueStateResponse open(@PathVariable UUID serviceId) {
    return queues.open(serviceId, currentUser.requireUser());
  }

  @PostMapping("/queues/{serviceId}/close")
  public QueueDtos.QueueStateResponse close(@PathVariable UUID serviceId) {
    return queues.close(serviceId, currentUser.requireUser());
  }

  @GetMapping("/queues/{serviceId}")
  public QueueDtos.QueueStateResponse state(@PathVariable UUID serviceId) {
    return queues.state(serviceId);
  }

  @PostMapping("/queues/{serviceId}/next")
  public TokenDtos.TokenResponse next(@PathVariable UUID serviceId) {
    return queues.callNext(serviceId, currentUser.requireUser());
  }

  @PostMapping("/tokens/{tokenId}/call")
  public TokenDtos.TokenResponse call(@PathVariable UUID tokenId) {
    return queues.callSpecific(tokenId, currentUser.requireUser());
  }

  @PostMapping("/tokens/{tokenId}/complete")
  public TokenDtos.TokenResponse complete(@PathVariable UUID tokenId) {
    return queues.complete(tokenId, currentUser.requireUser());
  }

  @PostMapping("/tokens/{tokenId}/skip")
  public TokenDtos.TokenResponse skip(@PathVariable UUID tokenId) {
    return queues.skip(tokenId, currentUser.requireUser());
  }

  @PostMapping("/tokens/{tokenId}/recall")
  public TokenDtos.TokenResponse recall(@PathVariable UUID tokenId) {
    return queues.recall(tokenId, currentUser.requireUser());
  }

  @PostMapping("/tokens/{tokenId}/priority")
  public TokenDtos.TokenResponse priority(@PathVariable UUID tokenId,
      @Valid @RequestBody TokenDtos.PriorityRequest request) {
    return queues.priority(tokenId, request, currentUser.requireUser());
  }
}
