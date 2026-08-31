#include "ApiClient.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "../security/DeviceAuth.h"

OrderResult ApiClient::sendButtonEvent(
    const String &baseUrl,
    const String &deviceId,
    const String &deviceSecret,
    const String &eventType,
    uint8_t battery,
    int rssi
) {
  OrderResult res;
  res.success = false;

  HTTPClient http;
  String url = baseUrl + "/api/iot/events";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);

  // Build JSON body
  JsonDocument doc;
  String requestId = "esp_req_" + String(millis()) + "_" + DeviceAuth::generateNonce().substring(0, 6);
  doc["eventType"] = eventType;
  doc["requestId"] = requestId;
  doc["battery"] = battery;
  doc["rssi"] = rssi;

  String bodyString;
  serializeJson(doc, bodyString);

  // Generate Crypto HMAC headers
  String timestamp = String(millis()); // In production: SNTP epoch time
  String nonce = DeviceAuth::generateNonce();
  String signaturePayload = deviceId + ":" + timestamp + ":" + nonce + ":" + bodyString;
  String signature = DeviceAuth::calculateHmac(deviceSecret, signaturePayload);

  http.addHeader("x-device-id", deviceId);
  http.addHeader("x-timestamp", timestamp);
  http.addHeader("x-nonce", nonce);
  http.addHeader("x-signature", signature);

  Serial.printf("[API] POST %s (ReqId: %s)\n", url.c_str(), requestId.c_str());
  int httpCode = http.POST(bodyString);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[API] Response Code: %d\n", httpCode);

    JsonDocument resDoc;
    DeserializationError error = deserializeJson(resDoc, response);
    if (!error && resDoc["success"] == true) {
      res.success = true;
      res.orderNumber = resDoc["data"]["order"]["orderNumber"].as<String>();
      res.cancelWindowSeconds = resDoc["data"]["cancelWindowSeconds"] | 60;
    } else {
      res.errorMessage = resDoc["message"].as<String>();
    }
  } else {
    res.errorMessage = "HTTP connection failed: " + http.errorToString(httpCode);
  }

  http.end();
  return res;
}
