package com.dmot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.net.URIBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects the actual email-sending domain for a company website domain.
 *
 * Strategy (in priority order):
 *   1. Hunter.io domain-search API (if key configured)
 *   2. Website contact page scraping — look for mailto: links (no API key needed)
 *   3. MX record analysis — infer from mail server hostname
 */
@Slf4j
@Service
public class EmailDomainDetectionService {

    private static final Set<String> SHARED_MAIL_PROVIDERS = Set.of(
            "hostinger.com", "google.com", "googlemail.com", "outlook.com",
            "microsoft.com", "zoho.com", "yahoo.com", "godaddy.com",
            "bluehost.com", "namecheap.com", "mailgun.org", "sendgrid.net",
            "amazonses.com", "protonmail.ch", "fastmail.com", "mxroute.com",
            "titan.email", "yandex.ru", "rackspace.com", "emailsrvr.com"
    );

    private static final String HUNTER_BASE = "https://api.hunter.io/v2/domain-search";

    /** Matches email addresses in HTML — used for contact page scraping. */
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "[a-zA-Z0-9._%+\\-]+@([a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})"
    );

    @Value("${app.hunter.key:}")
    private String hunterKey;

    private final SmtpVerificationService smtpService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public EmailDomainDetectionService(SmtpVerificationService smtpService) {
        this.smtpService = smtpService;
    }

    public record DetectionResult(String emailDomain, String source, String detail) {}

    /**
     * Scrape the website and return all real email addresses found on it.
     * These are considered ground-truth valid — the company published them.
     */
    public record WebsiteEmails(java.util.List<String> emails, String foundAt) {}

    public WebsiteEmails scrapeWebsiteEmails(String websiteDomain) {
        String[] urlsToTry = {
            "https://" + websiteDomain + "/contact",
            "https://" + websiteDomain + "/contact-us",
            "https://" + websiteDomain,
            "http://"  + websiteDomain + "/contact",
            "http://"  + websiteDomain
        };

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            for (String url : urlsToTry) {
                try {
                    HttpGet request = new HttpGet(url);
                    request.setHeader("User-Agent", "Mozilla/5.0");
                    String html = client.execute(request, response -> {
                        int status = response.getCode();
                        if (status < 200 || status >= 400) return null;
                        return new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
                    });
                    if (html == null) continue;

                    java.util.List<String> found = new java.util.ArrayList<>();
                    Matcher m = EMAIL_PATTERN.matcher(html);
                    while (m.find()) {
                        String email = m.group(0).toLowerCase();
                        String domain = m.group(1).toLowerCase();
                        if (!SHARED_MAIL_PROVIDERS.contains(extractRootDomain(domain))
                                && !domain.contains("example")
                                && !domain.contains("sentry")
                                && !domain.contains("w3.org")
                                && !found.contains(email)) {
                            found.add(email);
                        }
                    }
                    if (!found.isEmpty()) {
                        log.info("Found {} email(s) on website {}: {}", found.size(), url, found);
                        return new WebsiteEmails(found, url);
                    }
                } catch (Exception e) {
                    log.debug("Scrape failed for {}: {}", url, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("HTTP client error scraping {}: {}", websiteDomain, e.getMessage());
        }
        return new WebsiteEmails(java.util.List.of(), null);
    }

    /**
     * Attempt to find the real email domain for the given website domain.
     * Returns the website domain itself if detection is inconclusive.
     */
    public DetectionResult detect(String websiteDomain) {
        // 1. Hunter.io (most reliable)
        if (hunterKey != null && !hunterKey.isBlank()) {
            DetectionResult hunterResult = tryHunter(websiteDomain);
            if (hunterResult != null) return hunterResult;
        }

        // 2. Website contact page scraping (free, no API key needed)
        DetectionResult scrapeResult = tryContactPageScrape(websiteDomain);
        if (scrapeResult != null) return scrapeResult;

        // 3. MX record analysis
        return detectViaMx(websiteDomain);
    }

    // -------------------------------------------------------------------------

    private DetectionResult tryHunter(String domain) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            String url = new URIBuilder(HUNTER_BASE)
                    .addParameter("domain", domain)
                    .addParameter("api_key", hunterKey)
                    .build().toString();

            HttpGet request = new HttpGet(url);
            String body = client.execute(request, response ->
                    new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));

            JsonNode root = objectMapper.readTree(body);
            String detected = root.path("data").path("domain").asText(null);

            if (detected != null && !detected.isBlank()) {
                log.info("Hunter.io detected email domain '{}' for '{}'", detected, domain);
                return new DetectionResult(detected, "hunter.io",
                        "Found via Hunter.io domain search");
            }
        } catch (Exception e) {
            log.debug("Hunter.io lookup failed for {}: {}", domain, e.getMessage());
        }
        return null;
    }

    /**
     * Fetch the website's homepage and /contact page looking for mailto: links or
     * plain email addresses. The domain found in the first non-generic email wins.
     */
    private DetectionResult tryContactPageScrape(String domain) {
        String[] urlsToTry = {
            "https://" + domain + "/contact",
            "https://" + domain + "/contact-us",
            "https://" + domain,
            "http://"  + domain + "/contact",
            "http://"  + domain
        };

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            for (String url : urlsToTry) {
                try {
                    HttpGet request = new HttpGet(url);
                    request.setHeader("User-Agent", "Mozilla/5.0");
                    String html = client.execute(request, response -> {
                        int status = response.getCode();
                        if (status < 200 || status >= 400) return null;
                        return new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8);
                    });

                    if (html == null) continue;

                    Matcher m = EMAIL_PATTERN.matcher(html);
                    while (m.find()) {
                        String foundDomain = m.group(1).toLowerCase();
                        // Skip generic free/shared mail providers
                        if (!SHARED_MAIL_PROVIDERS.contains(extractRootDomain(foundDomain))
                                && !foundDomain.contains("example")
                                && !foundDomain.contains("sentry")
                                && !foundDomain.contains("w3.org")) {
                            log.info("Contact page scrape found email domain '{}' at {}", foundDomain, url);
                            return new DetectionResult(foundDomain, "website-scrape",
                                    "Found email address on " + url);
                        }
                    }
                } catch (Exception e) {
                    log.debug("Scrape failed for {}: {}", url, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("HTTP client error during scrape for {}: {}", domain, e.getMessage());
        }
        return null;
    }

    private DetectionResult detectViaMx(String domain) {
        String mxHost = smtpService.getMxRecord(domain);

        if (mxHost == null || mxHost.isBlank()) {
            log.debug("No MX record for {} — falling back to website domain", domain);
            return new DetectionResult(domain, "fallback",
                    "No MX record found — using website domain as email domain");
        }

        String mxRootDomain = extractRootDomain(mxHost);

        if (SHARED_MAIL_PROVIDERS.contains(mxRootDomain)) {
            // Shared hosting provider — email domain is the website domain itself
            log.info("MX {} is shared provider ({}) for {} — email domain = website domain",
                    mxHost, mxRootDomain, domain);
            return new DetectionResult(domain, "mx-shared",
                    "Mail handled by " + mxRootDomain + " — email domain matches website domain");
        }

        // Private mail server — email domain is likely the MX root domain
        if (!mxRootDomain.equals(domain)) {
            log.info("MX {} suggests email domain '{}' differs from website domain '{}'",
                    mxHost, mxRootDomain, domain);
            return new DetectionResult(mxRootDomain, "mx-inferred",
                    "MX record " + mxHost + " suggests email domain is " + mxRootDomain);
        }

        return new DetectionResult(domain, "mx-same",
                "MX record " + mxHost + " — email domain matches website domain");
    }

    /**
     * Extracts the registrable root domain from a hostname.
     * Handles common two-part TLDs like .co.in, .co.uk, .com.au.
     *
     * Examples:
     *   mail.chhedas.com  → chhedas.com
     *   mx1.hostinger.com → hostinger.com
     *   mail.company.co.in → company.co.in
     */
    static String extractRootDomain(String hostname) {
        String h = hostname.toLowerCase().replaceAll("\\.$", "");
        String[] parts = h.split("\\.");
        if (parts.length <= 2) return h;

        // Two-part TLDs: co.in, co.uk, com.au, net.in, org.in, etc.
        String secondToLast = parts[parts.length - 2];
        if (secondToLast.length() <= 3 && !secondToLast.matches("\\d+")) {
            // Likely a 2-part TLD — take last 3 segments
            return parts.length >= 3
                    ? parts[parts.length - 3] + "." + secondToLast + "." + parts[parts.length - 1]
                    : h;
        }

        return secondToLast + "." + parts[parts.length - 1];
    }
}
