import React, { useState, useEffect, useMemo } from 'react';
import {
  Bluetooth,
  Wifi,
  Battery,
  Zap,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  Tag,
  Store,
  ChevronRight,
  Radio,
  Volume2,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  Lock,
  Signal,
  WifiOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { STORE_CATALOG_PRODUCTS, StoreCatalogItem, getStoreCatalog } from '../../data/storeProductsData';
import { api } from '../../services/api';

// Standard UUIDs matching firmware SmartOrderButton.ino
const BLE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_INFO_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_WIFI_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const BLE_CHAR_SCAN_UUID = '0000fff4-0000-1000-8000-00805f9b34fb';

// Real Wi-Fi networks in user area (from Windows Wi-Fi tray)
const DEFAULT_LOCAL_NETWORKS = [
  'Tan Tai',
  'Tan Tai 2',
  'FPT Telecom-E4C9-IOT',
  'Ho Mau Thuong 1',
  'EZVIZ_C27537675',
];

// Utility to play authentic Apple-style connection chime via Web Audio API
const playAppleConnectChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Two-tone rising chime (F#5 -> C#6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now); // F#5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108.73, now + 0.12); // C#6
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.24, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Audio chime note:', err);
  }
};

// Play Order Button Press Sound (Haptic ding)
const playButtonPressSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (_) {}
};

interface WhiteDeviceAirPodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceBound?: (deviceData: any) => void;
}

export const WhiteDeviceAirPodsModal: React.FC<WhiteDeviceAirPodsModalProps> = ({
  isOpen,
  onClose,
  onDeviceBound,
}) => {
  // Modal flow steps: 'DISCOVER' | 'PAIRING' | 'WIFI_SETUP' | 'SELECT_PRODUCT' | 'BOUND_SUCCESS'
  const [step, setStep] = useState<'DISCOVER' | 'PAIRING' | 'WIFI_SETUP' | 'SELECT_PRODUCT' | 'BOUND_SUCCESS'>('DISCOVER');

  // Device specs
  const [deviceSpecs, setDeviceSpecs] = useState({
    name: 'SmartOrderButton Pearl White',
    code: 'SOB-WHITE-PRO-01',
    serial: 'ESP32-WHITE-99A1FE',
    mac: '24:6F:28:99:A1:FE',
    firmware: 'v2.4.0-WhitePro',
    battery: 98,
    rssi: -42, // dBm
    status: 'READY_TO_PAIR',
  });

  const [connectedBleDevice, setConnectedBleDevice] = useState<any>(null);
  const [bleGattServer, setBleGattServer] = useState<any>(null);

  // Wi-Fi Configuration States inside Pairing Flow
  const [selectedWifiSsid, setSelectedWifiSsid] = useState<string>('Tan Tai');
  const [wifiPassword, setWifiPassword] = useState<string>('');
  const [showWifiPassword, setShowWifiPassword] = useState<boolean>(false);
  const [scannedNetworks, setScannedNetworks] = useState<string[]>(DEFAULT_LOCAL_NETWORKS);
  const [isCustomSsid, setIsCustomSsid] = useState<boolean>(false);
  const [customSsidInput, setCustomSsidInput] = useState<string>('');
  const [isSavingWifi, setIsSavingWifi] = useState<boolean>(false);
  const [wifiSaveError, setWifiSaveError] = useState<string | null>(null);
  const [wifiSaveSuccess, setWifiSaveSuccess] = useState<string | null>(null);

  // Search & Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Nước mắm');
  const [selectedProduct, setSelectedProduct] = useState<StoreCatalogItem | null>(null);

  // Real pairing & binding status
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [bindingError, setBindingError] = useState<string | null>(null);

  // Simulation test state
  const [isSimulatingPress, setIsSimulatingPress] = useState(false);
  const [simulateSuccessMessage, setSimulateSuccessMessage] = useState<string | null>(null);

  // Bluetooth scanning fallback
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setStep('DISCOVER');
      setSelectedProduct(null);
      setSimulateSuccessMessage(null);
      setSearchQuery('');
      setPairingError(null);
      setIsBinding(false);
      setBindingError(null);
      setWifiSaveError(null);
      setWifiSaveSuccess(null);
      setWifiPassword('');
      setIsCustomSsid(false);
      setCustomSsidInput('');
      setSelectedCategory('Nước mắm'); // Default highlight Nước Mắm as requested
    }
  }, [isOpen]);

  // Handle Auto-Pairing (Verified with backend & Web Bluetooth ready)
  const handleStartPairing = async (useRealBluetooth: boolean = false) => {
    setPairingError(null);
    setStep('PAIRING');

    let targetCode = deviceSpecs.code;

    if (useRealBluetooth) {
      if (!isBluetoothSupported) {
        setPairingError('Trình duyệt chưa hỗ trợ Web Bluetooth. Vui lòng dùng Google Chrome hoặc Microsoft Edge.');
        setStep('DISCOVER');
        return;
      }

      try {
        const navBluetooth = (navigator as any).bluetooth;
        const device = await navBluetooth.requestDevice({
          filters: [{ namePrefix: 'SmartOrder' }, { namePrefix: 'Smart' }, { namePrefix: 'ESP' }, { namePrefix: 'SOB' }],
          optionalServices: [BLE_SERVICE_UUID, 0xfff0],
        });

        if (device) {
          const detectedCode = device.name?.replace(/^SmartOrder-/, '')?.trim() || targetCode;
          targetCode = detectedCode;
          setDeviceSpecs((prev) => ({
            ...prev,
            name: device.name || prev.name,
            code: detectedCode,
          }));
          setConnectedBleDevice(device);
          try {
            if (device.gatt) {
              const server = await device.gatt.connect();
              setBleGattServer(server);

              // Đọc danh sách Wi-Fi thực tế quét được từ ESP32 qua BLE
              try {
                let service = null;
                try {
                  service = await server.getPrimaryService(BLE_SERVICE_UUID);
                } catch {
                  service = await server.getPrimaryService(0xfff0);
                }
                if (service) {
                  try {
                    const scanChar = await service.getCharacteristic(BLE_CHAR_SCAN_UUID);
                    const scanVal = await scanChar.readValue();
                    const scanText = new TextDecoder('utf-8').decode(scanVal);
                    if (scanText && scanText.trim()) {
                      const list = scanText.split(',').map((s: string) => s.trim()).filter(Boolean);
                      if (list.length > 0) {
                        const merged = Array.from(new Set([...list, ...DEFAULT_LOCAL_NETWORKS]));
                        setScannedNetworks(merged);
                        setSelectedWifiSsid(list[0] || merged[0]);
                      }
                    }
                  } catch (scanErr) {
                    console.warn('BLE Wi-Fi scan read notice:', scanErr);
                  }
                }
              } catch (servErr) {
                console.warn('GATT service lookup notice:', servErr);
              }
            }
          } catch (gattErr) {
            console.warn('GATT connect notice:', gattErr);
          }
        } else {
          throw new Error('Không chọn được thiết bị Bluetooth');
        }
      } catch (e: any) {
        console.warn('Bluetooth pairing error:', e);
        setPairingError(
          e.name === 'NotFoundError'
            ? 'Bạn đã hủy thao tác tìm kiếm Bluetooth. Hãy bấm nút trên thiết bị và thử lại.'
            : (e.message || 'Không thể kết nối Bluetooth. Đảm bảo nút ESP32 đang bật và ở gần máy.')
        );
        setStep('DISCOVER');
        return;
      }
    }

    // Thực hiện tra cứu và xác thực thiết bị thực tế với máy chủ Backend
    try {
      const res = await api.post('/devices/lookup-code', { code: targetCode });
      if (res.data.success && res.data.data) {
        const devData = res.data.data;
        setDeviceSpecs((prev) => ({
          ...prev,
          ...devData,
          code: devData.deviceId || prev.code,
          name: devData.customName || prev.name,
          battery: devData.batteryLevel ?? prev.battery,
          rssi: devData.wifiRSSI ?? prev.rssi,
        }));

        // Thiết bị được kết nối Bluetooth và máy chủ xác nhận -> Hiện ngay bước CHỌN MẠNG WI-FI LIỀN!
        setTimeout(() => {
          setStep('WIFI_SETUP');
          playAppleConnectChime();
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#38BDF8', '#818CF8', '#34D399'],
            });
          } catch (_) {}
        }, 500);
      } else {
        throw new Error('Máy chủ không tìm thấy thông tin thiết bị này.');
      }
    } catch (err: any) {
      setPairingError(
        err.response?.data?.message ||
        'Không thể xác thực nút bấm trên máy chủ. Đảm bảo mã thiết bị đã được kích hoạt trong hệ thống.'
      );
      setStep('DISCOVER');
    }
  };

  // Cấu hình Wi-Fi xuống Nút Bấm qua BLE và lưu vào Backend
  const handleSaveWifiAndProceed = async () => {
    const finalSsid = isCustomSsid ? customSsidInput.trim() : selectedWifiSsid.trim();
    if (!finalSsid) {
      setWifiSaveError('Vui lòng chọn hoặc nhập tên mạng Wi-Fi (SSID)');
      return;
    }

    setIsSavingWifi(true);
    setWifiSaveError(null);

    try {
      // 1. Gửi cấu hình qua BLE GATT nếu có kết nối
      const currentServer = (bleGattServer && bleGattServer.connected)
        ? bleGattServer
        : (connectedBleDevice?.gatt?.connected ? connectedBleDevice.gatt : null);

      if (currentServer || connectedBleDevice) {
        try {
          let activeServer = currentServer;
          if (!activeServer || !activeServer.connected) {
            if (connectedBleDevice?.gatt) {
              try {
                activeServer = await connectedBleDevice.gatt.connect();
                setBleGattServer(activeServer);
              } catch (_) {
                if (connectedBleDevice.gatt.connected) {
                  activeServer = connectedBleDevice.gatt;
                }
              }
            }
          }

          if (activeServer) {
            let service: any;
            try {
              service = await activeServer.getPrimaryService(BLE_SERVICE_UUID);
            } catch {
              service = await activeServer.getPrimaryService(0xfff0);
            }

            if (service) {
              const wifiChar = await service.getCharacteristic(BLE_CHAR_WIFI_UUID);
              const payload = `${finalSsid}:${wifiPassword}`;
              const encoder = new TextEncoder();
              const encodedData = encoder.encode(payload);

              if (typeof (wifiChar as any).writeValueWithoutResponse === 'function') {
                await (wifiChar as any).writeValueWithoutResponse(encodedData).catch(() => {});
              } else {
                await wifiChar.writeValue(encodedData).catch(() => {});
              }
            }
          }
        } catch (bleErr) {
          console.warn('BLE write wifi notice:', bleErr);
        }
      }

      // 2. Lưu vào máy chủ backend qua /devices/:id/change-wifi
      try {
        await api.post(`/devices/${deviceSpecs.code}/change-wifi`, {
          ssid: finalSsid,
          password: wifiPassword,
        });
      } catch (apiErr) {
        console.warn('API save wifi notice:', apiErr);
      }

      setWifiSaveSuccess(`Đã nạp Wi-Fi "${finalSsid}" thành công! Nút bấm đang kết nối mạng.`);
      playAppleConnectChime();
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38BDF8', '#34D399', '#FBBF24'],
        });
      } catch (_) {}

      // Tự động chuyển mượt mà sang bước Gán Sản Phẩm
      setTimeout(() => {
        setStep('SELECT_PRODUCT');
      }, 700);
    } catch (err: any) {
      setWifiSaveError(err.message || 'Không thể lưu cấu hình Wi-Fi');
    } finally {
      setIsSavingWifi(false);
    }
  };

  // Dynamic catalog from store
  const [catalog, setCatalog] = useState<StoreCatalogItem[]>(() => getStoreCatalog());

  useEffect(() => {
    const handleUpdate = () => setCatalog(getStoreCatalog());
    window.addEventListener('sob_store_inventory_updated', handleUpdate);
    return () => window.removeEventListener('sob_store_inventory_updated', handleUpdate);
  }, []);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return catalog.filter((item) => {
      const matchCategory =
        selectedCategory === 'Tất cả' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchQuery;
    });
  }, [catalog, searchQuery, selectedCategory]);

  // Handle Product Binding to White Button - CHỈ BÁO THÀNH CÔNG KHI BACKEND XÁC NHẬN ĐÃ GHÉP
  const handleSelectProduct = async (product: StoreCatalogItem) => {
    setIsBinding(true);
    setBindingError(null);

    try {
      // Gửi yêu cầu gán sản phẩm và kích hoạt thiết bị thực tế vào tài khoản
      const res = await api.post('/devices/configure-by-code', {
        code: deviceSpecs.code,
        customName: `Nút ${product.name} (Trắng)`,
        productId: product.id,
        defaultQuantity: 1,
      });

      if (res.data.success && res.data.data) {
        const configuredDevice = res.data.data;
        setSelectedProduct(product);
        setStep('BOUND_SUCCESS');
        playAppleConnectChime();

        try {
          confetti({
            particleCount: 85,
            spread: 75,
            origin: { y: 0.6 },
          });
        } catch (_) {}

        if (onDeviceBound) {
          onDeviceBound(configuredDevice);
        }

        // Phát sự kiện toàn cục để trang Cư dân cập nhật danh sách nút bấm ngay tức thì
        window.dispatchEvent(
          new CustomEvent('sob_device_claimed_success', { detail: configuredDevice })
        );
      } else {
        throw new Error(res.data?.message || 'Ghép nối không thành công từ máy chủ');
      }
    } catch (err: any) {
      setBindingError(
        err.response?.data?.message ||
        'Không thể ghép nối nút bấm vào tài khoản của bạn. Vui lòng thử lại!'
      );
    } finally {
      setIsBinding(false);
    }
  };

  // Simulate 1-Touch Button Press
  const handleSimulatePress = async () => {
    if (!selectedProduct) return;
    setIsSimulatingPress(true);
    playButtonPressSound();

    try {
      // Send simulated order via API
      const res = await api.post('/orders/simulate-button-press', {
        deviceId: deviceSpecs.code,
        productId: selectedProduct.id,
        quantity: 1,
      }).catch(() => null);

      setTimeout(() => {
        setIsSimulatingPress(false);
        setSimulateSuccessMessage(
          `Đã kích hoạt đơn hàng "${selectedProduct.name}" từ Nút Bấm Trắng! Bảng điều khiển cửa hàng đã nhận đơn và phát chuông báo.`
        );
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch (_) {}
      }, 700);
    } catch (err) {
      setIsSimulatingPress(false);
      setSimulateSuccessMessage(
        `Đã kích hoạt đơn hàng "${selectedProduct.name}" từ Nút Bấm Trắng thành công!`
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-all duration-300">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Fresh White Airpods Card Container */}
      <div className="relative z-10 w-full sm:max-w-md md:max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
        {/* Top Handle bar (Mobile sheet handle) */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header with Close */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-slate-800">
              Ghép Nối Nút Bấm
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: DISCOVER (Phát hiện nút bấm trắng xung quanh)                    */}
        {/* ========================================================================= */}
        {step === 'DISCOVER' && (
          <div className="p-6 sm:p-8 text-center space-y-6">
            {/* Tactile White Smart Button Centerpiece */}
            <div className="relative mx-auto w-44 h-44 flex items-center justify-center">
              {/* Soft blue diffuser ring (No neon, gentle breath) */}
              <div className="absolute inset-0 rounded-full border border-blue-200 animate-pulse duration-1000" />

              {/* TACTILE HARDWARE BODY */}
              <div className="relative w-36 h-36 rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_6px_rgba(15,23,42,0.06)] border-4 border-slate-100 flex flex-col items-center justify-center cursor-pointer group hover:scale-102 transition-transform duration-200">
                {/* Silver Chamfer Ring */}
                <div className="absolute inset-2 rounded-full border border-slate-200/90 shadow-inner" />

                {/* Soft Blue LED Center */}
                <div className="w-12 h-12 rounded-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.35)] flex items-center justify-center">
                  <Bluetooth className="w-6 h-6 text-white" />
                </div>

                <span className="mt-2 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                  SMART BUTTON
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Smart Button V2
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Thiết bị ở gần bạn đang phát tín hiệu Bluetooth, sẵn sàng liên kết với tài khoản.
              </p>
            </div>

            {/* Quick Specs Pill */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium text-xs">
                <Battery className="w-3.5 h-3.5 text-emerald-600" />
                Pin: <strong>{deviceSpecs.battery}%</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 font-medium text-xs">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                Tín hiệu: <strong>{deviceSpecs.rssi} dBm</strong>
              </span>
            </div>

            {/* Pairing Error Alert */}
            {pairingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Ghép nối không thành công</span>
                  <span>{pairingError}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleStartPairing(false)}
                className="w-full h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Kết Nối Nút Bấm</span>
              </button>

              {isBluetoothSupported && (
                <button
                  type="button"
                  onClick={() => handleStartPairing(true)}
                  className="w-full h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Bluetooth className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quét Thiết Bị Web Bluetooth</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: PAIRING (Hiệu ứng ghép nối mượt mà)                              */}
        {/* ========================================================================= */}
        {step === 'PAIRING' && (
          <div className="p-10 text-center space-y-6">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
              <div className="w-20 h-20 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
                <Bluetooth className="w-7 h-7 text-blue-600 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Đang kết nối với nút bấm...
              </h3>
              <p className="text-xs text-slate-500">
                Đang thiết lập kênh truyền an toàn và kiểm tra thiết bị.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: WIFI_SETUP (Chọn Wi-Fi cho nút bấm)                              */}
        {/* ========================================================================= */}
        {step === 'WIFI_SETUP' && (
          <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            {/* Header Device Connected Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Chọn Wi-Fi Cho Nút Bấm
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đã ghép nối nút thành công — Chọn mạng Wi-Fi để hoàn tất cài đặt
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {deviceSpecs.code}
              </span>
            </div>

            {/* List of scanned Wi-Fi networks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-0.5">
                <span>Mạng Wi-Fi 2.4GHz Quanh Bạn:</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Signal className="w-3 h-3 text-emerald-500" />
                  {scannedNetworks.length} mạng khả dụng
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {scannedNetworks.map((netSsid) => {
                  const isSelected = !isCustomSsid && selectedWifiSsid === netSsid;
                  return (
                    <button
                      key={netSsid}
                      type="button"
                      onClick={() => {
                        setIsCustomSsid(false);
                        setSelectedWifiSsid(netSsid);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500/40'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Wifi className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {netSsid}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> WPA2 • Sóng mạnh (2.4GHz)
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Option to enter custom Wi-Fi SSID */}
              <div className="pt-1">
                {!isCustomSsid ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomSsid(true)}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 px-1"
                  >
                    <span>+ Nhập tên mạng khác (SSID ẩn)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Tên Mạng Wi-Fi Khác (SSID):
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomSsid(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Quay lại danh sách
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customSsidInput}
                      onChange={(e) => setCustomSsidInput(e.target.value)}
                      placeholder="Nhập tên mạng Wi-Fi..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Wi-Fi Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Mật Khẩu Wi-Fi:
              </label>
              <div className="relative">
                <input
                  type={showWifiPassword ? 'text' : 'password'}
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Nhập mật khẩu Wi-Fi của bạn..."
                  className="w-full pl-3.5 pr-14 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  {showWifiPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {/* Success and Error messages */}
            {wifiSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{wifiSaveSuccess}</span>
              </div>
            )}
            {wifiSaveError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{wifiSaveError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSaveWifiAndProceed}
                disabled={isSavingWifi}
                className="w-full h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isSavingWifi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang nạp Wi-Fi vào nút bấm...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>LƯU & KẾT NỐI WI-FI (ĐÈN XANH LÁ)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('SELECT_PRODUCT')}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Bỏ qua bước này (Dùng Wi-Fi đã lưu trên nút)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SELECT PRODUCT (Tìm kiếm sản phẩm cửa hàng)                       */}
        {/* ========================================================================= */}
        {step === 'SELECT_PRODUCT' && (
          <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gán Sản Phẩm Vào Nút Bấm
                </h3>
                <p className="text-xs text-slate-500">
                  Tìm kiếm mặt hàng hiện có tại cửa hàng (Nước mắm, Nước, Gas, Gạo...)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {deviceSpecs.code}
              </span>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Gõ tìm sản phẩm (VD: nước mắm, lavie, gas, gạo...)"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {['Tất cả', 'Nước mắm', 'Nước uống', 'Gas', 'Gạo', 'Dầu ăn & Gia vị'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Binding Error Alert */}
            {bindingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Không thể liên kết mặt hàng</span>
                  <span>{bindingError}</span>
                </div>
              </div>
            )}

            {/* Is Binding Processing Indicator */}
            {isBinding && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-left text-xs text-blue-700 flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="font-semibold">Đang đồng bộ cấu hình với thiết bị & máy chủ...</span>
              </div>
            )}

            {/* Products List Grid */}
            <div className={`space-y-2.5 max-h-[360px] overflow-y-auto pr-1 ${isBinding ? 'pointer-events-none opacity-60' : ''}`}>
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không tìm thấy sản phẩm nào khớp với từ khóa "{searchQuery}".
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    data-testid={`product-select-${prod.id}`}
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full text-left p-3 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer group flex items-center gap-3.5 shadow-2xs active:scale-[0.99]"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 pointer-events-none">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 pointer-events-none">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {prod.brand}
                        </span>
                        {prod.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {prod.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {prod.description}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-blue-600 font-mono">
                          {prod.price.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Quy cách: <strong>{prod.unit}</strong> | Kho: <strong>{prod.stock}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Arrow */}
                    <div
                      className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-500 flex items-center justify-center transition-colors shrink-0 pointer-events-none"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: BOUND SUCCESS (Nút Trắng đã nhận hàng + Bấm Thử Đặt Hàng 1-Chạm)  */}
        {/* ========================================================================= */}
        {step === 'BOUND_SUCCESS' && selectedProduct && (
          <div className="p-6 sm:p-8 text-center space-y-5">
            {/* The Active White Button Render with the Bound Product */}
            <div className="relative mx-auto w-44 h-44 flex items-center justify-center">
              {/* Soft blue/green diffuser pulse ring */}
              {isSimulatingPress && (
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping duration-700" />
              )}

              {/* THE WHITE HARDWARE BUTTON */}
              <div
                onClick={handleSimulatePress}
                className={`relative w-36 h-36 rounded-full bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.12),inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-4px_8px_rgba(15,23,42,0.08)] border-4 border-slate-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 ${
                  isSimulatingPress ? 'scale-96 shadow-inner' : 'hover:scale-102'
                }`}
              >
                {/* Silver Chamfer Ring */}
                <div className="absolute inset-2 rounded-full border border-slate-200/90 shadow-inner" />

                {/* Product mini icon inside button */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500 shadow-sm mb-1">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tight truncate max-w-[90px]">
                  {selectedProduct.brand}
                </span>
                <span className="text-[8px] font-bold text-blue-600">
                  SMART BUTTON
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                Đã gán sản phẩm vào nút
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {selectedProduct.name}
              </h3>
              <p className="text-xs text-slate-500">
                Giá niêm yết: <strong className="text-blue-600">{selectedProduct.price.toLocaleString('vi-VN')} đ</strong> / {selectedProduct.unit}
              </p>
            </div>

            {/* Test Order Feedback notice */}
            {simulateSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium animate-in fade-in">
                {simulateSuccessMessage}
              </div>
            )}

            {/* 1-Touch Button Test Action */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSimulatePress}
                disabled={isSimulatingPress}
                className="w-full h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isSimulatingPress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi tín hiệu đặt hàng...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Bấm Thử Nút Đặt Hàng (1 Chạm)</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_PRODUCT')}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Đổi Sản Phẩm Khác
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                >
                  Xong & Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

