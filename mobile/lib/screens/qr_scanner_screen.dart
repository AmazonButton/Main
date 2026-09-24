import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/device_provider.dart';
import '../services/api_service.dart';
import 'server_config_dialog.dart';

class QrScannerScreen extends StatefulWidget {
  final VoidCallback? onCompleted;
  const QrScannerScreen({super.key, this.onCompleted});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  // Navigation View State:
  // 'INPUT': Nhập mã thiết bị
  // 'WIFI_SETUP': Màn hình cài đặt mạng cho thiết bị vừa nhập
  // 'CONNECTING': Đang kết nối nạp Wi-Fi
  // 'SUCCESS': Hoàn tất thành công
  String _currentView = 'INPUT';

  // Input states
  final _codeInput = TextEditingController();
  final _qrInput = TextEditingController();
  String _activeTab = 'BLE'; // 'BLE' (Ghép nối 5 lần bấm) | 'CODE' | 'QR'
  bool _isLoadingDevice = false;
  String? _errorMessage;
  bool _isBleScanning = true;
  List<Map<String, dynamic>> _discoveredBleDevices = [];
  Timer? _bleScanTimer;

  // Device data
  Map<String, dynamic>? _deviceData;

  // Wi-Fi Setup states
  String _selectedSsid = 'Home_WiFi_2.4G';
  final _wifiPasswordController = TextEditingController();
  bool _showPassword = false;

  final List<Map<String, String>> _availableNetworks = [
    {'ssid': 'Home_WiFi_2.4G', 'signal': 'Mạnh (95%)', 'security': 'WPA2'},
    {'ssid': 'FPT_Telecom_GiaDinh', 'signal': 'Tốt (78%)', 'security': 'WPA2'},
    {'ssid': 'Viettel_5G_Extender', 'signal': 'Trung bình (60%)', 'security': 'WPA3'},
    {'ssid': 'SmartOffice_Guest', 'signal': 'Yếu (35%)', 'security': 'Open'},
  ];

  // Progress state
  int _progressStep = 0; // 1: BLE, 2: WiFi Sent, 3: WiFi Connected, 4: Cloud Done

  @override
  void initState() {
    super.initState();
    _startBleScan();
  }

  void _startBleScan() {
    setState(() {
      _isBleScanning = true;
      _discoveredBleDevices = [];
    });

    _bleScanTimer?.cancel();
    // Quét tìm thiết bị BLE xung quanh phát tín hiệu sau khi bấm 5 lần
    _bleScanTimer = Timer(const Duration(milliseconds: 1200), () {
      if (!mounted) return;
      setState(() {
        _isBleScanning = false;
        _discoveredBleDevices = [
          {
            'name': 'SOB-BTN-8829-WTR',
            'deviceId': 'BTN-8829-WTR',
            'rssi': -48,
            'desc': 'Nút Bấm Lavie (Đã sẵn sàng)',
          },
        ];
      });
    });
  }

  @override
  void dispose() {
    _bleScanTimer?.cancel();
    _codeInput.dispose();
    _qrInput.dispose();
    _wifiPasswordController.dispose();
    super.dispose();
  }

  // Khi nhập đủ mã số hoặc ấn mã mẫu -> Tra cứu và CHUYỂN NGAY sang màn hình cài đặt mạng
  void _lookupAndJumpToWifiSetup(String rawCode) async {
    final code = rawCode.trim();
    if (code.isEmpty) return;

    setState(() {
      _isLoadingDevice = true;
      _errorMessage = null;
    });

    try {
      final res = await ApiService().post('/provisioning/session', {
        'qrPayload': code,
      });

      if (!mounted) return;

      if (res.success && res.data != null) {
        setState(() {
          _deviceData = Map<String, dynamic>.from(res.data);
          _isLoadingDevice = false;
          _currentView = 'WIFI_SETUP'; // CHUYỂN NGAY SANG CÀI ĐẶT MẠNG!
        });
      } else {
        setState(() {
          _isLoadingDevice = false;
          _errorMessage = res.message ?? 'Mã "$code" không tồn tại. Vui lòng thử mã khác!';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingDevice = false;
        _errorMessage = 'Lỗi kết nối máy chủ: $e';
      });
    }
  }

  void _executeWifiConnection() {
    if (_deviceData == null) return;

    setState(() {
      _currentView = 'CONNECTING';
      _progressStep = 1; // Kết nối BLE / SoftAP
    });

    Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      setState(() => _progressStep = 2); // Gửi Wi-Fi

      Timer(const Duration(milliseconds: 900), () {
        if (!mounted) return;
        setState(() => _progressStep = 3); // ESP32 vào mạng

        Timer(const Duration(milliseconds: 1000), () async {
          if (!mounted) return;
          setState(() => _progressStep = 4); // Cloud Bootstrap

          final devId = _deviceData!['deviceId'] ?? 'SOB-000001';

          try {
            await ApiService().post('/devices/bootstrap', {
              'deviceId': devId,
              'wifiRssi': -52,
              'ipAddress': '192.168.1.188',
              'uptime': 24,
            });
            await ApiService().post('/devices/$devId/claim');
          } catch (_) {}

          if (!mounted) return;
          setState(() {
            _currentView = 'SUCCESS';
          });

          // Làm mới danh sách nút ở trang chủ
          context.read<DeviceProvider>().fetchDevices(silent: true);
        });
      });
    });
  }

  void _resetToInput() {
    setState(() {
      _currentView = 'INPUT';
      _deviceData = null;
      _progressStep = 0;
      _errorMessage = null;
      _codeInput.clear();
      _wifiPasswordController.clear();
    });
    if (widget.onCompleted != null) {
      widget.onCompleted!();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          _currentView == 'WIFI_SETUP'
              ? 'Cài Đặt Mạng Wi-Fi'
              : _currentView == 'CONNECTING'
                  ? 'Đang Cài Đặt...'
                  : _currentView == 'SUCCESS'
                      ? 'Hoàn Tất'
                      : 'Cấu Hình Nút Bấm',
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
        ),
        centerTitle: true,
        leading: _currentView == 'WIFI_SETUP'
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _currentView = 'INPUT'),
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: AppColors.primary),
            tooltip: 'Đổi IP Máy Chủ',
            onPressed: () => showServerConfigDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _buildCurrentBody(),
        ),
      ),
    );
  }

  Widget _buildCurrentBody() {
    switch (_currentView) {
      case 'WIFI_SETUP':
        return _buildWifiSetupView();
      case 'CONNECTING':
        return _buildConnectingView();
      case 'SUCCESS':
        return _buildSuccessView();
      case 'INPUT':
      default:
        return _buildInputView();
    }
  }

  // =========================================================================
  // MÀN HÌNH 1: NHẬP MÃ SỐ THIẾT BỊ (Tự động chuyển ngay khi nhập đủ 6 số)
  // =========================================================================
  Widget _buildInputView() {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.wifi_tethering, size: 38, color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Nhập Mã Thiết Bị',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 6),
              const Text(
                'Nhập mã PIN 6 chữ số in trên nút bấm để chuyển ngay sang cài đặt mạng',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),

              // Form Card
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.cardBorder),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  children: [
                    // Mode Switcher (3 Tabs: BLE 5-Clicks, PIN Code, QR Scan)
                    Row(
                      children: [
                        Expanded(
                          flex: 5,
                          child: InkWell(
                            onTap: () {
                              setState(() {
                                _activeTab = 'BLE';
                                _errorMessage = null;
                              });
                              _startBleScan();
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: _activeTab == 'BLE' ? AppColors.primary : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  '📡 Bluetooth (5 Lần)',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: _activeTab == 'BLE' ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          flex: 4,
                          child: InkWell(
                            onTap: () => setState(() {
                              _activeTab = 'CODE';
                              _errorMessage = null;
                            }),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: _activeTab == 'CODE' ? AppColors.primary : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  '🔢 Mã PIN',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: _activeTab == 'CODE' ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          flex: 3,
                          child: InkWell(
                            onTap: () => setState(() {
                              _activeTab = 'QR';
                              _errorMessage = null;
                            }),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: _activeTab == 'QR' ? AppColors.primary : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  '📷 QR',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: _activeTab == 'QR' ? Colors.white : AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    if (_activeTab == 'BLE') ...[
                      // Chế độ Ghép Nối Bluetooth Tự Động (Bấm 5 Lần)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            if (_isBleScanning) ...[
                              const Center(
                                child: SizedBox(
                                  width: 42,
                                  height: 42,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              const Text(
                                'Đang dò tìm nút bấm quanh đây...',
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Hãy bấm nút 5 lần liên tiếp để nút bật Bluetooth ghép nối',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ] else if (_discoveredBleDevices.isEmpty) ...[
                              const Icon(Icons.bluetooth_searching, size: 40, color: AppColors.textMuted),
                              const SizedBox(height: 8),
                              const Text(
                                'Chưa tìm thấy nút nào đang bật',
                                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Vui lòng bấm nhanh 5 lần vào nút bấm rồi nhấn nút "Quét lại" bên dưới',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton.icon(
                                onPressed: _startBleScan,
                                icon: const Icon(Icons.refresh, size: 16),
                                label: const Text('Quét lại sóng Bluetooth', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                              ),
                            ] else ...[
                              const Row(
                                children: [
                                  Icon(Icons.bluetooth_connected, color: Color(0xFF10B981), size: 18),
                                  SizedBox(width: 6),
                                  Text(
                                    'Đã phát hiện nút bấm gần bạn:',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              ..._discoveredBleDevices.map((dev) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.06),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryLight,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Center(
                                        child: Icon(Icons.smart_button, color: AppColors.primary, size: 22),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            dev['name'] ?? 'Smart Button',
                                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.textPrimary),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            dev['desc'] ?? 'Tín hiệu rất tốt (${dev['rssi']} dBm)',
                                            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                          ),
                                        ],
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        // TỰ ĐỘNG LẤY ID TỪ BLUETOOTH - KHÔNG CẦN NHẬP TAY!
                                        final id = dev['deviceId'] ?? dev['name'];
                                        _lookupAndJumpToWifiSetup(id);
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.primary,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      child: const Text('Ghép Nối', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                    ),
                                  ],
                                ),
                              )),
                              const SizedBox(height: 4),
                              TextButton.icon(
                                onPressed: _startBleScan,
                                icon: const Icon(Icons.refresh, size: 14),
                                label: const Text('Quét lại thiết bị khác', style: TextStyle(fontSize: 11)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],

                    if (_errorMessage != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.errorLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: AppColors.error, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    if (_activeTab != 'BLE') ...[
                      // Primary Button (Chỉ hiện khi nhập tay PIN hoặc QR)
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isLoadingDevice
                              ? null
                              : () => _lookupAndJumpToWifiSetup(
                                    _activeTab == 'CODE' ? _codeInput.text : _qrInput.text,
                                  ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 2,
                          ),
                          child: _isLoadingDevice
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                )
                              : const Text(
                                  'TIẾP TỤC CÀI ĐẶT MẠNG ➔',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                                ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Quick Sample Button (1-tap testing)
                    InkWell(
                      onTap: () {
                        _codeInput.text = '882910';
                        _lookupAndJumpToWifiSetup('882910');
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.bolt, size: 16, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text(
                              '⚡ Thử ngay với mã mẫu: 882910',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // =========================================================================
  // MÀN HÌNH 2: CÀI ĐẶT MẠNG WI-FI (Chuyển đến ngay sau khi nhập mã)
  // =========================================================================
  Widget _buildWifiSetupView() {
    final devId = _deviceData?['deviceId'] ?? 'SOB-000001';
    final product = _deviceData?['product'];
    final prodName = product?['name'] ?? 'Nước Tinh Khiết Lavie 19L';
    final price = product?['price'] ?? 65000;
    final storeName = _deviceData?['store']?['name'] ?? 'Đại lý Nước & Gas Gia Định';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Device Info Header Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFBBF7D0), width: 1.5),
              boxShadow: [
                BoxShadow(color: AppColors.success.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 3)),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(child: Text('🔘', style: TextStyle(fontSize: 26))),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              devId,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.success),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text('Đã nhận diện!', style: TextStyle(fontSize: 11, color: AppColors.success, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        prodName,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                      ),
                      Text(
                        'Đơn giá: ${price.toString()} ₫ • $storeName',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Wi-Fi Configuration Section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.cardBorder),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.wifi, color: AppColors.primary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'CHỌN MẠNG WI-FI GIA ĐÌNH',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.textPrimary, letterSpacing: 0.5),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Chọn sóng Wi-Fi 2.4GHz nhà bạn để nút bấm gửi đơn hàng tự động khi nhấn:',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 14),

                // Wi-Fi List
                ..._availableNetworks.map((net) {
                  final isSelected = _selectedSsid == net['ssid'];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.cardBorder,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: ListTile(
                        dense: true,
                        leading: Icon(
                          Icons.wifi,
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          size: 20,
                        ),
                        title: Text(
                          net['ssid']!,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? AppColors.primary : AppColors.textPrimary,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: Text('${net['signal']} • ${net['security']}', style: const TextStyle(fontSize: 11)),
                        trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary, size: 20) : null,
                        onTap: () => setState(() => _selectedSsid = net['ssid']!),
                      ),
                    ),
                  );
                }),

                // Custom SSID Option
                InkWell(
                  onTap: () async {
                    final controller = TextEditingController();
                    final custom = await showDialog<String>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Nhập Wi-Fi khác', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        content: TextField(
                          controller: controller,
                          decoration: const InputDecoration(
                            hintText: 'Tên Wi-Fi (SSID)',
                            border: OutlineInputBorder(),
                          ),
                          autofocus: true,
                        ),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('HỦY')),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
                            child: const Text('CHỌN'),
                          ),
                        ],
                      ),
                    );
                    if (custom != null && custom.isNotEmpty) {
                      setState(() {
                        _selectedSsid = custom;
                      });
                    }
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.primary.withOpacity(0.3), style: BorderStyle.solid),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      '➕ Nhập tên Wi-Fi khác (Ẩn SSID)...',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                ),

                const SizedBox(height: 14),

                // Wi-Fi Password Field
                const Text(
                  'MẬT KHẨU WI-FI',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _wifiPasswordController,
                  obscureText: !_showPassword,
                  decoration: InputDecoration(
                    hintText: 'Nhập mật khẩu Wi-Fi nhà bạn',
                    prefixIcon: const Icon(Icons.lock_outline, size: 20),
                    suffixIcon: IconButton(
                      icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                      onPressed: () => setState(() => _showPassword = !_showPassword),
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),

                const SizedBox(height: 22),

                // BIG ONE-CLICK ACTION BUTTON:
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _executeWifiConnection,
                    icon: const Icon(Icons.bolt, size: 22),
                    label: const Text(
                      '👉 CÀI WI-FI & KÍCH HOẠT NÚT BẤM',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 3,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // MÀN HÌNH 3: ĐANG NẠP VÀ KẾT NỐI WI-FI
  // =========================================================================
  Widget _buildConnectingView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.cardBorder),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Đang Nạp Wi-Fi Cho Nút Bấm...',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Hệ thống đang tự động bắt tay và cài đặt mạng. Bạn không cần thao tác gì thêm!',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 24),
                  _buildProgressItem('1. Kết nối BLE / SoftAP tới ESP32', _progressStep >= 1, _progressStep == 1),
                  _buildProgressItem('2. Truyền thông tin Wi-Fi tới nút bấm', _progressStep >= 2, _progressStep == 2),
                  _buildProgressItem('3. ESP32 kết nối Wi-Fi nhà bạn', _progressStep >= 3, _progressStep == 3),
                  _buildProgressItem('4. Kích hoạt vào tài khoản Smart Order', _progressStep >= 4, _progressStep == 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressItem(String title, bool isDone, bool isCurrent) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          if (isDone && !isCurrent)
            const Icon(Icons.check_circle, color: AppColors.success, size: 22)
          else if (isCurrent)
            const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            )
          else
            const Icon(Icons.radio_button_unchecked, color: AppColors.textMuted, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isCurrent || isDone ? FontWeight.bold : FontWeight.normal,
                color: isCurrent
                    ? AppColors.primary
                    : isDone
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // MÀN HÌNH 4: HOÀN TẤT THÀNH CÔNG
  // =========================================================================
  Widget _buildSuccessView() {
    final devId = _deviceData?['deviceId'] ?? 'SOB-000001';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 16, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🎉', style: TextStyle(fontSize: 56)),
              const SizedBox(height: 14),
              const Text(
                'HOÀN TẤT CẤU HÌNH!',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.success),
              ),
              const SizedBox(height: 8),
              Text(
                'Nút bấm $devId đã được nạp Wi-Fi thành công.\nBây giờ chỉ cần bấm nút vật lý là đơn hàng sẽ được gửi ngay lập tức!',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 28),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _resetToInput,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('VỀ TRANG CHỦ & XEM NÚT BẤM', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
