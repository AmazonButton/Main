import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../models/device_model.dart';
import '../providers/auth_provider.dart';
import '../providers/device_provider.dart';
import '../providers/smart_supply_provider.dart';
import 'server_config_dialog.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onGoToScan;
  const HomeScreen({super.key, this.onGoToScan});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _currencyFormat = NumberFormat('#,###', 'vi_VN');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeviceProvider>().fetchDevices();
    });
  }

  void _handleQuickReorder(DeviceModel dev) async {
    final devProvider = context.read<DeviceProvider>();
    final success = await devProvider.quickReorder(dev.deviceId);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🎉 Đặt hàng thành công cho ${dev.displayName}! Có 60s để hủy nếu bấm nhầm.'),
          backgroundColor: AppColors.success,
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể tạo đơn hàng. Vui lòng kiểm tra lại kết nối!'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _handleCancelActiveOrder() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xác nhận hủy đơn'),
        content: const Text('Bạn có chắc chắn muốn hủy đơn hàng vừa đặt không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('KHÔNG'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<DeviceProvider>().cancelActiveOrder();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Đơn hàng đã được hủy thành công.' : 'Không thể hủy đơn.'),
                    backgroundColor: success ? AppColors.warning : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('HỦY ĐƠN NGAY'),
          ),
        ],
      ),
    );
  }

  void _handleStartChangeWifi([DeviceModel? dev]) {
    final ssidController = TextEditingController(text: 'Home_WiFi_2.4G');
    final passwordController = TextEditingController();
    final pinController = TextEditingController(text: dev != null ? dev.deviceId : '');
    bool isSaving = false;
    bool obscurePassword = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.wifi, color: AppColors.primary, size: 22),
                          ),
                          const SizedBox(width: 12),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Đổi Mạng Wi-Fi Nút Bấm',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                              Text(
                                'Cập nhật trực tiếp trên App — Không cần 192.168.4.1',
                                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.textSecondary),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Mã số nút bấm / PIN
                  if (dev != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.radio_button_checked, color: AppColors.primary, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  dev.displayName,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Text(
                                  'Mã: ${dev.deviceId}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontFamily: 'monospace'),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.success.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('Đang chọn', style: TextStyle(fontSize: 10, color: AppColors.success, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
                  ] else ...[
                    const Text('Nhập Mã PIN / Mã Số Thiết Bị:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: pinController,
                      decoration: InputDecoration(
                        hintText: 'VD: 882910 hoặc SOB-000001',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),

                  const Text('Chọn Hoặc Nhập Wi-Fi (SSID 2.4 GHz):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: ssidController,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.wifi, size: 20),
                      hintText: 'VD: Home_WiFi_2.4G',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Quick chips
                  Wrap(
                    spacing: 8,
                    children: [
                      'Home_WiFi_2.4G',
                      'FPT_Telecom_GiaDinh',
                      'Viettel_5G_Extender',
                    ].map((s) => ActionChip(
                      label: Text(s, style: TextStyle(fontSize: 11, color: ssidController.text == s ? Colors.white : AppColors.textPrimary)),
                      backgroundColor: ssidController.text == s ? AppColors.primary : AppColors.surface,
                      onPressed: () {
                        setSheetState(() {
                          ssidController.text = s;
                        });
                      },
                    )).toList(),
                  ),
                  const SizedBox(height: 14),

                  const Text('Mật Khẩu Wi-Fi:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      hintText: 'Nhập mật khẩu Wi-Fi',
                      suffixIcon: IconButton(
                        icon: Icon(obscurePassword ? Icons.visibility_off : Icons.visibility, size: 20),
                        onPressed: () {
                          setSheetState(() {
                            obscurePassword = !obscurePassword;
                          });
                        },
                      ),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: isSaving ? null : () async {
                        final targetDevId = (dev != null ? dev.deviceId : pinController.text.trim());
                        if (targetDevId.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Vui lòng nhập mã thiết bị')),
                          );
                          return;
                        }
                        if (ssidController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Vui lòng nhập Tên Wi-Fi')),
                          );
                          return;
                        }

                        setSheetState(() => isSaving = true);
                        final ok = await context.read<DeviceProvider>().changeWifi(
                          targetDevId,
                          ssidController.text.trim(),
                          passwordController.text,
                        );
                        setSheetState(() => isSaving = false);

                        if (!mounted) return;
                        Navigator.pop(ctx);

                        if (ok) {
                          showDialog(
                            context: context,
                            builder: (dlgCtx) => AlertDialog(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                              title: const Row(
                                children: [
                                  Icon(Icons.check_circle, color: AppColors.success, size: 26),
                                  SizedBox(width: 8),
                                  Text('Cập Nhật Thành Công'),
                                ],
                              ),
                              content: Text(
                                '🟢 Đèn LED viền nút đã chuyển sang XANH LÁ (Connected)!\n\nNút "$targetDevId" đã nhận cấu hình Wi-Fi "${ssidController.text.trim()}" trực tiếp từ App. Bạn có thể nhấn nút để đặt hàng ngay mà không cần truy cập 192.168.4.1!',
                              ),
                              actions: [
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                  ),
                                  onPressed: () => Navigator.pop(dlgCtx),
                                  child: const Text('TUYỆT VỜI'),
                                ),
                              ],
                            ),
                          );
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Không thể cập nhật Wi-Fi. Vui lòng kiểm tra lại mã số thiết bị!'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      },
                      child: isSaving
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('LƯU & ĐỔI WI-FI (ĐÈN CHUYỂN XANH LÁ)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _handleTransferDevice(DeviceModel dev) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Chuyển Nhượng Nút Bấm'),
        content: Text(
          'Bạn có chắc chắn muốn chuyển nhượng nút "${dev.displayName}" cho người khác?\n\nSau khi tạo, người nhận chỉ cần quét mã chuyển nhượng để nhận quyền sở hữu.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('HỦY'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              final code = await context.read<DeviceProvider>().transferDevice(dev.id);
              if (!mounted) return;

              if (code != null) {
                showDialog(
                  context: context,
                  builder: (ctx2) => AlertDialog(
                    title: const Text('Mã Chuyển Nhượng Sẵn Sàng'),
                    content: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Hãy gửi mã này cho người nhận:'),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          child: SelectableText(
                            code,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                          ),
                        ),
                      ],
                    ),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx2), child: const Text('ĐÓNG')),
                    ],
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Không thể tạo mã chuyển nhượng!'), backgroundColor: AppColors.error),
                );
              }
            },
            child: const Text('TẠO MÃ'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final devProvider = context.watch<DeviceProvider>();
    final smartSupply = context.watch<SmartSupplyProvider>();
    final devices = devProvider.devices;
    final household = smartSupply.activeHousehold;
    final pendingReminders = smartSupply.reminders.where((r) => r.status == 'PENDING').toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await devProvider.fetchDevices(isRefresh: true);
            await smartSupply.fetchAllHouseholdData();
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header Profile Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.darkBackground,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.darkBackground.withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'SmartSupply Household',
                            style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            household?.name ?? 'Căn hộ 1204 Sunwah Pearl',
                            style: const TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.w900),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '👤 ${auth.user?.fullName ?? "Nguyễn Văn An"} • ${household?.myRole == "OWNER" ? "Chủ Hộ" : "Thành Viên"}',
                            style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8), fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          // Live Sync Status Pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: devProvider.isSocketConnected
                                  ? const Color(0xFF065F46).withOpacity(0.4)
                                  : const Color(0xFF7F1D1D).withOpacity(0.4),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: devProvider.isSocketConnected
                                    ? const Color(0xFF10B981)
                                    : const Color(0xFFEF4444),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                    color: devProvider.isSocketConnected
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFEF4444),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  devProvider.isSocketConnected
                                      ? 'Đồng bộ tức thì với Nút ESP32'
                                      : 'Mất kết nối máy chủ Cloud',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: devProvider.isSocketConnected
                                        ? const Color(0xFFA7F3D0)
                                        : const Color(0xFFFECACA),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      children: [
                        InkWell(
                          onTap: () => showServerConfigDialog(context),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF334155),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.settings, size: 16, color: Color(0xFFF1F5F9)),
                          ),
                        ),
                        const SizedBox(width: 8),
                        InkWell(
                          onTap: () => auth.logout(),
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF334155),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.logout, size: 14, color: Color(0xFFF1F5F9)),
                                SizedBox(width: 4),
                                Text(
                                  'Đăng xuất',
                                  style: TextStyle(color: Color(0xFFF1F5F9), fontSize: 11, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Real-time Button Pressing Banner (when physical ESP32 button is held down)
              if (devProvider.isButtonPressed)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3B82F6).withOpacity(0.4),
                        blurRadius: 14,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'TÍN HIỆU TỪ NÚT VẬT LÝ ESP32',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFDBEAFE),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${devProvider.pressingDeviceName ?? "Nút bấm"} đang được nhấn giữ...',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // 60-second Cancellation Countdown Window Banner (UI/UX Pro Max)
              if (devProvider.hasActiveCancelWindow)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFD97706), Color(0xFFDC2626)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFDC2626).withOpacity(0.35),
                        blurRadius: 14,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Center(
                                  child: Icon(Icons.timer_outlined, color: Colors.white, size: 26),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        const Text(
                                          'CỬA SỔ HỦY ĐƠN 60 GIÂY',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w900,
                                            color: Color(0xFFFEF3C7),
                                            letterSpacing: 0.6,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.black26,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: const Text(
                                            'BẤM ĐÚP ĐỂ HỦY',
                                            style: TextStyle(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      'Thời gian còn lại: 00:${devProvider.secondsRemaining.toString().padLeft(2, '0')}s',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: _handleCancelActiveOrder,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFFDC2626),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  elevation: 2,
                                ),
                                child: const Text(
                                  'HỦY ĐƠN',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Animated Progress Bar
                        LinearProgressIndicator(
                          value: (devProvider.secondsRemaining / devProvider.totalCancelSeconds).clamp(0.0, 1.0),
                          backgroundColor: Colors.black.withOpacity(0.2),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFEF08A)),
                          minHeight: 4,
                        ),
                      ],
                    ),
                  ),
                ),

              // ─── SMARTSUPPLY: SMART REPLENISHMENT REMINDER CARD ───
              if (pendingReminders.isNotEmpty) ...[
                ...pendingReminders.map((reminder) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB), // Amber warm
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFD97706).withOpacity(0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppColors.warning,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.notifications_active, color: Colors.white, size: 16),
                            ),
                            const SizedBox(width: 10),
                            const Expanded(
                              child: Text(
                                'Gợi Ý Bổ Sung Thông Minh',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 14,
                                  color: Color(0xFF92400E),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFDE68A),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${reminder.confidence}% Tin cậy',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF92400E),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          reminder.reason,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF78350F),
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                icon: const Icon(Icons.shopping_cart, size: 15),
                                label: const Text('Đặt Ngay'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFD97706),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: () async {
                                  // Quick order or add to list
                                  await smartSupply.convertReminderToList(reminder.id);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Đã xác nhận và thêm vào Danh Sách Mua Sắm!'),
                                        backgroundColor: AppColors.success,
                                        behavior: SnackBarBehavior.floating,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: const Color(0xFF92400E),
                                side: const BorderSide(color: Color(0xFFFCD34D)),
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () async {
                                await smartSupply.snoozeReminder(reminder.id, 3);
                              },
                              child: const Text('Nhắc Lại Sau 3 Ngày', style: TextStyle(fontSize: 12)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              ],

              // ─── QUICK STATUS SUMMARY METRICS ───
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildQuickMetric(
                      icon: Icons.hub_outlined,
                      label: 'Nút IoT',
                      value: '${devices.length}',
                      color: AppColors.primary,
                    ),
                    Container(width: 1, height: 28, color: AppColors.cardBorder),
                    _buildQuickMetric(
                      icon: Icons.checklist,
                      label: 'Cần mua',
                      value: '${smartSupply.shoppingItems.where((i) => !i.isChecked).length}',
                      color: AppColors.warning,
                    ),
                    Container(width: 1, height: 28, color: AppColors.cardBorder),
                    _buildQuickMetric(
                      icon: Icons.auto_graph,
                      label: 'Dự đoán',
                      value: '${smartSupply.predictions.length}',
                      color: AppColors.success,
                    ),
                  ],
                ),
              ),

              // Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'NÚT BẤM CỦA BẠN',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: 0.5,
                    ),
                  ),
                  InkWell(
                    onTap: () => _handleStartChangeWifi(null),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.wifi, size: 13, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text('Đổi Wi-Fi Bằng Mã', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Devices List or Empty State
              if (devProvider.loading && devices.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (devices.isEmpty)
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    children: [
                      const Text('🔘', style: TextStyle(fontSize: 40)),
                      const SizedBox(height: 12),
                      const Text(
                        'Chưa có nút bấm nào được gán cho bạn.',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Bấm Ghép Nối để liên kết nút bấm mới.',
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 16),
                      if (widget.onGoToScan != null)
                        ElevatedButton.icon(
                          onPressed: widget.onGoToScan,
                          icon: const Icon(Icons.bluetooth_searching, size: 18),
                          label: const Text('Ghép Nối Nút Ngay'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                    ],
                  ),
                )
              else
                ...devices.map((dev) {
                  final prod = dev.product;
                  final price = prod?.price ?? 0;
                  final qty = dev.defaultQuantity;

                  final isThisDevicePressed = devProvider.isButtonPressed && 
                      (devProvider.pressingDeviceName == dev.displayName || devProvider.pressingDeviceName == dev.deviceId);

                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isThisDevicePressed ? AppColors.tactileAmber : AppColors.cardBorder,
                        width: isThisDevicePressed ? 2.0 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isThisDevicePressed 
                              ? AppColors.tactileAmber.withOpacity(0.25)
                              : Colors.black.withOpacity(0.04),
                          blurRadius: isThisDevicePressed ? 14 : 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Card Header: Device ID & Online Status
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '🔒 ${dev.deviceId}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: dev.isOnline ? AppColors.successLight : const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                dev.isOnline ? '● ONLINE' : '○ CHỜ KẾT NỐI',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: dev.isOnline ? AppColors.success : AppColors.textMuted,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 14),

                        // Device Meta: Icon & Product info
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Center(
                                child: Text('🔘', style: TextStyle(fontSize: 26)),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dev.displayName,
                                    style: const TextStyle(
                                      fontSize: 17,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    prod?.name ?? 'Chưa gán sản phẩm',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text.rich(
                                    TextSpan(
                                      text: 'Số lượng: ',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                      children: [
                                        TextSpan(
                                          text: '$qty ${prod?.unit ?? 'cái'}',
                                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                        ),
                                        const TextSpan(text: ' • Đơn giá: '),
                                        TextSpan(
                                          text: '${_currencyFormat.format(price)} ₫',
                                          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF16A34A)),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      Text(
                                        '📶 Wi-Fi: ${dev.wifiRSSI} dBm',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        '🔋 Pin: ${dev.batteryLevel}%',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Big Touch CTA Button: "👉 ĐẶT NGAY BẰNG 1 CHẠM"
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: () => _handleQuickReorder(dev),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.tactileAmber,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              elevation: 3,
                              shadowColor: AppColors.tactileAmber.withOpacity(0.4),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.touch_app_rounded, size: 20, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'ĐẶT HÀNG BẰNG 1 CHẠM',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 10),

                        // Secondary Action Buttons: Đổi Wi-Fi & Chuyển Nhượng
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _handleStartChangeWifi(dev),
                                icon: const Icon(Icons.wifi, size: 16),
                                label: const Text('Đổi Wi-Fi', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.textSecondary,
                                  side: const BorderSide(color: AppColors.cardBorder),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _handleTransferDevice(dev),
                                icon: const Icon(Icons.send_to_mobile, size: 16),
                                label: const Text('Chuyển Nhượng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.textSecondary,
                                  side: const BorderSide(color: AppColors.cardBorder),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickMetric({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary),
            ),
            Text(
              label,
              style: const TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ],
    );
  }
}

