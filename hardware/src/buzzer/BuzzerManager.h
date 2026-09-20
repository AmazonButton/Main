#ifndef BUZZER_MANAGER_H
#define BUZZER_MANAGER_H

#include <Arduino.h>
#include "config.h"

class BuzzerManager {
public:
  static void init();
  static void beepBoot();
  static void beepSuccess();
  static void beepError();
  static void beepCancel();
};

#endif
