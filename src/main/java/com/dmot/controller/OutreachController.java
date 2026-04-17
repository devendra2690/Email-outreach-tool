package com.dmot.controller;

import com.dmot.model.*;
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

    private final OutreachService         outreachService;
    private final EmailPatternService     patternService;
    private final SmtpVerificationService smtpService;

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
        return ResponseEntity.ok(smtpService.verifySingle(email));
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
        return ResponseEntity.ok(smtpService.verifyAll(emails));
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
