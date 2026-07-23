import { useParams, Navigate, Link } from 'react-router';
import { disciplinesData } from '../data';
import { Check, ArrowRight } from 'lucide-react';
import Slider from 'react-slick';
import { Button } from '@mui/material';

export function DisciplineDetail() {
  const { id } = useParams();
  const discipline = disciplinesData.find(d => d.id === id);

  if (!discipline) {
    return <Navigate to="/" />;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  const benefits = [
    'Tăng cường sức mạnh và độ bền',
    'Cải thiện sức khỏe tim mạch',
    'Giảm mỡ thừa hiệu quả',
    'Giải tỏa căng thẳng, stress',
    'Xây dựng sự tự tin và kỷ luật',
    'Môi trường tập luyện chuyên nghiệp'
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <div className="relative h-[50vh] bg-slate-900 flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img src={discipline.images[0]} alt={discipline.name} className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            {discipline.name}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {discipline.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {/* Intro & Slider */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Trải Nghiệm Tập Luyện Đẳng Cấp
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Bộ môn {discipline.name} tại ZENFITNESS được thiết kế bài bản với giáo trình chuẩn quốc tế, trang thiết bị tối tân và đội ngũ huấn luyện viên dày dặn kinh nghiệm, cam kết mang lại hiệu quả tối ưu nhất cho bạn.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1 bg-green-100 p-1 rounded-full shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="pt-4">
              <Link to="/packages">
                <Button 
                  variant="contained" 
                  size="large"
                  sx={{ bgcolor: '#4f46e5', py: 1.5, px: 4, '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', fontSize: '1.1rem' }}
                  endIcon={<ArrowRight />}
                >
                  Đăng ký tập thử
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px]">
            <Slider {...sliderSettings} className="h-full w-full">
              {discipline.images.map((img, idx) => (
                <div key={idx} className="h-[500px] outline-none">
                  <img src={img} alt={`${discipline.name} ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </Slider>
          </div>
        </section>

        {/* Services & Facilities */}
        <section className="bg-slate-50 p-12 md:p-16 rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Tiện Ích Đi Kèm Bộ Môn</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Khi tham gia bộ môn {discipline.name}, bạn sẽ được tận hưởng các đặc quyền tiện ích chuẩn 5 sao.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Tủ Đồ Khóa Từ',
                desc: 'An toàn tuyệt đối cho tài sản cá nhân của bạn.',
                img: 'https://images.unsplash.com/photo-1676012088690-d2197f76db9b?auto=format&fit=crop&q=80&w=400'
              },
              {
                title: 'Khu Vực Thư Giãn',
                desc: 'Phục hồi cơ bắp với xông hơi, phòng tắm sang trọng.',
                img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400'
              },
              {
                title: 'Thiết Bị Theo Dõi',
                desc: 'Ứng dụng ZENFITNESS phân tích các chỉ số tập luyện chi tiết.',
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400'
              },
            ].map((svc, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                <div className="h-48 overflow-hidden">
                  <img
                    src={svc.img}
                    alt={svc.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{svc.title}</h3>
                  <p className="text-slate-600">{svc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
