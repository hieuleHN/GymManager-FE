import { DashboardLayout } from '../../components/DashboardLayout';
import { Star, MessageSquare, Calendar, MapPin, Dumbbell, User, Clock } from 'lucide-react';
import { Button, Chip } from '@mui/material';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { getAuthHeaders } from '../../context/AuthContext';
import { useEffect, useState, useMemo } from 'react';

interface Trainer {
  _id: string;
  fullName: string;
  phone: string;
  job?: { _id: string; name: string; description?: string };
  locationId?: { _id: string; title: string };
  avatar?: string;
  description?: string;
  specialties?: string[];
  rating?: number;
  totalReviews?: number;
  experience?: string;
}

export function Trainers() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [chatOpen, setChatOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/staff/trainers', { headers });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data || []);
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  const specialties = useMemo(() => {
    const map = new Map<string, string>();
    trainers.forEach(t => {
      if (t.job?.name) {
        map.set(t.job._id, t.job.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [trainers]);

  const filteredTrainers = useMemo(() => {
    if (selectedSpecialty === 'all') return trainers;
    return trainers.filter(t => t.job?._id === selectedSpecialty);
  }, [trainers, selectedSpecialty]);

  const fallbackAvatar = 'https://i.pinimg.com/1200x/3d/25/88/3d2588e7962761a3514db5837e4de526.jpg';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Đặt lịch / Liên hệ HLV</h1>
            <p className="text-slate-600">Chọn huấn luyện viên phù hợp với mục tiêu của bạn</p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Đặt lịch / Liên hệ HLV</h1>
          <p className="text-slate-600">Chọn huấn luyện viên phù hợp với mục tiêu của bạn</p>
        </div>

        {/* Specialty Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Dumbbell className="w-5 h-5 text-indigo-600" />
            <button
              onClick={() => setSelectedSpecialty('all')}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                selectedSpecialty === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {specialties.map((spec) => (
              <button
                key={spec.id}
                onClick={() => setSelectedSpecialty(spec.id)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  selectedSpecialty === spec.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec.name}
              </button>
            ))}
          </div>
        </div>

        {filteredTrainers.length === 0 ? (
          <div className="text-center py-20">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Không tìm thấy huấn luyện viên nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrainers.map((trainer) => (
              <motion.div
                key={trainer._id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
              >
                <div className="relative h-72">
                  <img
                    src={trainer.avatar || fallbackAvatar}
                    alt={trainer.fullName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                      {trainer.job?.name || 'HLV'}
                    </span>
                  </div>
                  {trainer.rating && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-bold text-slate-900">{trainer.rating}</span>
                      {trainer.totalReviews && (
                        <span className="text-xs text-slate-500">({trainer.totalReviews})</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{trainer.fullName}</h3>

                  {trainer.experience && (
                    <p className="text-sm text-indigo-600 font-medium mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {trainer.experience}
                    </p>
                  )}

                  {trainer.locationId?.title && (
                    <p className="text-slate-400 text-sm mb-3 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {trainer.locationId.title}
                    </p>
                  )}

                  {trainer.description && (
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                      {trainer.description}
                    </p>
                  )}

                  {trainer.specialties && trainer.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {trainer.specialties.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 24, bgcolor: '#eef2ff', color: '#4f46e5' }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/dashboard/trainers/${trainer._id}/book`)}
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
                      startIcon={<Calendar size={18} />}
                    >
                      Đặt lịch tập
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setChatOpen(trainer._id)}
                      sx={{ color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none' }}
                      startIcon={<MessageSquare size={18} />}
                    >
                      Liên hệ
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Chat Box */}
        {chatOpen && (
          <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col">
            <div className="bg-indigo-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={filteredTrainers.find(t => t._id === chatOpen)?.avatar || fallbackAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <h4 className="font-bold">{filteredTrainers.find(t => t._id === chatOpen)?.fullName}</h4>
                  <p className="text-xs text-indigo-100">Đang hoạt động</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(null)} className="text-white hover:bg-indigo-700 p-2 rounded-lg">
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                    <p className="text-sm text-slate-900">Xin chào! Tôi có thể giúp gì cho bạn?</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                  Gửi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}