# SMART ORDER BUTTON — API & WEBSOCKET SPECIFICATION

## Base URLs
- **REST API**: `http://localhost:5000/api`
- **WebSocket (Socket.io)**: `http://localhost:5000`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
- **Body**: `{ email, password, fullName, phone, role, storeName, address }`
- **Response**:
  - For `STORE_OWNER`: `{ success: true, code: "STORE_REGISTRATION_PENDING", message: "..." }`
  - For `CUSTOMER`: `{ success: true, data: { token, user } }`

### `POST /api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ success: true, data: { token, user } }`

### `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ success: true, data: { id, email, fullName, role, store, customerProfile } }`

---

## 2. IoT Edge Ingestion Endpoints (`/api/iot`)

### `POST /api/iot/events`
- **Headers**:
  - `x-device-id`: Unique device identifier (e.g. `BTN-8829-WTR`)
  - `x-timestamp`: Epoch milliseconds
  - `x-nonce`: 32-character random hex string
  - `x-signature`: HMAC-SHA256 hex digest
- **Body**:
  ```json
  {
    "eventType": "SINGLE_PRESS",
    "requestId": "btn_req_1725200000_a1b2",
    "battery": 94,
    "rssi": -55
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "code": "ORDER_CREATED",
    "message": "Đơn hàng mới đã được tạo và chuyển tới cửa hàng!",
    "data": {
      "order": {
        "id": "uuid",
        "orderNumber": "ORD-20260902-0041",
        "totalAmount": 68000,
        "status": "PENDING"
      },
      "isDuplicate": false,
      "cancelWindowSeconds": 60
    }
  }
  ```

### `POST /api/iot/telemetry`
- **Headers**: HMAC-SHA256 headers
- **Body**: `{ battery, voltageMv, rssi, bootReason, wakeDurationMs, firmwareVersion }`

---

## 3. Orders Endpoints (`/api/orders`)

- `GET /api/orders`: List orders filtered by store or customer.
- `GET /api/orders/:id`: Detailed order breakdown with items and timeline.
- `POST /api/orders/quick-reorder`: Mobile app 1-tap reorder trigger.
- `PATCH /api/orders/:id/status`: Transition status (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `COMPLETED`).
- `POST /api/orders/:id/cancel`: Cancel order within cancel window and rollback reserved stock.

---

## 4. Devices Endpoints (`/api/devices`)

- `GET /api/devices`: List devices.
- `POST /api/devices/claim`: Claim device via `deviceId` and `claimCode`.
- `POST /api/devices/:id/assign`: Bind customer profile and product configuration.
- `PUT /api/devices/:id/config`: Update quantity, product, custom name.
- `PATCH /api/devices/:id/status`: Enable or disable button.

---

## 5. Realtime WebSocket Events (Socket.io)

### Rooms:
- `store_{storeId}`: Subscribed by Store Dashboard.
- `customer_{customerId}`: Subscribed by Customer Mobile App.

### Events Dispatched:
- `ORDER_CREATED`: Emitted to store room and customer room upon physical button press.
- `ORDER_STATUS_CHANGED`: Emitted when order status advances.
- `ORDER_CANCELLED`: Emitted when customer cancels order.
