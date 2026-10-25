import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/OrderSoundContext';
import { subscribeToCustomer, getSocket } from '../../services/socket';
import { Device, Order, Product } from '../../types';
import { Radio, ShoppingBag, Clock, CheckCircle2, AlertCircle, X, ChevronRight, MapPin, Truck, RefreshCw, Battery, Wifi, Zap, Sparkles, Plus, Share2, WifiOff, Key, Hash, Check, Lightbulb, Bluetooth, Sliders, Power, Edit3, Signal, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Floating3DCard } from '../../components/3d/Floating3DCard';
import { DeliveryProgressTracker } from '../../components/orders/DeliveryProgressTracker';
import { WebBluetoothProvisioner } from '../../components/devices/WebBluetoothProvisioner';
import { WhiteDeviceAirPodsModal } from '../../components/devices/WhiteDeviceAirPodsModal';

export const CustomerHomePage: React.FC = () => {
  const { user } = useAuth();
  const { playOrderChime, playCancelChime } = useSound();
  const [devices, setDevices] = useState<Device[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAirPodsModal, setShowAirPodsModal] = useState(false);

  // Device Onboarding (PIN Code) Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [addTab, setAddTab] = useState<'CODE'>('CODE');
  const [deviceCodeInput, setDeviceCodeInput] = useState('');
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [foundDevice, setFoundDevice] = useState<any | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Device Transfer & Change Wi-Fi Modals
  const [transferringDevice, setTransferringDevice] = useState<Device | null>(null);
  const [transferResult, setTransferResult] = useState<any | null>(null);
  const [changeWifiDevice, setChangeWifiDevice] = useState<Device | null>(null);
  const [showWifiWebModal, setShowWifiWebModal] = useState<boolean>(false);
  const [wifiSsidInput, setWifiSsidInput] = useState('Tan Tai');
  const [wifiPasswordInput, setWifiPasswordInput] = useState('');
  const [showWifiPassword, setShowWifiPassword] = useState(false);
  const [isCustomWifiInput, setIsCustomWifiInput] = useState(false);
  const [customWifiInputVal, setCustomWifiInputVal] = useState('');
  const [wifiUpdating, setWifiUpdating] = useState(false);
  const [wifiSuccessMsg, setWifiSuccessMsg] = useState<string | null>(null);
  const [wifiPanelTab, setWifiPanelTab] = useState<'BLE' | 'CODE' | 'SELECT'>('BLE');
  const [wifiSelectedDevId, setWifiSelectedDevId] = useState<string>('');
  const [wifiCodeInput, setWifiCodeInput] = useState<string>('');
  const [wifiLookupLoading, setWifiLookupLoading] = useState<boolean>(false);
  const [wifiLookupError, setWifiLookupError] = useState<string | null>(null);
  const [wifiLookupFoundDev, setWifiLookupFoundDev] = useState<any | null>(null);

  // Active Cancel Countdown & Success Modal state
  const [activeCancelOrder, setActiveCancelOrder] = useState<Order | null>(null);
  const [activeSuccessOrder, setActiveSuccessOrder] = useState<Order | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Realtime button press & alerts state
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [pressingDeviceId, setPressingDeviceId] = useState<string | null>(null);
  const [activeOnlineDevices, setActiveOnlineDevices] = useState<Record<string, number>>({});
  const [cancelToast, setCancelToast] = useState<string | null>(null);
  const [throttledNotice, setThrottledNotice] = useState<string | null>(null);

  // Customer Self-Config Modal state
  const [configModalDevice, setConfigModalDevice] = useState<Device | null>(null);
  const [configCustomName, setConfigCustomName] = useState('');
  const [configProductId, setConfigProductId] = useState('');
  const [configQuantity, setConfigQuantity] = useState(1);
  const [configStatus, setConfigStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');
  const [configLoading, setConfigLoading] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const fetchData = async () => {
    try {
      const [devRes, ordRes, prodRes] = await Promise.all([
        api.get('/devices'),
        api.get('/orders'),
        api.get('/products').catch(() => ({ data: { success: false, data: [] } })),
      ]);
      if (devRes.data.success) setDevices(devRes.data.data);
      if (ordRes.data.success) setOrders(ordRes.data.data);
      if (prodRes.data?.success) setAvailableProducts(prodRes.data.data);
    } catch (e) {
      console.error('Failed to load customer data:', e);
    } finally {
      setLoading(false);
    }
  };

  const customerId = user?.customerProfileId || (user as any)?.customerProfile?.id;

  useEffect(() => {
    fetchData();

    if (customerId) {
      subscribeToCustomer(customerId);
    }
    if (user?.id && user.id !== customerId) {
      subscribeToCustomer(user.id);
    }

    const socket = getSocket();

    const markDeviceActive = (devId: string) => {
      if (!devId) return;
      setActiveOnlineDevices((prev) => ({ ...prev, [devId]: Date.now() }));
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === devId || d.id === devId
            ? { ...d, lastSeenAt: new Date().toISOString() }
            : d
        )
      );
    };

    const handleDeviceOnline = (data: any) => {
      console.log('⚡ [Customer Realtime] Device Online:', data);
      const devId = data.deviceId;
      if (devId) {
        markDeviceActive(devId);
        setDevices((prev) =>
          prev.map((d) =>
            d.deviceId === devId || d.id === devId
              ? {
                  ...d,
                  batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : d.batteryLevel,
                  wifiRSSI: data.wifiRSSI !== undefined ? data.wifiRSSI : d.wifiRSSI,
                  lastSeenAt: data.lastSeenAt || new Date().toISOString(),
                  status: data.status || d.status,
                }
              : d
          )
        );
      }
    };

    const handleOrderCreated = (data: any) => {
      console.log('⚡ [Customer Push Alert] Order Created:', data);
      const devId = data.order?.deviceId || data.deviceId || (data.order?.device?.deviceId);
      setIsPressing(true);
      if (devId) {
        setPressingDeviceId(devId);
        markDeviceActive(devId);
      }
      setTimeout(() => {
        setIsPressing(false);
        setPressingDeviceId(null);
      }, 2500);

      playOrderChime();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
      fetchData();

      if (data.order) {
        setActiveSuccessOrder(data.order);
        setActiveCancelOrder(data.order);
        setShowSuccessModal(true);
        setSecondsRemaining(data.cancelWindowSeconds || 60);
      }
    };

    const handleOrderUpdated = () => {
      fetchData();
    };

    const handleDeviceHeartbeat = (data: any) => {
      const devId = data.deviceId;
      if (devId) {
        markDeviceActive(devId);
      }
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === data.deviceId || d.id === data.deviceId
            ? {
                ...d,
                batteryLevel: data.batteryLevel !== undefined ? data.batteryLevel : d.batteryLevel,
                wifiRSSI: data.wifiRSSI !== undefined ? data.wifiRSSI : d.wifiRSSI,
                lastSeenAt: data.lastSeenAt || new Date().toISOString(),
              }
            : d
        )
      );
    };

    const handleButtonPressing = (data: any) => {
      setIsPressing(true);
      const devId = data.deviceId;
      setPressingDeviceId(devId);
      if (devId) {
        markDeviceActive(devId);
      }
      setTimeout(() => {
        setIsPressing(false);
        setPressingDeviceId(null);
      }, 2500);
    };

    const handleButtonReleased = () => {
      setIsPressing(false);
      setPressingDeviceId(null);
    };

    const handleOrderCancelled = (data: any) => {
      setIsPressing(false);
      setPressingDeviceId(null);
      setActiveCancelOrder(null);
      setShowSuccessModal(false);
      playCancelChime();
      setCancelToast(`Đơn hàng #${data.order?.orderNumber || ''} đã được HỦY THÀNH CÔNG qua nút bấm ESP32!`);
      fetchData();
      setTimeout(() => setCancelToast(null), 7000);
    };

    const handleOrderThrottled = (data: any) => {
      setIsPressing(false);
      setPressingDeviceId(null);
      setThrottledNotice(data.message || 'Đơn hàng gần đây đang được xử lý, tránh bấm lặp lại trong 30 giây.');
      setTimeout(() => setThrottledNotice(null), 6000);
    };

    const handleDeviceClaimed = () => {
      fetchData();
    };
    window.addEventListener('sob_device_claimed_success', handleDeviceClaimed);

    socket.on('ORDER_CREATED', handleOrderCreated);
    socket.on('ORDER_STATUS_CHANGED', handleOrderUpdated);
    socket.on('ORDER_CANCELLED', handleOrderCancelled);
    socket.on('DEVICE_HEARTBEAT', handleDeviceHeartbeat);
    socket.on('DEVICE_ONLINE', handleDeviceOnline);
    socket.on('device:online', handleDeviceOnline);
    socket.on('BUTTON_PRESSING', handleButtonPressing);
    socket.on('BUTTON_RELEASED', handleButtonReleased);
    socket.on('ORDER_DUPLICATE_THROTTLED', handleOrderThrottled);
    socket.on('device:claimed', handleDeviceClaimed);
    socket.on('device:wifi_changed', handleDeviceClaimed);

    return () => {
      window.removeEventListener('sob_device_claimed_success', handleDeviceClaimed);
      socket.off('ORDER_CREATED', handleOrderCreated);
      socket.off('ORDER_STATUS_CHANGED', handleOrderUpdated);
      socket.off('ORDER_CANCELLED', handleOrderCancelled);
      socket.off('DEVICE_HEARTBEAT', handleDeviceHeartbeat);
      socket.off('DEVICE_ONLINE', handleDeviceOnline);
      socket.off('device:online', handleDeviceOnline);
      socket.off('BUTTON_PRESSING', handleButtonPressing);
      socket.off('BUTTON_RELEASED', handleButtonReleased);
      socket.off('ORDER_DUPLICATE_THROTTLED', handleOrderThrottled);
      socket.off('device:claimed', handleDeviceClaimed);
      socket.off('device:wifi_changed', handleDeviceClaimed);
    };
  }, [user, customerId]);

  // Cancellation countdown timer
  useEffect(() => {
    if (!activeCancelOrder || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveCancelOrder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCancelOrder, secondsRemaining]);

  // App-triggered Quick Reorder
  const handleQuickReorder = async (deviceId: string) => {
    try {
      const res = await api.post('/orders/quick-reorder', { deviceId });
      if (res.data.success) {
        const { order, cancelWindowSeconds } = res.data.data;
        setActiveCancelOrder(order);
        setSecondsRemaining(cancelWindowSeconds || 60);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo đơn hàng');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await api.post(`/orders/${orderId}/cancel`, {
        reason: 'Khách hàng hủy đơn trong thời gian 60 giây cho phép',
      });
      if (res.data.success) {
        setActiveCancelOrder(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | null>(null);

  const handleSimulatePress = async (deviceId: string, gesture: 'SINGLE_PRESS' | 'DOUBLE_PRESS' = 'SINGLE_PRESS') => {
    setSimulatingDeviceId(deviceId);
    setIsPressing(true);
    setPressingDeviceId(deviceId);
    setActiveOnlineDevices((prev) => ({ ...prev, [deviceId]: Date.now() }));
    setDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId || d.id === deviceId ? { ...d, lastSeenAt: new Date().toISOString() } : d))
    );

    try {
      const res = await api.post(`/devices/${deviceId}/simulate-press`, { eventType: gesture });
      if (res.data.success) {
        fetchData();
        if (gesture === 'SINGLE_PRESS') {
          playOrderChime();
          confetti({ particleCount: 75, spread: 70, origin: { y: 0.5 } });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Mô phỏng bấm nút thất bại');
    } finally {
      setSimulatingDeviceId(null);
      setTimeout(() => {
        setIsPressing(false);
        setPressingDeviceId(null);
      }, 1500);
    }
  };

  const handleSimulateHold = async (deviceId: string) => {
    try {
      await api.post('/test-button-event', { event: 'hold', deviceId });
      setTimeout(async () => {
        await api.post('/test-button-event', { event: 'fail', deviceId });
      }, 3000);
    } catch (e: any) {
      console.error('Simulate hold error:', e);
    }
  };

  // Tra cứu thiết bị theo mã số
  const handleLookupCode = async (codeToSearch?: string) => {
    const code = (codeToSearch !== undefined ? codeToSearch : deviceCodeInput).trim();
    if (!code) {
      setLookupError('Vui lòng nhập mã số thiết bị');
      return;
    }
    setAddSubmitting(true);
    setLookupError(null);
    try {
      // 1. Thử gọi /devices/lookup-code
      const res = await api.post('/devices/lookup-code', { code });
      if (res.data.success && res.data.data) {
        const dev = res.data.data;
        setFoundDevice(dev);
        setCustomDeviceName(dev.customName || `Nút ${dev.product?.name || 'Đặt Hàng'}`);
        setAddStep(2);
        return;
      }
    } catch (err: any) {
      // 2. Thử fallback qua /provisioning/session
      try {
        const provRes = await api.post('/provisioning/session', { code });
        if (provRes.data.success && provRes.data.data) {
          const dev = provRes.data.data;
          setFoundDevice(dev);
          setCustomDeviceName(dev.customName || `Nút ${dev.product?.name || 'Đặt Hàng'}`);
          setAddStep(2);
          return;
        }
      } catch {}
      setLookupError(err.response?.data?.message || `Không tìm thấy thiết bị nào với mã "${code}". Vui lòng kiểm tra lại mã số trên thiết bị.`);
    } finally {
      setAddSubmitting(false);
    }
  };

  // Xác nhận liên kết thiết bị vào tài khoản khách hàng (Không cần MAC)
  const handleConfirmPair = async () => {
    if (!foundDevice) return;
    setAddSubmitting(true);
    try {
      const res = await api.post('/devices/configure-by-code', {
        code: foundDevice.pairingCode || foundDevice.deviceId,
        customName: customDeviceName,
      });
      if (res.data.success) {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.5 } });
        setAddStep(3);
        fetchData();
        return;
      }
    } catch (err: any) {
      try {
        await api.post(`/devices/${foundDevice.deviceId}/claim`);
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.5 } });
        setAddStep(3);
        fetchData();
        return;
      } catch {}
      alert(err.response?.data?.message || 'Không thể liên kết thiết bị vào tài khoản');
    } finally {
      setAddSubmitting(false);
    }
  };

  // Tra cứu mã số thiết bị trong modal đổi Wi-Fi
  const handleLookupWifiCode = async (codeToLookup?: string) => {
    const code = (codeToLookup !== undefined ? codeToLookup : wifiCodeInput).trim();
    if (!code) return;
    setWifiLookupLoading(true);
    setWifiLookupError(null);
    try {
      const res = await api.post('/devices/lookup-code', { code });
      if (res.data.success && res.data.data) {
        setWifiLookupFoundDev(res.data.data);
        setChangeWifiDevice(res.data.data);
        setWifiSelectedDevId(res.data.data.deviceId);
        return;
      }
    } catch (e: any) {
      try {
        const provRes = await api.post('/provisioning/session', { code });
        if (provRes.data.success && provRes.data.data) {
          setWifiLookupFoundDev(provRes.data.data);
          setChangeWifiDevice(provRes.data.data);
          setWifiSelectedDevId(provRes.data.data.deviceId);
          return;
        }
      } catch {}
      setWifiLookupError(`Không tìm thấy nút bấm với mã "${code}". Vui lòng kiểm tra lại.`);
    } finally {
      setWifiLookupLoading(false);
    }
  };

  // Cập nhật cấu hình Wi-Fi trực tiếp trên Web
  const handleSaveWifiOnWeb = async (devToConfig?: Device | null) => {
    const targetDev = devToConfig || changeWifiDevice || wifiLookupFoundDev || devices.find(d => d.deviceId === wifiSelectedDevId) || devices[0];
    if (!targetDev) {
      alert('Vui lòng nhập mã số nút hoặc chọn nút bấm trước khi đổi Wi-Fi');
      return;
    }
    const finalSsid = isCustomWifiInput ? customWifiInputVal.trim() : wifiSsidInput.trim();
    if (!finalSsid) {
      alert('Vui lòng nhập hoặc chọn Tên mạng Wi-Fi (SSID)');
      return;
    }
    setWifiUpdating(true);
    setWifiSuccessMsg(null);
    try {
      const res = await api.post(`/devices/${targetDev.deviceId}/change-wifi`, {
        ssid: finalSsid,
        password: wifiPasswordInput,
      });
      if (res.data.success) {
        setWifiSuccessMsg(`🟢 ĐÈN LED NÚT ĐÃ CHUYỂN SANG XANH LÁ!\nĐã cập nhật cấu hình mạng Wi-Fi "${finalSsid}" cho nút ${targetDev.deviceId} thành công trực tiếp trên Web. Nút đã sẵn sàng bấm đặt hàng ngay, không cần vào 192.168.4.1.`);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu cấu hình Wi-Fi');
    } finally {
      setWifiUpdating(false);
    }
  };

  // Bắn Wi-Fi qua Web Bluetooth trực tiếp xuống ESP32
  const handleDirectBleWifiWrite = async (devToConfig?: Device | null) => {
    const targetDev = devToConfig || changeWifiDevice || wifiLookupFoundDev || devices[0];
    const finalSsid = isCustomWifiInput ? customWifiInputVal.trim() : wifiSsidInput.trim();
    if (!finalSsid) {
      alert('Vui lòng chọn hoặc nhập tên mạng Wi-Fi');
      return;
    }

    try {
      const nav = (navigator as any).bluetooth;
      if (!nav) {
        alert('Trình duyệt chưa hỗ trợ Web Bluetooth. Vui lòng mở bằng Google Chrome hoặc Microsoft Edge.');
        return;
      }
      setWifiUpdating(true);
      const device = await nav.requestDevice({
        filters: [{ namePrefix: 'SmartOrder' }, { namePrefix: 'Smart' }, { namePrefix: 'ESP' }],
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb', 0xfff0],
      });

      if (device && device.gatt) {
        const server = await device.gatt.connect();
        let service: any;
        try {
          service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
        } catch {
          service = await server.getPrimaryService(0xfff0);
        }

        if (service) {
          const char = await service.getCharacteristic('0000fff2-0000-1000-8000-00805f9b34fb');
          const payload = `${finalSsid}:${wifiPasswordInput}`;
          const encoded = new TextEncoder().encode(payload);
          if (typeof (char as any).writeValueWithoutResponse === 'function') {
            await (char as any).writeValueWithoutResponse(encoded).catch(() => {});
          } else {
            await char.writeValue(encoded).catch(() => {});
          }
        }
      }

      await handleSaveWifiOnWeb(targetDev);
    } catch (err: any) {
      setWifiUpdating(false);
      if (err.name !== 'NotFoundError') {
        alert(err.message || 'Không thể truyền qua Bluetooth');
      }
    }
  };

  // Transfer device submit
  const handleTransferSubmit = async () => {
    if (!transferringDevice) return;
    try {
      const res = await api.post(`/devices/${transferringDevice.deviceId}/transfer`);
      if (res.data.success) {
        setTransferResult(res.data.data);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể chuyển nhượng');
    }
  };

  // Open & Save Customer Self-Config Modal
  const openConfigModal = (dev: Device) => {
    setConfigModalDevice(dev);
    setConfigCustomName(dev.customName || dev.configuration?.customName || '');
    setConfigProductId(dev.productId || dev.configuration?.productId || '');
    setConfigQuantity(dev.configuration?.defaultQuantity || 1);
    setConfigStatus(dev.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE');
    setConfigSuccessMsg(null);
    setConfigError(null);
  };

  const handleSaveConfig = async () => {
    if (!configModalDevice) return;
    if (!configProductId) {
      setConfigError('Vui lòng chọn sản phẩm gán cho nút');
      return;
    }
    setConfigLoading(true);
    setConfigError(null);
    try {
      const res = await api.put(`/devices/${configModalDevice.id}/customer-config`, {
        customName: configCustomName,
        productId: configProductId,
        defaultQuantity: configQuantity,
        status: configStatus,
      });
      if (res.data.success) {
        setConfigSuccessMsg('Đã lưu cấu hình nút thành công!');
        fetchData();
        setTimeout(() => {
          setConfigModalDevice(null);
          setConfigSuccessMsg(null);
        }, 1000);
      }
    } catch (err: any) {
      setConfigError(err.response?.data?.message || 'Không thể lưu cấu hình nút');
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Order Success Celebration Modal */}
      {showSuccessModal && activeSuccessOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-200">
            {/* Top Header Banner */}
            <div className="bg-[#10B981] p-6 text-white text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-2">
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Nút Bấm Đã Kích Hoạt</span>
              </div>

              <h3 className="text-xl font-bold tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-200" />
                <span>Đã Tạo Đơn Hàng Thành Công!</span>
              </h3>
              <p className="text-xs text-emerald-100 mt-1 max-w-xs mx-auto">
                Tín hiệu từ nút bấm đã được chuyển tiếp ngay tới trạm đại lý.
              </p>
            </div>

            {/* Order Details Body */}
            <div className="p-5 space-y-4">
              {/* Receipt Box */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Mã Đơn Hàng</span>
                    <p className="font-mono font-bold text-sm text-[#0F172A]">{activeSuccessOrder.orderNumber}</p>
                  </div>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#FFFBEB] text-[#F59E0B] border border-amber-200">
                    CHỜ GIAO HÀNG
                  </span>
                </div>

                {/* Product Items */}
                <div className="space-y-1.5">
                  {activeSuccessOrder.items?.map((it: any) => (
                    <div key={it.id || it.productName} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-[11px]">
                          {it.quantity}x
                        </span>
                        <span className="font-semibold text-[#0F172A]">{it.productName}</span>
                      </div>
                      <span className="font-bold text-[#0F172A]">{it.totalPrice?.toLocaleString()} ₫</span>
                    </div>
                  ))}
                </div>

                {/* Total & Delivery Address */}
                <div className="pt-2 border-t border-[#E2E8F0] space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-[#0F172A]">
                    <span>Tổng tiền thanh toán:</span>
                    <span className="text-[#10B981] font-bold text-sm">{activeSuccessOrder.totalAmount?.toLocaleString()} ₫</span>
                  </div>
                  <div className="flex items-start gap-1 text-[11px] text-[#64748B] pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
                    <span className="truncate">Giao đến: {activeSuccessOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* Cancel Countdown Notice */}
              {secondsRemaining > 0 && (
                <div className="p-3.5 bg-[#FFFBEB] border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
                      Thời gian hủy miễn phí:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#92400E] bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-sm">
                      00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}s
                    </span>
                  </div>

                  <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#F59E0B] h-full transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${(secondsRemaining / ((activeSuccessOrder as any).cancelWindowSeconds || 60)) * 100}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#92400E] flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 text-[#F59E0B]" />
                    <span><strong>Mẹo:</strong> Nhấn đúp 2 lần trên nút vật lý để hủy tức thì.</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {secondsRemaining > 0 && (
                  <button
                    onClick={() => {
                      handleCancelOrder(activeSuccessOrder.id);
                      setShowSuccessModal(false);
                    }}
                    className="w-full h-11 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>HỦY ĐƠN HÀNG NÀY (00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}s)</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>ĐÃ HIỂU — THEO DÕI ĐƠN HÀNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Welcoming Header - Bright & Fresh Clean Workspace */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#2563EB] border border-blue-200">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Nút Bấm Thông Minh • 1 Chạm Tiếp Tế Nhu Yếu Phẩm</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Xin chào, {user?.fullName || 'Quý Cư Dân'}!
              </h1>
              <p className="text-sm text-[#475569] mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>Đại lý phục vụ: <strong className="text-[#0F172A]">{user?.store?.name || 'Đại lý Nước & Gas Gia Định'}</strong></span>
                </span>
                <span className="text-[#CBD5E1] hidden sm:inline">•</span>
                <span>Căn hộ: <strong className="text-[#0F172A]">{(user as any)?.customerProfile?.apartment || '1204 - Sapphire'}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#64748B]">Nút Hoạt Động</div>
                <div className="text-lg font-bold text-[#0F172A]">{devices.length} <span className="text-xs font-normal text-[#64748B]">thiết bị</span></div>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#10B981]">
                <Battery className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#64748B]">Tình Trạng Pin</div>
                <div className="text-lg font-bold text-[#10B981]">Khỏe <span className="text-xs font-normal text-[#64748B]">(96%)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancelled Success Toast */}
      {cancelToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{cancelToast}</span>
          </div>
          <button onClick={() => setCancelToast(null)} className="p-1 hover:bg-emerald-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Throttled Anti-Spam Notice */}
      {throttledNotice && (
        <div className="p-4 bg-amber-600 text-white rounded-2xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{throttledNotice}</span>
          </div>
          <button onClick={() => setThrottledNotice(null)} className="p-1 hover:bg-amber-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cancellation Grace Period Floating Banner */}
      {!showSuccessModal && activeCancelOrder && secondsRemaining > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider opacity-95">Đơn hàng mới tạo từ nút ESP32</p>
            </div>
            <p className="text-xs font-medium">
              Mã #{activeCancelOrder.orderNumber} • Hủy miễn phí: <strong className="font-mono">00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}s</strong>
            </p>
            <p className="text-[10px] text-amber-100 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Nhấn đúp 2 lần trên nút ESP32 để hủy ngay</span>
            </p>
          </div>
          <button
            onClick={() => handleCancelOrder(activeCancelOrder.id)}
            className="px-3.5 py-2 bg-white text-rose-700 text-xs font-bold rounded-xl shadow hover:bg-slate-100 btn-press shrink-0 ml-2"
          >
            Hủy Đơn
          </button>
        </div>
      )}

      {/* Main Grid: Left = Buttons, Right = Orders History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Smart Buttons */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  Nút Bấm Của Bạn ({devices.length})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Thiết bị IoT một chạm đặt nhu yếu phẩm
                </p>
              </div>
            </div>

            {/* Scan & Connect Button */}
            <button
              type="button"
              onClick={() => setShowAirPodsModal(true)}
              className="h-11 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Bluetooth className="w-4 h-4" />
              <span>+ Thêm Thiết Bị</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-[#64748B] bg-white rounded-2xl border border-[#E2E8F0]">
              <div className="w-6 h-6 mx-auto mb-2 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
              Đang tải danh sách nút bấm...
            </div>
          ) : devices.length === 0 ? (
            <div className="p-10 bg-white border border-[#E2E8F0] rounded-2xl text-center space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                <Radio className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#0F172A]">Chưa có nút bấm nào</h4>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                  Bạn chưa liên kết nút bấm nào. Bấm "+ Thêm Thiết Bị" để ghép nối 1-chạm tức thì.
                </p>
              </div>
              <button
                onClick={() => setShowAirPodsModal(true)}
                className="h-12 px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm"
              >
                <Bluetooth className="w-4 h-4" />
                <span>Ghép Nối Nút Bấm Ngay</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((dev) => {
                const config = dev.configuration;
                const product = config?.product;

                const isDevicePressing = isPressing && (pressingDeviceId === dev.deviceId || pressingDeviceId === dev.id);
                const isRecentlyActive = !!activeOnlineDevices[dev.deviceId] && (Date.now() - activeOnlineDevices[dev.deviceId] < 90000);
                const isOnline = isRecentlyActive || (dev.lastSeenAt && (Date.now() - new Date(dev.lastSeenAt).getTime() < 90000));

                // Fallback image based on product category
                const productImg = product?.imageUrl || 
                  (product?.name?.includes('gas') ? 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80'
                  : product?.name?.includes('Gạo') ? 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80'
                  : product?.name?.includes('Khải Hoàn') || product?.name?.includes('mắm') ? 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80'
                  : 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80');

                return (
                  <div
                    key={dev.id}
                    className={`bg-white border rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all space-y-5 ${
                      isDevicePressing
                        ? 'border-[#2563EB] ring-2 ring-blue-200'
                        : 'border-[#E2E8F0] hover:border-blue-300'
                    }`}
                  >
                    {/* Header info: Status, ID & Battery */}
                    <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                          {dev.deviceId}
                        </span>
                        
                        {/* Device Status (Icon + Color + Text) */}
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#10B981] border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                            <span>● Đang hoạt động</span>
                          </span>
                        ) : dev.status === 'DISABLED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#EF4444] border border-red-200">
                            <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                            <span>● Tạm khóa</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                            <span>○ Chế độ chờ (Deep Sleep)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Battery className="w-4 h-4 text-[#10B981]" />
                          <span>{dev.batteryLevel ?? 96}%</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Wifi className="w-4 h-4 text-[#2563EB]" />
                          <span>{dev.wifiRSSI ?? -55} dBm</span>
                        </span>
                      </div>
                    </div>

                    {/* Main Body: Product visual, Title & Physical Tactile Button */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] shrink-0 shadow-sm">
                          <img
                            src={productImg}
                            alt={product?.name || 'Sản phẩm'}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                            {config?.customName || dev.customName || 'Nút Nhu Yếu Phẩm'}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] truncate">
                            {product?.name || 'Nước Khoáng Lavie 19L'}
                          </h3>
                          <div className="text-base font-bold text-[#2563EB]">
                            {((product?.price || 65000) * (config?.defaultQuantity || 1)).toLocaleString()} ₫
                          </div>
                          <p className="text-xs text-[#64748B]">
                            Đại lý phục vụ: <strong>{user?.store?.name || 'Đại lý Nước & Gas Gia Định'}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Smart Button Visual Identity - Tangible Hardware Puck */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSimulatePress(dev.deviceId, 'SINGLE_PRESS')}
                          disabled={simulatingDeviceId === dev.deviceId || dev.status === 'DISABLED'}
                          className={`relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 group shadow-md hover:shadow-lg ${
                            isDevicePressing
                              ? 'bg-slate-200 border-blue-400 scale-95 translate-y-1 shadow-inner'
                              : 'bg-gradient-to-b from-white to-slate-100 border-[#E2E8F0] hover:border-blue-400 hover:-translate-y-0.5 active:scale-95'
                          }`}
                          title="Bấm nút vật lý để kích hoạt đơn hàng"
                        >
                          {/* Soft Blue LED Diffuser Ring */}
                          <div
                            className={`absolute inset-1 rounded-full border transition-all ${
                              isDevicePressing
                                ? 'border-[#2563EB] bg-blue-100/50 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                                : isOnline
                                ? 'border-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                                : 'border-transparent'
                            }`}
                          />

                          {/* Center Tactile Mechanical Keycap */}
                          <div
                            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                              isDevicePressing
                                ? 'bg-[#2563EB] border-[#1D4ED8] text-white scale-90 shadow-inner'
                                : 'bg-[#2563EB] border-[#3B82F6] text-white shadow group-hover:scale-105'
                            }`}
                          >
                            <Radio className={`w-6 h-6 ${simulatingDeviceId === dev.deviceId ? 'animate-spin' : isDevicePressing ? 'animate-pulse' : ''}`} />
                          </div>

                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#475569] mt-1">
                            {isDevicePressing ? 'Đang bấm' : 'Bấm Đặt'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Elderly-Friendly Quantity & Primary Action Row */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between sm:justify-start gap-3 px-4 h-12 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                        <span className="text-xs font-bold text-[#475569]">Số lượng:</span>
                        <div className="flex items-center gap-2 font-mono font-bold text-base text-[#0F172A]">
                          <span className="px-3 py-1 bg-white border border-[#CBD5E1] rounded-lg shadow-sm">
                            {config?.defaultQuantity || 1}
                          </span>
                        </div>
                      </div>

                      {/* Primary Action Button: 50px height, #2563EB */}
                      <button
                        type="button"
                        onClick={() => handleQuickReorder(dev.deviceId)}
                        className="flex-1 h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        <span>🛒 ĐẶT HÀNG NGAY</span>
                      </button>

                      {/* Config & Wi-Fi Secondary Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openConfigModal(dev)}
                          className="h-12 px-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs flex items-center gap-1.5 transition-colors"
                          title="Cấu hình sản phẩm và số lượng"
                        >
                          <Sliders className="w-4 h-4 text-[#64748B]" />
                          <span>Cấu Hình</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setChangeWifiDevice(dev)}
                          className="h-12 px-3.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs flex items-center gap-1.5 transition-colors"
                          title="Cài đặt lại Wi-Fi"
                        >
                          <Wifi className="w-4 h-4 text-[#64748B]" />
                          <span>Đổi Wi-Fi</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Cancellation Row if Order is PENDING */}
                    {activeCancelOrder && (activeCancelOrder.deviceId === dev.id || (activeCancelOrder as any).device?.id === dev.id) && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(activeCancelOrder.id)}
                          className="w-full h-12 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border border-red-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          <span>✕ HỦY ĐƠN HÀNG NÀY (TRONG CỬA SỔ {secondsRemaining}S)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Order History & Real-Time Delivery Radar */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Order Live Tracker */}
          {(() => {
            const activeOrder =
              activeCancelOrder ||
              orders.find((o) =>
                ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING'].includes(o.status)
              ) ||
              (orders.length > 0 ? orders[0] : null);

            if (!activeOrder) return null;

            return (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <DeliveryProgressTracker
                  order={activeOrder}
                  onCancelOrder={handleCancelOrder}
                />
              </div>
            );
          })()}

          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Lịch Sử Đặt Hàng
              </h2>
            </div>
            <span className="text-xs text-[#64748B]">5 đơn gần nhất</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#0F172A] font-semibold">Chưa có đơn hàng nào</p>
              <p className="text-[11px] text-[#64748B]">Đơn hàng tạo từ nút bấm sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const isPending = order.status === 'PENDING';
                const statusMap: Record<string, { label: string; dot: string; cls: string }> = {
                  PENDING: { label: 'Chờ xác nhận (Có thể hủy)', dot: 'bg-amber-500', cls: 'bg-[#FFFBEB] text-[#92400E] border-amber-200' },
                  CONFIRMED: { label: 'Đã xác nhận', dot: 'bg-blue-500', cls: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200' },
                  PREPARING: { label: 'Đang đóng gói', dot: 'bg-blue-600', cls: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200' },
                  SHIPPING: { label: 'Đang giao hàng', dot: 'bg-blue-600', cls: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200' },
                  COMPLETED: { label: 'Giao thành công', dot: 'bg-emerald-500', cls: 'bg-[#ECFDF5] text-[#10B981] border-emerald-200' },
                  CANCELLED: { label: 'Đã hủy', dot: 'bg-red-400', cls: 'bg-[#FEF2F2] text-[#EF4444] border-red-200' },
                };
                const statusInfo = statusMap[order.status] || { label: order.status, dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600 border-slate-200' };

                return (
                  <div
                    key={order.id}
                    className={`bg-white border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs space-y-3 transition-all ${
                      isPending
                        ? 'bg-[#EFF6FF]/40 border-blue-300 ring-1 ring-blue-200'
                        : 'border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#0F172A] text-xs">
                        #{order.orderNumber}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-[#475569]">
                          <span className="font-semibold">{it.quantity}x {it.productName}</span>
                          <span className="font-bold text-[#0F172A]">{it.totalPrice.toLocaleString()} ₫</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-[#64748B] pt-2.5 border-t border-[#E2E8F0] flex justify-between items-center">
                      <span>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>Tổng tiền: <strong className="text-sm font-bold text-[#0F172A]">{order.totalAmount.toLocaleString()} ₫</strong></span>
                    </div>

                    {/* Quick Cancel Action directly on order card if PENDING */}
                    {isPending && (
                      <div className="pt-1">
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="w-full h-10 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>HỦY ĐƠN HÀNG NÀY (TRONG CỬA SỔ 60S)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 2. BẢNG CẤU HÌNH MẠNG WI-FI (TRỰC TIẾP TRÊN WEB HOẶC QUA THIẾT BỊ)       */}
      {/* ========================================================================= */}
      {changeWifiDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 border border-[#E2E8F0] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-blue-200">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Cấu Hình Mạng Wi-Fi Nút Bấm
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Chỉ cần chọn mạng & nhập mật khẩu để nút tự kết nối
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setChangeWifiDevice(null);
                  setShowWifiWebModal(false);
                  setWifiSuccessMsg(null);
                }}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* THÔNG TIN THIẾT BỊ ĐÃ CHỌN */}
            {(changeWifiDevice || wifiLookupFoundDev) && (
              <div className="p-3.5 bg-[#ECFDF5] border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
                  <div>
                    <p className="font-mono font-bold text-[#065F46]">
                      {(changeWifiDevice || wifiLookupFoundDev)?.deviceId} — {(changeWifiDevice || wifiLookupFoundDev)?.customName || (changeWifiDevice || wifiLookupFoundDev)?.product?.name || 'Smart Order Button'}
                    </p>
                    <p className="text-[11px] text-[#047857]">
                      {(changeWifiDevice || wifiLookupFoundDev)?.product?.name ? `Sản phẩm gán: ${(changeWifiDevice || wifiLookupFoundDev)?.product?.name}` : 'Sẵn sàng nạp Wi-Fi'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#10B981] text-white font-mono text-[10px] font-bold shrink-0">
                  SẴN SÀNG CẤU HÌNH
                </span>
              </div>
            )}

            {/* THÔNG BÁO THÀNH CÔNG NẾU ĐÃ LƯU */}
            {wifiSuccessMsg && (
              <div className="p-3.5 bg-[#ECFDF5] border-2 border-[#10B981] rounded-xl text-xs text-[#065F46] font-semibold space-y-1 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2 font-bold text-[#065F46]">
                  <Check className="w-4 h-4 shrink-0 text-[#10B981]" />
                  <span>CẬP NHẬT WI-FI THÀNH CÔNG!</span>
                </div>
                <p className="text-[11px] leading-relaxed whitespace-pre-line text-[#047857]">
                  {wifiSuccessMsg}
                </p>
              </div>
            )}

            {/* DANH SÁCH MẠNG WI-FI 2.4GHz CHỌN LIỀN 1-CHẠM */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#0F172A] font-bold px-1">
                <span>Chọn Mạng Wi-Fi 2.4GHz:</span>
                <span className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
                  <Signal className="w-3 h-3 text-[#10B981]" />
                  Sóng khả dụng quanh bạn
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {['Tan Tai', 'Tan Tai 2', 'FPT Telecom-E4C9-IOT', 'Ho Mau Thuong 1', 'EZVIZ_C27537675'].map((net) => {
                  const isSelected = !isCustomWifiInput && wifiSsidInput === net;
                  return (
                    <button
                      key={net}
                      type="button"
                      onClick={() => {
                        setIsCustomWifiInput(false);
                        setWifiSsidInput(net);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm ring-1 ring-blue-400'
                          : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          <Wifi className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0F172A] truncate">
                            {net}
                          </p>
                          <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> WPA2 • Sóng mạnh
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tùy chọn nhập Wi-Fi khác */}
              <div className="pt-0.5">
                {!isCustomWifiInput ? (
                  <button
                    type="button"
                    onClick={() => setIsCustomWifiInput(true)}
                    className="text-[11px] text-[#2563EB] hover:underline font-semibold flex items-center gap-1 px-1"
                  >
                    <span>+ Nhập tên mạng khác (SSID ẩn)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0F172A]">
                        Tên Mạng Wi-Fi Khác:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomWifiInput(false)}
                        className="text-[11px] text-[#64748B] hover:text-[#0F172A]"
                      >
                        Quay lại danh sách
                      </button>
                    </div>
                    <input
                      type="text"
                      value={customWifiInputVal}
                      onChange={(e) => setCustomWifiInputVal(e.target.value)}
                      placeholder="Nhập tên mạng Wi-Fi..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* MẬT KHẨU WI-FI */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Mật Khẩu Wi-Fi:
              </label>
              <div className="relative">
                <input
                  type={showWifiPassword ? 'text' : 'password'}
                  value={wifiPasswordInput}
                  onChange={(e) => setWifiPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu Wi-Fi của bạn"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] font-medium pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowWifiPassword(!showWifiPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#2563EB]"
                >
                  {showWifiPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-[#EFF6FF] border border-blue-200 rounded-xl text-[11px] text-[#2563EB] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span><strong>Cấu hình 1 Chạm:</strong> Lưu trực tiếp trên Web — Đèn viền nút sẽ tự đổi sang XANH LÁ ngay khi vào mạng.</span>
            </div>

            {/* NÚT THAO TÁC CHÍNH */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleSaveWifiOnWeb(changeWifiDevice)}
                disabled={wifiUpdating || (!wifiSsidInput.trim() && !customWifiInputVal.trim())}
                className="w-full h-12 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {wifiUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ĐANG NẠP CẤU HÌNH WI-FI XUỐNG NÚT...</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span>LƯU CẤU HÌNH WI-FI (ĐÈN CHUYỂN XANH LÁ)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDirectBleWifiWrite(changeWifiDevice)}
                disabled={wifiUpdating}
                className="w-full h-10 px-4 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Bluetooth className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Bắn Qua Bluetooth 1-Chạm (Nếu Nút Đang Bật Gần Máy)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRANSFER DEVICE MODAL (CHUYỂN NHƯỢNG NÚT SANG CHỦ MỚI)                */}
      {/* ========================================================================= */}
      {transferringDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#0F172A]">Chuyển Nhượng Nút Bấm</h3>
              </div>
              <button onClick={() => setTransferringDevice(null)} className="p-1 text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!transferResult ? (
              <div className="space-y-3">
                <p className="text-xs text-[#475569]">
                  Khi bạn chuyển nhượng nút <strong>{transferringDevice.deviceId}</strong>, bạn sẽ chuyển quyền quản lý nút này cho chủ mới.
                </p>
                <button
                  onClick={handleTransferSubmit}
                  className="w-full h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs"
                >
                  XÁC NHẬN CHUYỂN NHƯỢNG
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                <h4 className="text-sm font-bold text-[#0F172A]">Đã Tạo Mã Chuyển Nhượng Mới!</h4>
                <p className="text-xs text-[#0F172A] font-mono break-all p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left">
                  {transferResult.pairingCode || transferResult.claimCode || transferResult.deviceId || transferResult.qrPayload}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Hãy gửi mã số này cho chủ mới để họ kích hoạt trong ứng dụng.
                </p>
                <button
                  onClick={() => setTransferringDevice(null)}
                  className="px-6 h-10 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs"
                >
                  ĐÓNG
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. USER TỰ CẤU HÌNH NÚT BẤM MODAL                                         */}
      {/* ========================================================================= */}
      {configModalDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 border border-[#E2E8F0] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Tự Cấu Hình Nút Bấm
                  </h3>
                  <p className="text-xs font-mono text-[#64748B]">
                    Mã định danh: <span className="font-bold text-[#2563EB]">{configModalDevice.deviceId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigModalDevice(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Alerts */}
            {configError && (
              <div className="p-3 bg-[#FEF2F2] border border-red-200 rounded-xl text-xs text-[#EF4444] flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{configError}</span>
              </div>
            )}
            {configSuccessMsg && (
              <div className="p-3 bg-[#ECFDF5] border border-emerald-200 rounded-xl text-xs text-[#10B981] flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            {/* Device Diagnostics Overview */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#64748B] uppercase font-mono">Pin thiết bị</span>
                <p className="font-bold text-[#0F172A] flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-[#10B981]" />
                  {configModalDevice.batteryLevel ?? 100}%
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#64748B] uppercase font-mono">Thời hạn dùng</span>
                <p className="font-bold text-[#0F172A] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  {configModalDevice.expiresAt ? new Date(configModalDevice.expiresAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#64748B] uppercase font-mono">Trạng thái</span>
                <p className="font-bold">
                  {configStatus === 'ACTIVE' ? (
                    <span className="text-[#10B981]">Đang bật</span>
                  ) : (
                    <span className="text-[#EF4444]">Tạm khóa</span>
                  )}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* 1. Tên gợi nhớ */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Tên Gợi Nhớ Nút (Ví dụ: Nước Bếp, Nước Phòng Khách, Gas Kho)
                </label>
                <input
                  type="text"
                  value={configCustomName}
                  onChange={(e) => setConfigCustomName(e.target.value)}
                  placeholder="Nhập tên nút..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* 2. Chọn sản phẩm đặt khi bấm */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Sản Phẩm Đặt Khi Bấm Nút
                </label>
                <select
                  value={configProductId}
                  onChange={(e) => setConfigProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="">-- Chọn sản phẩm muốn gán cho nút --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit}) - {p.price.toLocaleString()} ₫
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Mỗi khi bạn bấm nút này trên bàn, server sẽ tự động tạo đơn đặt mặt hàng này.
                </p>
              </div>

              {/* 3. Số lượng mỗi lần bấm */}
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Số Lượng Đặt Mỗi Lần Bấm
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfigQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold flex items-center justify-center text-base"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={configQuantity}
                    onChange={(e) => setConfigQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-20 text-center py-2 text-sm font-mono font-bold rounded-xl bg-white border border-[#CBD5E1] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setConfigQuantity((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold flex items-center justify-center text-base"
                  >
                    +
                  </button>
                  <span className="text-xs text-[#64748B] font-medium">
                    (Ví dụ: 1 bình, 2 bình, 5 bình...)
                  </span>
                </div>
              </div>

              {/* 4. Trạng thái hoạt động (Còn xài hay không) */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Cho Phép Đặt Hàng Từ Nút Này</span>
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Tạm khóa nút nếu bạn đi vắng hoặc sợ trẻ nhỏ nghịch bấm nhầm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfigStatus((prev) => (prev === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    configStatus === 'ACTIVE' ? 'bg-[#10B981]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      configStatus === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfigModalDevice(null)}
                className="flex-1 h-11 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] font-bold text-xs"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={configLoading}
                className="flex-1 h-11 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {configLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ĐANG LƯU...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>LƯU CẤU HÌNH</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apple-Style AirPods White Device Pairing Modal */}
      <WhiteDeviceAirPodsModal
        isOpen={showAirPodsModal}
        onClose={() => setShowAirPodsModal(false)}
        onDeviceBound={() => {
          fetchData();
        }}
      />
    </div>
  );
};
