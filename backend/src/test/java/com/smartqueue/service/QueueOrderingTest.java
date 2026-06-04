package com.smartqueue.service;

import com.smartqueue.domain.PriorityType;
import java.util.List;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QueueOrderingTest {
  @Test
  void priorityOrderMatchesMvpRules() {
    List<PriorityType> order = List.of(PriorityType.EMERGENCY, PriorityType.SENIOR_CITIZEN,
        PriorityType.VIP, PriorityType.ADMIN_MARKED, PriorityType.NORMAL);

    assertThat(order).containsExactly(PriorityType.values());
  }
}
