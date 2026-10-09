package com.clinicflow.notification.config;

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
            // Use RequestAttributeSecurityContextRepository so that the SecurityContext
            // written into the request attribute by GatewayHeaderFilter (which runs before
            // this chain at Ordered.HIGHEST_PRECEDENCE) is loaded here lazily.
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
                .requestMatchers("/actuator/**", "/api/notification/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // ── Internal service writes — no JWT in flight ─────────────────
                .requestMatchers(HttpMethod.POST, "/api/notifications").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tasks").permitAll()

                // ── User-facing read / update / delete operations ─────────────
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/tasks/**").authenticated()

                .anyRequest().authenticated()
            );
        // GatewayHeaderFilter is registered as a @Component servlet filter running
        // before this chain — no addFilterBefore needed here.
        return http.build();
    }
}
