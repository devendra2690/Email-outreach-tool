package com.dmot.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Phase 2 — Email Permutation.
 *
 * Generates the 15 most common corporate email address patterns for a given
 * first name, last name and domain. All output is lowercase.
 */
@Service
public class EmailPatternService {

    /**
     * Generate all email permutations for a person at the given domain.
     *
     * @param firstName person's first name
     * @param lastName  person's last name
     * @param domain    target company domain, e.g. {@code madonpurefoods.com}
     * @return ordered list of 15 candidate email addresses
     */
    public List<String> generatePatterns(String firstName, String lastName, String domain) {
        String f  = firstName.toLowerCase().trim();
        String l  = lastName.toLowerCase().trim();
        domain    = domain.toLowerCase().trim();
        String fi = String.valueOf(f.charAt(0));  // first initial
        String li = String.valueOf(l.charAt(0));  // last initial

        List<String> patterns = new ArrayList<>(15);

        patterns.add(f + "@" + domain);                      // john@domain.com
        patterns.add(f + "." + l + "@" + domain);            // john.doe@domain.com
        patterns.add(fi + l + "@" + domain);                 // jdoe@domain.com
        patterns.add(f + li + "@" + domain);                 // johnd@domain.com
        patterns.add(f + "_" + l + "@" + domain);            // john_doe@domain.com
        patterns.add(f + l + "@" + domain);                  // johndoe@domain.com
        patterns.add(l + "@" + domain);                      // doe@domain.com
        patterns.add(l + "." + f + "@" + domain);            // doe.john@domain.com
        patterns.add(l + fi + "@" + domain);                 // doej@domain.com
        patterns.add(fi + "." + l + "@" + domain);           // j.doe@domain.com
        patterns.add(f + "-" + l + "@" + domain);            // john-doe@domain.com
        patterns.add(fi + "_" + l + "@" + domain);           // j_doe@domain.com
        patterns.add(l + "_" + f + "@" + domain);            // doe_john@domain.com
        patterns.add(fi + li + "@" + domain);                // jd@domain.com
        patterns.add(f + "." + li + "@" + domain);           // john.d@domain.com

        return patterns;
    }
}
