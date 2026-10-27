import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/OrderSoundContext';
import {
  LogOut,
  Shield,
  Store,
  Smartphone,
  Wifi,
  CheckCircle2,
  Volume2,
  VolumeX,
  Bluetooth,
  Bell,
  Search,
} from 'lucide-react';
import { WhiteDeviceAirPodsModal } from '../components/devices/WhiteDeviceAirPodsModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isSoundEnabled, toggleSound, testSound } = useSound();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAirPodsModal, setShowAirPodsModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'STORE_OWNER':
        return { label: 'Chủ Cửa Hàng', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'STORE_MANAGER':
      case 'STORE_STAFF':
        return { label: 'Nhân Viên', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'TECHNICIAN':
        return { label: 'Kỹ Thuật Viên', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'CUSTOMER':
      default:
        return { label: 'Khách Hàng', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ================================================================= */}
        {/* LEFT: Logo + Navigation                                            */}
        {/* ================================================================= */}
        <div className="flex items-center gap-6 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <img
                src="/assets/logo.png"
                alt="Smart Order"
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-[#0F172A]">
                SMART ORDER
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-blue-200">
                v2.0
              </span>
            </div>
          </Link>

          {/* Primary Navigation based on role */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#E2E8F0]">
              {user.role === 'CUSTOMER' && (
                <Link
                  to="/customer/home"
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isActive('/customer/home')
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Nút Của Tôi</span>
                </Link>
              )}

              {['STORE_OWNER', 'STORE_MANAGER', 'STORE_STAFF'].includes(user.role) && (
                <>
                  <Link
                    to="/store/dashboard"
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isActive('/store/dashboard')
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Đơn Hàng Cửa Hàng</span>
                  </Link>
                  <Link
                    to="/store/devices"
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      isActive('/store/devices')
                        ? 'bg-[#EFF6FF] text-[#2563EB]'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100'
                    }`}
                  >
                    <span>Quản Lý Thiết Bị</span>
                  </Link>
                </>
              )}

              {user.role === 'SUPER_ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isActive('/admin/dashboard')
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Hub</span>
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT: Actions, Sound, Account                                    */}
        {/* ================================================================= */}
        <div className="flex items-center gap-3">
          {/* Quick Bluetooth Pairing Button */}
          <button
            type="button"
            onClick={() => setShowAirPodsModal(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#475569] bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] rounded-lg transition-colors"
            title="Ghép nối Nút Bấm Trắng qua Bluetooth"
          >
            <Bluetooth className="w-4 h-4 text-[#2563EB]" />
            <span>Ghép Nối Nút</span>
          </button>

          {/* Quick Wi-Fi Setup shortcut */}
          <Link
            to="/quick-setup"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors"
            title="Cài đặt Wi-Fi cho nút bấm"
          >
            <Wifi className="w-4 h-4 text-[#2563EB]" />
            <span>Cài Wi-Fi</span>
          </Link>

          {/* Sound Notification Alert Toggle */}
          <button
            onClick={() => {
              if (!isSoundEnabled) {
                toggleSound();
              } else {
                testSound();
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              toggleSound();
            }}
            className={`p-2 rounded-lg transition-colors relative ${
              isSoundEnabled
                ? 'text-[#10B981] bg-[#ECFDF5] hover:bg-emerald-100'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
            }`}
            title={
              isSoundEnabled
                ? 'Chuông đơn hàng: Đang BẬT (Bấm để nghe thử, Chuột phải để tắt)'
                : 'Chuông đơn hàng: Đang TẮT (Bấm để bật)'
            }
            aria-label="Sound Notification"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {isSoundEnabled && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#10B981] rounded-full" />
            )}
          </button>

          {/* User Account / Auth Section */}
          {user ? (
            <div className="flex items-center gap-3 pl-3 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                {getInitials(user.fullName)}
              </div>

              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-xs font-bold text-[#0F172A] truncate max-w-[130px]">
                    {user.fullName}
                  </span>
                  {user.emailVerified && (
                    <span title="Tài khoản đã xác thực">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${
                      getRoleBadge(user.role).color
                    }`}
                  >
                    {getRoleBadge(user.role).label}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-1.5 text-[#64748B] hover:text-[#EF4444] rounded-lg hover:bg-red-50 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-[#E2E8F0]">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors shadow-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bluetooth Pairing Modal */}
      <WhiteDeviceAirPodsModal
        isOpen={showAirPodsModal}
        onClose={() => setShowAirPodsModal(false)}
      />
    </header>
  );
};
