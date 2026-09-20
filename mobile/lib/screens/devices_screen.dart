import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/device_provider.dart';
import '../providers/smart_supply_provider.dart';
import '../models/device_model.dart';
import 'qr_scanner_screen.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  @override
  Widget build(BuildContext context) {
    final devProvider = context.watch<DeviceProvider>();
    final smartSupply = context.watch<SmartSupplyProvider>();
    final devices = devProvider.devices;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Column(
          children: [
            Text(
              'Thiết Bị Nút Bấm IoT',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            Text(
              'Quản lý sức khỏe & Thiết kế hành vi nút',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: AppColors.primary),
            tooltip: 'Thêm nút mới',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => QrScannerScreen(onCompleted: () {
                    devProvider.fetchDevices();
                  }),
                ),
              );
            },
          ),
        ],
      ),
      body: devProvider.loading && devices.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                await devProvider.fetchDevices();
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Behavior Designer Intro Banner
                  _buildDesignerIntroBanner(),
                  const SizedBox(height: 16),

                  // Header with Count
                  Row(
                    children: [
                      const Icon(Icons.hub, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Danh Sách Nút Bấm Gia Đình',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                      const Spacer(),
                      Text(
                        '${devices.length} thiết bị',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (devices.isEmpty)
                    _buildEmptyState()
                  else
                    ...devices.map((d) => _buildDeviceCard(context, d, devProvider, smartSupply)),
                ],
              ),
            ),
    );
  }

  Widget _buildDesignerIntroBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.touch_app, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Behavior Designer (Lập trình nút)',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                ),
                SizedBox(height: 2),
                Text(
                  'Tùy biến hành vi cho từng thao tác: 1 click, 2 click, giữ 3 giây, giữ 5 giây.',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceCard(
    BuildContext context,
    DeviceModel d,
    DeviceProvider devProvider,
    SmartSupplyProvider smartSupply,
  ) {
    final healthScore = d.healthScore;
    final Color healthColor = healthScore >= 85
        ? AppColors.success
        : healthScore >= 65
            ? AppColors.warning
            : AppColors.error;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Name & Health Score badge
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.radio_button_checked, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      d.displayName,
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Mã: ${d.deviceId} • ${d.product?.name ?? "Chưa gán sản phẩm"}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              // Health Score Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: healthColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.health_and_safety, color: healthColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      'Sức khỏe $healthScore/100',
                      style: TextStyle(
                        color: healthColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Telemetry Row: Battery, Wi-Fi, Status
          Row(
            children: [
              _buildTelemetryBadge(
                icon: Icons.battery_charging_full,
                label: '${d.batteryLevel}% Pin',
                color: d.batteryLevel < 20 ? AppColors.error : AppColors.success,
              ),
              const SizedBox(width: 10),
              _buildTelemetryBadge(
                icon: Icons.wifi,
                label: '${d.wifiRSSI} dBm',
                color: d.wifiRSSI < -75 ? AppColors.warning : AppColors.primary,
              ),
              const SizedBox(width: 10),
              _buildTelemetryBadge(
                icon: Icons.circle,
                label: d.isOnline ? 'Sẵn sàng' : 'Ngoại tuyến',
                color: d.isOnline ? AppColors.success : AppColors.textMuted,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Configured Behaviors Preview
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _buildActionRow('1 lần bấm', _formatAction(d.singlePressAction)),
                const Divider(height: 12, color: AppColors.cardBorder),
                _buildActionRow('2 lần bấm', _formatAction(d.doublePressAction)),
                const Divider(height: 12, color: AppColors.cardBorder),
                _buildActionRow('Giữ 3 giây', _formatAction(d.hold3sAction)),
                const Divider(height: 12, color: AppColors.cardBorder),
                _buildActionRow('Giữ 5 giây', _formatAction(d.hold5sAction)),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Action Buttons: Behavior Designer & Simulate
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.tune, size: 16),
                  label: const Text('Lập Trình Hành Vi'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () {
                    _showBehaviorDesignerSheet(context, d, smartSupply, devProvider);
                  },
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                icon: const Icon(Icons.play_arrow, size: 16),
                label: const Text('Bấm Thử'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textPrimary,
                  side: const BorderSide(color: AppColors.cardBorder),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () {
                  _showSimulationDialog(context, d, devProvider);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryBadge({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildActionRow(String gesture, String action) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          gesture,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
        ),
        Text(
          action,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  String _formatAction(String action) {
    switch (action) {
      case 'ORDER_PRODUCT':
        return '🛒 Đặt Hàng Trực Tiếp';
      case 'ADD_TO_SHOPPING_LIST':
        return '📋 Thêm Vào Danh Sách';
      case 'REQUEST_SERVICE':
        return '🛠️ Yêu Cầu Kỹ Thuật';
      case 'TRIGGER_EMERGENCY':
        return '🚨 Báo Động Khẩn Cấp';
      case 'CANCEL_ACTIVE_REQUEST':
        return '❌ Hủy Yêu Cầu Đang Chờ';
      case 'SEND_NOTIFICATION':
        return '🔔 Gửi Thông Báo';
      default:
        return action;
    }
  }

  void _showBehaviorDesignerSheet(
    BuildContext context,
    DeviceModel d,
    SmartSupplyProvider smartSupply,
    DeviceProvider devProvider,
  ) {
    String single = d.singlePressAction;
    String doubleAction = d.doublePressAction;
    String hold3s = d.hold3sAction;
    String hold5s = d.hold5sAction;

    final actionOptions = [
      {'value': 'ORDER_PRODUCT', 'label': '🛒 Đặt Hàng Trực Tiếp (60s Hủy)'},
      {'value': 'ADD_TO_SHOPPING_LIST', 'label': '📋 Thêm Vào Danh Sách Mua Sắm'},
      {'value': 'REQUEST_SERVICE', 'label': '🛠️ Yêu Cầu Dịch Vụ / Kỹ Thuật'},
      {'value': 'TRIGGER_EMERGENCY', 'label': '🚨 Báo Động Khẩn Cấp (Rò Rỉ Gas/Nước)'},
      {'value': 'CANCEL_ACTIVE_REQUEST', 'label': '❌ Hủy Đơn / Yêu Cầu Đang Chờ'},
      {'value': 'SEND_NOTIFICATION', 'label': '🔔 Gửi Thông Báo Đến Cả Nhà'},
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Thiết Kế Hành Vi Nút Bấm',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                    Text(
                      'Thiết bị: ${d.deviceId} (${d.product?.name ?? "Sản phẩm"})',
                      style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                    ),
                    const SizedBox(height: 16),

                    // Gesture 1: Single Press
                    _buildDropdownSelector(
                      label: 'Nhấn 1 lần (Single Press)',
                      currentValue: single,
                      options: actionOptions,
                      onChanged: (val) => setModalState(() => single = val!),
                    ),
                    const SizedBox(height: 12),

                    // Gesture 2: Double Press
                    _buildDropdownSelector(
                      label: 'Nhấn 2 lần (Double Press)',
                      currentValue: doubleAction,
                      options: actionOptions,
                      onChanged: (val) => setModalState(() => doubleAction = val!),
                    ),
                    const SizedBox(height: 12),

                    // Gesture 3: Hold 3s
                    _buildDropdownSelector(
                      label: 'Nhấn giữ 3 giây (Hold 3s)',
                      currentValue: hold3s,
                      options: actionOptions,
                      onChanged: (val) => setModalState(() => hold3s = val!),
                    ),
                    const SizedBox(height: 12),

                    // Gesture 4: Hold 5s
                    _buildDropdownSelector(
                      label: 'Nhấn giữ 5 giây (Hold 5s)',
                      currentValue: hold5s,
                      options: actionOptions,
                      onChanged: (val) => setModalState(() => hold5s = val!),
                    ),
                    const SizedBox(height: 20),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          Navigator.pop(modalCtx);
                          final res = await smartSupply.updateDeviceBehavior(
                            deviceId: d.id,
                            singlePressAction: single,
                            doublePressAction: doubleAction,
                            hold3sAction: hold3s,
                            hold5sAction: hold5s,
                          );
                          if (res.success) {
                            await devProvider.fetchDevices(silent: true);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Đã cập nhật cấu hình hành vi nút thành công!'),
                                  backgroundColor: AppColors.success,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          }
                        },
                        child: const Text(
                          'Lưu Cấu Hình Hành Vi',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDropdownSelector({
    required String label,
    required String currentValue,
    required List<Map<String, String>> options,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.cardBorder),
            borderRadius: BorderRadius.circular(10),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: options.any((o) => o['value'] == currentValue) ? currentValue : options.first['value'],
              items: options.map((o) {
                return DropdownMenuItem(
                  value: o['value'],
                  child: Text(o['label']!, style: const TextStyle(fontSize: 13)),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  void _showSimulationDialog(BuildContext context, DeviceModel d, DeviceProvider devProvider) {
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text('Mô Phỏng Thao Tác: ${d.displayName}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.touch_app, color: AppColors.primary),
                title: const Text('Bấm 1 lần'),
                subtitle: Text(_formatAction(d.singlePressAction)),
                onTap: () async {
                  Navigator.pop(ctx);
                  await devProvider.simulatePress(d.id, eventType: 'SINGLE_PRESS');
                },
              ),
              ListTile(
                leading: const Icon(Icons.double_arrow, color: AppColors.warning),
                title: const Text('Bấm 2 lần'),
                subtitle: Text(_formatAction(d.doublePressAction)),
                onTap: () async {
                  Navigator.pop(ctx);
                  await devProvider.simulatePress(d.id, eventType: 'DOUBLE_PRESS');
                },
              ),
              ListTile(
                leading: const Icon(Icons.timer, color: Colors.blue),
                title: const Text('Giữ 3 giây'),
                subtitle: Text(_formatAction(d.hold3sAction)),
                onTap: () async {
                  Navigator.pop(ctx);
                  await devProvider.simulatePress(d.id, eventType: 'HOLD_3S');
                },
              ),
              ListTile(
                leading: const Icon(Icons.warning, color: AppColors.error),
                title: const Text('Giữ 5 giây'),
                subtitle: Text(_formatAction(d.hold5sAction)),
                onTap: () async {
                  Navigator.pop(ctx);
                  await devProvider.simulatePress(d.id, eventType: 'HOLD_5S');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: const Column(
        children: [
          Icon(Icons.radio_button_off, size: 48, color: AppColors.textMuted),
          SizedBox(height: 12),
          Text('Chưa có nút bấm nào', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          SizedBox(height: 6),
          Text(
            'Quét mã QR trên nút bấm vật lý để kết nối vào căn hộ của bạn.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
