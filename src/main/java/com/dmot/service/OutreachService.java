package com.dmot.service;

import com.dmot.entity.DomainCache;
import com.dmot.entity.Lead;
import com.dmot.model.*;
import com.dmot.model.EmailVerificationResult.VerificationStatus;
import com.dmot.repository.DomainCacheRepository;
import com.dmot.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Orchestrates all three phases of the outreach pipeline:
 *   Phase 1 — Lead Identification  (LeadIdentificationService)
 *   Phase 2 — Email Permutation    (EmailPatternService)
 *   Phase 3 — SMTP Verification    (SmtpVerificationService)
 *
 * Results are persisted to PostgreSQL so repeated calls for the same domain
 * return instantly from cache unless {@code skipCache} is set.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutreachService {

    private final LeadIdentificationService    leadService;
    private final EmailPatternService          patternService;
    private final SmtpVerificationService      smtpService;
    private final EmailDomainDetectionService  detectionService;
    private final LeadRepository               leadRepository;
    private final DomainCacheRepository        domainCacheRepository;

    public OutreachResponse processOutreach(OutreachRequest request) {
        String domain = request.getDomain();
        // Use emailDomain override if provided (e.g. website=chhedaspecialities.com, email=chhedas.com)
        String emailDomain = (request.getEmailDomain() != null && !request.getEmailDomain().isBlank())
                ? request.getEmailDomain()
                : domain;

        if (!request.isSkipCache()) {
            List<Lead> cached = leadRepository.findByDomain(domain);
            if (!cached.isEmpty()) {
                log.info("Cache hit for domain {}", domain);
                return buildResponseFromCache(domain, cached);
            }
        }

        // Phase 1
        List<DecisionMakerInfo> decisionMakers = leadService.findDecisionMakers(domain, request.getCompanyName());

        if (decisionMakers.isEmpty()) {
            log.warn("No decision-makers found for domain {}", domain);
            return OutreachResponse.builder()
                    .domain(domain)
                    .decisionMakers(List.of())
                    .verifiedEmails(List.of())
                    .build();
        }

        // Phase 2: generate patterns for the top-ranked decision-maker
        DecisionMakerInfo primary = decisionMakers.get(0);

        // If the email was found directly in a LinkedIn post, skip pattern generation entirely
        if (primary.getKnownEmail() != null && !primary.getKnownEmail().isBlank()) {
            log.info("Known email found for {} via LinkedIn post: {}", primary.getFullName(), primary.getKnownEmail());
            EmailVerificationResult known = EmailVerificationResult.builder()
                    .email(primary.getKnownEmail())
                    .status(VerificationStatus.WEBSITE)
                    .smtpResponse("Email found directly in LinkedIn post — ground-truth valid")
                    .build();
            persistLead(primary, primary.getKnownEmail());
            return OutreachResponse.builder()
                    .domain(domain)
                    .decisionMakers(decisionMakers)
                    .verifiedEmails(List.of(known))
                    .bestEmail(primary.getKnownEmail())
                    .catchAllDomain(false)
                    .build();
        }

        List<String> patterns = patternService.generatePatterns(
                primary.getFirstName(), primary.getLastName(), emailDomain
        );
        log.info("Generated {} email patterns for {} at {}", patterns.size(), primary.getFullName(), emailDomain);

        // Phase 2b: scrape the website for published emails — ground-truth valid
        EmailDomainDetectionService.WebsiteEmails websiteEmails =
                detectionService.scrapeWebsiteEmails(domain);
        java.util.Set<String> websiteEmailSet = new java.util.HashSet<>(websiteEmails.emails());

        // Phase 3: verify patterns; skip SMTP for any email found on the website
        List<EmailVerificationResult> smtpResults = smtpService.verifyAll(patterns);
        List<EmailVerificationResult> results = smtpResults.stream()
                .map(r -> websiteEmailSet.contains(r.getEmail())
                        ? EmailVerificationResult.builder()
                            .email(r.getEmail())
                            .status(VerificationStatus.WEBSITE)
                            .smtpResponse("Found on company website — ground-truth valid")
                            .mxRecord(r.getMxRecord())
                            .build()
                        : r)
                .collect(java.util.stream.Collectors.toList());

        // Also add website emails that weren't in the generated patterns
        websiteEmails.emails().stream()
                .filter(e -> patterns.stream().noneMatch(p -> p.equalsIgnoreCase(e)))
                .map(e -> EmailVerificationResult.builder()
                        .email(e)
                        .status(VerificationStatus.WEBSITE)
                        .smtpResponse("Found on company website — ground-truth valid")
                        .build())
                .forEach(r -> results.add(0, r)); // prepend — highest confidence

        boolean catchAll = results.stream().anyMatch(EmailVerificationResult::isCatchAll);
        String bestEmail = results.stream()
                .filter(r -> r.getStatus() == VerificationStatus.WEBSITE
                          || r.getStatus() == VerificationStatus.VALID)
                .map(EmailVerificationResult::getEmail)
                .findFirst()
                .orElse(null);

        persistLead(primary, bestEmail);
        cacheDomain(domain, smtpService.getMxRecord(domain), catchAll);

        log.info("Outreach complete for {}: bestEmail={}, catchAll={}", domain, bestEmail, catchAll);

        return OutreachResponse.builder()
                .domain(domain)
                .decisionMakers(decisionMakers)
                .verifiedEmails(results)
                .bestEmail(bestEmail)
                .catchAllDomain(catchAll)
                .build();
    }

    // -------------------------------------------------------------------------
    // Persistence helpers
    // -------------------------------------------------------------------------

    private void persistLead(DecisionMakerInfo info, String verifiedEmail) {
        // Avoid duplicate rows for the same person
        leadRepository.findByFullNameAndDomain(info.getFullName(), info.getDomain())
                .ifPresentOrElse(
                        existing -> {
                            existing.setVerifiedEmail(verifiedEmail);
                            existing.setEmailStatus(verifiedEmail != null ? "VALID" : "UNVERIFIED");
                            leadRepository.save(existing);
                        },
                        () -> {
                            Lead lead = new Lead();
                            lead.setFirstName(info.getFirstName());
                            lead.setLastName(info.getLastName());
                            lead.setFullName(info.getFullName());
                            lead.setTitle(info.getTitle());
                            lead.setDomain(info.getDomain());
                            lead.setVerifiedEmail(verifiedEmail);
                            lead.setEmailStatus(verifiedEmail != null ? "VALID" : "UNVERIFIED");
                            leadRepository.save(lead);
                        }
                );
    }

    private void cacheDomain(String domain, String mxRecord, boolean catchAll) {
        DomainCache cache = domainCacheRepository.findById(domain).orElse(new DomainCache());
        cache.setDomain(domain);
        cache.setMxRecord(mxRecord);
        cache.setCatchAll(catchAll);
        cache.setLastChecked(LocalDateTime.now());
        cache.setExpiresAt(LocalDateTime.now().plusDays(7));
        domainCacheRepository.save(cache);
    }

    private OutreachResponse buildResponseFromCache(String domain, List<Lead> leads) {
        List<DecisionMakerInfo> makers = leads.stream()
                .map(l -> DecisionMakerInfo.builder()
                        .firstName(l.getFirstName())
                        .lastName(l.getLastName())
                        .fullName(l.getFullName())
                        .title(l.getTitle())
                        .domain(l.getDomain())
                        .build())
                .toList();

        String bestEmail = leads.stream()
                .filter(l -> "VALID".equals(l.getEmailStatus()))
                .map(Lead::getVerifiedEmail)
                .findFirst()
                .orElse(null);

        return OutreachResponse.builder()
                .domain(domain)
                .decisionMakers(makers)
                .verifiedEmails(List.of())
                .bestEmail(bestEmail)
                .build();
    }
}
