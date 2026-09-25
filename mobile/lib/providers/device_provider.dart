import 'dart:async';
import 'package:flutter/material.dart';
import '../models/device_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class DeviceProvider extends ChangeNotifier {
  List<DeviceModel> _devices = [];
  bool _loading = false;
  bool _refreshing = false;
  String? _errorMessage;

  // 60-second cancel window banner state
  Map<String, dynamic>? _activeCancelOrder;
  int _secondsRemaining = 0;
  int _totalCancelSeconds = 60;
  Timer? _countdownTimer;

  bool _isSocketConnected = SocketService().isConnected;
  bool _isButtonPressed = false;
  String? _pressingDeviceName;

  StreamSubscription? _orderCreatedSub;
  StreamSubscription? _orderCancelledSub;
  StreamSubscription? _buttonPressingSub;
  StreamSubscription? _buttonReleasedSub;
  StreamSubscription? _deviceHeartbeatSub;
  StreamSubscription? _connectionSub;

  List<DeviceModel> get devices => _devices;
  bool get loading => _loading;
  bool get refreshing => _refreshing;
  String? get errorMessage => _errorMessage;

  Map<String, dynamic>? get activeCancelOrder => _activeCancelOrder;
  int get secondsRemaining => _secondsRemaining;
  int get totalCancelSeconds => _totalCancelSeconds;
  bool get hasActiveCancelWindow => _activeCancelOrder != null && _secondsRemaining > 0;
  bool get isSocketConnected => _isSocketConnected;
  bool get isButtonPressed => _isButtonPressed;
  String? get pressingDeviceName => _pressingDeviceName;

  DeviceProvider() {
    _listenToSocketEvents();
  }

  void _listenToSocketEvents() {
    _orderCreatedSub = SocketService().onOrderCreated.listen((data) {
      _isButtonPressed = false;
      if (data['order'] != null) {
        final windowSecs = data['cancelWindowSeconds'] is int
            ? data['cancelWindowSeconds']
            : (data['cancelWindowSeconds'] as num?)?.toInt() ?? 60;
        startCancelWindow(Map<String, dynamic>.from(data['order']), windowSecs);
      }
      fetchDevices(silent: true);
    });

    _orderCancelledSub = SocketService().onOrderCancelled.listen((_) {
      _countdownTimer?.cancel();
      _activeCancelOrder = null;
      _secondsRemaining = 0;
      _isButtonPressed = false;
      notifyListeners();
      fetchDevices(silent: true);
    });

    _buttonPressingSub = SocketService().onButtonPressing.listen((data) {
      _isButtonPressed = true;
      _pressingDeviceName = data['customName'] ?? 'Nút Bấm Thông Minh';
      notifyListeners();
    });

    _buttonReleasedSub = SocketService().onButtonReleased.listen((_) {
      _isButtonPressed = false;
      notifyListeners();
    });

    _deviceHeartbeatSub = SocketService().onDeviceHeartbeat.listen((_) {
      fetchDevices(silent: true);
    });

    _connectionSub = SocketService().onConnectionChange.listen((connected) {
      _isSocketConnected = connected;
      notifyListeners();
    });
  }

  void startCancelWindow(Map<String, dynamic> order, int seconds) {
    _countdownTimer?.cancel();
    _activeCancelOrder = order;
    _secondsRemaining = seconds;
    _totalCancelSeconds = seconds > 0 ? seconds : 60;
    notifyListeners();

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining <= 1) {
        timer.cancel();
        _activeCancelOrder = null;
        _secondsRemaining = 0;
        notifyListeners();
      } else {
        _secondsRemaining--;
        notifyListeners();
      }
    });
  }

  Future<void> fetchDevices({bool silent = false, bool isRefresh = false}) async {
    if (isRefresh) {
      _refreshing = true;
    } else if (!silent) {
      _loading = true;
    }
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService().get('/devices');
      if (res.success && res.data != null) {
        final list = res.data is List ? res.data as List : [];
        _devices = list
            .map((item) => DeviceModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      } else {
        _errorMessage = res.message ?? 'Không thể tải danh sách nút bấm';
      }
    } catch (e) {
      _errorMessage = 'Lỗi kết nối: $e';
    } finally {
      _loading = false;
      _refreshing = false;
      notifyListeners();
    }
  }

  Future<bool> quickReorder(String deviceId) async {
    try {
      final res = await ApiService().post('/orders/quick-reorder', {
        'deviceId': deviceId,
      });

      if (res.success && res.data != null) {
        final data = res.data is Map<String, dynamic> ? res.data : {};
        final order = data['order'] != null
            ? Map<String, dynamic>.from(data['order'])
            : null;
        final window = data['cancelWindowSeconds'] is int
            ? data['cancelWindowSeconds']
            : (data['cancelWindowSeconds'] as num?)?.toInt() ?? 60;

        if (order != null) {
          startCancelWindow(order, window);
        }
        await fetchDevices(silent: true);
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Lỗi đặt hàng nhanh: $e');
      return false;
    }
  }

  Future<bool> cancelActiveOrder([String? reason]) async {
    if (_activeCancelOrder == null) return false;
    final orderId = _activeCancelOrder!['id'];

    try {
      final res = await ApiService().post('/orders/$orderId/cancel', {
        'reason': reason ?? 'Khách bấm hủy trên ứng dụng trong 60 giây',
      });

      if (res.success) {
        _countdownTimer?.cancel();
        _activeCancelOrder = null;
        _secondsRemaining = 0;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Lỗi hủy đơn: $e');
      return false;
    }
  }

  Future<bool> changeWifi(String deviceId, [String? ssid, String? password]) async {
    try {
      final res = await ApiService().post('/devices/$deviceId/change-wifi', {
        if (ssid != null && ssid.isNotEmpty) 'ssid': ssid,
        if (password != null) 'password': password,
      });
      if (res.success) {
        await fetchDevices(silent: true);
      }
      return res.success;
    } catch (_) {
      return false;
    }
  }

  Future<String?> transferDevice(String deviceId) async {
    try {
      final res = await ApiService().post('/devices/$deviceId/transfer');
      if (res.success && res.data != null) {
        return res.data['qrPayload'];
      }
    } catch (_) {}
    return null;
  }

  Future<bool> simulatePress(String deviceId, {String eventType = 'SINGLE_PRESS'}) async {
    try {
      final res = await ApiService().post('/devices/$deviceId/simulate-press', {
        'eventType': eventType,
        'requestId': 'sim_${DateTime.now().millisecondsSinceEpoch}',
      });
      if (res.success) {
        await fetchDevices(silent: true);
      }
      return res.success;
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _orderCreatedSub?.cancel();
    _orderCancelledSub?.cancel();
    _buttonPressingSub?.cancel();
    _buttonReleasedSub?.cancel();
    _deviceHeartbeatSub?.cancel();
    _connectionSub?.cancel();
    super.dispose();
  }
}
