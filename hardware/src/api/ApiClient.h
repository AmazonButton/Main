#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>

struct OrderResult {
  bool success;
  String orderNumber;
  int cancelWindowSeconds;
  String errorMessage;
};

class ApiClient {
public:
  static OrderResult sendButtonEvent(
      const String &baseUrl,
      const String &deviceId,
      const String &deviceSecret,
      const String &eventType,
      uint8_t battery,
      int rssi
  );
};

#endif
