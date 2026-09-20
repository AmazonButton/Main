import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String? _token;
  bool _loading = true;
  String? _errorMessage;

  UserModel? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null && _token != null;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    loadSession();
  }

  Future<void> loadSession() async {
    _loading = true;
    notifyListeners();

    try {
      await ApiService().init();
      final prefs = await SharedPreferences.getInstance();
      final savedToken = prefs.getString('smart_order_token');
      final savedUserJson = prefs.getString('smart_order_user');

      if (savedToken != null && savedUserJson != null) {
        _token = savedToken;
        _user = UserModel.fromJson(jsonDecode(savedUserJson));
        SocketService().initSocket();
        if (_user?.customerProfileId != null) {
          SocketService().subscribeToCustomer(_user!.customerProfileId!);
        }
      } else {
        // Tự động kết nối tài khoản khách hàng mặc định (An) để người dùng vào thẳng app
        // không bị chặn bởi màn hình đăng nhập!
        await autoLoginDefaultCustomer();
      }
    } catch (e) {
      debugPrint('Lỗi tải phiên đăng nhập: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> autoLoginDefaultCustomer() async {
    return login('customer@smartorder.local', 'Password123!', isSilent: true);
  }

  Future<bool> login(String email, String password, {bool isSilent = false}) async {
    _errorMessage = null;
    if (!isSilent) {
      _loading = true;
      notifyListeners();
    }

    try {
      final res = await ApiService().post('/auth/login', {
        'email': email.trim(),
        'password': password,
      });

      if (res.success && res.data != null) {
        final data = res.data is Map<String, dynamic> ? res.data : {};
        _token = data['token'];
        _user = UserModel.fromJson(data['user'] ?? {});

        final prefs = await SharedPreferences.getInstance();
        if (_token != null) {
          await prefs.setString('smart_order_token', _token!);
        }
        if (_user != null) {
          await prefs.setString('smart_order_user', jsonEncode(_user!.toJson()));
        }

        SocketService().initSocket();
        if (_user?.customerProfileId != null) {
          SocketService().subscribeToCustomer(_user!.customerProfileId!);
        }

        _loading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = res.message ?? 'Email hoặc mật khẩu không chính xác';
        _loading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Lỗi kết nối máy chủ: $e';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    SocketService().disconnect();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('smart_order_token');
    await prefs.remove('smart_order_user');

    notifyListeners();
  }

  Future<void> updateServerUrl(String newUrl) async {
    await ApiService().setBaseUrl(newUrl);
    SocketService().disconnect();
    SocketService().initSocket();
    if (_user?.customerProfileId != null) {
      SocketService().subscribeToCustomer(_user!.customerProfileId!);
    }
    notifyListeners();
  }
}
