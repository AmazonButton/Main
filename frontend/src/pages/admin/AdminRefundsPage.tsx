import './admin-ui.css';
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AdminRefundsWorkspace } from '../../components/admin/AdminRefundsWorkspace';

export const AdminRefundsPage: React.FC = () => {
  const reduced = useReducedMotion();

  return (
    <motion.main
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="admin-ui admin-payouts mx-auto max-w-6xl space-y-6 px-4 py-7 sm:px-6"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold text-[#287DA8]">Quản trị hệ thống</p>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Đối soát & Hoàn tiền PayOS</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Theo dõi các khoản tiền cần hoàn trả (hủy đơn, hoàn cọc thiết bị, tiền thừa) và gửi lệnh chi trả tự động qua PayOS.
          </p>
        </div>
      </header>

      <AdminRefundsWorkspace />
    </motion.main>
  );
};
