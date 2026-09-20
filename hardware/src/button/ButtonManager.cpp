#include "ButtonManager.h"

void ButtonManager::init() {
  pinMode(PIN_BUTTON, INPUT_PULLUP);
}

ButtonGesture ButtonManager::detectGesture() {
  if (digitalRead(PIN_BUTTON) == HIGH) {
    return GESTURE_NONE;
  }

  unsigned long pressStart = millis();

  // 1. Measure hold duration (non-blocking sampling)
  while (digitalRead(PIN_BUTTON) == LOW) {
    unsigned long heldMs = millis() - pressStart;

    if (heldMs >= HOLD_15S_FACTORY_RESET_MS) {
      // Held >= 15 seconds -> Factory Reset
      while (digitalRead(PIN_BUTTON) == LOW) delay(10);
      return GESTURE_HOLD_15S_FACTORY_RESET;
    }
    delay(10);
  }

  unsigned long totalHeldMs = millis() - pressStart;

  if (totalHeldMs >= HOLD_10S_PROVISION_MS) {
    // Held between 10s and 15s -> WiFi Provisioning Mode
    return GESTURE_HOLD_10S_PROVISION;
  }

  if (totalHeldMs >= HOLD_5S_ACTIVATE_MS) {
    // Held between 5s and 10s -> Wake / Activate Device
    return GESTURE_HOLD_5S_ACTIVATE;
  }

  if (totalHeldMs < DEBOUNCE_MS) {
    return GESTURE_NONE; // Electrical bounce noise
  }

  // 2. Button was released quickly (< 5s). Check for multi-presses (double click or 5-click pair)
  int clickCount = 1;
  unsigned long lastReleaseTime = millis();
  const unsigned long MULTI_CLICK_WINDOW_MS = 450; // max gap between taps

  while (millis() - lastReleaseTime < MULTI_CLICK_WINDOW_MS) {
    if (digitalRead(PIN_BUTTON) == LOW) {
      delay(DEBOUNCE_MS);
      if (digitalRead(PIN_BUTTON) == LOW) {
        clickCount++;
        // Wait until release
        while (digitalRead(PIN_BUTTON) == LOW) {
          delay(10);
        }
        lastReleaseTime = millis();

        if (clickCount >= 5) {
          return GESTURE_FIVE_CLICKS_PAIR;
        }
      }
    }
    delay(10);
  }

  if (clickCount == 2) {
    return GESTURE_DOUBLE_PRESS;
  }

  return GESTURE_SHORT_PRESS;
}
