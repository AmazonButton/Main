import 'dart:async';
import 'package:flutter/material.dart';
import '../models/smart_supply_models.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class SmartSupplyProvider extends ChangeNotifier {
  HouseholdModel? _activeHousehold;
  List<HouseholdModel> _households = [];
  List<PredictionInsightModel> _predictions = [];
  List<SmartReminderModel> _reminders = [];
  List<ShoppingListItemModel> _shoppingItems = [];
  List<ServiceRequestModel> _serviceRequests = [];
  List<UrgentAlertModel> _urgentAlerts = [];

  bool _loading = false;
  String? _errorMessage;

  StreamSubscription? _shoppingSub;
  StreamSubscription? _serviceReqSub;
  StreamSubscription? _alertSub;

  HouseholdModel? get activeHousehold => _activeHousehold;
  List<HouseholdModel> get households => _households;
  List<PredictionInsightModel> get predictions => _predictions;
  List<SmartReminderModel> get reminders => _reminders;
  List<ShoppingListItemModel> get shoppingItems => _shoppingItems;
  List<ServiceRequestModel> get serviceRequests => _serviceRequests;
  List<UrgentAlertModel> get urgentAlerts => _urgentAlerts;
  bool get loading => _loading;
  String? get errorMessage => _errorMessage;

  SmartSupplyProvider() {
    _initSocketListeners();
  }

  void _initSocketListeners() {
    _shoppingSub = SocketService().onShoppingListUpdated.listen((data) {
      if (_activeHousehold != null) {
        fetchShoppingList(_activeHousehold!.id);
      }
    });

    _serviceReqSub = SocketService().onServiceRequestCreated.listen((data) {
      if (_activeHousehold != null) {
        fetchServiceRequests(_activeHousehold!.id);
      }
    });

    _alertSub = SocketService().onUrgentAlertTriggered.listen((data) {
      if (_activeHousehold != null) {
        fetchUrgentAlerts(_activeHousehold!.id);
      }
    });
  }

  Future<void> fetchAllHouseholdData() async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await ApiService().get('/households');
      if (res.success && res.data is List) {
        _households = (res.data as List)
            .map((h) => HouseholdModel.fromJson(h as Map<String, dynamic>))
            .toList();

        if (_households.isNotEmpty) {
          _activeHousehold = _households.first;
          await Future.wait([
            fetchPredictions(_activeHousehold!.id),
            fetchReminders(_activeHousehold!.id),
            fetchShoppingList(_activeHousehold!.id),
            fetchServiceRequests(_activeHousehold!.id),
            fetchUrgentAlerts(_activeHousehold!.id),
          ]);
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void switchHousehold(HouseholdModel household) {
    _activeHousehold = household;
    notifyListeners();
    fetchPredictions(household.id);
    fetchReminders(household.id);
    fetchShoppingList(household.id);
    fetchServiceRequests(household.id);
    fetchUrgentAlerts(household.id);
  }

  Future<void> fetchPredictions(String householdId) async {
    try {
      final res = await ApiService().get('/prediction/household/$householdId');
      if (res.success && res.data is List) {
        _predictions = (res.data as List)
            .map((p) => PredictionInsightModel.fromJson(p as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> fetchReminders(String householdId) async {
    try {
      final res = await ApiService().get('/reminders/household/$householdId');
      if (res.success && res.data is List) {
        _reminders = (res.data as List)
            .map((r) => SmartReminderModel.fromJson(r as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> fetchShoppingList(String householdId) async {
    try {
      final res = await ApiService().get('/shopping-list/household/$householdId');
      if (res.success && res.data is Map<String, dynamic>) {
        final items = (res.data['items'] as List<dynamic>?)
                ?.map((i) => ShoppingListItemModel.fromJson(i as Map<String, dynamic>))
                .toList() ??
            [];
        _shoppingItems = items;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> fetchServiceRequests(String householdId) async {
    try {
      final res = await ApiService().get('/service-requests/household/$householdId');
      if (res.success && res.data is List) {
        _serviceRequests = (res.data as List)
            .map((s) => ServiceRequestModel.fromJson(s as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> fetchUrgentAlerts(String householdId) async {
    try {
      final res = await ApiService().get('/service-requests/household/$householdId/alerts');
      if (res.success && res.data is List) {
        _urgentAlerts = (res.data as List)
            .map((a) => UrgentAlertModel.fromJson(a as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> snoozeReminder(String reminderId, [int days = 3]) async {
    final res = await ApiService().put('/reminders/$reminderId/snooze', {'days': days});
    if (res.success && _activeHousehold != null) {
      await fetchReminders(_activeHousehold!.id);
      return true;
    }
    return false;
  }

  Future<bool> dismissReminder(String reminderId) async {
    final res = await ApiService().put('/reminders/$reminderId/dismiss');
    if (res.success && _activeHousehold != null) {
      await fetchReminders(_activeHousehold!.id);
      return true;
    }
    return false;
  }

  Future<bool> convertReminderToList(String reminderId) async {
    final res = await ApiService().post('/reminders/$reminderId/convert-to-list');
    if (res.success && _activeHousehold != null) {
      await fetchReminders(_activeHousehold!.id);
      await fetchShoppingList(_activeHousehold!.id);
      return true;
    }
    return false;
  }

  Future<bool> toggleShoppingItem(String itemId, bool isChecked) async {
    // Optimistic update
    final index = _shoppingItems.indexWhere((i) => i.id == itemId);
    if (index != -1) {
      _shoppingItems[index] = ShoppingListItemModel(
        id: _shoppingItems[index].id,
        productId: _shoppingItems[index].productId,
        product: _shoppingItems[index].product,
        quantity: _shoppingItems[index].quantity,
        isChecked: isChecked,
        addedFromDeviceId: _shoppingItems[index].addedFromDeviceId,
      );
      notifyListeners();
    }

    final res = await ApiService().put('/shopping-list/items/$itemId/toggle', {'isChecked': isChecked});
    return res.success;
  }

  Future<bool> removeShoppingItem(String itemId) async {
    _shoppingItems.removeWhere((i) => i.id == itemId);
    notifyListeners();
    final res = await ApiService().delete('/shopping-list/items/$itemId');
    return res.success;
  }

  Future<ApiResponse> batchOrderShoppingList() async {
    if (_activeHousehold == null) {
      return ApiResponse(success: false, message: 'Chưa chọn căn hộ', statusCode: 400);
    }
    final res = await ApiService().post('/shopping-list/household/${_activeHousehold!.id}/batch-order');
    if (res.success) {
      await fetchShoppingList(_activeHousehold!.id);
    }
    return res;
  }

  Future<ApiResponse> updateDeviceBehavior({
    required String deviceId,
    required String singlePressAction,
    required String doublePressAction,
    required String hold3sAction,
    required String hold5sAction,
    String? customName,
    int? defaultQuantity,
  }) async {
    final res = await ApiService().put('/devices/$deviceId/behavior', {
      'singlePressAction': singlePressAction,
      'doublePressAction': doublePressAction,
      'hold3sAction': hold3sAction,
      'hold5sAction': hold5sAction,
      'customName': customName,
      'defaultQuantity': defaultQuantity,
    });
    return res;
  }

  Future<ApiResponse> createServiceRequest({
    required String category,
    required String description,
    String priority = 'NORMAL',
    String? deviceId,
  }) async {
    if (_activeHousehold == null) {
      return ApiResponse(success: false, message: 'Chưa chọn căn hộ', statusCode: 400);
    }
    final res = await ApiService().post('/service-requests/household/${_activeHousehold!.id}', {
      'category': category,
      'description': description,
      'priority': priority,
      'deviceId': deviceId,
    });
    if (res.success) {
      await fetchServiceRequests(_activeHousehold!.id);
    }
    return res;
  }

  @override
  void dispose() {
    _shoppingSub?.cancel();
    _serviceReqSub?.cancel();
    _alertSub?.cancel();
    super.dispose();
  }
}
