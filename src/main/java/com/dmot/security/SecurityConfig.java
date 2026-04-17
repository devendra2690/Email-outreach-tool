package com.dmot.security;

import com.dmot.service.ApiKeyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ApiKeyService apiKeyService;
    private final ObjectMapper  objectMapper;

    /**
     * Declare the filter as a @Bean (not @Component) so Spring Boot does NOT
     * auto-register it as a servlet filter — it runs only inside the security chain.
     */
    @Bean
    public ApiKeyAuthFilter apiKeyAuthFilter() {
        return new ApiKeyAuthFilter(apiKeyService, objectMapper);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // REST API — no CSRF tokens needed
            .csrf(AbstractHttpConfigurer::disable)
            // No session state — every request must carry the API key
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Plug in our key filter before the default username/password filter
            .addFilterBefore(apiKeyAuthFilter(), UsernamePasswordAuthenticationFilter.class)
            // Every endpoint requires authentication
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());

        return http.build();
    }
}
