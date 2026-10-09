package com.clinicflow.consultation.config;

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
                // Infrastructure — always open
                .requestMatchers("/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // ── Doctor endpoints ──────────────────────────────────────────
                // Patients browse the doctor list (needed for booking modal)
                .requestMatchers("/api/consultation/doctor/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician", "Patient")

                // ── Patient endpoints: safe read operations ───────────────────
                // GET: patients read their own profile, appointments list, family
                .requestMatchers(HttpMethod.GET, "/api/consultation/patient/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician", "Patient")

                // ── Patient endpoints: specific safe POST actions ─────────────
                // Patients book their own appointment (POST .../patient/{id}/appointments)
                .requestMatchers(HttpMethod.POST, "/api/consultation/patient/*/appointments")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician", "Patient")
                // Patient dashboard resolves identity on login (POST .../patient/resolve)
                .requestMatchers(HttpMethod.POST, "/api/consultation/patient/resolve")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician", "Patient")

                // ── Patient mutations — staff only ────────────────────────────
                // Remaining POST (register new patient), PUT (update), DELETE
                .requestMatchers(HttpMethod.POST, "/api/consultation/patient/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician")
                .requestMatchers(HttpMethod.PUT, "/api/consultation/patient/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician")
                .requestMatchers(HttpMethod.DELETE, "/api/consultation/patient/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician")

                // ── Appointment endpoints ─────────────────────────────────────
                // Status updates, cancellations — staff + patients
                .requestMatchers("/api/consultation/appointment/**")
                    .hasAnyRole("Administrator", "Manager", "Receptionist", "Clinician", "Patient")

                .anyRequest().authenticated()
            );
        // GatewayHeaderFilter is @Component running before this chain — no addFilterBefore needed
        return http.build();
    }
}
