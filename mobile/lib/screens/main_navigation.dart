import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import 'home_screen.dart';
import 'insights_screen.dart';
import 'devices_screen.dart';
import 'orders_screen.dart';
import 'household_screen.dart';

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(onGoToScan: () => setState(() => _currentIndex = 2)),
      const InsightsScreen(),
      const DevicesScreen(),
      const OrdersScreen(),
      const HouseholdScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.cardBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined, size: 22),
              activeIcon: Icon(Icons.home, size: 24, color: AppColors.primary),
              label: 'Trang Chủ',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.insights_outlined, size: 22),
              activeIcon: Icon(Icons.insights, size: 24, color: AppColors.primary),
              label: 'Dự Đoán',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.touch_app_outlined, size: 22),
              activeIcon: Icon(Icons.touch_app, size: 24, color: AppColors.primary),
              label: 'Nút Bấm',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined, size: 22),
              activeIcon: Icon(Icons.receipt_long, size: 24, color: AppColors.primary),
              label: 'Đơn Hàng',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.family_restroom_outlined, size: 22),
              activeIcon: Icon(Icons.family_restroom, size: 24, color: AppColors.primary),
              label: 'Gia Đình',
            ),
          ],
        ),
      ),
    );
  }
}
