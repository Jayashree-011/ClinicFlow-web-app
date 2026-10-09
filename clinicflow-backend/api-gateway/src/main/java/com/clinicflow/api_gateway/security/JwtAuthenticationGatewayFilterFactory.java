package com.clinicflow.api_gateway.security;

import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthenticationGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtAuthenticationGatewayFilterFactory.Config> {

    @Autowired
    private JwtUtils jwtUtils;

    // Rigid whitelist: always bypass JWT — these never need caller identity
    private static final List<String> PUBLIC_ENDPOINTS = List.of("/api/auth/login");

    // Prefix whitelist: public endpoints that carry a path variable
    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/api/auth/suggestUsername/",
            // Actuator health endpoints — always public so the dashboard can poll without a token
            "/api/auth/actuator/",
            "/api/consultation/actuator/",
            "/api/billing/actuator/",
            "/api/lab/actuator/",
            "/api/pharmacy/actuator/",
            "/api/notification/actuator/",
            "/api/encounter/actuator/",
            "/api/prescriptions/actuator/"
    );

    // Semi-public: accessible without auth (anonymous patient self-registration),
    // but if a valid JWT is present the caller's identity is forwarded in headers
    // so the service can apply role-based rules (e.g. admin creating staff accounts).
    private static final List<String> SEMI_PUBLIC_ENDPOINTS = List.of("/api/auth/register");

    public JwtAuthenticationGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // Strict matching to prevent structural bypass on /api/auth/user/me
            if (PUBLIC_ENDPOINTS.contains(path) ||
                    PUBLIC_PREFIXES.stream().anyMatch(path::startsWith)) {
                return chain.filter(exchange);
            }

            final List<String> apiKeyHeader = request.getHeaders().get("Authorization");

            // Semi-public: no token → let the request through anonymously (no headers injected).
            // If a token IS present it falls through to validation below so the downstream
            // service receives X-User-* headers and can make role-based decisions.
            if (SEMI_PUBLIC_ENDPOINTS.contains(path) &&
                    (apiKeyHeader == null || apiKeyHeader.isEmpty())) {
                return chain.filter(exchange);
            }

            if (apiKeyHeader == null || apiKeyHeader.isEmpty()) {
                return onError(exchange, "Authorization header is missing", HttpStatus.UNAUTHORIZED);
            }

            String authHeaderValue = apiKeyHeader.get(0);
            String token;

            // Handle case-insensitive bearer prefix parsing securely
            if (authHeaderValue.regionMatches(true, 0, "Bearer ", 0, 7)) {
                token = authHeaderValue.substring(7);
            } else {
                token = authHeaderValue;
            }

            try {
                if (!jwtUtils.validateJwtToken(token)) {
                    return onError(exchange, "Invalid token verification failed", HttpStatus.UNAUTHORIZED);
                }

                String username = jwtUtils.getUsernameFromJwtToken(token);
                String userId = jwtUtils.getUserIdFromJwtToken(token); 
                String role = jwtUtils.getRoleFromJwtToken(token);     
                System.out.println("GATEWAY AUTH SUCCESS: User [" + username + "] with role [" + role + "] authenticated successfully for path: " + path);

                // Mutate downstream headers cleanly
                ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                        .header("X-User-Id", userId != null ? userId : "")
                        .header("X-User-Username", username != null ? username : "")
                        .header("X-User-Role", role != null ? role : "USER")
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (ExpiredJwtException e) {
                return onError(exchange, "Token expired", HttpStatus.UNAUTHORIZED);
            } catch (MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
                return onError(exchange, "Malformed token structure", HttpStatus.UNAUTHORIZED);
            } catch (Exception e) {
                return onError(exchange, "Authentication execution failed", HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String error, HttpStatus httpStatus) {
        System.err.println("GATEWAY ERROR REJECTION: [" + error + "] at path: " + exchange.getRequest().getURI().getPath());
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    public static class Config { }
}