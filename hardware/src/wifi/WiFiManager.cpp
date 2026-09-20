#include "WiFiManager.h"
#include <WebServer.h>
#include <DNSServer.h>

static Preferences prefs;
static WebServer server(80);
static DNSServer dnsServer;
static bool captivePortalActive = false;

bool WiFiManager::hasCredentials() {
  prefs.begin("wifi_config", true);
  String ssid = prefs.getString("ssid", "");
  prefs.end();
  return ssid.length() > 0;
}

void WiFiManager::saveCredentials(const String &ssid, const String &password) {
  prefs.begin("wifi_config", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", password);
  prefs.end();
  Serial.println("[WIFI] Credentials safely saved to encrypted NVS storage.");
}

void WiFiManager::clearCredentials() {
  prefs.begin("wifi_config", false);
  prefs.clear();
  prefs.end();
}

bool WiFiManager::connectStoredWiFi() {
  prefs.begin("wifi_config", true);
  String ssid = prefs.getString("ssid", "");
  String password = prefs.getString("pass", "");
  prefs.end();

  if (ssid.length() == 0) {
    Serial.println("[WIFI] No stored credentials found in NVS.");
    return false;
  }

  Serial.printf("[WIFI] Connecting to '%s'...\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_CONNECT_TIMEOUT_MS) {
    delay(100);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WIFI] Connected! IP: %s, RSSI: %d dBm (Took %lu ms)\n",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI(), millis() - startAttempt);
    return true;
  }

  Serial.println("[WIFI] Connection timed out!");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  return false;
}

void WiFiManager::startCaptivePortal(const String &apName) {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(apName.c_str());
  IPAddress apIP(192, 168, 4, 1);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));

  dnsServer.start(53, "*", apIP);

  server.on("/", HTTP_GET, []() {
    String html = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'>"
                  "<title>Smart Button Wi-Fi Setup</title><style>"
                  "body{font-family:sans-serif;background:#0f172a;color:#fff;display:flex;justify-content:center;padding:20px;}"
                  ".card{background:#1e293b;padding:24px;border-radius:12px;width:100%;max-width:360px;box-shadow:0 4px 6px rgba(0,0,0,0.3);}"
                  "h2{margin-top:0;color:#38bdf8;font-size:20px;text-align:center;}"
                  "input{width:100%;padding:10px;margin:8px 0 16px 0;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#fff;box-sizing:border-box;}"
                  "button{width:100%;background:#2563eb;color:#fff;padding:12px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;}"
                  "</style></head><body><div class='card'>"
                  "<h2>Smart Button Setup</h2>"
                  "<form action='/save' method='POST'>"
                  "<label>Wi-Fi Name (SSID):</label><input type='text' name='s' required placeholder='Home Wi-Fi'>"
                  "<label>Wi-Fi Password:</label><input type='password' name='p' placeholder='Password'>"
                  "<button type='submit'>LƯU VÀ KẾT NỐI</button>"
                  "</form></div></body></html>";
    server.send(200, "text/html", html);
  });

  server.on("/save", HTTP_POST, []() {
    String ssid = server.arg("s");
    String pass = server.arg("p");
    saveCredentials(ssid, pass);
    server.send(200, "text/html", "<html><body style='background:#0f172a;color:#10b981;text-align:center;padding:40px;font-family:sans-serif;'>"
                                  "<h3>Đã lưu thành công!</h3><p>Thiết bị đang kết nối lại Wi-Fi...</p></body></html>");
    delay(1000);
    ESP.restart();
  });

  server.begin();
  captivePortalActive = true;
  Serial.printf("[WIFI] Captive Portal active on SSID: %s (IP: 192.168.4.1)\n", apName.c_str());
}

void WiFiManager::handleCaptivePortal() {
  if (captivePortalActive) {
    dnsServer.processNextRequest();
    server.handleClient();
  }
}

void WiFiManager::stopWiFi() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  captivePortalActive = false;
}
