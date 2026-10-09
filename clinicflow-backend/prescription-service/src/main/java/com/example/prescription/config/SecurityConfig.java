package com.clinicflow.prescription.config;

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
                // Patients view their own prescriptions in the Records tab
                .requestMatchers(HttpMethod.GET, "/api/prescriptions/patient/*")
                    .hasAnyRole("Clinician", "Pharmacy", "Manager", "Administrator", "Patient")

                // ── Prescription base path (POST /api/prescriptions) ───────────
                // Explicitly cover the base-path POST so PathPatternParser doesn't
                // miss it when /** requires at least one additional segment
                .requestMatchers(HttpMethod.POST, "/api/prescriptions")
                    .hasAnyRole("Clinician", "Pharmacy", "Manager", "Administrator")

                // ── All other prescription operations — staff only ─────────────
                // Issue, cancel, dispense — prescribers + dispensers
                .requestMatchers("/api/prescriptions/**")
                    .hasAnyRole("Clinician", "Pharmacy", "Manager", "Administrator")

                .anyRequest().authenticated()
            );
        // GatewayHeaderFilter is @Component running before this chain — no addFilterBefore needed
        return http.build();
    }
}
