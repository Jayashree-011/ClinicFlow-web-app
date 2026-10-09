package com.clinicflow.userservice.service;

import com.clinicflow.userservice.entity.User;
import com.clinicflow.userservice.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private UserService userService;

    // ─── findByUsername ──────────────────────────────────────────────────────

    @Test
    @DisplayName("findByUsername: returns user when username exists")
    void findByUsername_whenFound_returnsUser() {
        User user = buildUser(1L, "john.doe", User.UserRole.Patient, User.UserStatus.ACTIVE);
        when(userRepository.findByUsername("john.doe")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByUsername("john.doe");

        assertThat(result).isPresent().contains(user);
    }

    @Test
    @DisplayName("findByUsername: returns empty when username not found")
    void findByUsername_whenNotFound_returnsEmpty() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        Optional<User> result = userService.findByUsername("ghost");

        assertThat(result).isEmpty();
    }

    // ─── findByEmail ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("findByEmail: returns user when email exists")
    void findByEmail_whenFound_returnsUser() {
        User user = buildUser(1L, "alice", User.UserRole.Clinician, User.UserStatus.ACTIVE);
        user.setEmail("alice@clinic.com");
        when(userRepository.findByEmail("alice@clinic.com")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByEmail("alice@clinic.com");

        assertThat(result).isPresent();
    }

    // ─── existsByUsername ─────────────────────────────────────────────────────

    @Test
    @DisplayName("existsByUsername: returns true when username exists")
    void existsByUsername_whenExists_returnsTrue() {
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        assertThat(userService.existsByUsername("admin")).isTrue();
    }

    @Test
    @DisplayName("existsByUsername: returns false when username absent")
    void existsByUsername_whenAbsent_returnsFalse() {
        when(userRepository.existsByUsername("newUser")).thenReturn(false);
        assertThat(userService.existsByUsername("newUser")).isFalse();
    }

    // ─── findById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById: returns user when id exists")
    void findById_whenFound_returnsUser() {
        User user = buildUser(42L, "bob", User.UserRole.Patient, User.UserStatus.ACTIVE);
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        Optional<User> result = userService.findById(42L);

        assertThat(result).isPresent().contains(user);
    }

    @Test
    @DisplayName("findById: returns empty when id absent")
    void findById_whenAbsent_returnsEmpty() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThat(userService.findById(99L)).isEmpty();
    }

    // ─── findAll ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll: delegates to repository")
    void findAll_returnsAllUsers() {
        List<User> users = List.of(
                buildUser(1L, "alice", User.UserRole.Patient, User.UserStatus.ACTIVE),
                buildUser(2L, "bob", User.UserRole.Clinician, User.UserStatus.ACTIVE));
        when(userRepository.findAll()).thenReturn(users);

        List<User> result = userService.findAll();

        assertThat(result).hasSize(2);
    }

    // ─── save ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save: new user with unique username is saved successfully")
    void save_newUserUniqueUsername_succeeds() {
        User user = buildUser(null, "alice", User.UserRole.Patient, User.UserStatus.ACTIVE);
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        User result = userService.save(user);

        assertThat(result).isEqualTo(user);
        verify(userRepository).save(user);
    }

    @Test
    @DisplayName("save: new user with duplicate username throws IllegalArgumentException")
    void save_newUserDuplicateUsername_throwsIllegalArgument() {
        User user = buildUser(null, "alice", User.UserRole.Patient, User.UserStatus.ACTIVE);
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> userService.save(user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username is already taken");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("save: existing user update skips username uniqueness check")
    void save_existingUser_skipsUsernameCheck() {
        User user = buildUser(5L, "alice", User.UserRole.Patient, User.UserStatus.ACTIVE);
        when(userRepository.save(user)).thenReturn(user);

        userService.save(user);

        verify(userRepository, never()).existsByUsername(anyString());
        verify(userRepository).save(user);
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete: delegates to repository")
    void delete_delegatesToRepository() {
        User user = buildUser(1L, "alice", User.UserRole.Patient, User.UserStatus.ACTIVE);
        doNothing().when(userRepository).delete(user);

        userService.delete(user);

        verify(userRepository).delete(user);
    }

    // ─── suggestUsername ──────────────────────────────────────────────────────

    @Test
    @DisplayName("suggestUsername: returns base when not taken")
    void suggestUsername_whenBaseAvailable_returnsBase() {
        when(userRepository.existsByUsername("john.doe")).thenReturn(false);

        String result = userService.suggestUsername("john.doe");

        assertThat(result).isEqualTo("john.doe");
    }

    @Test
    @DisplayName("suggestUsername: appends '1' when base is taken")
    void suggestUsername_whenBaseTaken_appendsOneSuffix() {
        when(userRepository.existsByUsername("john.doe")).thenReturn(true);
        when(userRepository.existsByUsername("john.doe1")).thenReturn(false);

        String result = userService.suggestUsername("john.doe");

        assertThat(result).isEqualTo("john.doe1");
    }

    @Test
    @DisplayName("suggestUsername: increments suffix until free slot found")
    void suggestUsername_whenMultipleTaken_appendsIncrementalSuffix() {
        when(userRepository.existsByUsername("john.doe")).thenReturn(true);
        when(userRepository.existsByUsername("john.doe1")).thenReturn(true);
        when(userRepository.existsByUsername("john.doe2")).thenReturn(false);

        String result = userService.suggestUsername("john.doe");

        assertThat(result).isEqualTo("john.doe2");
    }

    // ─── createInactiveUser ───────────────────────────────────────────────────

    @Test
    @DisplayName("createInactiveUser: creates INACTIVE user when username is free")
    void createInactiveUser_whenUsernameFree_createsInactiveUser() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.findByEmail("alice@clinic.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ClinicFlow@2025")).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.createInactiveUser(
                "alice", "Alice Doe", "alice@clinic.com",
                "555-0001", User.UserRole.Patient, "ClinicFlow@2025");

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(User.UserStatus.INACTIVE);
        assertThat(result.getUsername()).isEqualTo("alice");
        assertThat(result.getFullName()).isEqualTo("Alice Doe");
        assertThat(result.getRole()).isEqualTo(User.UserRole.Patient);
    }

    @Test
    @DisplayName("createInactiveUser: returns null (idempotent) when username already exists")
    void createInactiveUser_whenUsernameExists_returnsNull() {
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        User result = userService.createInactiveUser(
                "alice", "Alice Doe", "alice@clinic.com",
                null, User.UserRole.Patient, "pass");

        assertThat(result).isNull();
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("createInactiveUser: uses auto-generated email when email conflicts")
    void createInactiveUser_whenEmailConflict_usesAutoEmail() {
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.findByEmail("alice@clinic.com"))
                .thenReturn(Optional.of(new User()));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.createInactiveUser(
                "alice", "Alice", "alice@clinic.com",
                null, User.UserRole.Patient, "pass");

        assertThat(result.getEmail()).endsWith("@auto.clinicflow.local");
    }

    @Test
    @DisplayName("createInactiveUser: sets empty string when phone is null")
    void createInactiveUser_whenPhoneNull_setsEmptyString() {
        when(userRepository.existsByUsername("bob")).thenReturn(false);
        when(userRepository.findByEmail("bob@clinic.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.createInactiveUser(
                "bob", "Bob", "bob@clinic.com",
                null, User.UserRole.Clinician, "pass");

        assertThat(result.getPhone()).isEqualTo("");
    }

    // ─── encodePassword / passwordsMatch ─────────────────────────────────────

    @Test
    @DisplayName("encodePassword: delegates to PasswordEncoder")
    void encodePassword_delegatesToEncoder() {
        when(passwordEncoder.encode("rawPass")).thenReturn("$2a$10$encoded");

        String encoded = userService.encodePassword("rawPass");

        assertThat(encoded).isEqualTo("$2a$10$encoded");
    }

    @Test
    @DisplayName("passwordsMatch: returns true when passwords match")
    void passwordsMatch_whenMatch_returnsTrue() {
        when(passwordEncoder.matches("raw", "encoded")).thenReturn(true);
        assertThat(userService.passwordsMatch("raw", "encoded")).isTrue();
    }

    @Test
    @DisplayName("passwordsMatch: returns false when passwords do not match")
    void passwordsMatch_whenMismatch_returnsFalse() {
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);
        assertThat(userService.passwordsMatch("wrong", "encoded")).isFalse();
    }

    // ─── helper ──────────────────────────────────────────────────────────────

    private User buildUser(Long id, String username, User.UserRole role, User.UserStatus status) {
        User u = new User();
        u.setUserId(id);
        u.setUsername(username);
        u.setFullName("Test User");
        u.setEmail(username + "@test.com");
        u.setPassword("encodedPass");
        u.setRole(role);
        u.setStatus(status);
        return u;
    }
}
