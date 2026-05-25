import { Check, Shield } from 'lucide-react';
import { Button } from '@mui/material';
import { motion } from 'motion/react';
import { FloatingContact } from '../components/FloatingContact';
import { useState } from 'react';
import { packagesData, clubsData } from '../data';
import { Link } from 'react-router';

const disciplines = [
  { id: 'all', name: 'Tất cả' },
  { id: 'gym', name: 'Gym' },
  { id: 'yoga', name: 'Yoga' },
  { id: 'boxing', name: 'Boxing' },
  { id: 'combo', name: 'Combo' }
];

export function Packages() {
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');

  const filteredPackages = selectedDiscipline === 'all'
    ? packagesData
    : packagesData.filter(pkg => pkg.discipline === selectedDiscipline);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="min-h-screen bg-white py-24 px-4">
      <FloatingContact phoneNumber="1900 9999" />
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 uppercase">Gói tập dành cho bạn</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Các kế hoạch linh hoạt được thiết kế để phù hợp với lối sống và giúp bạn đạt được mục tiêu.
        </p>
      </div>

      {/* Refund Policy */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="bg-slate-50 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 border border-slate-100">
          <div className="bg-indigo-100 p-4 rounded-2xl shrink-0">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold text-slate-900 mb-2">Đảm bảo hoàn tiền trong 20 ngày</h4>
            <p className="text-slate-600">
              Nếu bạn không hoàn toàn hài lòng với cơ sở vật chất hoặc dịch vụ của chúng tôi trong vòng 20 ngày đầu tiên,
              chúng tôi sẽ hoàn trả đầy đủ phí hội viên. Không cần lý do.
            </p>
          </div>
          <Button variant="text" sx={{ color: '#4f46e5', fontWeight: 600, textTransform: 'none', shrink: 0 }}>
            Tìm hiểu thêm
          </Button>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          {disciplines.map((disc) => (
            <button
              key={disc.id}
              onClick={() => setSelectedDiscipline(disc.id)}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                selectedDiscipline === disc.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {disc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPackages.map((plan, index) => {
          const isHighlighted = plan.name === 'PREMIUM';
          const clubNames = plan.clubs.map(clubId => {
            const club = clubsData.find(c => c.id === clubId);
            return club?.name.replace('ZenFitness ', '') || '';
          });

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 rounded-2xl flex flex-col ${
                isHighlighted
                  ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-2xl'
                  : 'bg-slate-900 text-white shadow-lg'
              }`}
            >
              {plan.name === 'STANDARD' && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-xs font-bold">
                  HOT
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-4 tracking-wide">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-3xl font-extrabold">{formatPrice(plan.price)}</span>
                </div>
                <span className="text-sm text-slate-300">/ {plan.duration}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6 text-xs text-slate-300">
                <p className="font-semibold mb-1">Cơ sở:</p>
                <p className="line-clamp-2">{clubNames.join(', ')}</p>
              </div>

              <Link to={`/packages/${plan.id}/checkout`}>
                <Button
                  fullWidth
                  variant={isHighlighted ? "contained" : "outlined"}
                  size="large"
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    bgcolor: isHighlighted ? '#ef4444' : 'transparent',
                    borderColor: 'white',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isHighlighted ? '#dc2626' : 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'white'
                    }
                  }}
                >
                  {isHighlighted ? 'Đăng ký ngay' : 'Chi tiết'}
                </Button>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
