#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <Preferences.h>
#include "config.h"

class WiFiManager {
public:
  static bool connectStoredWiFi();
  static void saveCredentials(const String &ssid, const String &password);
  static bool hasCredentials();
  static void clearCredentials();
  static void startCaptivePortal(const String &apName);
  static void handleCaptivePortal();
  static void stopWiFi();
};

#endif
