import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { CheckCircle, XCircle, Clock, User, Calendar, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, getAuthHeaders } from '../../context/AuthContext';

interface Booking {
  _id: string;
  customerId: { _id: string; fullName: string; phone: string; email: string };
  trainerId: { _id: string; fullName: string };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  rejectionReason?: string;
  locationId?: { _id: string; title: string };
  createdAt: string;
}

export function BookingManagement() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; bookingId: string }>({
    open: false,
    bookingId: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (user?.locationId) params.append('locationId', user.locationId);

      const res = await fetch(`/api/bookings?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBookings(data.data || []);
      }
    } catch (err) {
      toast.error('Lỗi tải danh sách lịch đặt!');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers
      });

      if (res.ok) {
        toast.success('Đã xác nhận lịch tập!');
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi xác nhận!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối server!');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối!');
      return;
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/bookings/${rejectDialog.bookingId}/reject`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason })
      });

      if (res.ok) {
        toast.success('Đã từ chối lịch tập!');
        setRejectDialog({ open: false, bookingId: '' });
        setRejectionReason('');
        fetchBookings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi từ chối!');
      }
    } catch (err) {
      toast.error('Lỗi kết nối server!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'rejected': return 'Đã từ chối';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      booking.customerId?.fullName?.toLowerCase().includes(term) ||
      booking.trainerId?.fullName?.toLowerCase().includes(term) ||
      booking.time?.includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Quản lý lịch đặt HLV</h1>
          <p className="text-slate-600">Xác nhận hoặc từ chối yêu cầu đặt lịch từ học viên</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên học viên, HLV..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'confirmed', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'all' ? 'Tất cả' : getStatusText(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Đang tải...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Không có lịch đặt nào</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span className="font-bold text-slate-900">{booking.customerId?.fullName || 'N/A'}</span>
                        </div>
                        <Chip
                          label={getStatusText(booking.status)}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User className="w-4 h-4" />
                          <span>HLV: <span className="font-semibold">{booking.trainerId?.fullName || 'N/A'}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>Ngày: <span className="font-semibold">
                            {new Date(booking.date).toLocaleDateString('vi-VN')}
                          </span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>Giờ: <span className="font-semibold">{booking.time}</span></span>
                        </div>
                      </div>
                      {booking.customerId?.phone && (
                        <p className="text-sm text-slate-500 mt-2">SĐT: {booking.customerId.phone}</p>
                      )}
                      {booking.rejectionReason && (
                        <p className="text-sm text-red-600 mt-2">Lý do từ chối: {booking.rejectionReason}</p>
                      )}
                    </div>
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => handleConfirm(booking._id)}
                          sx={{
                            bgcolor: '#10b981',
                            '&:hover': { bgcolor: '#059669' },
                            textTransform: 'none'
                          }}
                        >
                          Xác nhận
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<XCircle />}
                          onClick={() => setRejectDialog({ open: true, bookingId: booking._id })}
                          sx={{ textTransform: 'none' }}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, bookingId: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Từ chối lịch đặt</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Lý do từ chối *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Nhập lý do từ chối lịch đặt..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialog({ open: false, bookingId: '' });
              setRejectionReason('');
            }}
            sx={{ textTransform: 'none' }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            sx={{ textTransform: 'none' }}
          >
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}