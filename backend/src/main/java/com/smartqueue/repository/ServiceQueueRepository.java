package com.smartqueue.repository;

import com.smartqueue.domain.ServiceQueue;
import com.smartqueue.domain.ServiceStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceQueueRepository extends JpaRepository<ServiceQueue, UUID> {
  List<ServiceQueue> findByStatusOrderByNameAsc(ServiceStatus status);
  List<ServiceQueue> findAllByOrderByNameAsc();
}
