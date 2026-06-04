package com.smartqueue.websocket;

import com.smartqueue.dto.QueueDtos;
import java.util.UUID;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class QueueEventPublisher {
  private final SimpMessagingTemplate messaging;

  public QueueEventPublisher(SimpMessagingTemplate messaging) {
    this.messaging = messaging;
  }

  public void queueChanged(String type, UUID serviceId, UUID tokenId, Object payload) {
    QueueDtos.QueueEventMessage message = new QueueDtos.QueueEventMessage(type, serviceId, tokenId, payload);
    messaging.convertAndSend("/topic/queues/" + serviceId, message);
    messaging.convertAndSend("/topic/admin/queues", message);
  }

  public void userTokenChanged(String type, UUID serviceId, UUID userId, UUID tokenId, Object payload) {
    QueueDtos.QueueEventMessage message = new QueueDtos.QueueEventMessage(type, serviceId, tokenId, payload);
    messaging.convertAndSend("/topic/users/" + userId + "/tokens", message);
  }
}
