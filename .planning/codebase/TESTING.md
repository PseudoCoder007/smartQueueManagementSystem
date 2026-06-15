# Testing Patterns

**Analysis Date:** 2026-06-15

## Test Framework

**Backend Runner:**
- JUnit 5 (Jupiter) via `spring-boot-starter-test` (Spring Boot 3.3.5)
- Config: `backend/pom.xml` — inherits Maven Surefire defaults
- Assertion Library: AssertJ (`org.assertj.core.api.Assertions.assertThat`)
- Mocking: Mockito (`org.mockito.Mockito.mock`, `when`)
- Test DB: H2 in-memory (scope `test`) — available but not used in existing tests

**Frontend Runner:**
- Vitest 2.1.5
- Config: `frontend/vite.config.ts` (Vitest reads from Vite config)
- Assertion Library: Vitest built-in `expect`
- Component Testing: `@testing-library/react` 15.0.7 + `@testing-library/jest-dom` 6.6.3 (installed but not yet used in existing tests)

**Run Commands:**
```bash
# Backend
cd backend && mvn test                 # Run all tests
cd backend && mvn test -pl .           # Single module

# Frontend
cd frontend && npm test                # Run all tests (vitest run)
cd frontend && npx vitest              # Watch mode
```

## Test File Organization

**Backend:**
- Location: `backend/src/test/java/com/smartqueue/service/`
- Naming: `{ClassName}Test.java` — e.g., `StatsServiceTest.java`, `QueueOrderingTest.java`
- Package mirrors production: `package com.smartqueue.service;`

**Frontend:**
- Location: Co-located with source — `frontend/src/routes/ProtectedRoute.test.tsx`
- Naming: `{ComponentName}.test.tsx` or `{Module}.test.ts`

**Structure:**
```
backend/src/test/java/com/smartqueue/
└── service/
    ├── QueueOrderingTest.java
    └── StatsServiceTest.java

frontend/src/
└── routes/
    └── ProtectedRoute.test.tsx
```

## Test Structure

**Backend — Suite Organization:**
```java
package com.smartqueue.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class StatsServiceTest {
  @Test
  void methodNameDescribesScenarioAndExpectedOutcome() {
    // Arrange — build subject with mocked dependencies
    TokenRepository tokens = mock(TokenRepository.class);
    StatsService stats = new StatsService(tokens, services, sessions);

    // Stub
    when(tokens.averageWaitMinutes()).thenReturn(null);

    // Act + Assert
    assertThat(stats.overview().averageWaitMinutes()).isZero();
  }
}
```

**Test method naming:** Full sentence in camelCase describing scenario and outcome:
- `overviewDefaultsAverageWaitToZeroWhenNoCompletedTokensExist`
- `priorityOrderMatchesMvpRules`

**Frontend — Suite Organization:**
```typescript
import { describe, expect, it } from 'vitest';

describe('route guards', () => {
  it('keeps role names explicit', () => {
    expect(['USER', 'ADMIN']).toContain('USER');
  });
});
```

**Patterns:**
- No `@BeforeEach` / `beforeEach` setup observed — dependencies instantiated inline per test
- No teardown methods
- AssertJ fluent style: `assertThat(actual).isZero()`, `assertThat(list).containsExactly(...)`

## Mocking

**Backend Framework:** Mockito (plain `mock()` calls, not `@Mock` annotations)

**Pattern:**
```java
// Inline mock creation — no @ExtendWith(MockitoExtension.class) annotation used
TokenRepository tokens = mock(TokenRepository.class);
ServiceQueueRepository services = mock(ServiceQueueRepository.class);
QueueSessionRepository sessions = mock(QueueSessionRepository.class);

// Constructor injection of mocks into real service
StatsService stats = new StatsService(tokens, services, sessions);

// Stubbing
when(services.findAll()).thenReturn(List.of());
when(tokens.averageWaitMinutes()).thenReturn(null);
```

**What to Mock:**
- Spring Data JPA repository interfaces — instantiate via `mock(XRepository.class)`
- External publishers or auditing services when testing core business logic

**What NOT to Mock:**
- The service under test itself
- Domain/enum classes (`PriorityType`, `TokenStatus`) — use real values

**Frontend Mocking:**
- `@testing-library/react` is installed but not yet exercised
- The existing test (`ProtectedRoute.test.tsx`) contains only a trivial assertion with no mocking

## Fixtures and Factories

**Test Data:**
- No shared fixture files or factory helpers exist
- Data is constructed inline per test using `List.of(...)`, `mock(...)`, and direct `when(...)` stubs

**Location:**
- No `fixtures/`, `factories/`, or `testdata/` directories present

## Coverage

**Requirements:** None enforced — no Jacoco or coverage threshold configuration detected in `pom.xml` or `vite.config.ts`

**View Coverage:**
```bash
# Backend (add jacoco plugin to pom.xml first)
mvn test jacoco:report

# Frontend
npx vitest run --coverage
```

## Test Types

**Unit Tests (Backend):**
- Scope: Individual service methods in isolation
- Approach: Instantiate real service with mocked repositories; no Spring context loaded (`@SpringBootTest` not used)
- Examples: `StatsServiceTest.java`, `QueueOrderingTest.java`

**Integration Tests:**
- Not present — `@SpringBootTest`, `@DataJpaTest`, and `@WebMvcTest` are available (via `spring-boot-starter-test`) but unused
- H2 test database is declared in `pom.xml` but has no test classes using it

**E2E Tests:**
- Not present — no Playwright, Cypress, or Selenium configuration found

**Component Tests (Frontend):**
- `@testing-library/react` is installed but no component render tests exist yet
- The single frontend test file is a placeholder-level assertion

## Common Patterns

**Async Testing (Frontend — pattern to follow):**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';

it('shows loading then content', async () => {
  render(<MyComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('Content')).toBeInTheDocument());
});
```

**Error Testing (Backend — pattern to follow):**
```java
import static org.assertj.core.api.Assertions.assertThatThrownBy;

assertThatThrownBy(() -> service.methodUnderTest(badInput))
    .isInstanceOf(BadRequestException.class)
    .hasMessage("Expected message");
```

## Coverage Gaps

The test suite is minimal. Critical paths with no test coverage:

- `TokenService` — join/cancel/create logic, priority recalculation (`backend/src/main/java/com/smartqueue/service/TokenService.java`)
- `AdminQueueService` — call/complete/skip/recall state transitions
- `AuthService` / `SupabaseAuthService` — authentication flows
- `JwtAuthFilter` / `JwtService` — JWT validation
- All frontend pages and components — zero component tests exist
- `useAsync` hook — loading/error/reload states untested
- `ProtectedRoute` — only a trivial constant assertion exists in `frontend/src/routes/ProtectedRoute.test.tsx`

---

*Testing analysis: 2026-06-15*
