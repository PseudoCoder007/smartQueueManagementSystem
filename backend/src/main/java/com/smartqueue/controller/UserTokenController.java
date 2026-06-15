package com.smartqueue.controller;

import com.smartqueue.dto.TokenDtos;
import com.smartqueue.service.CurrentUser;
import com.smartqueue.service.TokenService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tokens")
public class UserTokenController {
  private final TokenService tokens;
  private final CurrentUser currentUser;

  public UserTokenController(TokenService tokens, CurrentUser currentUser) {
    this.tokens = tokens;
    this.currentUser = currentUser;
  }

  @PostMapping
  public TokenDtos.TokenResponse create(@Valid @RequestBody TokenDtos.CreateTokenRequest request) {
    return tokens.create(request, currentUser.requireUser());
  }

  @GetMapping("/my")
  public List<TokenDtos.TokenResponse> mine() {
    return tokens.myTokens(currentUser.requireUser());
  }

  @GetMapping("/active")
  public ResponseEntity<TokenDtos.TokenResponse> active(@RequestParam UUID serviceId) {
    return tokens.activeForService(serviceId, currentUser.requireUser())
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.noContent().build());
  }

  @GetMapping("/{tokenId}")
  public TokenDtos.TokenResponse detail(@PathVariable UUID tokenId) {
    return tokens.detail(tokenId, currentUser.requireUser());
  }

  @DeleteMapping("/{tokenId}/cancel")
  public TokenDtos.TokenResponse cancel(@PathVariable UUID tokenId) {
    return tokens.cancel(tokenId, currentUser.requireUser());
  }
}
