import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../providers/order_provider.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _currencyFormat = NumberFormat('#,###', 'vi_VN');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().fetchOrders();
    });
  }

  Map<String, dynamic> _getStatusBadge(String status) {
    switch (status) {
      case 'PENDING':
        return {'label': 'Chờ Tiếp Nhận', 'bg': const Color(0xFFFEF3C7), 'color': const Color(0xFF92400E)};
      case 'CONFIRMED':
        return {'label': 'Đã Tiếp Nhận', 'bg': const Color(0xFFDBEAFE), 'color': const Color(0xFF1E40AF)};
      case 'PREPARING':
        return {'label': 'Đang Chuẩn Bị', 'bg': const Color(0xFFE0E7FF), 'color': const Color(0xFF3730A3)};
      case 'OUT_FOR_DELIVERY':
        return {'label': 'Đang Giao Hàng', 'bg': const Color(0xFFEDE9FE), 'color': const Color(0xFF5B21B6)};
      case 'COMPLETED':
        return {'label': 'Hoàn Thành', 'bg': const Color(0xFFDCFCE7), 'color': const Color(0xFF166534)};
      case 'CANCELLED':
        return {'label': 'Đã Hủy', 'bg': const Color(0xFFFFE4E6), 'color': const Color(0xFF9F1239)};
      default:
        return {'label': status, 'bg': const Color(0xFFF1F5F9), 'color': const Color(0xFF475569)};
    }
  }

  String _formatDate(String isoDate) {
    try {
      final dt = DateTime.parse(isoDate).toLocal();
      return DateFormat('HH:mm - dd/MM/yyyy').format(dt);
    } catch (_) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final orderProvider = context.watch<OrderProvider>();
    final orders = orderProvider.orders;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => orderProvider.fetchOrders(isRefresh: true),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header
              const Text(
                'Lịch Sử Đơn Hàng',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Tiến độ giao hàng thực tế từ các đơn nhấn nút thông minh',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),

              if (orderProvider.loading && orders.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40.0),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (orders.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.receipt_long, size: 48, color: AppColors.textMuted),
                      SizedBox(height: 12),
                      Text(
                        'Chưa có đơn hàng nào',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Nhấn nút trên app hoặc bấm nút SOB để tạo đơn ngay!',
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                )
              else
                ...orders.map((order) {
                  final badge = _getStatusBadge(order.status);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Order Number & Status Badge
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.orderNumber,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'monospace',
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: badge['bg'] as Color,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                badge['label'] as String,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: badge['color'] as Color,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 10),

                        // Item Rows
                        ...order.items.map(
                          (item) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    '${item.quantity}x ${item.productName}',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF334155),
                                    ),
                                  ),
                                ),
                                Text(
                                  '${_currencyFormat.format(item.totalPrice)} ₫',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Cancel reason if cancelled
                        if (order.cancelReason != null && order.cancelReason!.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Lý do hủy: ${order.cancelReason}',
                            style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.error),
                          ),
                        ],

                        const SizedBox(height: 10),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 10),

                        // Footer: Date & Total
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _formatDate(order.createdAt),
                              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                            ),
                            Text.rich(
                              TextSpan(
                                text: 'Tổng: ',
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                children: [
                                  TextSpan(
                                    text: '${_currencyFormat.format(order.totalAmount)} ₫',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF16A34A),
                                    ),
                                  ),
                                ],
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
}
