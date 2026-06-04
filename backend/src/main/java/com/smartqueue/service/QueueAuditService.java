package com.smartqueue.service;

import com.smartqueue.domain.*;
import com.smartqueue.repository.QueueEventRepository;
import org.springframework.stereotype.Service;

@Service
public class QueueAuditService {
  private final QueueEventRepository events;

  public QueueAuditService(QueueEventRepository events) {
    this.events = events;
  }

  public void record(Token token, QueueEventType type, AppUser actor, String notes) {
    QueueEvent event = new QueueEvent();
    event.setToken(token);
    event.setService(token.getService());
    event.setQueueSession(token.getQueueSession());
    event.setEventType(type);
    event.setActorUser(actor);
    event.setNotes(notes);
    events.save(event);
  }

  public void recordSession(QueueSession session, QueueEventType type, AppUser actor, String notes) {
    QueueEvent event = new QueueEvent();
    event.setService(session.getService());
    event.setQueueSession(session);
    event.setEventType(type);
    event.setActorUser(actor);
    event.setNotes(notes);
    events.save(event);
  }
}
