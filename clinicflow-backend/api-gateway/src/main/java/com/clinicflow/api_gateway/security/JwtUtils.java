package com.clinicflow.api_gateway.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret:clinicflow-secret-key-for-jwt-token-generation-and-validation}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // 24 hours
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        // Ensure your secret is long enough for HS256
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateTokenFromUsername(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey()) // Algorithm is inferred from key type
                .compact();
    }

    public String getUserIdFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Replaces setSigningKey
                .build()                     // CRITICAL: You must build the parser
                .parseSignedClaims(token)    // Replaces parseClaimsJws
                .getPayload()                // Replaces getBody
                .get("userId", String.class); // Assuming userId is stored as a claim
    }

    public String getRoleFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("role", String.class); // Assuming role is stored as a claim
    }

    public String getUsernameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey()) // Replaces setSigningKey
                .build()                     // CRITICAL: You must build the parser
                .parseSignedClaims(token)    // Replaces parseClaimsJws
                .getPayload()                // Replaces getBody
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token is expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token is unsupported: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims string is empty: " + e.getMessage());
        }
        return false;
    }
}