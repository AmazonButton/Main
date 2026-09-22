import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'api_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  String? _currentCustomerId;

  final _orderCreatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusChangedController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderCancelledController = StreamController<Map<String, dynamic>>.broadcast();
  final _buttonPressingController = StreamController<Map<String, dynamic>>.broadcast();
  final _buttonReleasedController = StreamController<Map<String, dynamic>>.broadcast();
  final _deviceHeartbeatController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionController = StreamController<bool>.broadcast();

  final _shoppingListUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _serviceRequestCreatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _serviceRequestUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _urgentAlertTriggeredController = StreamController<Map<String, dynamic>>.broadcast();
  final _deviceBehaviorUpdatedController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onOrderCreated => _orderCreatedController.stream;
  Stream<Map<String, dynamic>> get onOrderStatusChanged => _orderStatusChangedController.stream;
  Stream<Map<String, dynamic>> get onOrderCancelled => _orderCancelledController.stream;
  Stream<Map<String, dynamic>> get onButtonPressing => _buttonPressingController.stream;
  Stream<Map<String, dynamic>> get onButtonReleased => _buttonReleasedController.stream;
  Stream<Map<String, dynamic>> get onDeviceHeartbeat => _deviceHeartbeatController.stream;
  Stream<Map<String, dynamic>> get onShoppingListUpdated => _shoppingListUpdatedController.stream;
  Stream<Map<String, dynamic>> get onServiceRequestCreated => _serviceRequestCreatedController.stream;
  Stream<Map<String, dynamic>> get onServiceRequestUpdated => _serviceRequestUpdatedController.stream;
  Stream<Map<String, dynamic>> get onUrgentAlertTriggered => _urgentAlertTriggeredController.stream;
  Stream<Map<String, dynamic>> get onDeviceBehaviorUpdated => _deviceBehaviorUpdatedController.stream;
  Stream<bool> get onConnectionChange => _connectionController.stream;

  bool get isConnected => _socket?.connected ?? false;

  void initSocket() {
    final serverUrl = ApiService().baseUrl;

    if (_socket != null) {
      if (_socket!.connected) return;
      _socket!.disconnect();
      _socket = null;
    }

    try {
      _socket = IO.io(
        serverUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(1500)
            .build(),
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        debugPrint('⚡ [Flutter Socket.IO] Đã kết nối tới: $serverUrl');
        _connectionController.add(true);
        if (_currentCustomerId != null) {
          subscribeToCustomer(_currentCustomerId!);
        }
      });

      _socket!.onDisconnect((_) {
        debugPrint('❌ [Flutter Socket.IO] Mất kết nối tới server');
        _connectionController.add(false);
      });

      _socket!.onConnectError((err) {
        debugPrint('⚠️ [Flutter Socket.IO] Lỗi kết nối: $err');
        _connectionController.add(false);
      });

      _socket!.on('ORDER_CREATED', (data) {
        debugPrint('🔔 [Flutter Socket.IO] ORDER_CREATED: $data');
        if (data is Map) {
          _orderCreatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('ORDER_STATUS_CHANGED', (data) {
        debugPrint('🔔 [Flutter Socket.IO] ORDER_STATUS_CHANGED: $data');
        if (data is Map) {
          _orderStatusChangedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('ORDER_CANCELLED', (data) {
        debugPrint('🔔 [Flutter Socket.IO] ORDER_CANCELLED: $data');
        if (data is Map) {
          _orderCancelledController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('BUTTON_PRESSING', (data) {
        debugPrint('🔘 [Flutter Socket.IO] BUTTON_PRESSING: $data');
        if (data is Map) {
          _buttonPressingController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('BUTTON_RELEASED', (data) {
        debugPrint('🔘 [Flutter Socket.IO] BUTTON_RELEASED: $data');
        if (data is Map) {
          _buttonReleasedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('DEVICE_HEARTBEAT', (data) {
        debugPrint('💓 [Flutter Socket.IO] DEVICE_HEARTBEAT: $data');
        if (data is Map) {
          _deviceHeartbeatController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('SHOPPING_LIST_UPDATED', (data) {
        debugPrint('🛒 [Flutter Socket.IO] SHOPPING_LIST_UPDATED: $data');
        if (data is Map) {
          _shoppingListUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('SERVICE_REQUEST_CREATED', (data) {
        debugPrint('🛠️ [Flutter Socket.IO] SERVICE_REQUEST_CREATED: $data');
        if (data is Map) {
          _serviceRequestCreatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('SERVICE_REQUEST_UPDATED', (data) {
        debugPrint('🛠️ [Flutter Socket.IO] SERVICE_REQUEST_UPDATED: $data');
        if (data is Map) {
          _serviceRequestUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('URGENT_ALERT_TRIGGERED', (data) {
        debugPrint('🚨 [Flutter Socket.IO] URGENT_ALERT_TRIGGERED: $data');
        if (data is Map) {
          _urgentAlertTriggeredController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket!.on('DEVICE_BEHAVIOR_UPDATED', (data) {
        debugPrint('⚙️ [Flutter Socket.IO] DEVICE_BEHAVIOR_UPDATED: $data');
        if (data is Map) {
          _deviceBehaviorUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });
    } catch (e) {
      debugPrint('⚠️ [Flutter Socket.IO] Không thể khởi tạo socket: $e');
    }
  }

  void subscribeToCustomer(String customerId) {
    _currentCustomerId = customerId;
    if (_socket != null && _socket!.connected) {
      debugPrint('📡 Subscribing to customer channel: $customerId');
      _socket!.emit('subscribe:customer', customerId);
    }
  }

  void disconnect() {
    _currentCustomerId = null;
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _orderCreatedController.close();
    _orderStatusChangedController.close();
    _orderCancelledController.close();
    _buttonPressingController.close();
    _buttonReleasedController.close();
    _deviceHeartbeatController.close();
    _connectionController.close();
  }
}
