import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { subscribeToStore, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/OrderSoundContext';
import { AnalyticsChart } from '../../components/AnalyticsChart';
import { Order } from '../../types';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  Phone,
  MapPin,
  Radio,
  DollarSign,
  Calendar,
  ChevronRight,
  TrendingUp,
  X,
  Volume2,
  Sparkles,
  Search,
  Filter,
  Boxes,
  Package,
  Zap,
  Camera,
  Plus,
  Save,
  Trash2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { StoreCatalogItem, getStoreCatalog, saveStoreCatalog } from '../../data/storeProductsData';

export const StoreDashboard: React.FC = () => {
  const { user } = useAuth();
  const { announceStoreOrder, testStoreBankSpeaker } = useSound();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'NEWEST' | 'OLDEST'>('PRIORITY');
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Inventory state with exact number input & image upload
  const [showInventoryModal, setShowInventoryModal] = useState<boolean>(false);
  const [inventoryList, setInventoryList] = useState<StoreCatalogItem[]>(() => getStoreCatalog());
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('Tất cả');
  const [showAddProductForm, setShowAddProductForm] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<StoreCatalogItem['category']>('Nước mắm');
  const [newProdUnit, setNewProdUnit] = useState('Chai 520ml');
  const [newProdPrice, setNewProdPrice] = useState<number>(45000);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdImage, setNewProdImage] = useState<string>('');

  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const [orderRes, analyticsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/analytics/dashboard').catch(() => ({ data: { success: false } })),
      ]);
      if (orderRes.data.success) {
        setOrders(orderRes.data.data);
      }
      if (analyticsRes.data?.success && analyticsRes.data.data?.chartData) {
        setChartData(analyticsRes.data.data.chartData);
      }
    } catch (e) {
      console.error('Failed to fetch store orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    if (user?.storeId) {
      subscribeToStore(user.storeId);
    }

    const socket = getSocket();

    const handleOrderCreated = (payload: any) => {
      console.log('⚡ [Store Live Feed] Order Created:', payload);
      const incomingId = payload.order?.id;
      if (incomingId) {
        setHighlightOrderId(incomingId);
        setTimeout(() => {
          setHighlightOrderId(null);
        }, 1500);
      }

      setNewOrderAlert({
        type: 'CREATE',
        orderNumber: payload.order?.orderNumber,
        customerName: payload.customerName || payload.order?.customerName,
        productName: payload.productName,
        quantity: payload.quantity,
        totalAmount: payload.order?.totalAmount,
        deliveryAddress: payload.order?.deliveryAddress,
        orderId: payload.order?.id,
      });
      fetchOrders();
    };

    const handleOrderCancelled = (payload: any) => {
      console.log('❌ [Store Live Feed] Order Cancelled:', payload);
      setNewOrderAlert({
        type: 'CANCEL',
        orderNumber: payload.order?.orderNumber,
        reason: payload.reason || 'Khách bấm nút hủy đơn trên Smart Button',
      });
      fetchOrders();
      setTimeout(() => {
        setNewOrderAlert(null);
      }, 8000);
    };

    const handleOrderUpdated = () => {
      fetchOrders();
    };

    socket.on('ORDER_CREATED', handleOrderCreated);
    socket.on('ORDER_STATUS_CHANGED', handleOrderUpdated);
    socket.on('ORDER_CANCELLED', handleOrderCancelled);

    return () => {
      socket.off('ORDER_CREATED', handleOrderCreated);
      socket.off('ORDER_STATUS_CHANGED', handleOrderUpdated);
      socket.off('ORDER_CANCELLED', handleOrderCancelled);
    };
  }, [user]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus as any } : o))
        );
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Handle Exact Stock Change (Direct manual input)
  const handleStockChange = (id: string, val: string | number) => {
    const num = Math.max(0, parseInt(String(val), 10) || 0);
    setInventoryList((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, stock: num } : item));
      saveStoreCatalog(updated);
      return updated;
    });
  };

  // Handle Image Upload for existing product
  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      setInventoryList((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...item, imageUrl: base64Url } : item));
        saveStoreCatalog(updated);
        return updated;
      });
      showToast('Đã gắn ảnh mới cho sản phẩm thành công!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Paste Image URL
  const handleImageUrlPrompt = (id: string, currentUrl: string) => {
    const url = prompt('Nhập đường link ảnh (URL) mới cho sản phẩm:', currentUrl);
    if (url && url.trim()) {
      setInventoryList((prev) => {
        const updated = prev.map((item) => (item.id === id ? { ...item, imageUrl: url.trim() } : item));
        saveStoreCatalog(updated);
        return updated;
      });
      showToast('Đã gắn link ảnh cho sản phẩm!');
    }
  };

  // Delete product from inventory
  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${name}" khỏi kho cửa hàng?`)) {
      setInventoryList((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveStoreCatalog(updated);
        return updated;
      });
      showToast(`Đã xóa sản phẩm "${name}" khỏi kho`);
    }
  };

  // Add new store product
  const handleAddNewProduct = () => {
    if (!newProdName.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    const newProduct: StoreCatalogItem = {
      id: `custom-prod-${Date.now()}`,
      sku: `CUSTOM-${Date.now().toString().slice(-6)}`,
      name: newProdName.trim(),
      brand: newProdBrand.trim() || 'Cửa hàng',
      category: newProdCategory,
      unit: newProdUnit.trim() || 'Chai',
      price: newProdPrice || 0,
      stock: Math.max(0, newProdStock || 0),
      minStockAlert: 10,
      imageUrl: newProdImage.trim() || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=600&q=80',
      description: 'Sản phẩm do chủ cửa hàng thêm và quản lý trực tiếp.',
      badge: 'Sản phẩm quán',
      rating: 5.0,
    };

    setInventoryList((prev) => {
      const updated = [newProduct, ...prev];
      saveStoreCatalog(updated);
      return updated;
    });

    setNewProdName('');
    setNewProdBrand('');
    setNewProdImage('');
    setNewProdStock(50);
    setNewProdPrice(45000);
    setShowAddProductForm(false);
    showToast(`Đã thêm sản phẩm "${newProduct.name}" vào kho hàng!`);
  };

  // Filtered inventory list
  const filteredInventory = inventoryList.filter((item) => {
    const matchCategory = inventoryCategory === 'Tất cả' || item.category === inventoryCategory;
    const matchSearch =
      !inventorySearch.trim() ||
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      item.category.toLowerCase().includes(inventorySearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Metrics calculations
  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const inProgressCount = orders.filter((o) => ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)).length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;

  const priorityMap: Record<string, number> = {
    PENDING: 1,
    CONFIRMED: 2,
    PREPARING: 3,
    OUT_FOR_DELIVERY: 4,
    COMPLETED: 5,
    CANCELLED: 6,
  };

  const filteredOrders = orders
    .filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        o.deliveryAddress.toLowerCase().includes(q) ||
        o.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'PRIORITY') {
        const pA = priorityMap[a.status] || 99;
        const pB = priorityMap[b.status] || 99;
        if (pA !== pB) return pA - pB;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'NEWEST') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Chờ Xác Nhận</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Đã Tiếp Nhận</span>
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3.5 h-3.5 text-purple-600" />
            <span>Đang Chuẩn Bị</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5 text-sky-600" />
            <span>Đang Giao Hàng</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Đã Giao Thành Công</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <X className="w-3.5 h-3.5 text-rose-600" />
            <span>Đã Hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Realtime Order Alert Banner (Requirement 14: Fresh, Clean, Friendly) */}
      {newOrderAlert && (
        <div
          className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${
            newOrderAlert.type === 'CREATE'
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <span
              className={`p-2.5 rounded-xl shrink-0 ${
                newOrderAlert.type === 'CREATE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Radio className="w-5 h-5 animate-pulse" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md ${
                    newOrderAlert.type === 'CREATE'
                      ? 'bg-emerald-200/70 text-emerald-800'
                      : 'bg-rose-200/70 text-rose-800'
                  }`}
                >
                  {newOrderAlert.type === 'CREATE' ? 'Đơn Mới Từ Nút Bấm' : 'Đơn Đã Hủy'}
                </span>
                <span className="font-mono font-bold text-xs text-slate-900">
                  #{newOrderAlert.orderNumber}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {newOrderAlert.type === 'CREATE'
                  ? `Khách ${newOrderAlert.customerName} vừa đặt ${newOrderAlert.quantity}x ${newOrderAlert.productName} (${newOrderAlert.totalAmount?.toLocaleString()} ₫)`
                  : `Đơn hàng #${newOrderAlert.orderNumber} đã được hủy qua Smart Button`}
              </p>
              {newOrderAlert.deliveryAddress && (
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{newOrderAlert.deliveryAddress}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {newOrderAlert.type === 'CREATE' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    announceStoreOrder({
                      customerName: newOrderAlert.customerName,
                      productName: newOrderAlert.productName,
                      quantity: newOrderAlert.quantity,
                      totalAmount: newOrderAlert.totalAmount,
                      orderNumber: newOrderAlert.orderNumber,
                    });
                  }}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-98"
                  title="Nghe lại thông báo loa"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Nghe Lại</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (newOrderAlert.orderId) {
                      handleUpdateStatus(newOrderAlert.orderId, 'CONFIRMED');
                    }
                    setNewOrderAlert(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-98 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Tiếp Nhận Đơn</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setNewOrderAlert(null)}
              className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Đơn Hàng Trực Tiếp (Live Orders)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
              REALTIME
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dòng sự kiện thời gian thực từ các Smart Button trong mạng lưới khách hàng
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quản lý & Tra cứu kho hàng */}
          <button
            type="button"
            onClick={() => setShowInventoryModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
            title="Tra cứu & Quản lý tồn kho hàng hóa"
          >
            <Boxes className="w-4 h-4 text-blue-600" />
            <span>Kho Hàng ({inventoryList.length})</span>
          </button>

          {/* Smart Bank Speaker Button */}
          <button
            type="button"
            onClick={() => testStoreBankSpeaker()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold transition-all shadow-sm active:scale-98 cursor-pointer"
            title="Bấm để nghe thử Loa Thông Báo Đơn Hàng"
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span>Thử Loa Báo</span>
          </button>

          <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-medium text-slate-700">Trực Tuyến</span>
          </div>
        </div>
      </div>

      {/* Requirement 13: Dashboard Stat Cards Matrix with Visual Hierarchy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Chờ Xử Lý (Pending - High Priority) */}
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Chờ Xử Lý</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{pendingCount}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">Cần xác nhận đơn ngay</p>
          </div>
        </div>

        {/* Card 2: Đang Tiến Hành (In Progress) */}
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-blue-600 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Đang Tiến Hành</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{inProgressCount}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Đang chuẩn bị & giao hàng</p>
          </div>
        </div>

        {/* Card 3: Đã Hoàn Thành (Completed) */}
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-emerald-500 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Đã Hoàn Thành</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">{completedCount}</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">Giao thành công hôm nay</p>
          </div>
        </div>

        {/* Card 4: Doanh Số Tạm Tính (Revenue) */}
        <div className="p-4 bg-white border border-slate-200 border-l-4 border-l-slate-400 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Doanh Số Tạm Tính</span>
            <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalRevenue.toLocaleString()} ₫
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">Tổng cộng các đơn hợp lệ</p>
          </div>
        </div>
      </div>

      {/* Revenue Analytics Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Biểu Đồ Doanh Thu Theo Ngày (Telemetry Analytics)
              </h2>
              <p className="text-xs text-slate-500">
                Xu hướng đặt hàng từ mạng lưới Smart Button
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            7 Ngày Gần Nhất
          </span>
        </div>
        <AnalyticsChart data={chartData} />
      </div>

      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc theo Tên cư dân, SĐT, Căn hộ, Mã đơn..."
            className="w-full pl-10 pr-8 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Sắp xếp:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="PRIORITY">Ưu Tiên (Chờ xử lý trước)</option>
            <option value="NEWEST">Mới Nhất Trước</option>
            <option value="OLDEST">Cũ Nhất Trước</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
        {['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {st === 'ALL' && 'Tất Cả'}
            {st === 'PENDING' && `Chờ Tiếp Nhận (${pendingCount})`}
            {st === 'CONFIRMED' && 'Đã Nhận'}
            {st === 'PREPARING' && 'Chuẩn Bị'}
            {st === 'OUT_FOR_DELIVERY' && 'Đang Giao'}
            {st === 'COMPLETED' && 'Hoàn Thành'}
            {st === 'CANCELLED' && 'Đã Hủy'}
          </button>
        ))}
      </div>

      {/* Orders List / Live Table (Requirement 14: Highlight Light Blue for 1.5s on new order) */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-sm">Đang tải danh sách đơn hàng...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Khi khách hàng bấm Smart Button, đơn hàng sẽ lập tức xuất hiện tại đây kèm tín hiệu thời gian thực.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isJustCreated = highlightOrderId === order.id;

            return (
              <div
                key={order.id}
                className={`border rounded-2xl p-5 shadow-sm transition-all duration-300 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isJustCreated
                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Details */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs">
                    <div className="font-bold text-slate-900">
                      Khách: {order.customerName}
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{order.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 max-w-md truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </div>
                  </div>

                  {/* Ordered Items Preview & Badges */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    {order.items.map((item) => (
                      <span
                        key={item.id}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold"
                      >
                        {item.quantity}x {item.productName} ({item.totalPrice.toLocaleString()} ₫)
                      </span>
                    ))}
                    {order.device && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-600 font-medium flex items-center gap-1 border border-slate-200">
                        <Radio className="w-3 h-3 text-emerald-500" />
                        {order.device.configuration?.customName || order.device.deviceId}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      COD - Tiền mặt
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons (Requirement 11, 17: Accessible, Icon + Text, 44px min height) */}
                <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {order.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                      className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Tiếp Nhận Đơn</span>
                    </button>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="h-11 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                    >
                      <Package className="w-4 h-4" />
                      <span>Chuẩn Bị Hàng</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
                      className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Xuất Kho Đi Giao</span>
                    </button>
                  )}

                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:-translate-y-0.5 active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Hoàn Thành & Đã Thu Tiền</span>
                    </button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã Giao Xong</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tra cứu & Quản lý tồn kho hàng hóa (Inventory Lookup Modal - Clean Bright Surface) */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setShowInventoryModal(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Quản Lý Tồn Kho & Sản Phẩm Cửa Hàng
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      {filteredInventory.length} sản phẩm
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chủ cửa hàng gắn ảnh tùy chỉnh trực tiếp và nhập số lượng tồn kho theo nhu cầu
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductForm(!showAddProductForm)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddProductForm ? 'Ẩn Form Thêm' : 'Thêm Sản Phẩm Mới'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {saveToast && (
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{saveToast}</span>
              </div>
            )}

            {/* Form Thêm Sản Phẩm Mới */}
            {showAddProductForm && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Thêm Sản Phẩm Mới (Kèm Ảnh & Số Lượng)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddProductForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Hủy
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Tên sản phẩm *</label>
                    <input
                      type="text"
                      placeholder="VD: Nước Mắm Cốt Nhĩ Cá Cơm 500ml..."
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Thương hiệu / Nhãn</label>
                    <input
                      type="text"
                      placeholder="VD: Khải Hoàn, Chinsu..."
                      value={newProdBrand}
                      onChange={(e) => setNewProdBrand(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Nhóm danh mục</label>
                    <select
                      value={newProdCategory}
                      onChange={(e) => setNewProdCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="Nước mắm">Nước mắm</option>
                      <option value="Nước uống">Nước uống</option>
                      <option value="Gas">Gas & Nhiên liệu</option>
                      <option value="Gạo">Gạo & Ngũ cốc</option>
                      <option value="Dầu ăn & Gia vị">Dầu ăn & Gia vị</option>
                      <option value="Nhu yếu phẩm">Nhu yếu phẩm khác</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Đơn vị đóng gói</label>
                    <input
                      type="text"
                      placeholder="VD: Chai 520ml, Bình 20L..."
                      value={newProdUnit}
                      onChange={(e) => setNewProdUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Giá bán (VNĐ)</label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-blue-600 uppercase">
                      Số lượng tồn kho ban đầu *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-300 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Gắn ảnh sản phẩm (Tải file hoặc dán URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Dán link ảnh (https://...)"
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <label className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Tải Ảnh Máy</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setNewProdImage(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {newProdImage && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs text-slate-500 font-medium">Xem trước:</span>
                    <img
                      src={newProdImage}
                      alt="Xem trước"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewProduct}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu & Thêm Vào Kho</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['Tất cả', 'Nước mắm', 'Nước uống', 'Gas', 'Gạo', 'Dầu ăn & Gia vị'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInventoryCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                      inventoryCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-300 transition-colors shadow-2xs"
                >
                  {/* Product Info & Photo */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative group shrink-0 w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <label
                        htmlFor={`img-upload-${item.id}`}
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold cursor-pointer transition-opacity text-center p-1"
                        title="Bấm để tải ảnh mới từ máy"
                      >
                        <Camera className="w-3.5 h-3.5 mb-0.5 text-white" />
                        <span>Đổi Ảnh</span>
                        <input
                          id={`img-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(item.id, e)}
                        />
                      </label>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                          {item.category}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">{item.brand}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </h4>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-blue-600 font-extrabold font-mono">
                          {item.price.toLocaleString('vi-VN')} đ
                        </span>
                        <span className="text-xs text-slate-400">/ {item.unit}</span>

                        <button
                          type="button"
                          onClick={() => handleImageUrlPrompt(item.id, item.imageUrl)}
                          className="text-xs text-slate-400 hover:text-blue-600 underline ml-2 flex items-center gap-0.5"
                          title="Gắn link ảnh trực tiếp"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Dán link ảnh</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Stock Input & Quick Adjustments */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Trạng Thái:</span>
                      {item.stock === 0 ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Hết hàng
                        </span>
                      ) : item.stock <= item.minStockAlert ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Sắp hết ({item.stock})
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Sẵn sàng
                        </span>
                      )}
                    </div>

                    {/* Numeric Input */}
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold text-slate-500">
                        Số lượng tồn kho:
                      </span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleStockChange(item.id, Math.max(0, item.stock - 1))}
                          className="w-8 h-8 rounded-l-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 border-r-0 transition-colors text-sm"
                          title="Giảm 1"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={(e) => handleStockChange(item.id, e.target.value)}
                          className="w-16 h-8 text-center font-mono font-bold text-sm bg-white text-slate-900 border-y border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleStockChange(item.id, item.stock + 1)}
                          className="w-8 h-8 rounded-r-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-300 border-l-0 transition-colors text-sm"
                          title="Tăng 1"
                        >
                          +
                        </button>

                        <span className="text-xs font-semibold text-slate-500 ml-2 min-w-8">
                          {item.unit.split(' ')[0]}
                        </span>
                      </div>
                    </div>

                    {/* Delete item if custom */}
                    {item.id.startsWith('custom-prod-') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors ml-1"
                        title="Xóa món này khỏi danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredInventory.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Package className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">Không tìm thấy sản phẩm nào khớp với tìm kiếm.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Số lượng và ảnh gắn vào được lưu tự động trên hệ thống</span>
              </div>

              <button
                type="button"
                onClick={() => setShowInventoryModal(false)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Đóng & Hoàn Tất Lưu Kho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
