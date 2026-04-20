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
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.LinkedHashMap;

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

    /**
     * Words that, if present in a regex-matched "name", indicate it is actually
     * a job title or role phrase rather than a real person's name.
     * E.g. "Country Manager", "Post Founder", "Head Sales", "Vice President".
     */
    private static final Set<String> ROLE_WORDS = Set.of(
            // From EXECUTIVE_TITLES
            "Director", "Founder", "Ceo", "Owner", "President",
            // Common role/function words that appear title-cased in LinkedIn snippets
            "Manager", "Managing", "Head", "Chief", "Officer", "Executive",
            "Vice", "Partner", "Associate", "Lead", "Coordinator", "Specialist",
            "Consultant", "Advisor", "Analyst", "Strategist", "Controller",
            // Geographic/scope qualifiers that prefix roles
            "Country", "Regional", "National", "Global", "General", "Group",
            // Functional area words
            "Operations", "Marketing", "Sales", "Finance", "Technical",
            "Business", "Development", "Digital", "Product", "Commercial",
            "Corporate", "Strategic", "International", "Senior", "Junior"
    );

    /** Matches any email address in a snippet/title. */
    private static final Pattern EMAIL_IN_TEXT = Pattern.compile(
            "[a-zA-Z0-9._%+\\-]+@([a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})"
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

        // Use a map keyed by fullName to deduplicate across both searches
        LinkedHashMap<String, DecisionMakerInfo> found = new LinkedHashMap<>();

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            // Query 1 — title-based: find people with executive titles near company name
            String titleQuery = buildTitleQuery(identifier);
            searchAndCollect(client, titleQuery, domain, found);

            // Query 2 — email-direct: find publicly posted emails at this domain on LinkedIn
            // Catches cases like "Email me @ chetan.shinde@rpsg.in" in posts
            String emailQuery = "\"@" + domain + "\" site:linkedin.com";
            searchAndCollect(client, emailQuery, domain, found);

        } catch (Exception e) {
            log.error("SerpApi search failed for '{}': {}", identifier, e.getMessage());
        }

        return new ArrayList<>(found.values());
    }

    private void searchAndCollect(CloseableHttpClient client, String query,
                                  String domain, LinkedHashMap<String, DecisionMakerInfo> found) {
        try {
            URIBuilder uri = new URIBuilder(SERPAPI_BASE_URL)
                    .addParameter("q", query)
                    .addParameter("api_key", serpApiKey)
                    .addParameter("num", "10")
                    .addParameter("hl", "en");

            HttpGet request = new HttpGet(uri.build());
            String body = client.execute(request, response ->
                    new String(response.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));

            // First pass: extract emails directly from snippets (highest confidence)
            parseEmailsFromSnippets(body, domain).forEach(info ->
                    found.putIfAbsent(info.getFullName(), info));

            // Second pass: name+title extraction
            parseResults(body, domain).forEach(info ->
                    found.putIfAbsent(info.getFullName(), info));

        } catch (Exception e) {
            log.debug("SerpApi query failed: {} — {}", query, e.getMessage());
        }
    }

    private String buildTitleQuery(String company) {
        return "(Director OR \"Managing Director\" OR Founder OR CEO OR Owner) \"" + company + "\" site:linkedin.com";
    }

    /**
     * Scan search result snippets for actual email addresses at the target domain.
     * The profile/post author name comes from the result title (LinkedIn format: "Name - Title").
     */
    private List<DecisionMakerInfo> parseEmailsFromSnippets(String json, String domain) {
        List<DecisionMakerInfo> people = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(json);
            for (JsonNode result : root.path("organic_results")) {
                String title   = result.path("title").asText("");
                String snippet = result.path("snippet").asText("");
                String link    = result.path("link").asText("");
                String text    = title + " " + snippet;

                Matcher emailMatcher = EMAIL_IN_TEXT.matcher(text);
                while (emailMatcher.find()) {
                    String email = emailMatcher.group(0).toLowerCase();
                    if (!email.endsWith(domain)) continue;

                    // Extract name from LinkedIn title format "Firstname Lastname - Title at Company"
                    String personName = extractNameFromLinkedInTitle(title);
                    if (personName == null) continue;

                    String[] parts = personName.split("\\s+", 2);
                    if (parts.length < 2) continue;

                    DecisionMakerInfo info = DecisionMakerInfo.builder()
                            .firstName(parts[0])
                            .lastName(parts[1])
                            .fullName(personName)
                            .title(extractTitle(text))
                            .domain(domain)
                            .sourceUrl(link)
                            .knownEmail(email)   // we already know the exact email!
                            .build();

                    if (!isDuplicate(people, info)) {
                        log.info("Found email directly in snippet: {} → {}", personName, email);
                        people.add(info);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Email snippet parse failed: {}", e.getMessage());
        }
        return people;
    }

    /** LinkedIn result titles follow "Firstname Lastname - Title | LinkedIn" format. */
    private String extractNameFromLinkedInTitle(String title) {
        // Pattern: "Name - Something" or "Name | Something"
        String[] parts = title.split("[-|]", 2);
        if (parts.length == 0) return null;
        String candidate = parts[0].trim();
        // Must look like a real name: 2 capitalised words
        if (candidate.matches("[A-Z][a-z]+(?: [A-Z][a-z]+)+") && !containsTitle(candidate)) {
            return candidate;
        }
        return null;
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

            // Skip if the matched "name" is actually a title phrase like "Post Founder"
            if (containsTitle(fullName)) continue;

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

    private boolean containsTitle(String text) {
        for (String t : EXECUTIVE_TITLES) {
            if (text.contains(t)) return true;
        }
        // Also reject if any word in the candidate name is a known role/function word
        for (String word : text.split("\\s+")) {
            if (ROLE_WORDS.contains(word)) return true;
        }
        return false;
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
