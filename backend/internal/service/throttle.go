// ============================================================================
// File: backend/internal/service/throttle.go
// Purpose: In-memory thread-safe rate-limiter for failed authentication attempts.
// ============================================================================

package service

import (
	"sync"
	"time"
)

type LoginThrottler struct {
	mu          sync.Mutex
	attempts    map[string][]time.Time
	maxAttempts int
	window      time.Duration
}

func NewLoginThrottler(maxAttempts int, window time.Duration) *LoginThrottler {
	return &LoginThrottler{
		attempts:    make(map[string][]time.Time),
		maxAttempts: maxAttempts,
		window:      window,
	}
}

// IsBlocked checks if a key (username or IP) has exceeded failed attempt limits
func (t *LoginThrottler) IsBlocked(key string) bool {
	t.mu.Lock()
	defer t.mu.Unlock()

	times, exists := t.attempts[key]
	if !exists {
		return false
	}

	cutoff := time.Now().Add(-t.window)
	var validTimes []time.Time
	for _, tm := range times {
		if tm.After(cutoff) {
			validTimes = append(validTimes, tm)
		}
	}
	t.attempts[key] = validTimes

	return len(validTimes) >= t.maxAttempts
}

// RecordFailure notes a failed authentication attempt
func (t *LoginThrottler) RecordFailure(key string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	cutoff := time.Now().Add(-t.window)
	times := t.attempts[key]
	var validTimes []time.Time
	for _, tm := range times {
		if tm.After(cutoff) {
			validTimes = append(validTimes, tm)
		}
	}
	validTimes = append(validTimes, time.Now())
	t.attempts[key] = validTimes
}

// Reset clears failure tracking after a successful authentication
func (t *LoginThrottler) Reset(key string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.attempts, key)
}
