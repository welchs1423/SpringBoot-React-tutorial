package com.react.tutorial.config;

import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import com.react.tutorial.service.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    private static final String FRONTEND_REDIRECT_URI = "http://localhost:5173/oauth2/callback";

    public OAuth2AuthenticationSuccessHandler(JwtTokenProvider jwtTokenProvider,
                                               UserRepository userRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId;
        String provider = resolveProvider(request);

        if ("GOOGLE".equals(provider)) {
            providerId = (String) attributes.get("sub");
        } else {
            providerId = String.valueOf(attributes.get("id"));
        }

        User user = userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseThrow(() -> new IllegalStateException("OAuth2 사용자를 찾을 수 없습니다."));

        Authentication userAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                user, null, List.of(new SimpleGrantedAuthority(user.getRole()))
        );

        String token = jwtTokenProvider.generateToken(userAuth);
        String redirectUrl = FRONTEND_REDIRECT_URI
                + "?token=" + token
                + "&role=" + user.getRole()
                + "&username=" + user.getUsername();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String resolveProvider(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.contains("google")) return "GOOGLE";
        if (uri.contains("kakao")) return "KAKAO";
        return "UNKNOWN";
    }
}
