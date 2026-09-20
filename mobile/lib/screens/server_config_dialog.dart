import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/device_provider.dart';
import '../providers/order_provider.dart';
import '../services/api_service.dart';

void showServerConfigDialog(BuildContext context) {
  final currentUrl = ApiService().baseUrl;
  final controller = TextEditingController(text: currentUrl);

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (context, setModalState) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.settings_ethernet, color: AppColors.primary, size: 24),
              SizedBox(width: 8),
              Text(
                'Cài Đặt IP Máy Chủ',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Chọn nhanh IP kết nối tới máy tính chạy backend:',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.phone_android, size: 16, color: AppColors.primary),
                      label: const Text('Điện thoại thật (192.168.1.129)'),
                      backgroundColor: controller.text.contains('192.168.1.129') ? AppColors.primaryLight : null,
                      onPressed: () {
                        setModalState(() {
                          controller.text = 'http://192.168.1.129:5000';
                        });
                      },
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.laptop, size: 16),
                      label: const Text('Localhost (5000)'),
                      backgroundColor: controller.text.contains('localhost') ? AppColors.primaryLight : null,
                      onPressed: () {
                        setModalState(() {
                          controller.text = 'http://localhost:5000';
                        });
                      },
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.smart_display, size: 16),
                      label: const Text('Máy ảo Android (10.0.2.2)'),
                      backgroundColor: controller.text.contains('10.0.2.2') ? AppColors.primaryLight : null,
                      onPressed: () {
                        setModalState(() {
                          controller.text = 'http://10.0.2.2:5000';
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    labelText: 'URL Backend',
                    hintText: 'http://192.168.1.xxx:5000',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.link, size: 20),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  '💡 Mẹo: Điện thoại và máy tính phải kết nối cùng 1 mạng Wi-Fi.',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('HỦY'),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.check, size: 18),
              label: const Text('LƯU & KẾT NỐI'),
              onPressed: () async {
                final newUrl = controller.text.trim();
                if (newUrl.isNotEmpty) {
                  await ctx.read<AuthProvider>().updateServerUrl(newUrl);
                  // Refresh devices
                  if (ctx.mounted) {
                    ctx.read<DeviceProvider>().fetchDevices(silent: true);
                    ctx.read<OrderProvider>().fetchOrders(silent: true);
                    Navigator.pop(ctx);
                  }
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đã cập nhật máy chủ: $newUrl'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                }
              },
            ),
          ],
        );
      },
    ),
  );
}
