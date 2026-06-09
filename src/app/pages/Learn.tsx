import { useState } from 'react';
import { Volume2, RotateCw, ChevronLeft, ChevronRight, Check, BookOpen, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card, CardContent, LinearProgress, Box, Typography, IconButton, TextField, InputAdornment } from '@mui/material';

const gymVocabulary = [
  { word: 'Hypertrophy', definition: 'Sự tăng kích thước của một cơ quan hoặc mô do sự gia tăng kích thước của các tế bào của nó.', example: 'Những người tập thể hình tập luyện đặc biệt để đạt được sự phì đại cơ bắp (hypertrophy).', language: 'en-US' },
  { word: 'Barbell', definition: 'Một thanh kim loại dài có gắn tạ ở mỗi đầu, được sử dụng trong việc nâng tạ.', example: 'Bài tập squat tốt nhất nên được thực hiện với một thanh đòn (barbell) chắc chắn.', language: 'en-US' },
  { word: 'Isokinetic', definition: 'Một loại bài tập làm cho cơ bắp co lại với tốc độ không đổi.', example: 'Máy tập Isokinetic thường được sử dụng trong các trung tâm phục hồi chức năng.', language: 'en-US' },
  { word: 'Metabolism', definition: 'Các quá trình hóa học xảy ra trong một sinh vật sống để duy trì sự sống.', example: 'Tập luyện cường độ cao ngắt quãng có thể thúc đẩy quá trình trao đổi chất (metabolism) của bạn trong nhiều giờ.', language: 'en-US' },
  { word: 'Proprioception', definition: 'Cảm giác về sự tự vận động và vị trí cơ thể.', example: 'Tập luyện thăng bằng giúp cải thiện khả năng nhận biết vị trí cơ thể (proprioception) của bạn.', language: 'en-US' },
  { word: 'Plyometrics', definition: 'Các bài tập trong đó cơ bắp tác dụng lực tối đa trong khoảng thời gian ngắn.', example: 'Nhảy bục (Box jumps) là một bài tập plyometric cổ điển.', language: 'en-US' },
  { word: 'Cardiovascular', definition: 'Liên quan đến tim và mạch máu.', example: 'Chạy bộ rất tốt cho sức khỏe tim mạch (cardiovascular).', language: 'en-US' },
  { word: 'Macronutrients', definition: 'Các chất dinh dưỡng chúng ta cần với số lượng lớn: protein, chất béo và carbohydrate.', example: 'Tính toán các chất dinh dưỡng đa lượng (macros) là điều cần thiết để quản lý cân nặng.', language: 'en-US' },
];

export function Learn() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = gymVocabulary.filter(item => 
    item.word.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentCard = filteredData[currentIndex] || gymVocabulary[0];
  const progress = ((currentIndex + 1) / filteredData.length) * 100;

  const pronounceWord = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentCard.word);
      utterance.lang = currentCard.language;
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    const newMastered = new Set(masteredCards);
    if (masteredCards.has(currentIndex)) {
      newMastered.delete(currentIndex);
    } else {
      newMastered.add(currentIndex);
    }
    setMasteredCards(newMastered);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <BookOpen className="text-indigo-600" />
              Từ vựng Ngành Gym
            </h1>
            <p className="text-slate-500 mt-1">Làm chủ ngôn ngữ của sức khỏe và hiệu suất.</p>
          </div>
          
          <TextField
            placeholder="Tìm kiếm từ vựng..."
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentIndex(0);
            }}
            slotProps={{
                input: {
                    startAdornment: (
                        <InputAdornment position="start">
                          <Search size={18} className="text-slate-400" />
                        </InputAdornment>
                      ),
                }
            }}
            sx={{ minWidth: 250, bgcolor: 'white' }}
          />
        </div>

        {filteredData.length > 0 ? (
          <div className="max-w-2xl mx-auto">
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#4f46e5' } }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {currentIndex + 1} / {filteredData.length}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {masteredCards.size} thuật ngữ đã thuộc
              </Typography>
            </Box>

            <div className="perspective-1000 mb-8" style={{ perspective: '1000px' }}>
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer"
              >
                <Card
                  sx={{
                    minHeight: 380,
                    position: 'relative',
                    backfaceVisibility: 'hidden',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                    borderRadius: 4,
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <CardContent sx={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 6 }}>
                    {!isFlipped ? (
                      <div className="text-center">
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b', mb: 2 }}>
                          {currentCard.word}
                        </Typography>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            pronounceWord();
                          }}
                          sx={{ color: '#4f46e5', bgcolor: '#f5f3ff', mb: 4 }}
                          size="large"
                        >
                          <Volume2 size={24} />
                        </IconButton>
                        <p className="text-slate-400 text-sm mt-8">Nhấn vào thẻ để xem định nghĩa</p>
                      </div>
                    ) : (
                      <div style={{ transform: 'rotateY(180deg)' }}>
                        <div className="mb-6">
                          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Định nghĩa</span>
                          <Typography variant="h5" sx={{ color: '#334155', mt: 1, lineHeight: 1.6, fontWeight: 500 }}>
                            {currentCard.definition}
                          </Typography>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Ví dụ sử dụng</span>
                          <p className="text-slate-500 mt-1 italic border-l-2 border-indigo-100 pl-4 py-2">
                            "{currentCard.example}"
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outlined"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                startIcon={<ChevronLeft />}
                sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
              >
                Trước đó
              </Button>

              <div className="flex gap-2">
                <Button
                  variant={masteredCards.has(currentIndex) ? "contained" : "outlined"}
                  onClick={handleMastered}
                  startIcon={<Check />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    minWidth: 140,
                    bgcolor: masteredCards.has(currentIndex) ? '#10b981' : 'transparent',
                    borderColor: masteredCards.has(currentIndex) ? '#10b981' : '#e2e8f0',
                    color: masteredCards.has(currentIndex) ? 'white' : '#64748b',
                    '&:hover': {
                      bgcolor: masteredCards.has(currentIndex) ? '#059669' : '#f8fafc',
                      borderColor: masteredCards.has(currentIndex) ? '#059669' : '#cbd5e1',
                    }
                  }}
                >
                  {masteredCards.has(currentIndex) ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
                </Button>

                <IconButton
                  onClick={() => setIsFlipped(!isFlipped)}
                  sx={{
                    border: '1px solid #e2e8f0',
                    bgcolor: 'white',
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#f8fafc' }
                  }}
                >
                  <RotateCw size={20} className="text-slate-600" />
                </IconButton>
              </div>

              <Button
                variant="contained"
                onClick={handleNext}
                disabled={currentIndex === filteredData.length - 1}
                endIcon={<ChevronRight />}
                sx={{ borderRadius: 2, textTransform: 'none', px: 3, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
              >
                Tiếp theo
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <Search className="mx-auto w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Không tìm thấy từ vựng</h3>
            <p className="text-slate-500">Hãy thử điều chỉnh từ khóa tìm kiếm của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
