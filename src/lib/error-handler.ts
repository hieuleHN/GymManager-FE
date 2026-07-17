import { toast } from 'sonner';

const VIETNAMESE_ERROR_MESSAGES: Record<string, string> = {
  'Failed to fetch': 'Không thể kết nối đến máy chủ! Vui lòng kiểm tra kết nối mạng.',
  'NetworkError': 'Lỗi kết nối mạng! Vui lòng thử lại sau.',
  'Network request failed': 'Kết nối thất bại! Vui lòng kiểm tra đường truyền.',
  'The user aborted a request': 'Yêu cầu đã bị hủy.',
  'Load failed': 'Tải dữ liệu thất bại!',
  'Timeout': 'Yêu cầu đã quá thời gian chờ! Vui lòng thử lại.',
};

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Có lỗi xảy ra!';

  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const apiErr = error as any;

    if (apiErr.status === 401) return 'Phiên đăng nhập đã hết hạn! Vui lòng đăng nhập lại.';
    if (apiErr.status === 403) return 'Bạn không có quyền thực hiện thao tác này!';
    if (apiErr.status === 404) return 'Không tìm thấy dữ liệu yêu cầu!';
    if (apiErr.status === 409) return 'Dữ liệu đã bị thay đổi hoặc xung đột! Vui lòng tải lại.';
    if (apiErr.status === 422) return 'Dữ liệu gửi lên không hợp lệ! Vui lòng kiểm tra lại.';
    if (apiErr.status >= 500) return 'Máy chủ đang gặp sự cố! Vui lòng thử lại sau.';

    if (apiErr.data?.error) return apiErr.data.error;
    if (apiErr.data?.message) return apiErr.data.message;

    const message = apiErr.message || String(error);
    return VIETNAMESE_ERROR_MESSAGES[message] || message;
  }

  return 'Có lỗi không xác định xảy ra!';
}

export function handleApiError(error: unknown, fallbackMessage?: string): void {
  const message = getErrorMessage(error);
  toast.error(fallbackMessage || message);
}

export function handleSuccess(message: string): void {
  toast.success(message);
}

export function handleFormErrors(errors: Record<string, string>): void {
  const firstError = Object.values(errors)[0];
  if (firstError) {
    toast.error(firstError);
  }
}
