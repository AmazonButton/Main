#include "BuzzerManager.h"

void BuzzerManager::init() {
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
}

void BuzzerManager::beepBoot() {
  // 1 short 80ms beep
  digitalWrite(PIN_BUZZER, HIGH);
  delay(80);
  digitalWrite(PIN_BUZZER, LOW);
}

void BuzzerManager::beepSuccess() {
  // 2 crisp short beeps
  digitalWrite(PIN_BUZZER, HIGH);
  delay(60);
  digitalWrite(PIN_BUZZER, LOW);
  delay(60);
  digitalWrite(PIN_BUZZER, HIGH);
  delay(60);
  digitalWrite(PIN_BUZZER, LOW);
}

void BuzzerManager::beepError() {
  // 3 quick warning beeps
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(100);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < 2) delay(60);
  }
}

void BuzzerManager::beepCancel() {
  // 1 long 400ms cancel tone
  digitalWrite(PIN_BUZZER, HIGH);
  delay(350);
  digitalWrite(PIN_BUZZER, LOW);
}
