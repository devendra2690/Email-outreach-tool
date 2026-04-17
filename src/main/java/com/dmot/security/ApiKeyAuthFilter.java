package com.dmot.security;

import com.dmot.service.ApiKeyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Validates the {@code X-Api-Key} header on every request.
 *
 * On success: sets a Spring Security authentication token so downstream
 *             authorisation rules see the request as authenticated.
 * On failure: writes a 401 JSON response and stops the filter chain.
 *
 * Note: NOT annotated with @Component — registered exclusively via
 * {@link SecurityConfig} to avoid double-invocation by Spring Boot's
 * auto-servlet-filter registration.
 */
@Slf4j
@RequiredArgsConstructor
public class ApiKeyAuthFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Api-Key";

    private final ApiKeyService apiKeyService;
    private final ObjectMapper  objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         chain) throws ServletException, IOException {

        String rawKey = request.getHeader(HEADER);

        if (!apiKeyService.isValid(rawKey)) {
            log.warn("Rejected unauthenticated request: {} {}", request.getMethod(), request.getRequestURI());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "error", "Unauthorized",
                    "message", "Missing or invalid API key. Include header: X-Api-Key: <your-key>"
            ));
            return;
        }

        // Update last-used timestamp and stamp the security context
        apiKeyService.recordUsage(rawKey);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(rawKey, null, List.of())
        );

        chain.doFilter(request, response);
    }
}
