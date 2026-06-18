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
  private final String frontendUrl;
  private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  private final ObjectMapper json = new ObjectMapper();
  private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
    Thread thread = new Thread(runnable, "email-sender");
    thread.setDaemon(true);
    return thread;
  });

  public EmailService(@Value("${app.resend.api-key:}") String apiKey,
      @Value("${app.resend.from-email}") String fromEmail,
      @Value("${app.frontend-url}") String frontendUrl) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.frontendUrl = frontendUrl;
  }

  public void sendWelcomeEmail(String to, String name) {
    sendAsync(to, "Welcome to Smart Queue", wrap("Welcome to Smart Queue, " + esc(displayName(name)) + "!",
        "Your account is ready. Join a queue any time and we'll keep you posted on your position.",
        "Go to Dashboard", frontendUrl + "/dashboard"));
  }

  public void sendTokenCreated(String to, String name, String serviceName, int tokenNumber, int position,
      int estimatedWaitMinutes) {
    sendAsync(to, "You're in the queue - Smart Queue", wrap("You're in the queue!",
        "Hi " + esc(displayName(name)) + ", your token <strong>#" + tokenNumber + "</strong> for "
            + "<strong>" + esc(serviceName) + "</strong> has been created. You're at position "
            + position + " with an estimated wait of about " + estimatedWaitMinutes + " minutes. "
            + "We'll email you again when your turn is close.",
        "Track My Token", frontendUrl + "/my-tokens"));
  }

  public void sendSignInNotification(String to, String name) {
    sendAsync(to, "New sign-in to your Smart Queue account", wrap("New sign-in detected",
        "Hi " + esc(displayName(name)) + ", we noticed a new sign-in to your Smart Queue account. "
            + "If this wasn't you, please reset your password right away.",
        "Secure My Account", frontendUrl + "/login"));
  }

  public void sendTurnReminder(String to, String name, String serviceName, int tokenNumber) {
    sendAsync(to, "Your turn is coming up - Smart Queue", wrap("You're almost up!",
        "Hi " + esc(displayName(name)) + ", your token <strong>#" + tokenNumber + "</strong> for "
            + "<strong>" + esc(serviceName) + "</strong> will be called in about 5 minutes. "
            + "Please head to the counter and have your item or billing details ready.",
        "View My Token", frontendUrl + "/my-tokens"));
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

  private String wrap(String heading, String bodyHtml, String ctaLabel, String ctaUrl) {
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>" + heading + "</title>"
        + "<style>"
        + "body{margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;}"
        + "table{border-collapse:collapse;}"
        + ".container{width:100%;max-width:600px;margin:0 auto;}"
        + ".header{background:#09090b;padding:28px 32px;text-align:center;}"
        + ".brand{font-size:22px;font-weight:bold;color:#fafafa;letter-spacing:-0.5px;}"
        + ".brand span{color:#10b981;}"
        + ".card{background:#ffffff;padding:40px 32px;}"
        + ".heading{font-size:20px;font-weight:bold;color:#111111;margin:0 0 16px;}"
        + ".body-text{font-size:15px;line-height:1.6;color:#3f3f46;margin:0 0 28px;}"
        + ".btn{display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:bold;"
        + "font-size:15px;padding:14px 28px;border-radius:8px;}"
        + ".footer{padding:24px 32px;text-align:center;font-size:12px;color:#a1a1aa;}"
        + ".footer a{color:#a1a1aa;}"
        + "@media only screen and (max-width:480px){"
        + ".card{padding:28px 20px!important;}.header{padding:22px 20px!important;}"
        + ".heading{font-size:18px!important;}.btn{display:block!important;text-align:center!important;}"
        + "}"
        + "</style></head><body>"
        + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td>"
        + "<table role=\"presentation\" class=\"container\" cellpadding=\"0\" cellspacing=\"0\" align=\"center\">"
        + "<tr><td class=\"header\"><span class=\"brand\">Smart<span>Queue</span></span></td></tr>"
        + "<tr><td class=\"card\">"
        + "<p class=\"heading\">" + heading + "</p>"
        + "<p class=\"body-text\">" + bodyHtml + "</p>"
        + (ctaUrl == null ? "" : "<p style=\"text-align:center;margin:0;\">"
            + "<a class=\"btn\" href=\"" + ctaUrl + "\">" + ctaLabel + "</a></p>")
        + "</td></tr>"
        + "<tr><td class=\"footer\">SmartQueue &middot; <a href=\"https://smart-queue.in\">smart-queue.in</a>"
        + "<br>Queues, made invisible.</td></tr>"
        + "</table></td></tr></table></body></html>";
  }
}
