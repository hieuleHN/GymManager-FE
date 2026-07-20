import { useState, useEffect, useMemo } from 'react';
import { Search, Star, MessageSquare, Calendar, Filter, MapPin } from 'lucide-react';
import { Button, TextField, InputAdornment, Chip } from '@mui/material';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { getAuthHeaders } from '../context/AuthContext';

interface Trainer {
  _id: string;
  fullName: string;
  phone: string;
  job?: { _id: string; name: string; description?: string };
  locationId?: { _id: string; title: string; address?: string };
  avatar?: string;
  description?: string;
  specialties?: string[];
  rating?: number;
  totalReviews?: number;
  experience?: string;
}

const fallbackTrainers: Trainer[] = [
  {
    _id: '1',
    fullName: 'Sarah Johnson',
    phone: '',
    job: { _id: '', name: 'Yoga & Pilates' },
    avatar: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400',
    description: 'Huấn luyện viên Yoga được chứng nhận với 8 năm kinh nghiệm giúp phụ nữ đạt được vóc dáng mơ ước.',
    specialties: ['Yoga', 'HIIT', 'Dinh dưỡng'],
    rating: 4.9,
    totalReviews: 124,
    experience: '8 năm kinh nghiệm'
  },
  {
    _id: '2',
    fullName: 'Marcus Chen',
    phone: '',
    job: { _id: '', name: 'Gym & Bodybuilding' },
    avatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fe?auto=format&fit=crop&q=80&w=400',
    description: 'Cựu vận động viên chuyên về sức mạnh bùng nổ và các chuyển động phức hợp.',
    specialties: ['Thể hình', 'Powerlifting'],
    rating: 5.0,
    totalReviews: 89,
    experience: '10 năm kinh nghiệm'
  },
  {
    _id: '3',
    fullName: 'Elena Rodriguez',
    phone: '',
    job: { _id: '', name: 'Boxing & Kickfit' },
    avatar: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400',
    description: 'Chuyên gia phục hồi giúp khách hàng cải thiện phạm vi chuyển động và sự ổn định của cốt lõi.',
    specialties: ['Pilates', 'Linh hoạt', 'Phục hồi'],
    rating: 4.8,
    totalReviews: 215,
    experience: '6 năm kinh nghiệm'
  },
  {
    _id: '4',
    fullName: 'David Wilson',
    phone: '',
    job: { _id: '', name: 'CrossFit & Functional' },
    avatar: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    description: 'Võ sĩ chuyên nghiệp chuyển sang làm huấn luyện viên. Thể hình dựa trên chiến đấu cường độ cao.',
    specialties: ['Boxing', 'MMA', 'Sức bền'],
    rating: 4.9,
    totalReviews: 156,
    experience: '5 năm kinh nghiệm'
  }
];

export function PTList() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/staff/trainers', { headers });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data.length > 0 ? data : fallbackTrainers);
      } else {
        setTrainers(fallbackTrainers);
      }
    } catch {
      setTrainers(fallbackTrainers);
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
    let result = trainers;
    if (selectedSpecialty !== 'all') {
      result = result.filter(t => t.job?._id === selectedSpecialty);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.fullName.toLowerCase().includes(term) ||
        t.job?.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.specialties?.some(s => s.toLowerCase().includes(term))
      );
    }
    return result;
  }, [trainers, selectedSpecialty, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Gặp gỡ Huấn luyện viên của Chúng tôi</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Lựa chọn từ các huấn luyện viên đẳng cấp thế giới để tăng tốc tiến độ và đạt được mục tiêu thể hình của bạn.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên, chuyên môn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} className="text-slate-400" />
                  </InputAdornment>
                ),
              }
            }}
            sx={{ bgcolor: 'white', borderRadius: 2 }}
          />
        </div>

        {/* Specialty Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-5 h-5 text-indigo-600" />
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

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">Không tìm thấy huấn luyện viên nào</p>
          </div>
        ) : (
          /* Trainer Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredTrainers.map((trainer) => (
              <motion.div
                key={trainer._id}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col"
              >
                <div className="relative h-64">
                  <img
                    src={trainer.avatar || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400'}
                    alt={trainer.fullName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-slate-900">{trainer.rating || 5.0}</span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {trainer.job?.name || 'HLV'}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{trainer.fullName}</h3>
                  <p className="text-indigo-600 text-sm font-medium mb-2">{trainer.experience || ''}</p>
                  {trainer.locationId && (
                    <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {trainer.locationId.title}
                    </p>
                  )}
                  <p className="text-slate-500 text-sm mb-4 line-clamp-3">
                    {trainer.description || trainer.job?.description || ''}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {(trainer.specialties || []).slice(0, 3).map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 24, bgcolor: '#f1f5f9' }}
                      />
                    ))}
                  </div>

                  <div className="mt-auto space-y-3">
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/trainers/${trainer._id}/book`)}
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
                      startIcon={<Calendar size={18} />}
                    >
                      Đặt lịch tập
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
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
      </div>
    </div>
  );
}