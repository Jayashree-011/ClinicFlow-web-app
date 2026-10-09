package com.clinicflow.notification.security;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

/**
 * Runs as a standalone servlet filter BEFORE the Spring Security filter chain
 * (order = Integer.MIN_VALUE, security chain = -100).
 *
 * Writes the SecurityContext into the request attribute that
 * RequestAttributeSecurityContextRepository reads lazily when AuthorizationFilter
 * asks for the context — bypassing the Spring Security 6/7 deferred-context
 * timing issue that breaks setContext() calls inside the security chain.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String userId   = request.getHeader("X-User-Id");
        String username = request.getHeader("X-User-Username");
        String role     = request.getHeader("X-User-Role");

        if (username != null && !username.isBlank() && userId != null) {
            String assignedRole = (role != null && !role.isBlank()) ? role : "USER";
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                username, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + assignedRole))
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authToken);
            // Store in the request attribute that SecurityContextHolderFilter
            // will pick up via RequestAttributeSecurityContextRepository.
            request.setAttribute(
                RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME,
                context
            );
        }

        filterChain.doFilter(request, response);
    }
}
