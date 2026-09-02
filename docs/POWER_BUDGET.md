# SMART ORDER BUTTON — POWER CONSUMPTION BUDGET & BATTERY LIFE CALCULATION

## 1. Operating Principle
The ESP32 physical button NEVER maintains a constant Wi-Fi association. The default, steady-state mode is **DEEP SLEEP**.
- All digital peripherals, CPU cores, Wi-Fi radio, and Bluetooth basebands are powered off.
- The RTC controller and ULP coprocessor monitor RTC GPIO 33.
- When pressed, the button pulls GPIO 33 to GND, triggering an ext0 wakeup.
- The ESP32 boots, establishes Wi-Fi, computes HMAC-SHA256, fires the HTTP POST, triggers LED/buzzer confirmation, and immediately powers down back to deep sleep.

---

## 2. Power Profile by State

| State | Typical Current | Duration per Event | Energy per Event |
|---|---|---|---|
| **Deep Sleep** (Quiescent) | $15\,\mu\text{A}$ ($0.015\,\text{mA}$) | 23.99 hours/day | $0.015\,\text{mA} \times 24\,\text{h} = 0.360\,\text{mAh/day}$ |
| **Boot & RTC Init** | $28\,\text{mA}$ | $0.08\,\text{s}$ ($80\,\text{ms}$) | $0.0006\,\text{mAh}$ |
| **Wi-Fi Association & Fast DHCP** | $110\,\text{mA}$ | $1.20\,\text{s}$ ($1200\,\text{ms}$) | $0.0366\,\text{mAh}$ |
| **HMAC Compute & HTTP POST** | $135\,\text{mA}$ | $0.80\,\text{s}$ ($800\,\text{ms}$) | $0.0300\,\text{mAh}$ |
| **LED & Buzzer Feedback** | $35\,\text{mA}$ | $1.00\,\text{s}$ ($1000\,\text{ms}$) | $0.0097\,\text{mAh}$ |
| **Radio Shutdown & Sleep Entry** | $25\,\text{mA}$ | $0.05\,\text{s}$ ($50\,\text{ms}$) | $0.0003\,\text{mAh}$ |
| **TOTAL ACTIVE CYCLE** | **$\approx 92\,\text{mA}$ average** | **$3.13\,\text{s}$ total** | **$\approx 0.077\,\text{mAh}$ per press** |

---

## 3. Daily Energy Calculation

Assuming a typical domestic reorder pattern of **1 press per day**:
$$\begin{aligned}
E_{\text{daily}} &= E_{\text{sleep}} + (N_{\text{press}} \times E_{\text{active}}) \\
&= (0.015\,\text{mA} \times 24\,\text{h}) + (1 \times 0.077\,\text{mAh}) \\
&= 0.360\,\text{mAh} + 0.077\,\text{mAh} \\
&= \mathbf{0.437\,\text{mAh / day}}
\end{aligned}$$

For a commercial scenario with **3 presses per day**:
$$E_{\text{daily}} = 0.360 + (3 \times 0.077) = \mathbf{0.591\,\text{mAh / day}}$$

---

## 4. Realistic Battery Life Estimation

Using a **LiPo 3.7V 1200mAh** rechargeable cell with an effective usable capacity derating factor of $85\%$ (accounting for temperature variations, low-voltage cutoff at 3.3V, and self-discharge):
$$\text{Usable Capacity} = 1200\,\text{mAh} \times 0.85 = \mathbf{1020\,\text{mAh}}$$

### Theoretical Lifespan:
$$\text{Days} = \frac{1020\,\text{mAh}}{0.437\,\text{mAh / day}} \approx 2334\,\text{days} \approx 6.4\,\text{years}$$

### Realistic Engineering Derating:
In real-world deployment, lithium batteries experience internal chemical self-discharge ($\approx 2 - 3\%$ per month) and occasional Wi-Fi retries if the home router is congested.
- **Estimated Real-world Runtime (1 press / day)**: **18 to 28 Months ($\approx 1.5 - 2.3$ Years)**
- **Estimated Real-world Runtime (3 presses / day)**: **12 to 18 Months ($\approx 1 - 1.5$ Years)**

> [!NOTE]
> Firmware battery ADC tracking alerts both the Store Dashboard and Customer App when cell capacity drops below $20\%$ ($3.55\text{V}$), allowing timely recharging via standard USB-C in under 90 minutes.
