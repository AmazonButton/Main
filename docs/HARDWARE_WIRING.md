# SMART ORDER BUTTON — HARDWARE WIRING & SCHEMATIC SPECIFICATION

## 1. Overview
The Smart Order Button hardware is designed for **ultra-low power consumption** and **maximum battery longevity**. The device operates primarily in ESP32 **Deep Sleep mode (~15µA)** and only wakes up when the physical button generates a hardware interrupt on an RTC-capable GPIO pin.

---

## 2. Bill of Materials (BOM)

| Component | Quantity | Value / Specification | Role in Circuit |
|---|---|---|---|
| **MCU Board** | 1 | ESP32-WROOM-32E / ESP32-C3 | Wi-Fi 802.11b/g/n, BLE 5, Dual Core / RISC-V, RTC Controller |
| **Battery** | 1 | LiPo 3.7V 1200mAh (or 18650 2600mAh) | Main power source |
| **Charger & Protection Module** | 1 | TP4056 with DW01A + FS8205A | 1A Lithium charge, over-charge, over-discharge & short circuit cut-off |
| **Low-Dropout Voltage Regulator (LDO)** | 1 | ME6211C33 / XC6206 (3.3V, SOT-23) | Ultra-low quiescent current ($I_q < 1.0\mu A$) stepping 3.7V - 4.2V to 3.3V |
| **Tactile Push Button** | 1 | SPST Momentary 12x12x7.3mm | Main customer interaction & RTC Wakeup switch |
| **Status RGB LED** | 1 | 5mm Common Cathode (R/G/B) | Visual feedback (Blue, Yellow, Green, Red, Purple) |
| **Current Limiting Resistors** | 3 | $330\,\Omega$ ($1/4\text{W}$, 5%) | Connected in series with RGB LED anodes |
| **Voltage Divider Resistors** | 2 | $100\,\text{k}\Omega$ (1% precision) | Step battery voltage down (1:2 ratio) to ESP32 ADC safe range |
| **Piezo Buzzer (Optional)** | 1 | 3V Active Buzzer / Piezo | Audio feedback on boot, success, error, cancel |
| **Enclosure** | 1 | 3D Printed Polycarbonate/ABS | Ergonomic desktop/wall puck with rubberized button cap |

---

## 3. ESP32 Pin Assignment Table

> [!IMPORTANT]
> Wake-up from Deep Sleep via `esp_sleep_enable_ext0_wakeup()` requires an **RTC GPIO** pin. In our design, **GPIO 33 (RTC_GPIO8)** is selected because it has RTC pull-up capability and does not conflict with boot strapping pins (GPIO 0, 2, 12, 15).

| Pin Name | ESP32 GPIO | Function | Connection Details |
|---|---|---|---|
| **Button Input** | `GPIO 33` | RTC Wake / Debounce Interrupt | Connected to one side of Tactile Switch; other side to `GND`. Configured with RTC internal pull-up. Active LOW. |
| **LED Blue** | `GPIO 25` | Wi-Fi Connecting / Boot | GPIO 25 $\to$ $330\,\Omega$ resistor $\to$ Blue Anode. Cathode to `GND`. |
| **LED Green** | `GPIO 26` | Order Confirmed Success | GPIO 26 $\to$ $330\,\Omega$ resistor $\to$ Green Anode. Cathode to `GND`. |
| **LED Red** | `GPIO 27` | Error / Order Cancelled | GPIO 27 $\to$ $330\,\Omega$ resistor $\to$ Red Anode. Cathode to `GND`. |
| **Buzzer** | `GPIO 14` | Audio Tones | GPIO 14 $\to$ Buzzer (+) pin. Buzzer (-) to `GND`. |
| **Battery ADC** | `GPIO 34` | LiPo Voltage Monitoring | Midpoint of $100\,\text{k}\Omega$ / $100\,\text{k}\Omega$ voltage divider between `VBAT` and `GND`. (ADC1_CH6). |

---

## 4. Electrical Block Diagram

```
[ LiPo Battery 3.7V ]
         |
         v
[ TP4056 + DW01A Protection ] ---> (USB-C 5V Input for Charging)
         |
      (VBAT: 3.3V - 4.2V)
         |
         +----------------------------+
         |                            |
         v                            v
[ ME6211 Ultra-Low Iq LDO ]    [ 100k / 100k Voltage Divider ]
         |                                    |
     (3.3V Rail)                              v
         |                             (GPIO 34 / ADC1)
         +-------------------+-------------------+-------------------+
         |                   |                   |                   |
         v                   v                   v                   v
     [ ESP32 VDD ]     [ RGB LED Pins ]    [ Tactile Button ]   [ Buzzer ]
     (VDD3P3 / 3.3V)   (GPIO 25, 26, 27)    (GPIO 33 -> GND)     (GPIO 14)
```

---

## 5. Lithium Battery Safety Rules

> [!CAUTION]
> Lithium-ion and Lithium-polymer batteries store high energy density.
> 1. **Protection Circuit Mandatory**: Always use a battery with an integrated PCM (Protection Circuit Module) or a TP4056 board featuring the **DW01A + FS8205A** dual-MOSFET protection IC. This cuts off power if voltage drops below $2.4\text{V}$ (preventing cell damage) or rises above $4.25\text{V}$ (preventing overcharging).
> 2. **Never connect raw battery voltage directly to ESP32 GPIOs**: LiPo max voltage is $4.2\text{V}$, while ESP32 GPIO absolute maximum input is $3.6\text{V}$. The $100\,\text{k}\Omega / 100\,\text{k}\Omega$ divider guarantees that $4.2\text{V}$ is safely scaled down to $2.1\text{V}$, well inside the ADC input ceiling.
