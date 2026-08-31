#ifndef DEVICE_AUTH_H
#define DEVICE_AUTH_H

#include <Arduino.h>

class DeviceAuth {
public:
  static String calculateHmac(const String &secret, const String &payload);
  static String generateNonce();
};

#endif
