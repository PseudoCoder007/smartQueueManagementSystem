package com.smartqueue.repository;

import com.smartqueue.domain.QueueEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QueueEventRepository extends JpaRepository<QueueEvent, UUID> {
}
