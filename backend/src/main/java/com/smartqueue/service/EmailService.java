package com.smartqueue.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);
  private static final URI RESEND_ENDPOINT = URI.create("https://api.resend.com/emails");

  private final String apiKey;
  private final String fromEmail;
  private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  private final ObjectMapper json = new ObjectMapper();
  private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
    Thread thread = new Thread(runnable, "email-sender");
    thread.setDaemon(true);
    return thread;
  });

  public EmailService(@Value("${app.resend.api-key:}") String apiKey,
      @Value("${app.resend.from-email}") String fromEmail) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  public void sendWelcomeEmail(String to, String name) {
    sendAsync(to, "Welcome to Smart Queue", wrap("Welcome to Smart Queue, " + esc(displayName(name)) + "!",
        "Your account is ready. Join a queue any time and we'll keep you posted on your position."));
  }

  public void sendSignInNotification(String to, String name) {
    sendAsync(to, "New sign-in to your Smart Queue account", wrap("New sign-in detected",
        "Hi " + esc(displayName(name)) + ", we noticed a new sign-in to your Smart Queue account. "
            + "If this wasn't you, please contact support."));
  }

  public void sendTurnReminder(String to, String name, String serviceName, int tokenNumber) {
    sendAsync(to, "Your turn is coming up - Smart Queue", wrap("You're almost up!",
        "Hi " + esc(displayName(name)) + ", your token <strong>#" + tokenNumber + "</strong> for "
            + "<strong>" + esc(serviceName) + "</strong> will be called in about 5 minutes. "
            + "Please head to the counter and have your item or billing details ready."));
  }

  private void sendAsync(String to, String subject, String html) {
    if (apiKey == null || apiKey.isBlank()) {
      log.info("RESEND_API_KEY not set; skipping email to {} ({})", to, subject);
      return;
    }
    executor.submit(() -> send(to, subject, html));
  }

  private void send(String to, String subject, String html) {
    try {
      Map<String, Object> body = Map.of(
          "from", fromEmail,
          "to", List.of(to),
          "subject", subject,
          "html", html);
      HttpRequest request = HttpRequest.newBuilder(RESEND_ENDPOINT)
          .header("Authorization", "Bearer " + apiKey)
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
          .build();
      HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) {
        log.warn("Resend email to {} failed: {} {}", to, response.statusCode(), response.body());
      }
    } catch (Exception e) {
      log.warn("Resend email to {} failed: {}", to, e.getMessage());
    }
  }

  private String displayName(String name) {
    return (name == null || name.isBlank()) ? "there" : name;
  }

  private String esc(String value) {
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }

  private String wrap(String heading, String bodyHtml) {
    return "<div style=\"font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;\">"
        + "<h2 style=\"color:#111;\">" + heading + "</h2>"
        + "<p style=\"color:#333;font-size:15px;line-height:1.5;\">" + bodyHtml + "</p>"
        + "<p style=\"color:#999;font-size:12px;margin-top:32px;\">Smart Queue &middot; smart-queue.in</p>"
        + "</div>";
  }
}
