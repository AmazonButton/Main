#include "BLEProvisioning.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "../wifi/WiFiManager.h"

static BLEServer *pServer = nullptr;
static BLECharacteristic *pStatusChar = nullptr;
static bool deviceConnected = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("[BLE] Mobile App connected via BLE 5!");
  }

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    Serial.println("[BLE] Mobile App disconnected.");
  }
};

class WiFiConfigCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue().c_str();
    if (value.length() > 0) {
      Serial.printf("[BLE] Received Wi-Fi Provisioning Packet (%d bytes)\n", value.length());
      // Expected format: "SSID:PASSWORD"
      int separatorIndex = value.indexOf(':');
      if (separatorIndex != -1) {
        String ssid = value.substring(0, separatorIndex);
        String pass = value.substring(separatorIndex + 1);
        WiFiManager::saveCredentials(ssid, pass);

        // Notify client status: 0x03 (SUCCESS)
        if (pStatusChar) {
          uint8_t status = 0x03;
          pStatusChar->setValue(&status, 1);
          pStatusChar->notify();
        }

        delay(1000);
        ESP.restart();
      }
    }
  }
};

void BLEProvisioning::start(const String &deviceName, const String &deviceId) {
  BLEDevice::init(deviceName.c_str());
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService *pService = pServer->createService(BLE_SERVICE_UUID);

  // 1. Info Characteristic
  BLECharacteristic *pInfoChar = pService->createCharacteristic(
      BLE_CHAR_INFO_UUID,
      BLECharacteristic::PROPERTY_READ
  );
  pInfoChar->setValue(deviceId.c_str());

  // 2. Wi-Fi Config Write Characteristic
  BLECharacteristic *pWiFiChar = pService->createCharacteristic(
      BLE_CHAR_WIFI_UUID,
      BLECharacteristic::PROPERTY_WRITE
  );
  pWiFiChar->setCallbacks(new WiFiConfigCallbacks());

  // 3. Provisioning Status Characteristic
  pStatusChar = pService->createCharacteristic(
      BLE_CHAR_STATUS_UUID,
      BLECharacteristic::PROPERTY_NOTIFY
  );
  pStatusChar->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(BLE_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.printf("[BLE] BLE 5 Advertising started: '%s'\n", deviceName.c_str());
}

void BLEProvisioning::stop() {
  BLEDevice::deinit(true);
  Serial.println("[BLE] BLE 5 Radio disabled to conserve battery.");
}

bool BLEProvisioning::isConnected() {
  return deviceConnected;
}
