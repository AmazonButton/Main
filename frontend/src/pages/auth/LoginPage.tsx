import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Radio,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Zap,
  Wifi,
  Battery,
  Store,
  User,
  ShieldAlert,
  Cpu,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('store@smartorder.local');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Field validation
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const validateEmailOrUsername = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Vui lòng nhập email hoặc tên đăng nhập';
    if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return 'Định dạng email không hợp lệ';
    } else if (trimmed.length < 3) {
      return 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Vui lòng nhập mật khẩu';
    if (!val.trim()) return 'Mật khẩu không được chỉ chứa khoảng trắng';
    return null;
  };

  const identifierError = identifierTouched ? validateEmailOrUsername(identifier) : null;
  const passwordError = passwordTouched ? validatePassword(password) : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdentifierTouched(true);
    setPasswordTouched(true);

    const emailErr = validateEmailOrUsername(identifier);
    const passErr = validatePassword(password);
    if (emailErr || passErr) return;

    setError(null);
    setLoading(true);

    try {
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const res = await api.post('/auth/login', {
        email: normalizedIdentifier,
        password,
        rememberMe,
      });

      if (res.data?.success) {
        const token = res.data.accessToken || res.data.data?.accessToken || res.data.data?.token;
        const refreshToken = res.data.refreshToken || res.data.data?.refreshToken;
        const user = res.data.user || res.data.data?.user;

        login(token, user, refreshToken);

        // Redirect based on role
        if (['STORE_OWNER', 'STORE_MANAGER', 'STORE_STAFF'].includes(user.role)) {
          navigate('/store/dashboard');
        } else if (user.role === 'CUSTOMER') {
          navigate('/customer/home');
        } else if (user.role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Email/Tên đăng nhập hoặc mật khẩu không chính xác.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoId: string) => {
    setIdentifier(demoId);
    setPassword('Password123!');
    setError(null);
    setIdentifierTouched(false);
    setPasswordTouched(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 transition-colors">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Editorial & Practical Information */}
        <div className="lg:col-span-5 bg-blue-50/60 text-slate-900 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white border border-blue-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src="/assets/logo.png"
                  alt="Smart Order"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-slate-900 block">
                  SmartSupply Platform
                </span>
                <span className="text-xs text-slate-500">
                  Hệ thống điều phối nút bấm IoT
                </span>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">
              Quản trị thiết bị & đơn hàng thời gian thực.
            </h1>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Giải pháp kết nối nút bấm vật lý ESP32 với trạm giao nhận và ứng dụng gia đình. Tự động hóa tiếp tế nước uống, gas và nhu yếu phẩm.
            </p>

            <div className="mt-8 space-y-4 pt-6 border-t border-slate-200 text-xs">
              <div className="flex items-start gap-3 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-slate-900 block font-semibold">Bảo mật mã hóa phần cứng</strong>
                  <span className="text-slate-500 text-[11px]">Xác thực HMAC-SHA256 trên mỗi lượt nhấn nút</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Radio className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-slate-900 block font-semibold">Đồng bộ trực tiếp qua WebSocket</strong>
                  <span className="text-slate-500 text-[11px]">Báo động tức thì cho đại lý tiếp nhận đơn</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200">
            <span>Phiên bản 2.0</span>
            <span>Hỗ trợ: support@smartorder.local</span>
          </div>
        </div>

        {/* Right Side: Professional Clean Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Đăng nhập tài khoản
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sử dụng email hoặc tên đăng nhập để tiếp tục vào hệ thống
              </p>
            </div>

            {/* Quick Demo Credentials Assistant */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Tài khoản dùng thử (Mật khẩu: <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono text-slate-800">Password123!</code>)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Cửa hàng', id: 'store@smartorder.local', icon: Store },
                  { label: 'Khách hàng', id: 'customer@smartorder.local', icon: User },
                  { label: 'Admin', id: 'admin@smartorder.local', icon: Shield },
                ].map((demo) => {
                  const isSelected = identifier === demo.id;
                  const Icon = demo.icon;
                  return (
                    <button
                      key={demo.id}
                      type="button"
                      onClick={() => setDemoAccount(demo.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 truncate ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{demo.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div
                role="alert"
                className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="space-y-1">
                  <p className="font-semibold">{error}</p>
                  <p className="text-[11px] text-rose-600/90">
                    Gợi ý: Nhấp vào nút <strong>"Cửa hàng"</strong> hoặc <strong>"Admin"</strong> ở trên để tự động điền tài khoản và mật khẩu mẫu.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Identifier Input */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    onBlur={() => setIdentifierTouched(true)}
                    placeholder="VD: store@smartorder.local"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg bg-white border text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                      identifierError
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                    }`}
                  />
                </div>
                {identifierError && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {identifierError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-slate-600 hover:text-slate-900"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    onBlur={() => setPasswordTouched(true)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-lg bg-white border text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-rose-300 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-slate-900 focus:ring-slate-200'
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center pt-0.5">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 text-xs text-slate-600 cursor-pointer"
                >
                  Ghi nhớ đăng nhập trên thiết bị này
                </label>
              </div>

              {/* Submit Button (Section 11) */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:-translate-y-0.5 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-semibold text-slate-900 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
