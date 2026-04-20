package com.dmot.controller;

import com.dmot.model.*;
import com.dmot.service.EmailDomainDetectionService;
import com.dmot.service.EmailPatternService;
import com.dmot.service.OutreachService;
import com.dmot.service.SmtpVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for the Decision-Maker Outreach Tool.
 *
 * Endpoints:
 *   POST /api/v1/outreach/find-leads        — full pipeline (identify → generate → verify)
 *   POST /api/v1/outreach/generate-patterns — Phase 2 only (pattern generation)
 *   POST /api/v1/outreach/verify-email      — Phase 3 for a single address
 *   POST /api/v1/outreach/verify-emails     — Phase 3 for a batch of addresses
 */
@RestController
@RequestMapping("/api/v1/outreach")
@RequiredArgsConstructor
public class OutreachController {

    private final OutreachService outreachService;
    private final EmailPatternService  patternService;
    private final SmtpVerificationService smtpService;
    private final EmailDomainDetectionService domainDetectionService;

    /**
     * Run the full 3-phase outreach pipeline for a target domain.
     *
     * Request body:
     * <pre>
     * {
     *   "domain":      "madonpurefoods.com",
     *   "companyName": "Madon Pure Foods",   // optional — improves search accuracy
     *   "skipCache":   false                  // optional — force re-run
     * }
     * </pre>
     */
    @PostMapping("/find-leads")
    public ResponseEntity<OutreachResponse> findLeads(@RequestBody OutreachRequest request) {
        return ResponseEntity.ok(outreachService.processOutreach(request));
    }

    /**
     * Generate 15 email permutations for a given person + domain.
     *
     * Request body: {@code {"firstName":"John","lastName":"Doe","domain":"example.com"}}
     */
    @PostMapping("/generate-patterns")
    public ResponseEntity<List<String>> generatePatterns(@RequestBody Map<String, String> body) {
        String first  = requireParam(body, "firstName");
        String last   = requireParam(body, "lastName");
        String domain = requireParam(body, "domain");
        return ResponseEntity.ok(patternService.generatePatterns(first, last, domain));
    }

    /**
     * Verify a single email address via SMTP handshake.
     *
     * Request body: {@code {"email":"john.doe@example.com"}}
     */
    @PostMapping("/verify-email")
    public ResponseEntity<EmailVerificationResult> verifyEmail(@RequestBody Map<String, String> body) {
        String email = requireParam(body, "email");
        EmailVerificationResult result = smtpService.verifySingle(email);
        // SMTP couldn't verify — check if the email is published on the company's own website
        if (result.getStatus() == EmailVerificationResult.VerificationStatus.UNVERIFIABLE
                || result.getStatus() == EmailVerificationResult.VerificationStatus.TIMEOUT) {
            String domain = email.substring(email.indexOf('@') + 1);
            EmailDomainDetectionService.WebsiteEmails websiteEmails =
                    domainDetectionService.scrapeWebsiteEmails(domain);
            if (websiteEmails.emails().stream().anyMatch(e -> e.equalsIgnoreCase(email))) {
                result = EmailVerificationResult.builder()
                        .email(email)
                        .status(EmailVerificationResult.VerificationStatus.WEBSITE)
                        .smtpResponse("Found on company website — ground-truth valid")
                        .mxRecord(result.getMxRecord())
                        .build();
            }
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Verify a list of email addresses (should share the same domain for efficiency).
     *
     * Request body: {@code {"emails":["john@example.com","j.doe@example.com"]}}
     */
    @PostMapping("/verify-emails")
    public ResponseEntity<List<EmailVerificationResult>> verifyEmails(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> emails = (List<String>) body.get("emails");
        if (emails == null || emails.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<EmailVerificationResult> results = smtpService.verifyAll(emails);

        // Scrape the website once for the shared domain, upgrade any matches to WEBSITE status
        String sharedDomain = emails.get(0).substring(emails.get(0).indexOf('@') + 1);
        EmailDomainDetectionService.WebsiteEmails websiteEmails =
                domainDetectionService.scrapeWebsiteEmails(sharedDomain);
        java.util.Set<String> onWebsite = new java.util.HashSet<>(websiteEmails.emails());

        results = results.stream().map(r -> {
            if (onWebsite.contains(r.getEmail().toLowerCase()) &&
                    (r.getStatus() == EmailVerificationResult.VerificationStatus.UNVERIFIABLE
                  || r.getStatus() == EmailVerificationResult.VerificationStatus.TIMEOUT)) {
                return EmailVerificationResult.builder()
                        .email(r.getEmail())
                        .status(EmailVerificationResult.VerificationStatus.WEBSITE)
                        .smtpResponse("Found on company website — ground-truth valid")
                        .mxRecord(r.getMxRecord())
                        .build();
            }
            return r;
        }).toList();

        return ResponseEntity.ok(results);
    }

    /**
     * Detect the likely email domain for a given website domain.
     * Uses MX record analysis and optionally Hunter.io.
     *
     * Query param: domain=chhedaspecialities.com
     */
    @GetMapping("/detect-email-domain")
    public ResponseEntity<Map<String, String>> detectEmailDomain(@RequestParam String domain) {
        if (domain == null || domain.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "domain parameter is required"));
        }
        EmailDomainDetectionService.DetectionResult result = domainDetectionService.detect(domain.trim());
        return ResponseEntity.ok(Map.of(
                "emailDomain", result.emailDomain(),
                "source",      result.source(),
                "detail",      result.detail()
        ));
    }

    // -------------------------------------------------------------------------

    private String requireParam(Map<String, String> body, String key) {
        String value = body.get(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing required parameter: " + key);
        }
        return value;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
