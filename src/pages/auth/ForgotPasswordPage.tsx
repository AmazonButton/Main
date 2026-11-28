import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';

export const ForgotPasswordCard: React.FC<{ onClose?: () => void; initialEmail?: string }> = ({
  onClose,
  initialEmail = '',
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'EMAIL' | 'OTP_RESET' | 'SUCCESS'>('EMAIL');
  const [email, setEmail] = useState(initialEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{}|;:,.<>~`]/.test(newPassword);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Vui lòng nhập địa chỉ email đã đăng ký.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmed });
      setInfoMessage(
        res.data?.message ||
          'Nếu email tồn tại trong hệ thống, mã OTP 6 chữ số đã được gửi tới hòm thư của bạn (hiệu lực 15 phút).'
      );
      setStep('OTP_RESET');
      setCooldown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join('. ') : msg || 'Không thể gửi yêu cầu khôi phục. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmedToken = otpCode.trim();
    if (!trimmedToken) {
      setError('Vui lòng nhập mã OTP 6 chữ số đã gửi về email.');
      return;
    }
    if (!isPasswordValid) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        token: trimmedToken,
        newPassword,
      });
      if (res.data?.success) {
        setStep('SUCCESS');
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(res.data?.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join('. ')
          : msg || 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-200/50 dark:shadow-black/60 relative z-10 transition-all">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp thoại quên mật khẩu"
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
        {step === 'SUCCESS' ? <ShieldCheck className="w-7 h-7 text-emerald-500" /> : <KeyRound className="w-7 h-7" />}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {step === 'SUCCESS'
            ? 'Đặt Lại Mật Khẩu Thành Công'
            : step === 'OTP_RESET'
            ? 'Nhập Mã OTP & Mật Khẩu Mới'
            : 'Quên Mật Khẩu'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {step === 'SUCCESS'
            ? 'Mật khẩu mới đã được cập nhật vào hệ thống. Bạn có thể đăng nhập ngay.'
            : step === 'OTP_RESET'
            ? `Nhập mã OTP 6 chữ số gửi tới ${email.trim().toLowerCase()} và thiết lập mật khẩu mới`
            : 'Nhập email đã đăng ký để nhận mã OTP 6 chữ số khôi phục mật khẩu'}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {step === 'SUCCESS' ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Cập nhật mật khẩu thành công!</span>
              <p className="text-[11px] leading-relaxed opacity-90">
                Vui lòng đăng nhập lại bằng mật khẩu mới (mật khẩu cũ đã hết hiệu lực).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              else navigate('/login', { replace: true });
            }}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Đăng nhập bằng mật khẩu mới</span>
          </button>
        </div>
      ) : step === 'OTP_RESET' ? (
        <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
          {infoMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <div>
            <label htmlFor="reset-otp" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mã OTP 6 chữ số <span className="text-rose-500">*</span>
            </label>
            <input
              id="reset-otp"
              type="text"
              inputMode="numeric"
              required
              autoFocus
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nhập 6 số OTP từ email"
              className="w-full px-4 py-2.5 text-sm font-mono tracking-[0.25em] text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div>
            <label htmlFor="reset-new-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-new-password"
                type={showNewPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự, chữ hoa, số & ký tự đặc biệt"
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                aria-label={showNewPass ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {newPassword.length > 0 && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-[11px] space-y-1.5">
                <p className="font-semibold text-slate-600 dark:text-slate-400 text-[10.5px] uppercase tracking-wider mb-1">
                  Yêu cầu mật khẩu an toàn:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {hasMinLen ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" />}
                    <span>Tối thiểu 8 ký tự</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper && hasLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {hasUpper && hasLower ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" />}
                    <span>Chữ hoa & chữ thường</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" />}
                    <span>Ít nhất 1 chữ số</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mx-1" />}
                    <span>Ký tự đặc biệt</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="reset-confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-confirm-password"
                type={showConfirmPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition-all ${
                  confirmPassword.length > 0 && !isMatching
                    ? 'border-rose-400 focus:ring-rose-400/20'
                    : confirmPassword.length > 0 && isMatching
                    ? 'border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-blue-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                aria-label={showConfirmPass ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
              >
                {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && !isMatching && (
              <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <X className="w-3 h-3 shrink-0" />
                Mật khẩu xác nhận chưa trùng khớp.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.trim().length < 6 || !isPasswordValid || !isMatching}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG ĐẶT LẠI MẬT KHẨU...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>XÁC NHẬN ĐẶT LẠI MẬT KHẨU</span>
              </>
            )}
          </button>

          <div className="pt-1 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep('EMAIL');
                setError(null);
              }}
              className="font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              ← Đổi email khác
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || loading}
              onClick={() => void handleRequestOtp()}
              className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {cooldown > 0 ? `Gửi lại OTP (${cooldown}s)` : 'Gửi lại mã OTP'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Địa chỉ Email đã đăng ký <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full pl-10 pr-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ĐANG GỬI MÃ OTP...</span>
              </>
            ) : (
              <>
                <span>GỬI MÃ OTP KHÔI PHỤC</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Đăng nhập</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại Đăng nhập</span>
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => (
  <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 telemetry-grid relative overflow-hidden">
    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/10 via-cyan-500/10 to-indigo-600/5 blur-[120px] pointer-events-none rounded-full" />
    <ForgotPasswordCard />
  </div>
);
