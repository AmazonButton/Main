# Backend Handoff: Thêm Endpoint `POST /api/v1/auth/verify-reset-otp` (Quên Mật Khẩu 2 Bước)

**Ngày tạo:** 2026-11-28  
**Mục tiêu:** Cho phép Frontend kiểm tra tính hợp lệ của mã OTP 6 chữ số trên database (`auth_otps`) trước khi chuyển người dùng sang màn hình nhập mật khẩu mới, nhưng vẫn giữ tương thích 100% với endpoint `POST /api/v1/auth/reset-password` hiện tại.

---

## 1. Bối cảnh & Yêu cầu
Hiện tại backend (`https://backend-fae8.onrender.com`) mới có 2 endpoint cho luồng Quên mật khẩu:
1. `POST /api/v1/auth/forgot-password` — tạo OTP 6 chữ số (`purpose = 'PASSWORD_RESET'`, hiệu lực 15 phút) và gửi email.
2. `POST /api/v1/auth/reset-password` — nhận `{ email, token, newPassword }`, xác thực OTP và cập nhật mật khẩu mới cùng lúc (`atomicResetPasswordWithOtpTx`).

Backend **chưa có API kiểm tra OTP trước** để Frontend chặn người dùng ở bước nhập OTP nếu nhập sai/hết hạn, chỉ cho qua bước đặt lại mật khẩu khi OTP hợp lệ.

---

## 2. Đặc tả Endpoint mới

### Route
```http
POST /api/v1/auth/verify-reset-otp
```
- **Auth:** Public (không yêu cầu JWT)
- **Guards:** `@UseGuards(AuthRateLimitGuard)` (giống `forgot-password` và `reset-password`)
- **HTTP Status:** `@HttpCode(200)`

### Request Body (`VerifyResetOtpDto`)
Thêm vào `backend/src/auth/dto/auth.dto.ts`:

```ts
export class VerifyResetOtpDto {
  @IsNotEmpty({ message: 'Vui lòng nhập email' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Vui lòng nhập mã OTP' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  token: string;
}
```

### Response
- **Thành công (`200 OK`)**:
```json
{
  "success": true,
  "message": "Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới."
}
```
- **Thất bại (`400 Bad Request`)**:
```json
{
  "success": false,
  "message": "Mã OTP không hợp lệ hoặc đã được sử dụng."
}
```
Các thông báo lỗi cụ thể tương ứng:
- Sai mã OTP: `"Mã OTP không hợp lệ hoặc đã được sử dụng."`
- Vượt quá số lần thử (`attempts >= max_attempts`): `"Mã OTP đã bị vô hiệu hóa do thử sai quá nhiều lần."`
- Hết hạn (`expires_at <= NOW()`): `"Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới."`

---

## 3. Logic Xử Lý Cần Triển Khai

### 3.1. `backend/src/auth/auth.repository.ts`
Thêm hàm `verifyResetOtpTx` (kiểm tra OTP trong transaction với `FOR UPDATE`, **không đánh dấu `consumed_at`** để bước `POST /api/v1/auth/reset-password` phía sau vẫn tiêu thụ OTP atomically như hiện tại):

```ts
async verifyResetOtpTx(params: {
  tokenHash: string;
  purpose: string;
  email: string;
}): Promise<{ success: boolean; reason?: string }> {
  const normalizedEmail = params.email.toLowerCase().trim();

  return this.prisma.$transaction(async (tx) => {
    const otps = await tx.$queryRawUnsafe<any[]>(
      `SELECT id, attempts, max_attempts, expires_at
       FROM auth_otps
       WHERE token_hash = $1
         AND purpose = $2
         AND LOWER(email) = LOWER($3)
         AND consumed_at IS NULL
       ORDER BY id DESC
       LIMIT 1
       FOR UPDATE`,
      params.tokenHash,
      params.purpose,
      normalizedEmail,
    );

    if (!otps || otps.length === 0) {
      // Tăng attempts cho các OTP chưa dùng của email này để chống brute-force
      await tx.$executeRawUnsafe(
        `UPDATE auth_otps
         SET attempts = attempts + 1
         WHERE LOWER(email) = LOWER($1)
           AND purpose = $2
           AND consumed_at IS NULL`,
        normalizedEmail,
        params.purpose,
      );
      return { success: false, reason: 'Mã OTP không hợp lệ hoặc đã được sử dụng.' };
    }

    const otp = otps[0];
    if (otp.attempts >= otp.max_attempts) {
      return { success: false, reason: 'Mã OTP đã bị vô hiệu hóa do thử sai quá nhiều lần.' };
    }
    if (new Date(otp.expires_at) <= new Date()) {
      return { success: false, reason: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' };
    }

    return { success: true };
  });
}
```

### 3.2. `backend/src/auth/auth.service.ts`
Thêm method `verifyResetOtp(body: VerifyResetOtpDto)`:

```ts
async verifyResetOtp(body: VerifyResetOtpDto) {
  const email = body.email?.trim().toLowerCase();
  const token = body.token?.trim();

  if (!email || !token) {
    throw new BadRequestException({
      success: false,
      message: 'Vui lòng nhập đầy đủ email và mã OTP',
    });
  }

  const tokenHash = this.hashOtp(token, 'PASSWORD_RESET');
  const verifyResult = await this.authRepo.verifyResetOtpTx({
    tokenHash,
    purpose: 'PASSWORD_RESET',
    email,
  });

  if (!verifyResult.success) {
    throw new BadRequestException({
      success: false,
      message: verifyResult.reason || 'Mã OTP không hợp lệ hoặc đã hết hạn',
    });
  }

  return {
    success: true,
    message: 'Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.',
  };
}
```

### 3.3. `backend/src/auth/auth.controller.ts`
Thêm route ngay dưới `@Post('forgot-password')`:

```ts
@UseGuards(AuthRateLimitGuard)
@HttpCode(200)
@Post('verify-reset-otp')
verifyResetOtp(@Body() body: VerifyResetOtpDto) {
  return this.authService.verifyResetOtp(body);
}
```

---

## 4. Lưu ý Bảo Mật & Deploy
1. **Giữ nguyên cơ chế chống brute-force:** Nếu người dùng nhập sai OTP ở `/auth/verify-reset-otp`, cột `attempts` vẫn tăng lên và sẽ khóa OTP khi `attempts >= max_attempts`.
2. **Không consume OTP sớm:** `verify-reset-otp` chỉ xác nhận OTP đúng và còn hạn; OTP chỉ được đánh dấu `consumed_at = NOW()` khi gọi `POST /api/v1/auth/reset-password` để tránh trường hợp người dùng verify xong nhưng chưa kịp đổi mật khẩu (hoặc mất kết nối) bị mất luôn OTP.
3. **Swagger & Render Deploy:**
   - Thêm `@ApiOperation({ summary: 'Xác thực mã OTP đặt lại mật khẩu' })` nếu controller có dùng `@nestjs/swagger`.
   - Sau khi push & deploy lên Render (`https://backend-fae8.onrender.com`), xác nhận endpoint xuất hiện tại `https://backend-fae8.onrender.com/docs` để Frontend tích hợp bước xác nhận OTP riêng.
