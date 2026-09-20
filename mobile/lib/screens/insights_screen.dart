import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../providers/smart_supply_provider.dart';
import '../models/smart_supply_models.dart';

class InsightsScreen extends StatelessWidget {
  const InsightsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final smartSupply = context.watch<SmartSupplyProvider>();
    final predictions = smartSupply.predictions;
    final household = smartSupply.activeHousehold;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Column(
          children: [
            Text(
              'Tiêu Dùng & Dự Đoán',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            Text(
              'Mô hình thống kê chu kỳ tiêu thụ thực tế',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () {
              if (household != null) {
                smartSupply.fetchPredictions(household.id);
              }
            },
          ),
        ],
      ),
      body: smartSupply.loading && predictions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                if (household != null) {
                  await smartSupply.fetchPredictions(household.id);
                }
              },
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Methodology Transparency Header Card
                  _buildTransparencyBanner(),
                  const SizedBox(height: 16),

                  // Section Title
                  Row(
                    children: [
                      const Icon(Icons.analytics, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'Dự Đoán Bổ Sung Nhu Yếu Phẩm',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                      const Spacer(),
                      Text(
                        '${predictions.length} mục theo dõi',
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  if (predictions.isEmpty)
                    _buildEmptyState()
                  else
                    ...predictions.map((p) => _buildPredictionCard(context, p, smartSupply)),
                ],
              ),
            ),
    );
  }

  Widget _buildTransparencyBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF), // Soft Blue
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_graph, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Thuật Toán Thống Kê Minh Bạch',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: Color(0xFF1E3A8A),
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Dự đoán dựa trên khoảng thời gian trung bình (Mean Interval) và độ lệch chuẩn giữa các đơn hàng thực tế của gia đình. Hệ thống không đoán mò mà giải thích rõ từng mốc thời gian.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF1E40AF), height: 1.35),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionCard(
    BuildContext context,
    PredictionInsightModel p,
    SmartSupplyProvider provider,
  ) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final isOverdue = p.status == 'OVERDUE';
    final isDueSoon = p.status == 'DUE_SOON';

    final Color statusColor = isOverdue
        ? AppColors.error
        : isDueSoon
            ? AppColors.warning
            : AppColors.success;

    final String statusLabel = isOverdue
        ? 'Đã quá chu kỳ'
        : isDueSoon
            ? 'Cần đổi trong ${p.daysRemaining.abs().toStringAsFixed(1)} ngày'
            : 'Chu kỳ còn ${p.daysRemaining.toStringAsFixed(0)} ngày';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDueSoon || isOverdue ? statusColor.withOpacity(0.4) : AppColors.cardBorder,
          width: isDueSoon || isOverdue ? 1.5 : 1,
        ),
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
          // Header: Product name & Status badge
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.productName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Đơn vị: ${p.unit} • Thu thập qua ${p.sampleCount} chu kỳ',
                      style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
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

          // 3 Metric Boxes: Mean Interval, Expected Date, Confidence
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      const Text(
                        'Chu kỳ trung bình',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${p.meanIntervalDays.toStringAsFixed(1)} ngày',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        '±${p.stdDevDays.toStringAsFixed(1)} ngày',
                        style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 32, color: AppColors.cardBorder),
                Expanded(
                  child: Column(
                    children: [
                      const Text(
                        'Dự kiến hết',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dateFormat.format(p.expectedReplenishmentDate),
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: statusColor,
                        ),
                      ),
                      Text(
                        isOverdue ? 'Quá hạn' : 'Sắp tới',
                        style: TextStyle(fontSize: 10, color: statusColor),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 32, color: AppColors.cardBorder),
                Expanded(
                  child: Column(
                    children: [
                      const Text(
                        'Độ tin cậy',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${p.confidenceScore}%',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
                          color: AppColors.primary,
                        ),
                      ),
                      const Text(
                        'Mô hình Gauss',
                        style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Human-readable Explanation
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, size: 15, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  p.explanation,
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Action Button: Add to household shopping list
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.add_shopping_cart, size: 16),
              label: const Text('Thêm vào Danh Sách Mua Sắm'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primaryLight),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () async {
                if (provider.activeHousehold != null) {
                  // Find or add
                  await provider.fetchShoppingList(provider.activeHousehold!.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Đã thêm "${p.productName}" vào Danh Sách Mua Sắm!'),
                        backgroundColor: AppColors.success,
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                }
              },
            ),
          ),
        ],
      ),
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
          Icon(Icons.hourglass_empty, size: 48, color: AppColors.textMuted),
          SizedBox(height: 12),
          Text(
            'Chưa đủ dữ liệu tiêu dùng',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
          ),
          SizedBox(height: 6),
          Text(
            'Khi bạn bấm nút hoặc đặt nhu yếu phẩm từ 2 lần trở lên, hệ thống sẽ tự động tính toán chu kỳ tiêu dùng thực tế.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textMuted, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
