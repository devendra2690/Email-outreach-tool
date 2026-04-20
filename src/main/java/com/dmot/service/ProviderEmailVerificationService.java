package com.dmot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Verifies emails hosted on Microsoft 365 and Google Workspace using their
 * own login-flow APIs — the same endpoints their sign-in pages call to check
 * whether an account exists before showing the password field.
 *
 * This is how commercial tools (Hunter.io, ZeroBounce, etc.) bypass the SMTP
 * port-25 blocks that Microsoft and Google enforce.
 *
 * Microsoft: POST /common/GetCredentialType  → IfExistsResult 0/5 = exists, 1 = not found
 * Google:    GET  /mail/gxlu?email=...        → HTTP 200 + cookie = exists, 404 = not found
 */
@Slf4j
@Service
public class ProviderEmailVerificationService {

    private static final String MS_URL =
            "https://login.microsoftonline.com/common/GetCredentialType";

    private static final String GOOGLE_URL =
            "https://mail.google.com/mail/gxlu?email=";

    private final ObjectMapper objectMapper = new ObjectMapper();

    public enum ProviderResult { EXISTS, NOT_EXISTS, UNKNOWN }

    // -------------------------------------------------------------------------
    // Microsoft 365 / Exchange Online
    // -------------------------------------------------------------------------

    /**
     * Returns EXISTS if the mailbox is found in Microsoft's directory,
     * NOT_EXISTS if confirmed absent, UNKNOWN if the check fails or is
     * inconclusive (e.g. federated/on-prem hybrid tenants).
     */
    public ProviderResult checkMicrosoft(String email) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(MS_URL);
            post.setHeader("Content-Type", "application/json");
            post.setHeader("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            post.setHeader("Origin", "https://login.microsoftonline.com");

            String body = objectMapper.writeValueAsString(
                    new MsRequest(email));
            post.setEntity(new StringEntity(body, ContentType.APPLICATION_JSON));

            String response = client.execute(post, resp ->
                    new String(resp.getEntity().getContent().readAllBytes(),
                            StandardCharsets.UTF_8));

            JsonNode root = objectMapper.readTree(response);
            int ifExistsResult = root.path("IfExistsResult").asInt(-1);

            // 0 = managed account exists
            // 5 = federated account (exists in external IdP, still a real account)
            // 6 = Microsoft personal account exists
            // 1 = account not found
            // -1 = parse failure
            ProviderResult result = switch (ifExistsResult) {
                case 0, 5, 6 -> ProviderResult.EXISTS;
                case 1       -> ProviderResult.NOT_EXISTS;
                default      -> ProviderResult.UNKNOWN;
            };

            log.info("Microsoft check for {}: IfExistsResult={} → {}",
                    email, ifExistsResult, result);
            return result;

        } catch (Exception e) {
            log.debug("Microsoft verification failed for {}: {}", email, e.getMessage());
            return ProviderResult.UNKNOWN;
        }
    }

    // -------------------------------------------------------------------------
    // Google Workspace / Gmail
    // -------------------------------------------------------------------------

    /**
     * Google's GXLU endpoint returns HTTP 200 with a Set-Cookie header when the
     * account exists, and HTTP 404 when it does not.
     */
    public ProviderResult checkGoogle(String email) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            var get = new org.apache.hc.client5.http.classic.methods.HttpGet(
                    GOOGLE_URL + java.net.URLEncoder.encode(email, StandardCharsets.UTF_8));
            get.setHeader("User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

            ProviderResult result = client.execute(get, resp -> {
                int status = resp.getCode();
                if (status == 200) return ProviderResult.EXISTS;
                if (status == 404) return ProviderResult.NOT_EXISTS;
                return ProviderResult.UNKNOWN;
            });

            log.info("Google check for {}: {}", email, result);
            return result;

        } catch (Exception e) {
            log.debug("Google verification failed for {}: {}", email, e.getMessage());
            return ProviderResult.UNKNOWN;
        }
    }

    // -------------------------------------------------------------------------

    /** Request body for Microsoft GetCredentialType. */
    record MsRequest(String Username) {}
}
