export type ServiceKey =
  | 'freeze'
  | 'activate'
  | 'transfer'
  | 'contract'
  | 'support'
  | 'cancel-refund'
  | 'locker'
  | 'complaint';

export interface ServiceCatalogItem {
  key: ServiceKey;
  title: string;
  description: string;
}

export const SERVICE_TYPES: ServiceCatalogItem[] = [
  { key: 'freeze', title: 'Tạm ngưng gói tập', description: 'Tạm dừng gói tập của bạn khi cần nghỉ ngơi' },
  { key: 'activate', title: 'Kích hoạt gói tập', description: 'Kích hoạt lại gói tập đã tạm ngưng' },
  { key: 'transfer', title: 'Chuyển nhượng', description: 'Chuyển nhượng gói tập cho người khác' },
  { key: 'contract', title: 'Xem chính sách', description: 'Xem và tải xuống chính sách của bạn' },
  { key: 'support', title: 'Hỗ trợ khách hàng', description: 'Liên hệ với đội ngũ hỗ trợ' },
  { key: 'cancel-refund', title: 'Hủy gói / Hoàn phí', description: 'Yêu cầu hủy gói và hoàn lại phí còn lại' },
  { key: 'locker', title: 'Thuê tủ đồ', description: 'Đăng ký thuê tủ đồ tại cơ sở' },
  { key: 'complaint', title: 'Khiếu nại / Góp ý', description: 'Gửi khiếu nại hoặc góp ý đến quản lý' }
];

export const ALL_SERVICE_KEYS: ServiceKey[] = SERVICE_TYPES.map(t => t.key);

export const SERVICE_LABELS: Record<string, string> = {
  ...SERVICE_TYPES.reduce(
    (acc, t) => {
      acc[t.key] = t.title;
      return acc;
    },
    {} as Record<string, string>
  ),
  // Giữ label cũ để hiển thị lịch sử (đã bỏ chức năng tạo mới)
  'reactivate-expired': 'Kích hoạt gói đã hết hạn',
  'change-club': 'Chuyển cơ sở phòng tập'
};

export const SERVICE_STATUS_LABELS: Record<string, string> = {
  pending: 'Đang xử lý',
  awaiting_payment: 'Chờ thanh toán',
  accepted: 'Đã chấp nhận',
  rejected: 'Đã từ chối',
  cancelled: 'Đã hủy',
  success: 'Thành công'
};

// Dịch vụ không bao giờ thu phí trước (phòng tập hoàn tiền theo chiều ngược lại)
export const REFUND_SERVICE_KEYS: ServiceKey[] = ['cancel-refund'];

// Dịch vụ không tính phí (xem/xử lý tự động)
export const FREE_SERVICE_KEYS: ServiceKey[] = ['contract', 'support'];

export const formatVND = (amount: number) =>
  `${Number(amount || 0).toLocaleString('vi-VN')}₫`;
