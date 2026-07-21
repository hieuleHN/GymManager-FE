import { DashboardLayout } from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Star, Calendar, Phone, Mail, MapPin, Award, ChevronLeft, Flag, X, Send } from 'lucide-react';
import { Button } from '@mui/material';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

interface Trainer {
  _id: string;
  fullName: string;
  avatar: string;
  coverImage: string;
  description: string;
  specialties: string[];
  gallery: string[];
  rating: number;
  totalReviews: number;
  experience: string;
  pricePerSession: number;
  disciplineId: { _id: string; name: string } | null;
  locationId: { _id: string; title: string } | null;
  gender: string;
  phone: string;
  email: string;
  certifications: string[];
  job: { name: string; isAdmin: boolean };
}

export function TrainerDetail() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportModal, setReportModal] = useState<{ step: 'title' | 'form' } | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!trainerId) return;
    const fetchTrainer = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/staff/${trainerId}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        setTrainer(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchTrainer();
  }, [trainerId]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`${getApiUrl()}/api/reports`, {
        method: 'POST',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: trainerId, title: reportTitle, reason: reportReason })
      });
      alert('Gửi báo cáo thành công!');
      setReportModal(null);
      setReportTitle('');
      setReportReason('');
    } catch (e) {
      alert('Lỗi gửi báo cáo');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">Đang tải...</div>
      </DashboardLayout>
    );
  }

  if (!trainer) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500">Không tìm thấy huấn luyện viên</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* Cover + Avatar */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <div className="relative h-64 bg-gradient-to-r from-indigo-500 to-purple-600">
            {trainer.coverImage && (
              <img src={trainer.coverImage} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="relative px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-20">
              <img
                src={trainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=200'}
                alt={trainer.fullName}
                className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
              <div className="flex-1 pt-16 sm:pt-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl font-bold text-slate-900">{trainer.fullName}</h1>
                      <button
                        onClick={() => setReportModal({ step: 'title' })}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Báo cáo"
                      >
                        <Flag className="w-4 h-4 text-slate-400 hover:text-red-500" />
                      </button>
                    </div>
                    <p className="text-indigo-600 font-medium text-lg">
                      {trainer.disciplineId?.name || trainer.job?.name || 'HLV'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-slate-900">{trainer.rating || 0}</span>
                      <span className="text-slate-500">({trainer.totalReviews || 0} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Giới thiệu</h2>
              <p className="text-slate-600 leading-relaxed">
                {trainer.description || 'Chưa có thông tin giới thiệu.'}
              </p>
              {trainer.experience && (
                <div className="flex items-center gap-2 mt-4 text-slate-600">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <span>{trainer.experience}</span>
                </div>
              )}
            </div>

            {/* Specialties */}
            {trainer.specialties && trainer.specialties.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Bộ môn chuyên môn</h2>
                <div className="flex flex-wrap gap-3">
                  {trainer.specialties.map((s, i) => (
                    <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium text-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {trainer.certifications && trainer.certifications.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Chứng chỉ</h2>
                <div className="space-y-2">
                  {trainer.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-600" />
                      <span className="text-slate-600">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {trainer.gallery && trainer.gallery.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Thư viện ảnh</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trainer.gallery.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Booking & Contact */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Thông tin liên hệ</h3>
              <div className="space-y-3">
                {trainer.phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    <span>{trainer.phone}</span>
                  </div>
                )}
                {trainer.email && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail className="w-4 h-4 text-indigo-500" />
                    <span>{trainer.email}</span>
                  </div>
                )}
                {trainer.locationId && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <span>{trainer.locationId.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <span className="font-medium text-slate-900">Giới tính:</span>
                  <span>{trainer.gender || 'Chưa cập nhật'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Đặt lịch tập</h3>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                <span className="text-slate-600">Phí HLV/buổi:</span>
                <span className="text-2xl font-bold text-indigo-600">
                  {(trainer.pricePerSession || 500000).toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="space-y-3">
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/dashboard/trainers/${trainer._id}/book`)}
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, height: 52 }}
                  startIcon={<Calendar size={18} />}
                >
                  Đặt lịch tập
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReportModal(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" />
                Báo cáo HLV
              </h3>
              <button onClick={() => setReportModal(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            {reportModal.step === 'title' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">Chọn lý do báo cáo:</p>
                {['Spam', 'Quấy rối', 'Thông tin sai lệch', 'Hành vi không phù hợp', 'Khác'].map(title => (
                  <button
                    key={title}
                    onClick={() => { setReportTitle(title); setReportModal({ step: 'form' }); }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all font-medium text-slate-700"
                  >
                    {title}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700 mb-1">Lý do: <span className="text-indigo-600">{reportTitle}</span></p>
                <textarea
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do báo cáo..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button variant="outlined" onClick={() => setReportModal({ step: 'title' })} sx={{ flex: 1, textTransform: 'none', borderRadius: 2 }}>Quay lại</Button>
                  <Button variant="contained" onClick={handleReport} disabled={!reportReason.trim() || submitting}
                    startIcon={<Send size={16} />}
                    sx={{ flex: 1, textTransform: 'none', borderRadius: 2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
