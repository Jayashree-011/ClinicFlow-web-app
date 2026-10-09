package com.clinicflow.billingService.config;

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
                // Patients view their own invoices and payment history
                .requestMatchers(HttpMethod.GET, "/api/billing/invoices/patient/*")
                    .hasAnyRole("Finance", "Manager", "Administrator", "Receptionist", "Clinician", "Patient")
                .requestMatchers(HttpMethod.GET, "/api/billing/payments/invoice/*")
                    .hasAnyRole("Finance", "Manager", "Administrator", "Receptionist", "Clinician", "Patient")

                // ── Service-item catalogue — finance/management only ───────────
                .requestMatchers("/api/billing/service-items/**")
                    .hasAnyRole("Finance", "Manager", "Administrator")

                // ── All other billing operations ───────────────────────────────
                .requestMatchers("/api/billing/**")
                    .hasAnyRole("Finance", "Manager", "Administrator", "Receptionist", "Clinician")

                .anyRequest().authenticated()
            );
        // GatewayHeaderFilter is @Component running before this chain — no addFilterBefore needed
        return http.build();
    }
}
