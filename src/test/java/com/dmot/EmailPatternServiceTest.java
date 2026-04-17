package com.dmot;

import com.dmot.service.EmailPatternService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmailPatternServiceTest {

    private final EmailPatternService service = new EmailPatternService();

    @Test
    void generates15Patterns() {
        List<String> patterns = service.generatePatterns("John", "Doe", "example.com");
        assertThat(patterns).hasSize(15);
    }

    @Test
    void allPatternsAreForCorrectDomain() {
        List<String> patterns = service.generatePatterns("Jane", "Smith", "acme.io");
        assertThat(patterns).allMatch(p -> p.endsWith("@acme.io"));
    }

    @Test
    void allPatternsAreLowercase() {
        List<String> patterns = service.generatePatterns("ALICE", "WALKER", "Corp.com");
        assertThat(patterns).allMatch(p -> p.equals(p.toLowerCase()));
    }

    @Test
    void containsCommonPatterns() {
        List<String> patterns = service.generatePatterns("John", "Doe", "example.com");
        assertThat(patterns).contains(
                "john@example.com",
                "john.doe@example.com",
                "jdoe@example.com",
                "johnd@example.com",
                "johndoe@example.com",
                "j.doe@example.com",
                "jd@example.com"
        );
    }
}
