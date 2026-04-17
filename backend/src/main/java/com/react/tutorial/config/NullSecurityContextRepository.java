package com.react.tutorial.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.DeferredSecurityContext;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.security.web.context.SecurityContextRepository;

public class NullSecurityContextRepository implements SecurityContextRepository {

    @Override
    public void saveContext(SecurityContext context, HttpServletRequest request, HttpServletResponse response) {
    }

    @SuppressWarnings("deprecation")
    @Override
    public SecurityContext loadContext(HttpRequestResponseHolder requestResponseHolder) {
        return SecurityContextHolder.getContext();
    }

    @Override
    public DeferredSecurityContext loadDeferredContext(HttpServletRequest request) {
        SecurityContext context = SecurityContextHolder.getContext();
        return new DeferredSecurityContext() {
            @Override
            public SecurityContext get() { return context; }
            @Override
            public boolean isGenerated() { return false; }
        };
    }

    @Override
    public boolean containsContext(HttpServletRequest request) {
        return false;
    }
}
