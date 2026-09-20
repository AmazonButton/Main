import 'dart:async';
import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class OrderProvider extends ChangeNotifier {
  List<OrderModel> _orders = [];
  bool _loading = false;
  bool _refreshing = false;
  String? _errorMessage;

  StreamSubscription? _createdSub;
  StreamSubscription? _statusSub;
  StreamSubscription? _cancelledSub;

  List<OrderModel> get orders => _orders;
  bool get loading => _loading;
  bool get refreshing => _refreshing;
  String? get errorMessage => _errorMessage;

  OrderProvider() {
    _listenToSocketEvents();
  }

  void _listenToSocketEvents() {
    _createdSub = SocketService().onOrderCreated.listen((_) {
      fetchOrders(silent: true);
    });

    _statusSub = SocketService().onOrderStatusChanged.listen((_) {
      fetchOrders(silent: true);
    });

    _cancelledSub = SocketService().onOrderCancelled.listen((_) {
      fetchOrders(silent: true);
    });
  }

  Future<void> fetchOrders({bool silent = false, bool isRefresh = false}) async {
    if (isRefresh) {
      _refreshing = true;
    } else if (!silent) {
      _loading = true;
    }
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService().get('/orders');
      if (res.success && res.data != null) {
        final list = res.data is List ? res.data as List : [];
        _orders = list
            .map((item) => OrderModel.fromJson(Map<String, dynamic>.from(item)))
            .toList();
      } else {
        _errorMessage = res.message ?? 'Không thể tải lịch sử đơn hàng';
      }
    } catch (e) {
      _errorMessage = 'Lỗi kết nối: $e';
    } finally {
      _loading = false;
      _refreshing = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _createdSub?.cancel();
    _statusSub?.cancel();
    _cancelledSub?.cancel();
    super.dispose();
  }
}
