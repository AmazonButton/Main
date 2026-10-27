import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingBag, Cpu, Package, BarChart3, ShieldCheck, Activity, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const links = [
    { to: '/store/dashboard', label: 'Đơn Hàng Trực Tiếp', icon: ShoppingBag, badge: 'Mới' },
    { to: '/store/devices', label: 'Hạm Đội Nút Bấm', icon: Cpu, badge: null },
    { to: '/store/device-templates', label: 'Mẫu Thiết Bị (Templates)', icon: Layers, badge: null },
    { to: '/store/products', label: 'Sản Phẩm & Tồn Kho', icon: Package, badge: null },
    { to: '/store/analytics', label: 'Báo Cáo Doanh Thu', icon: BarChart3, badge: null },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 hidden md:flex">
      <div className="space-y-4">
        {/* Store Profile Card */}
        <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">
              Trạm Cửa Hàng
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              Online
            </span>
          </div>
          <p className="text-sm font-bold text-[#0F172A] truncate">
            {user?.store?.name || 'Đại Lý Nước & Gas'}
          </p>
          <div className="flex items-center space-x-1.5 mt-2 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#475569]">
            <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Mạng IoT Sẵn Sàng</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] border border-emerald-200">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Security Info Card */}
      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
        <div className="flex items-center space-x-2 text-[#10B981]">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-semibold text-[#0F172A]">Bảo Mật HMAC-SHA256</span>
        </div>
        <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
          Xác thực mã hóa độc bản trên từng nút bấm vật lý
        </p>
      </div>
    </aside>
  );
};
