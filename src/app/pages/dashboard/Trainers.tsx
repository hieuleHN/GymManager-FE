import { DashboardLayout } from '../../components/DashboardLayout';
import { useState } from 'react';
import { Star, MessageSquare, Calendar } from 'lucide-react';
import { Button, Chip } from '@mui/material';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useChatContext } from '../../context/ChatContext';

const trainers = [
  {
    id: '1',
    name: 'Nguyễn Thùy Anh',
    specialty: 'Yoga & GroupX',
    discipline: 'yoga',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400',
    bio: 'Huấn luyện viên Yoga được chứng nhận với 8 năm kinh nghiệm.',
    tags: ['Yoga', 'Pilates', 'Meditation']
  },
  {
    id: '2',
    name: 'Trần Văn Mạnh',
    specialty: 'Gym & Bodybuilding',
    discipline: 'gym',
    rating: 5.0,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fe?auto=format&fit=crop&q=80&w=400',
    bio: 'Cựu vận động viên chuyên về sức mạnh và phì đại cơ bắp.',
    tags: ['Thể hình', 'Powerlifting', 'Nutrition']
  },
  {
    id: '3',
    name: 'Lê Minh Châu',
    specialty: 'Boxing & Kickfit',
    discipline: 'boxing',
    rating: 4.8,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400',
    bio: 'Chuyên gia Boxing giúp khách hàng cải thiện sức bền và kỹ thuật.',
    tags: ['Boxing', 'Kickboxing', 'MMA']
  },
  {
    id: '4',
    name: 'Phạm Quốc Huy',
    specialty: 'Gym & Strength',
    discipline: 'gym',
    rating: 4.9,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    bio: 'Chuyên gia sức mạnh với hơn 10 năm kinh nghiệm huấn luyện.',
    tags: ['Strength', 'Powerlifting', 'CrossFit']
  },
  {
    id: '5',
    name: 'Hoàng Thị Mai',
    specialty: 'Yoga & Wellness',
    discipline: 'yoga',
    rating: 4.9,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=400',
    bio: 'Huấn luyện viên Yoga chuyên về phục hồi chức năng.',
    tags: ['Yoga', 'Stretching', 'Recovery']
  },
  {
    id: '6',
    name: 'Vũ Đức Thắng',
    specialty: 'Boxing Coach',
    discipline: 'boxing',
    rating: 5.0,
    reviews: 134,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400',
    bio: 'Võ sĩ chuyên nghiệp chuyển sang làm huấn luyện viên.',
    tags: ['Boxing', 'Combat', 'Cardio']
  }
];

const disciplines = [
  { id: 'all', name: 'Tất cả' },
  { id: 'gym', name: 'Gym' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'boxing', name: 'Boxing' }
];

export function Trainers() {
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const { openChatWith } = useChatContext();

  const filteredTrainers =
    selectedDiscipline === 'all'
      ? trainers
      : trainers.filter((t) => t.discipline === selectedDiscipline);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Đặt lịch / Liên hệ HLV</h1>
          <p className="text-slate-600">Chọn huấn luyện viên phù hợp với mục tiêu của bạn</p>
        </div>

        <div className="flex gap-3">
          {disciplines.map((disc) => (
            <button
              key={disc.id}
              onClick={() => setSelectedDiscipline(disc.id)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
                selectedDiscipline === disc.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {disc.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrainers.map((trainer) => (
            <motion.div
              key={trainer.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100"
            >
              <div className="relative h-64">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-slate-900">{trainer.rating}</span>
                  <span className="text-xs text-slate-500">({trainer.reviews})</span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{trainer.name}</h3>
                <p className="text-indigo-600 text-sm font-medium mb-3">{trainer.specialty}</p>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{trainer.bio}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {trainer.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 24, bgcolor: '#f1f5f9' }}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <Link to={`/dashboard/trainers/${trainer.id}/book`}>
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none' }}
                      startIcon={<Calendar size={18} />}
                    >
                      Đặt lịch tập
                    </Button>
                  </Link>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => openChatWith(trainer.id, {
                      fullName: trainer.name,
                      avatar: trainer.image,
                      role: trainer.specialty
                    })}
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
u      </div>
    </DashboardLayout>
  );
}
