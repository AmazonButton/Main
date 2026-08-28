#include "LedManager.h"

void LedManager::init() {
  pinMode(PIN_LED_BLUE, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  setColor(LED_OFF);
}

void LedManager::setColor(LedColor color) {
  // Common Cathode (HIGH = ON, LOW = OFF)
  switch (color) {
    case LED_BLUE:
      digitalWrite(PIN_LED_BLUE, HIGH);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      break;
    case LED_YELLOW:
      digitalWrite(PIN_LED_BLUE, LOW);
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, HIGH);
      break;
    case LED_GREEN:
      digitalWrite(PIN_LED_BLUE, LOW);
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, LOW);
      break;
    case LED_RED:
      digitalWrite(PIN_LED_BLUE, LOW);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      break;
    case LED_PURPLE:
      digitalWrite(PIN_LED_BLUE, HIGH);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, HIGH);
      break;
    case LED_WHITE:
      digitalWrite(PIN_LED_BLUE, HIGH);
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_RED, HIGH);
      break;
    case LED_OFF:
    default:
      digitalWrite(PIN_LED_BLUE, LOW);
      digitalWrite(PIN_LED_GREEN, LOW);
      digitalWrite(PIN_LED_RED, LOW);
      break;
  }
}

void LedManager::blink(LedColor color, int times, int intervalMs) {
  for (int i = 0; i < times; i++) {
    setColor(color);
    delay(intervalMs);
    setColor(LED_OFF);
    if (i < times - 1) delay(intervalMs);
  }
}
