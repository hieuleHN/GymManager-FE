import { useState, useEffect } from 'react';
import { Search, Star, MessageSquare, Calendar, Filter } from 'lucide-react';
import { Button, TextField, InputAdornment, Rating, Chip, CircularProgress } from '@mui/material';
import { motion } from 'motion/react';
import { getApiUrl, getAuthHeaders, useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { toast } from 'sonner';

interface Trainer {
  _id: string;
  fullName: string;
  specialty?: string;
  rating?: number;
  bio?: string;
  avatar?: string;
  tags?: string[];
}

export function PTList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const { openChatWith } = useChatContext();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/staff/trainers`, {
          headers: getAuthHeaders() as HeadersInit
        });
        if (res.ok) {
          const data = await res.json();
          setTrainers(data);
        }
      } catch (error) {
        console.error('Failed to fetch trainers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  const filteredTrainers = trainers.filter(t => 
    (t.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (t.specialty?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress />
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Không tìm thấy huấn luyện viên nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredTrainers.map((trainer) => (
              <motion.div
                key={trainer._id}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col"
              >
                <div className="relative h-64 bg-slate-200">
                  <img 
                    src={trainer.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=400'} 
                    alt={trainer.fullName} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-bold text-slate-900">{trainer.rating || '5.0'}</span>
                  </div>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{trainer.fullName}</h3>
                  <p className="text-indigo-600 text-sm font-medium mb-3">{trainer.specialty || 'Huấn luyện viên'}</p>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                    {trainer.bio || 'Huấn luyện viên chuyên nghiệp giúp bạn đạt được mục tiêu sức khỏe.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(trainer.tags || []).map(tag => (
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
                      onClick={() => {
                        if (!user) {
                          toast.error('Bạn cần đăng nhập để liên hệ!');
                          return;
                        }
                        openChatWith(trainer._id);
                      }}
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
