import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wifi,
  ArrowRight,
  ShieldCheck,
  Zap,
  Battery,
  Store,
  CheckCircle2,
  Droplets,
  Flame,
  Wheat,
  Package,
  Clock,
  MapPin,
  Radio,
  Truck,
} from 'lucide-react';
import { Interactive3DButton } from '../components/3d/Interactive3DButton';

export const LandingPage: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01',
      title: 'Nhấn Nút Tại Nhà',
      desc: 'Khi hết nước hoặc gas, chỉ cần nhấn 1 lần vào nút vật lý. Không cần mở điện thoại hay tìm kiếm danh bạ.',
      icon: Radio,
    },
    {
      step: '02',
      title: 'Xác Thực Bảo Mật',
      desc: 'Nút bấm tự động kết nối Wi-Fi gia đình và ký xác thực mã hóa HMAC độc bản chống trùng lặp đơn hàng.',
      icon: ShieldCheck,
    },
    {
      step: '03',
      title: 'Cửa Hàng Tiếp Nhận',
      desc: 'Màn hình trạm giao nhận và loa thông báo reo chuông nhận đơn tức thời cùng địa chỉ căn hộ chính xác.',
      icon: Store,
    },
    {
      step: '04',
      title: 'Giao Hàng Tận Cửa',
      desc: 'Nhân viên giao nhu yếu phẩm tận cửa căn hộ. Thanh toán tiền mặt hoặc chuyển khoản linh hoạt.',
      icon: Truck,
    },
  ];

  const categories = [
    {
      title: 'Nước Uống 20L',
      sub: 'Lavie, Vĩnh Hảo, Miru, Ion Life',
      icon: Droplets,
      badge: 'Giao trong 30p',
    },
    {
      title: 'Bình Gas Gia Đình 12kg',
      sub: 'Petrolimex, Saigon Petro, Elf Gaz',
      icon: Flame,
      badge: 'Kiểm tra van an toàn',
    },
    {
      title: 'Gạo Sạch Đóng Túi',
      sub: 'ST25 Ông Cua, ST24, Hương Lài 5-10kg',
      icon: Wheat,
      badge: 'Chính hãng',
    },
    {
      title: 'Nhu Yếu Phẩm',
      sub: 'Thùng sữa tươi, nước giặt, dầu ăn',
      icon: Package,
      badge: 'Đóng gói cẩn thận',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* ================================================================= */}
      {/* 1. HERO SECTION                                                   */}
      {/* ================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-blue-200 text-xs font-semibold text-[#2563EB]">
                <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                <span>Nút Bấm IoT Đặt Nhu Yếu Phẩm Cho Gia Đình</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.15]">
                Một nút bấm. <br />
                <span className="text-[#2563EB]">Mọi đơn hàng.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#475569] max-w-2xl leading-relaxed">
                Giải pháp nút bấm thông minh đặt nước uống 20L, bình gas và nhu yếu phẩm chỉ với một lần nhấn. 
                Rất dễ dùng cho cả người lớn tuổi và trẻ nhỏ — không cần mở ứng dụng phức tạp.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/quick-setup"
                  className="h-12 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Wifi className="w-4 h-4" />
                  <span>Cài Wi-Fi Nút Bấm 1-Chạm</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <Link
                  to="/register"
                  className="h-12 px-6 rounded-xl bg-white hover:bg-slate-50 text-[#0F172A] font-semibold text-sm border border-[#E2E8F0] shadow-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <Store className="w-4 h-4 text-[#64748B]" />
                  <span>Đăng Ký Cửa Hàng</span>
                </Link>
              </div>

              {/* Status Ribbon */}
              <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#475569] shadow-sm max-w-xl">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#10B981]">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                  Hệ thống trực tuyến
                </span>
                <span className="text-[#E2E8F0]">•</span>
                <span>Phản hồi đơn: <strong className="text-[#0F172A]">dưới 1 giây</strong></span>
                <span className="text-[#E2E8F0]">•</span>
                <span>Thời lượng pin: <strong className="text-[#0F172A]">12–18 tháng</strong></span>
              </div>
            </div>

            {/* Right Column: Physical Smart Button Preview Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-md text-center">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0] text-xs">
                  <span className="font-semibold text-[#0F172A]">Smart Button V2</span>
                  <span className="inline-flex items-center gap-1 text-[#10B981] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã Sẵn Sàng
                  </span>
                </div>

                <div className="mb-3">
                  <h3 className="text-base font-bold text-[#0F172A]">Nút Đặt Nước Khoáng 20L</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Đặt tại phòng khách hoặc kệ bếp</p>
                </div>

                {/* Tactile Physical Button Component */}
                <div className="py-3 flex justify-center">
                  <Interactive3DButton size="lg" />
                </div>

                {/* Quick Hint */}
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B] flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Có 60 giây hủy đơn an toàn nếu nhấn nhầm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 2. 4-STEP PROCESS                                                 */}
      {/* ================================================================= */}
      <section className="py-16 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Quy Trình Đơn Giản
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              Chỉ Cần Nhấn Nút, Hàng Đến Tận Cửa
            </h2>
            <p className="text-sm text-[#475569] mt-2">
              Công nghệ thông minh ẩn sau một nút bấm vật lý duy nhất, tiện lợi cho mọi thành viên
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-blue-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-mono font-bold text-sm mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. CATEGORIES                                                     */}
      {/* ================================================================= */}
      <section className="py-16 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
              Sản Phẩm Tiếp Tế
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
              Nhu Yếu Phẩm Thiết Yếu Hàng Ngày
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm text-left hover:border-blue-300 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#10B981] border border-emerald-200 inline-block mb-1.5">
                    {cat.badge}
                  </span>
                  <h4 className="font-bold text-sm text-[#0F172A]">{cat.title}</h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{cat.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 4. CLEAN PROFESSIONAL FOOTER                                     */}
      {/* ================================================================= */}
      <footer className="py-12 bg-white text-[#475569]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#2563EB]" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">SMARTSUPPLY (BUTTON V2)</span>
          </div>

          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Nền tảng kết nối nút bấm vật lý thông minh với chuỗi cung ứng hàng hóa sinh hoạt gia đình.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              to="/quick-setup"
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
            >
              Cài Wi-Fi Nút Bấm
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-xs font-semibold transition-colors"
            >
              Đăng Nhập Quản Trị
            </Link>
          </div>

          <div className="pt-6 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
            © 2026 SmartSupply Platform. Giải pháp IoT thương mại tin cậy cho mọi gia đình.
          </div>
        </div>
      </footer>
    </div>
  );
};
