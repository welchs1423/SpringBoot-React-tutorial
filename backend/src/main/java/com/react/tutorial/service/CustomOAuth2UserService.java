package com.react.tutorial.service;

import com.react.tutorial.entity.User;
import com.react.tutorial.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    @SuppressWarnings({"unchecked", "null"})
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String provider = registrationId.toUpperCase();
        String providerId;
        String email;

        if ("GOOGLE".equals(provider)) {
            providerId = (String) attributes.get("sub");
            email = (String) attributes.get("email");
        } else if ("KAKAO".equals(provider)) {
            providerId = String.valueOf(attributes.get("id"));
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = (String) kakaoAccount.getOrDefault("email", providerId + "@kakao.local");
        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자: " + registrationId);
        }

        final String finalProviderId = providerId;
        final String finalEmail = email;

        User user = userRepository.findByProviderAndProviderId(provider, finalProviderId)
                .orElseGet(() -> {
                    String username = provider.toLowerCase() + "_" + finalProviderId;
                    User newUser = User.builder()
                                .username(username)
                                .password(null)
                                .role("ROLE_USER")
                                .email(finalEmail)
                                .provider(provider)
                                .providerId(finalProviderId)
                                .build();
                    return userRepository.findByUsername(username)
                            .orElseGet(() -> Objects.requireNonNull(userRepository.save(newUser)));
                });

        user.updateOAuthInfo(finalEmail);

        return oAuth2User;
    }
}
