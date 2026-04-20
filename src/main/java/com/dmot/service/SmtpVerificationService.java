package com.dmot.service;

import com.dmot.model.EmailVerificationResult;
import com.dmot.model.EmailVerificationResult.VerificationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.xbill.DNS.*;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phase 3 — SMTP Verification.
 *
 * Verification flow per email:
 *   1. MX Record Lookup  — resolve the domain's mail server via DNS.
 *   2. Socket Connection  — TCP connect to MX host on port 25.
 *   3. EHLO handshake    — identify the sender.
 *   4. MAIL FROM         — open a null-sender envelope.
 *   5. RCPT TO           — probe whether the mailbox exists.
 *
 * Catch-all detection: before verifying real addresses, the service sends
 * a RCPT TO for a random UUID address. If the server accepts it (250), every
 * result for that domain is marked CATCH_ALL so callers can act accordingly.
 *
 * Results are NOT sent — no email is delivered. The connection is closed with
 * QUIT after the RCPT TO response.
 */
@Slf4j
@Service
public class SmtpVerificationService {

    @Value("${app.smtp.timeout-ms:10000}")
    private int timeoutMs;

    @Value("${app.smtp.helo-domain:verification.local}")
    private String heloDomain;

    private final ProviderEmailVerificationService providerVerifier;

    public SmtpVerificationService(ProviderEmailVerificationService providerVerifier) {
        this.providerVerifier = providerVerifier;
    }

    /** In-process cache so each domain's catch-all status is probed only once per JVM lifetime. */
    private final Map<String, Boolean> catchAllCache = new ConcurrentHashMap<>();

    private static final Set<String> MICROSOFT_MX_SUFFIXES = Set.of(
            "mail.protection.outlook.com",
            "outlook.com",
            "hotmail.com"
    );

    private static final Set<String> GOOGLE_MX_SUFFIXES = Set.of(
            "aspmx.l.google.com",
            "googlemail.com",
            "smtp.google.com"
    );

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Resolve the lowest-priority MX record for a domain.
     *
     * @return fully-qualified hostname without trailing dot, or {@code null} if none found
     */
    public String getMxRecord(String domain) {
        try {
            org.xbill.DNS.Record[] records = new Lookup(domain, Type.MX).run();
            if (records == null || records.length == 0) {
                log.debug("No MX records for domain {}", domain);
                return null;
            }
            Arrays.sort(records, Comparator.comparingInt(r -> ((MXRecord) r).getPriority()));
            String host = ((MXRecord) records[0]).getTarget().toString();
            return host.endsWith(".") ? host.substring(0, host.length() - 1) : host;
        } catch (TextParseException e) {
            log.warn("MX lookup failed for {}: {}", domain, e.getMessage());
            return null;
        }
    }

    /**
     * Determine whether the mail server for {@code domain} is a catch-all.
     * Result is cached per domain for the lifetime of the service bean.
     */
    public boolean isCatchAll(String domain) {
        return catchAllCache.computeIfAbsent(domain, d -> {
            String mx = getMxRecord(d);
            if (mx == null) return false;
            // Probe with a guaranteed-nonexistent address
            String probe = "catch-all-probe-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12) + "@" + d;
            EmailVerificationResult result = smtpCheck(probe, mx);
            return result.getStatus() == VerificationStatus.VALID;
        });
    }

    /**
     * Verify a single email address (resolves MX internally).
     */
    public EmailVerificationResult verifySingle(String email) {
        String domain = domainOf(email);
        String mx = getMxRecord(domain);
        if (mx == null) {
            return result(email, VerificationStatus.INVALID, "No MX record found for " + domain, false, null);
        }
        if (isMicrosoft(mx)) return checkViaProvider(email, mx, false);
        if (isGoogle(mx))    return checkViaProvider(email, mx, true);
        boolean catchAll = isCatchAll(domain);
        EmailVerificationResult raw = smtpCheck(email, mx);
        return finalize(raw, catchAll, mx);
    }

    /**
     * Verify a batch of email addresses that share the same domain.
     * MX resolution and catch-all detection are performed once for the whole batch.
     *
     * @param emails list of email addresses (must all share the same domain)
     */
    public List<EmailVerificationResult> verifyAll(List<String> emails) {
        if (emails.isEmpty()) return Collections.emptyList();

        String domain = domainOf(emails.get(0));
        String mx = getMxRecord(domain);

        if (mx == null) {
            return emails.stream()
                    .map(e -> result(e, VerificationStatus.INVALID, "No MX record found for " + domain, false, null))
                    .toList();
        }

        if (isMicrosoft(mx)) {
            log.info("Using Microsoft API verification for {} (MX: {})", domain, mx);
            return emails.stream().map(e -> checkViaProvider(e, mx, false)).toList();
        }
        if (isGoogle(mx)) {
            log.info("Using Google API verification for {} (MX: {})", domain, mx);
            return emails.stream().map(e -> checkViaProvider(e, mx, true)).toList();
        }

        boolean catchAll = isCatchAll(domain);

        return emails.stream()
                .map(email -> finalize(smtpCheck(email, mx), catchAll, mx))
                .toList();
    }

    // -------------------------------------------------------------------------
    // SMTP handshake
    // -------------------------------------------------------------------------

    private EmailVerificationResult smtpCheck(String email, String mxHost) {
        // Try port 25 first, fall back to port 587 (submission) if it times out
        EmailVerificationResult result = smtpCheckOnPort(email, mxHost, 25);
        if (result.getStatus() == VerificationStatus.TIMEOUT) {
            log.debug("Port 25 timed out for {}, retrying on port 587", mxHost);
            EmailVerificationResult fallback = smtpCheckOnPort(email, mxHost, 587);
            if (fallback.getStatus() != VerificationStatus.TIMEOUT) return fallback;
        }
        return result;
    }

    private EmailVerificationResult smtpCheckOnPort(String email, String mxHost, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(mxHost, port), timeoutMs);
            socket.setSoTimeout(timeoutMs);

            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            PrintWriter    writer = new PrintWriter(new OutputStreamWriter(socket.getOutputStream()), true);

            // Read server greeting
            String greeting = reader.readLine();
            if (greeting == null || !greeting.startsWith("2")) {
                writer.println("QUIT");
                return result(email, VerificationStatus.UNVERIFIABLE, greeting, false, null);
            }

            // EHLO
            writer.println("EHLO " + heloDomain);
            drainMultilineResponse(reader);

            // MAIL FROM (null sender — RFC 5321 §4.5.5)
            writer.println("MAIL FROM:<>");
            String fromResp = reader.readLine();
            if (fromResp == null || !fromResp.startsWith("2")) {
                writer.println("QUIT");
                return result(email, VerificationStatus.UNVERIFIABLE, fromResp, false, null);
            }

            // RCPT TO — the actual probe
            writer.println("RCPT TO:<" + email + ">");
            String rcptResp = reader.readLine();
            writer.println("QUIT");

            if (rcptResp == null) {
                return result(email, VerificationStatus.UNVERIFIABLE, "No RCPT response", false, null);
            }

            int code = parseCode(rcptResp);
            VerificationStatus status = switch (code / 100) {
                case 2 -> VerificationStatus.VALID;
                case 5 -> VerificationStatus.INVALID;
                // 4xx = temporary failure; treat as unverifiable
                default -> VerificationStatus.UNVERIFIABLE;
            };
            return result(email, status, rcptResp, false, null);

        } catch (java.net.SocketTimeoutException e) {
            log.debug("SMTP timeout for {}: {}", email, e.getMessage());
            return result(email, VerificationStatus.TIMEOUT, "Connection or read timed out", false, null);
        } catch (Exception e) {
            log.debug("SMTP error for {}: {}", email, e.getMessage());
            return result(email, VerificationStatus.UNVERIFIABLE, e.getMessage(), false, null);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Overlay catch-all flag and MX record onto a raw SMTP result. */
    private EmailVerificationResult finalize(EmailVerificationResult raw, boolean catchAll, String mx) {
        VerificationStatus finalStatus = (catchAll && raw.getStatus() == VerificationStatus.VALID)
                ? VerificationStatus.CATCH_ALL
                : raw.getStatus();
        return result(raw.getEmail(), finalStatus, raw.getSmtpResponse(), catchAll, mx);
    }

    private EmailVerificationResult result(String email, VerificationStatus status,
                                           String smtpResponse, boolean catchAll, String mx) {
        return EmailVerificationResult.builder()
                .email(email)
                .status(status)
                .smtpResponse(smtpResponse)
                .catchAll(catchAll)
                .mxRecord(mx)
                .build();
    }

    /** Consume multi-line SMTP responses (lines where char[3] == '-'). */
    private void drainMultilineResponse(BufferedReader reader) throws IOException {
        String line;
        do {
            line = reader.readLine();
        } while (line != null && line.length() >= 4 && line.charAt(3) == '-');
    }

    private int parseCode(String response) {
        try {
            return Integer.parseInt(response.substring(0, 3));
        } catch (NumberFormatException | StringIndexOutOfBoundsException e) {
            return 400;
        }
    }

    private boolean isMicrosoft(String mxHost) {
        String lower = mxHost.toLowerCase();
        return MICROSOFT_MX_SUFFIXES.stream().anyMatch(lower::endsWith);
    }

    private boolean isGoogle(String mxHost) {
        String lower = mxHost.toLowerCase();
        return GOOGLE_MX_SUFFIXES.stream().anyMatch(lower::endsWith);
    }

    private EmailVerificationResult checkViaProvider(String email, String mx, boolean google) {
        ProviderEmailVerificationService.ProviderResult pr = google
                ? providerVerifier.checkGoogle(email)
                : providerVerifier.checkMicrosoft(email);

        VerificationStatus status = switch (pr) {
            case EXISTS     -> VerificationStatus.VALID;
            case NOT_EXISTS -> VerificationStatus.INVALID;
            case UNKNOWN    -> VerificationStatus.UNVERIFIABLE;
        };
        String provider = google ? "Google Workspace" : "Microsoft 365";
        String detail = switch (pr) {
            case EXISTS     -> "Confirmed via " + provider + " login API";
            case NOT_EXISTS -> "Account not found in " + provider + " directory";
            case UNKNOWN    -> provider + " check inconclusive (federated/hybrid tenant)";
        };
        return result(email, status, detail, false, mx);
    }

    private String domainOf(String email) {
        int at = email.lastIndexOf('@');
        return at >= 0 ? email.substring(at + 1) : email;
    }
}
