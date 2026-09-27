import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../providers/smart_supply_provider.dart';
import '../models/smart_supply_models.dart';

class HouseholdScreen extends StatefulWidget {
  const HouseholdScreen({super.key});

  @override
  State<HouseholdScreen> createState() => _HouseholdScreenState();
}

class _HouseholdScreenState extends State<HouseholdScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final smartSupply = context.watch<SmartSupplyProvider>();
    final household = smartSupply.activeHousehold;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          children: [
            Text(
              household?.name ?? 'Gia Đình & Dịch Vụ',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            Text(
              'Vai trò của bạn: ${household?.myRole ?? "Thành viên"}',
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: 'Mua Sắm (${smartSupply.shoppingItems.where((i) => !i.isChecked).length})'),
            Tab(text: 'Dịch Vụ (${smartSupply.serviceRequests.length})'),
            Tab(text: 'Thành Viên (${household?.members.length ?? 0})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildShoppingListTab(smartSupply),
          _buildServiceRequestsTab(smartSupply),
          _buildMembersTab(household),
        ],
      ),
    );
  }

  Widget _buildShoppingListTab(SmartSupplyProvider provider) {
    final items = provider.shoppingItems;
    final uncheckedCount = items.where((i) => !i.isChecked).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Batch Order Action Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4), // Light emerald
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBBF7D0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.local_shipping, color: AppColors.success, size: 22),
                  const SizedBox(width: 8),
                  const Text(
                    'Đặt Hàng Gộp (Order Batching)',
                    style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF166534)),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.success,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$uncheckedCount món cần mua',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'Gộp các nhu yếu phẩm cần bổ sung vào 1 lần giao duy nhất để tiết kiệm phí ship và giảm rác thải bao bì.',
                style: TextStyle(fontSize: 12, color: Color(0xFF15803D), height: 1.3),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.shopping_bag, size: 18),
                  label: const Text('Đặt Hàng Gộp Toàn Bộ Danh Sách'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: uncheckedCount == 0
                      ? null
                      : () async {
                          final res = await provider.batchOrderShoppingList();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(res.message ?? 'Đã tạo đơn hàng gộp thành công!'),
                                backgroundColor: res.success ? AppColors.success : AppColors.error,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        },
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (items.isEmpty)
          _buildEmptyTabState(
            icon: Icons.checklist,
            title: 'Danh sách mua sắm trống',
            subtitle: 'Bấm 2 lần nút vật lý hoặc dùng nút "Thêm" để đưa nhu yếu phẩm vào danh sách.',
          )
        else
          ...items.map((item) {
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: ListTile(
                leading: Checkbox(
                  value: item.isChecked,
                  activeColor: AppColors.success,
                  onChanged: (val) {
                    if (val != null) {
                      provider.toggleShoppingItem(item.id, val);
                    }
                  },
                ),
                title: Text(
                  item.product?.name ?? 'Sản phẩm',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    decoration: item.isChecked ? TextDecoration.lineThrough : null,
                    color: item.isChecked ? AppColors.textMuted : AppColors.textPrimary,
                  ),
                ),
                subtitle: Text(
                  'Số lượng: ${item.quantity} • ${item.addedFromDeviceId != null ? "Bấm từ nút vật lý" : "Thêm thủ công"}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.textMuted),
                  onPressed: () => provider.removeShoppingItem(item.id),
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildServiceRequestsTab(SmartSupplyProvider provider) {
    final requests = provider.serviceRequests;
    final alerts = provider.urgentAlerts;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Urgent Alerts Banner (if any active)
        if (alerts.isNotEmpty)
          ...alerts.map((a) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2), // Red soft
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFFECACA), width: 1.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'CẢNH BÁO KHẨN CẤP ĐANG KÍCH HOẠT',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: AppColors.error),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          a.message,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }),

        // Create Service Request Action
        Row(
          children: [
            const Icon(Icons.handyman, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Yêu Cầu Dịch Vụ & Kỹ Thuật',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
            ),
            const Spacer(),
            ElevatedButton.icon(
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Tạo Yêu Cầu'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () => _showCreateServiceDialog(context, provider),
            ),
          ],
        ),
        const SizedBox(height: 12),

        if (requests.isEmpty)
          _buildEmptyTabState(
            icon: Icons.build_circle_outlined,
            title: 'Chưa có yêu cầu dịch vụ nào',
            subtitle: 'Bạn có thể gửi yêu cầu bảo trì, đổi vòi nước hoặc kiểm tra van gas định kỳ.',
          )
        else
          ...requests.map((r) {
            final dateFormat = DateFormat('dd/MM HH:mm');
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        r.category,
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                      ),
                      _buildStatusChip(r.status),
                    ],
                  ),
                  if (r.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      r.description!,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    'Thời gian: ${dateFormat.format(r.createdAt)} • Mức độ: ${r.priority}',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildMembersTab(HouseholdModel? household) {
    if (household == null) return const Center(child: Text('Chưa có thông tin căn hộ'));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Household Info Header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                household.name,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                household.address ?? 'Địa chỉ đang cập nhật',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        const Text(
          'Thành Viên Trong Căn Hộ',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
        ),
        const SizedBox(height: 10),

        ...household.members.map((m) {
          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: AppColors.primaryLight,
                child: Text(
                  (m.nickname ?? m.fullName ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800),
                ),
              ),
              title: Text(
                m.nickname ?? m.fullName ?? 'Thành viên',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              subtitle: Text(
                m.email ?? 'Tài khoản SmartSupply',
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: m.role == 'OWNER'
                      ? AppColors.primary.withOpacity(0.12)
                      : AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  m.role == 'OWNER'
                      ? 'Chủ Hộ'
                      : m.role == 'ADMIN'
                          ? 'Quản Trị'
                          : 'Thành Viên',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: m.role == 'OWNER' ? AppColors.primary : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color color = AppColors.warning;
    String text = 'Đang chờ';

    if (status == 'ACCEPTED' || status == 'IN_PROGRESS') {
      color = AppColors.primary;
      text = 'Đang xử lý';
    } else if (status == 'RESOLVED') {
      color = AppColors.success;
      text = 'Hoàn tất';
    } else if (status == 'CANCELLED') {
      color = AppColors.textMuted;
      text = 'Đã hủy';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  void _showCreateServiceDialog(BuildContext context, SmartSupplyProvider provider) {
    final catController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Yêu Cầu Dịch Vụ Mới', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: catController,
                decoration: const InputDecoration(
                  labelText: 'Loại yêu cầu',
                  hintText: 'Ví dụ: Kiểm tra rò rỉ van gas, sửa vòi nước',
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Ghi chú chi tiết',
                  hintText: 'Mô tả tình trạng hiện tại',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              onPressed: () async {
                if (catController.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                await provider.createServiceRequest(
                  category: catController.text.trim(),
                  description: descController.text.trim(),
                );
              },
              child: const Text('Gửi Yêu Cầu'),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEmptyTabState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        children: [
          Icon(icon, size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
