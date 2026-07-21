import { useState } from 'react';
import { Search, Star, MessageSquare, Calendar, Filter } from 'lucide-react';
import { Button, TextField, InputAdornment, Rating, Chip } from '@mui/material';
import { motion } from 'motion/react';

const trainers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    specialty: 'Giảm cân & Yoga',
    rating: 4.9,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400',
    bio: 'Huấn luyện viên Yoga được chứng nhận với 8 năm kinh nghiệm giúp phụ nữ đạt được vóc dáng mơ ước.',
    tags: ['Yoga', 'HIIT', 'Dinh dưỡng']
  },
  {
    id: '2',
    name: 'Marcus Chen',
    specialty: 'Sức mạnh & Thể lực',
    rating: 5.0,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1567013127542-490d757e51fe?auto=format&fit=crop&q=80&w=400',
    bio: 'Cựu vận động viên chuyên về sức mạnh bùng nổ và các chuyển động phức hợp. Tập trung vào phì đại cơ bắp.',
    tags: ['Thể hình', 'Powerlifting']
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    specialty: 'Pilates & Linh hoạt',
    rating: 4.8,
    reviews: 215,
    image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&q=80&w=400',
    bio: 'Chuyên gia phục hồi giúp khách hàng cải thiện phạm vi chuyển động và sự ổn định của cốt lõi thông qua Pilates.',
    tags: ['Pilates', 'Linh hoạt', 'Phục hồi']
  },
  {
    id: '4',
    name: 'David Wilson',
    specialty: 'Boxing & MMA',
    rating: 4.9,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400',
    bio: 'Võ sĩ chuyên nghiệp chuyển sang làm huấn luyện viên. Thể hình dựa trên chiến đấu cường độ cao để xây dựng sức bền và bản lĩnh.',
    tags: ['Boxing', 'MMA', 'Sức bền']
  }
];

export function PTList() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrainers = trainers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Gặp gỡ Huấn luyện viên của Chúng tôi</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            Lựa chọn từ các huấn luyện viên đẳng cấp thế giới để tăng tốc tiến độ và đạt được mục tiêu thể hình của bạn.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <TextField
            fullWidth
            placeholder="Tìm kiếm theo tên hoặc chuyên môn..."
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
            sx={{ bgcolor: 'white' }}
          />
          <Button 
            variant="outlined" 
            startIcon={<Filter size={18} />}
            sx={{ minWidth: 120, height: 56, borderColor: '#e2e8f0', color: '#64748b', textTransform: 'none' }}
          >
            Bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredTrainers.map((trainer) => (
            <motion.div
              key={trainer.id}
              whileHover={{ y: -8 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col"
            >
              <div className="relative h-64">
                <img 
                  src={trainer.image} 
                  alt={trainer.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-bold text-slate-900">{trainer.rating}</span>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{trainer.name}</h3>
                <p className="text-indigo-600 text-sm font-medium mb-3">{trainer.specialty}</p>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {trainer.bio}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {trainer.tags.map(tag => (
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
      </div>
    </div>
  );
}
