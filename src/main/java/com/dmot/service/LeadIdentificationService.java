package com.dmot.service;

import com.dmot.model.DecisionMakerInfo;
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
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phase 1 — Lead Identification.
 *
 * Uses SerpApi to query Google for decision-makers (Director / MD / Founder / CEO / Owner)
 * associated with the target domain. Parses organic result titles and snippets with a
 * regex to extract capitalised full names that appear adjacent to a known executive title.
 */
@Slf4j
@Service
public class LeadIdentificationService {

    private static final String SERPAPI_BASE_URL = "https://serpapi.com/search";

    private static final List<String> EXECUTIVE_TITLES = List.of(
            "Director", "Managing Director", "Founder", "Co-Founder",
            "CEO", "Chief Executive Officer", "Owner", "President", "MD"
    );

    private static final Pattern NAME_NEAR_TITLE = Pattern.compile(
            "([A-Z][a-z]+(?: [A-Z][a-z]+){1,2})" +
            "(?:[^.]{0,60}?" +
            "(?:Director|Managing Director|Founder|Co-Founder|CEO|Chief Executive|Owner|President|MD)" +
            "|" +
            "(?:Director|Managing Director|Founder|Co-Founder|CEO|Chief Executive|Owner|President|MD)" +
            "[^.]{0,60}?([A-Z][a-z]+(?: [A-Z][a-z]+){1,2}))"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.serpapi.key:}")
    private String serpApiKey;

    /**
     * Search for decision-makers at the given company.
     *
     * @param domain      target domain (used as fallback company identifier)
     * @param companyName human-readable company name for better search accuracy
     * @return ordered list of identified decision-makers; empty if SerpApi key is absent
     */
    public List<DecisionMakerInfo> findDecisionMakers(String domain, String companyName) {
        if (serpApiKey == null || serpApiKey.isBlank()) {
            log.warn("SERPAPI_KEY not configured — skipping web search for {}", domain);
            return List.of();
        }

        String identifier = (companyName != null && !companyName.isBlank()) ? companyName : domain;
        String query = buildQuery(identifier);

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            URIBuilder uri = new URIBuilder(SERPAPI_BASE_URL)
                    .addParameter("q", query)
                    .addParameter("api_key", serpApiKey)
                    .addParameter("num", "10")
                    .addParameter("hl", "en");

            HttpGet request = new HttpGet(uri.build());
            String body = client.execute(request, response ->
                    new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8)
            );

            return parseResults(body, domain);

        } catch (Exception e) {
            log.error("SerpApi search failed for '{}': {}", identifier, e.getMessage());
            return List.of();
        }
    }

    private String buildQuery(String company) {
        return "(Director OR \"Managing Director\" OR Founder OR CEO OR Owner) \"" + company + "\" site:linkedin.com";
    }

    private List<DecisionMakerInfo> parseResults(String json, String domain) {
        List<DecisionMakerInfo> people = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode results = root.path("organic_results");

            for (JsonNode result : results) {
                String title   = result.path("title").asText("");
                String snippet = result.path("snippet").asText("");
                String link    = result.path("link").asText("");

                DecisionMakerInfo info = extractPerson(title + " " + snippet, domain, link);
                if (info != null && !isDuplicate(people, info)) {
                    people.add(info);
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse SerpApi JSON: {}", e.getMessage());
        }
        return people;
    }

    private DecisionMakerInfo extractPerson(String text, String domain, String sourceUrl) {
        Matcher m = NAME_NEAR_TITLE.matcher(text);
        while (m.find()) {
            String fullName = m.group(1) != null ? m.group(1).trim() : (m.group(2) != null ? m.group(2).trim() : null);
            if (fullName == null) continue;

            String[] parts = fullName.split("\\s+", 2);
            if (parts.length < 2) continue;

            String detectedTitle = extractTitle(text);
            return DecisionMakerInfo.builder()
                    .firstName(parts[0])
                    .lastName(parts[1])
                    .fullName(fullName)
                    .title(detectedTitle)
                    .domain(domain)
                    .sourceUrl(sourceUrl)
                    .build();
        }
        return null;
    }

    private String extractTitle(String text) {
        for (String t : EXECUTIVE_TITLES) {
            if (text.contains(t)) return t;
        }
        return "Executive";
    }

    private boolean isDuplicate(List<DecisionMakerInfo> existing, DecisionMakerInfo candidate) {
        return existing.stream().anyMatch(e -> e.getFullName().equalsIgnoreCase(candidate.getFullName()));
    }
}
