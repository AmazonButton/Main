#include "DeviceAuth.h"
#include <mbedtls/md.h>

String DeviceAuth::calculateHmac(const String &secret, const String &payload) {
  byte hmacResult[32];

  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;

  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)secret.c_str(), secret.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  char hexString[65];
  for (int i = 0; i < 32; i++) {
    sprintf(&hexString[i * 2], "%02x", (unsigned int)hmacResult[i]);
  }
  hexString[64] = '\0';

  return String(hexString);
}

String DeviceAuth::generateNonce() {
  char nonce[33];
  for (int i = 0; i < 16; i++) {
    uint8_t byteVal = (uint8_t)(esp_random() & 0xFF);
    sprintf(&nonce[i * 2], "%02x", byteVal);
  }
  nonce[32] = '\0';
  return String(nonce);
}
