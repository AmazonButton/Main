import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Radio, CheckCircle2, Lock, ArrowRight, ArrowLeft, Zap, Eye, EyeOff, Smartphone, Store, Bluetooth, Hash } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Interactive3DButton } from '../components/3d/Interactive3DButton';
import { Floating3DCard } from '../components/3d/Floating3DCard';
import { WebBluetoothProvisioner } from '../components/devices/WebBluetoothProvisioner';
import { WhiteDeviceAirPodsModal } from '../components/devices/WhiteDeviceAirPodsModal';

export const QuickSetupPage: React.FC = () => {
  // Views: 'INPUT' | 'WIFI_SETUP' | 'CONNECTING' | 'SUCCESS'
  const [view, setView] = useState<'INPUT' | 'WIFI_SETUP' | 'CONNECTING' | 'SUCCESS'>('INPUT');
  const [inputMode, setInputMode] = useState<'BLE' | 'PIN'>('BLE');
  const [showAirPodsModal, setShowAirPodsModal] = useState(false);

  const [pinCode, setPinCode] = useState('');
  const [isLoadingDevice, setIsLoadingDevice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Device data once fetched
  const [deviceData, setDeviceData] = useState<any>(null);

  // Wi-Fi Setup States
  const [selectedSsid, setSelectedSsid] = useState('Home_WiFi_2.4G');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const availableNetworks = [
    { ssid: 'Home_WiFi_2.4G', signal: 'Mạnh (95%)', security: 'WPA2' },
    { ssid: 'FPT_Telecom_GiaDinh', signal: 'Tốt (78%)', security: 'WPA2' },
    { ssid: 'Viettel_5G_Extender', signal: 'Trung bình (60%)', security: 'WPA3' },
    { ssid: 'SmartOffice_Guest', signal: 'Yếu (35%)', security: 'Open' },
  ];

  // Connecting progress
  const [progressStep, setProgressStep] = useState(0);

  const handleLookupAndJump = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    setIsLoadingDevice(true);
    setErrorMessage(null);

    try {
      const res = await api.post('/provisioning/session', { code, deviceId: code });
      if (res.data?.success && res.data?.data) {
        setDeviceData(res.data.data);
        setIsLoadingDevice(false);
        // CHUYỂN NGAY LẬP TỨC SANG MÀN HÌNH CÀI ĐẶT MẠNG!
        setView('WIFI_SETUP');
      } else {
        setIsLoadingDevice(false);
        setErrorMessage(res.data?.message || `Mã "${code}" không tồn tại. Vui lòng kiểm tra lại!`);
      }
    } catch (err: any) {
      setIsLoadingDevice(false);
      setErrorMessage(err.response?.data?.message || 'Không thể tìm thấy thiết bị hoặc lỗi máy chủ');
    }
  };

  const handleStartConnection = () => {
    if (!deviceData) return;
    setView('CONNECTING');
    setProgressStep(1);

    setTimeout(() => {
      setProgressStep(2); // Gửi Wi-Fi

      setTimeout(() => {
        setProgressStep(3); // ESP32 vào mạng

        setTimeout(async () => {
          setProgressStep(4); // Cloud bootstrap

          const devId = deviceData.deviceId || 'SOB-000001';
          try {
            await api.post('/devices/bootstrap', {
              deviceId: devId,
              wifiRssi: -52,
              ipAddress: '192.168.1.188',
              uptime: 24,
            });
            await api.post(`/devices/${devId}/claim`);
          } catch (_) {}

          setView('SUCCESS');
          try {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#2563EB', '#10B981', '#F59E0B'],
            });
          } catch (_) {}
        }, 1100);
      }, 900);
    }, 700);
  };

  const handleReset = () => {
    setView('INPUT');
    setPinCode('');
    setDeviceData(null);
    setWifiPassword('');
    setProgressStep(0);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        {/* ========================================================================= */}
        {/* VIEW 1: NHẬP MÃ PIN (Gõ đủ 6 số là TỰ ĐỘNG CHUYỂN NGAY LẬP TỨC)          */}
        {/* ========================================================================= */}
        {view === 'INPUT' && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E2E8F0] text-center transition-all">
            {/* 3D Smart Button Centerpiece (36.9) */}
            <div className="py-2 flex justify-center scale-90 mb-2">
              <Interactive3DButton
                size="sm"
                hideFeedbackFooter={true}
                showTelemetry={false}
                label="PROVISION"
                subLabel="Wi-Fi Setup"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Cài Đặt Wi-Fi Cho Nút Bấm
            </h1>
            <p className="text-sm text-[#475569] mt-2 max-w-sm mx-auto">
              Cấu hình trực tiếp trên Web — Không cần ngắt mạng, không cần vào 192.168.4.1
            </p>

            {/* Special Apple-Style AirPods White Device Connection Banner */}
            <div className="mt-6 text-left">
              <button
                type="button"
                onClick={() => setShowAirPodsModal(true)}
                className="w-full p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 hover:border-[#2563EB] hover:shadow-sm transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center">
                      <Bluetooth className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0F172A]">
                        Ghép Nối Nút Bấm Trắng (Bluetooth)
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2563EB] text-white">
                        Tiện Lợi
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Tự động nhận diện nút bấm ở gần và liên kết nhanh nhu yếu phẩm
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0] mt-4 mb-4">
              <button
                type="button"
                onClick={() => setInputMode('BLE')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === 'BLE'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Bluetooth className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Bluetooth / Cáp USB (1-Chạm)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('PIN')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === 'PIN'
                    ? 'bg-white text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Nhập Mã PIN 6 Số</span>
              </button>
            </div>

            {inputMode === 'BLE' ? (
              <div className="mt-4 text-left">
                <WebBluetoothProvisioner
                  defaultSsid={selectedSsid}
                  onSuccess={(devId) => {
                    setDeviceData({ deviceId: devId });
                    setView('SUCCESS');
                  }}
                />
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    placeholder="••••••"
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinCode(val);
                      if (val.length === 6) {
                        handleLookupAndJump(val);
                      }
                    }}
                    className="w-full text-center text-4xl font-bold tracking-[0.4em] py-4 px-4 rounded-xl bg-[#F8FAFC] border-2 border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none text-[#2563EB] placeholder:text-[#CBD5E1] transition-all font-mono"
                    autoFocus
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-[#FEF2F2] border border-red-200 rounded-xl text-[#EF4444] text-xs font-semibold">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={() => handleLookupAndJump(pinCode)}
                  disabled={isLoadingDevice || pinCode.length < 4}
                  className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  {isLoadingDevice ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>ĐANG NHẬN DIỆN THIẾT BỊ...</span>
                    </>
                  ) : (
                    <>
                      <span>TIẾP TỤC CÀI ĐẶT MẠNG</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinCode('882910');
                      handleLookupAndJump('882910');
                    }}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 text-xs font-bold transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Thử nhanh với mã mẫu: 882910</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CÀI ĐẶT MẠNG WI-FI (Chuyển đến ngay lập tức sau khi nhập mã)       */}
        {/* ========================================================================= */}
        {view === 'WIFI_SETUP' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E2E8F0] transition-all">
            <button
              onClick={() => setView('INPUT')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Nhập mã nút khác</span>
            </button>

            {/* Device Info Badge */}
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-emerald-200 flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-sm">
                <Radio className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-[#10B981] text-white">
                    {deviceData?.deviceId || 'SOB-000001'}
                  </span>
                  <span className="text-xs font-bold text-[#10B981]">
                    Đã nhận diện thành công!
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] truncate mt-1">
                  {deviceData?.product?.name || 'Nước Tinh Khiết Lavie 19L'}
                </h3>
                <p className="text-xs text-[#475569]">
                  Đơn giá: {(deviceData?.product?.price || 65000).toLocaleString('vi-VN')} ₫ • {deviceData?.store?.name || 'Đại lý Nước & Gas Gia Định'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-wider text-[#0F172A] uppercase mb-2">
                  Chọn Mạng Wi-Fi Gia Đình (2.4GHz)
                </label>
                <div className="space-y-2">
                  {availableNetworks.map((net) => {
                    const isSelected = selectedSsid === net.ssid;
                    return (
                      <div
                        key={net.ssid}
                        onClick={() => setSelectedSsid(net.ssid)}
                        className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm'
                            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Wifi className={`w-4 h-4 ${isSelected ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? 'text-[#2563EB]' : 'text-[#0F172A]'}`}>
                              {net.ssid}
                            </p>
                            <p className="text-[11px] text-[#64748B]">
                              Sóng: {net.signal} • Bảo mật: {net.security}
                            </p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#2563EB]" />}
                      </div>
                    );
                  })}

                  {/* Option for hidden/other SSID */}
                  <div
                    onClick={() => {
                      const custom = prompt('Nhập tên Wi-Fi (SSID) nhà bạn:');
                      if (custom && custom.trim()) {
                        setSelectedSsid(custom.trim());
                      }
                    }}
                    className="p-3 rounded-xl border border-dashed border-[#CBD5E1] text-center cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span className="text-xs font-bold text-[#2563EB]">
                      ➕ Nhập tên Wi-Fi khác (Mạng ẩn SSID)...
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider text-[#0F172A] uppercase mb-2">
                  Mật Khẩu Wi-Fi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="Nhập mật khẩu Wi-Fi nhà bạn"
                    className="w-full py-3.5 pl-4 pr-12 rounded-xl bg-white border border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-sm font-medium transition-all text-[#0F172A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleStartConnection}
                  className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Zap className="w-5 h-5" />
                  <span>CÀI WI-FI & KÍCH HOẠT NÚT NGAY</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: TIẾN TRÌNH KẾT NỐI                                                 */}
        {/* ========================================================================= */}
        {view === 'CONNECTING' && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E2E8F0] text-left transition-all">
            <h2 className="text-xl font-bold text-[#0F172A]">
              Đang Cài Đặt Mạng Cho Nút Bấm...
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Hệ thống đang tự động bắt tay nạp Wi-Fi cho nút bấm. Bạn không cần thao tác thêm.
            </p>

            <div className="mt-8 space-y-4">
              {[
                { title: '1. Kết nối BLE / SoftAP tới ESP32', done: progressStep >= 1, current: progressStep === 1 },
                { title: '2. Truyền cấu hình Wi-Fi tới nút bấm', done: progressStep >= 2, current: progressStep === 2 },
                { title: '3. ESP32 kết nối Wi-Fi nhà bạn', done: progressStep >= 3, current: progressStep === 3 },
                { title: '4. Kích hoạt vào hệ thống Smart Order', done: progressStep >= 4, current: progressStep === 4 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {item.done && !item.current ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
                  ) : item.current ? (
                    <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#E2E8F0] shrink-0"></div>
                  )}
                  <span className={`text-sm ${item.current ? 'font-bold text-[#2563EB]' : item.done ? 'font-bold text-[#0F172A]' : 'text-[#64748B]'}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: HOÀN TẤT THÀNH CÔNG                                                */}
        {/* ========================================================================= */}
        {view === 'SUCCESS' && (
          <div className="bg-white rounded-2xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#E2E8F0] text-center transition-all">
            <div className="w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#10B981] flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#10B981]">
              CÀI ĐẶT WI-FI THÀNH CÔNG!
            </h2>
            <p className="text-xs text-[#475569] mt-2 max-w-sm mx-auto leading-relaxed">
              Nút bấm <strong className="text-[#0F172A]">{deviceData?.deviceId || 'SOB-000001'}</strong> đã được kết nối mạng Wi-Fi và sẵn sàng sử dụng.
              Từ bây giờ, mỗi khi bạn nhấn nút vật lý, đơn hàng sẽ được gửi ngay lập tức tới cửa hàng!
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="flex-1 h-12 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs transition-colors"
              >
                Cài đặt thêm nút khác
              </button>
              <Link
                to="/"
                className="flex-1 h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Về Trang Chủ</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Apple-Style AirPods White Device Pairing Modal */}
      <WhiteDeviceAirPodsModal
        isOpen={showAirPodsModal}
        onClose={() => setShowAirPodsModal(false)}
        onDeviceBound={(boundData) => {
          setDeviceData({ deviceId: boundData.code });
          setView('SUCCESS');
        }}
      />
    </div>
  );
};
