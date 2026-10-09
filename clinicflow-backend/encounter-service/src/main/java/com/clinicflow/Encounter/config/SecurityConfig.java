package com.clinicflow.Encounter.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .securityContext(ctx -> ctx
                .securityContextRepository(new RequestAttributeSecurityContextRepository()))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) ->
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                .accessDeniedHandler((request, response, accessDeniedException) ->
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden"))
            )
            .authorizeHttpRequests(auth -> auth
                // Infrastructure
                .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // ── Patient self-service reads ─────────────────────────────────
                // Patients view their own encounter history in the Records tab
                .requestMatchers(HttpMethod.GET, "/api/encounter/patient/*")
                    .hasAnyRole("Clinician", "Manager", "Administrator", "Patient")

                // ── Encounter base path (POST /api/encounter) ─────────────────
                // Explicitly cover the base-path POST so PathPatternParser doesn't
                // miss it when /** requires at least one additional segment
                .requestMatchers(HttpMethod.POST, "/api/encounter")
                    .hasAnyRole("Clinician", "Manager", "Administrator")

                // ── All other encounter operations — clinical staff only ────────
                .requestMatchers("/api/encounter/**")
                    .hasAnyRole("Clinician", "Manager", "Administrator")

                .anyRequest().authenticated()
            );
        // GatewayHeaderFilter is @Component running before this chain — no addFilterBefore needed
        return http.build();
    }
}
