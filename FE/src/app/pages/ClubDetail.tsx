import { useParams, Navigate } from 'react-router';
import { clubsData, disciplinesData } from '../data';
import { MapPin, Phone, Clock, Play, Quote } from 'lucide-react';
import Slider from 'react-slick';
import { FloatingContact } from '../components/FloatingContact';
import { motion } from 'motion/react';

export function ClubDetail() {
  const { id } = useParams();
  const club = clubsData.find(c => c.id === id);

  if (!club) {
    return <Navigate to="/" />;
  }

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 1 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ]
  };

  const transformationSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ]
  };

  const services = [
    { name: 'Khu Vực Yoga - GroupX', img: 'https://images.unsplash.com/photo-1676496962536-d8ef110ff6f0?auto=format&fit=crop&q=80&w=800' },
    { name: 'Khu Vực Kickfit & Boxing', img: 'https://images.unsplash.com/photo-1716307043003-dbe6a5cc496e?auto=format&fit=crop&q=80&w=800' },
    { name: 'Tủ Đồ Cá Nhân', img: 'https://images.unsplash.com/photo-1676012088690-d2197f76db9b?auto=format&fit=crop&q=80&w=800' },
    { name: 'Phòng Tắm - Vệ Sinh', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' }
  ];

  const transformations = [
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1648542036561-e1d66a5ae2b1?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600'
  ];

  const testimonials = [
    {
      name: 'Minh Tuấn',
      job: 'Nhân viên văn phòng',
      text: 'Cơ sở vật chất tuyệt vời, HLV nhiệt tình hỗ trợ 24/7. Sau 3 tháng tập, tôi đã cải thiện được sức khỏe và tinh thần rất nhiều.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Hoàng Oanh',
      job: 'Giáo viên',
      text: 'Mình đã giảm 5kg sau 2 tháng nhờ lộ trình của PT tại đây. Các HLV rất tận tâm và chuyên nghiệp, luôn theo sát tiến độ.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    {
      name: 'Đức Phát',
      job: 'Sinh viên',
      text: 'Không gian tập rộng rãi, máy móc hiện đại và đầy đủ. Giá cả phải chăng cho sinh viên, mình rất hài lòng với dịch vụ.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      <FloatingContact phoneNumber={club.phone} />

      {/* Hero Banner */}
      <div className="relative h-[60vh] md:h-[80vh]">
        <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{club.name}</h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl">{club.description}</p>
            
            <div className="flex flex-col md:flex-row gap-6 text-white bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 inline-flex">
              <div className="flex items-center gap-3">
                <MapPin className="text-indigo-400" />
                <span>{club.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-400" />
                <span>{club.hours}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-indigo-400" />
                <span className="font-bold text-lg">{club.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {/* Services */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Dịch Vụ & Tiện Ích</h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, idx) => (
              <motion.div whileHover={{ y: -5 }} key={idx} className="group cursor-pointer rounded-2xl overflow-hidden shadow-lg relative h-80">
                <img src={svc.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={svc.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <h3 className="absolute bottom-6 left-6 right-6 text-white font-bold text-xl">{svc.name}</h3>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Disciplines with video placeholders */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Các Bộ Môn Giảng Dạy</h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {disciplinesData.map(disc => (
              <div key={disc.id} className="bg-slate-50 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row">
                <div className="md:w-1/2 relative h-64 md:h-auto group">
                  <img src={disc.images[0]} alt={disc.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-6 md:w-1/2 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{disc.name}</h3>
                  <p className="text-slate-600 line-clamp-3">{disc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trainers Slider */}
        <section className="bg-slate-50 p-12 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Đội Ngũ Huấn Luyện Viên</h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="px-4">
            <Slider {...sliderSettings}>
              {[
                { name: 'HLV Nguyễn Văn A', role: 'Chuyên gia thể hình', desc: 'Chứng chỉ ISSA, 8 năm kinh nghiệm huấn luyện cá nhân và dinh dưỡng thể hình chuyên nghiệp.' },
                { name: 'HLV Trần Thị B', role: 'Yoga & Pilates Master', desc: 'Chứng chỉ RYT 500, chuyên sâu về trị liệu yoga và phục hồi chức năng vận động.' },
                { name: 'HLV Lê Minh C', role: 'Boxing & Kickfit Coach', desc: 'Vô địch Kickboxing Quốc gia 2022, huấn luyện viên cấp cao của Liên đoàn Boxing Việt Nam.' },
                { name: 'HLV Phạm Hồng D', role: 'GroupX & Dance Fitness', desc: 'Chứng chỉ Zumba & HIIT, chuyên xây dựng lớp học bùng nổ năng lượng và sáng tạo.' },
                { name: 'HLV Hoàng Quốc E', role: 'Strength & Conditioning', desc: 'Chứng chỉ NSCA-CSCS, chuyên xây dựng sức mạnh và hiệu suất tối đa cho vận động viên.' }
              ].map((trainer, i) => (
                <div key={i} className="px-3 outline-none">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row">
                    <div className="md:w-2/5 h-64 md:h-auto shrink-0">
                      <img src={`https://images.unsplash.com/photo-1648542036561-e1d66a5ae2b1?auto=format&fit=crop&w=400&q=80&sig=${i}`} alt="Trainer" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 flex flex-col justify-center md:w-3/5">
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{trainer.name}</h4>
                      <p className="text-indigo-600 font-medium mb-4">{trainer.role}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">{trainer.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>

        {/* Member Transformations */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 uppercase tracking-wide">Thay Đổi Hình Thể Cùng ZenFitness</h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="px-4">
            <Slider {...transformationSettings}>
              {transformations.map((img, i) => (
                <div key={i} className="px-3 outline-none">
                  <div className="rounded-2xl overflow-hidden shadow-md h-80 group">
                    <img src={img} alt="Transformation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 translate-x-1/3 -translate-y-1/3">
            <Quote className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Hội Viên Nói Gì Về Chúng Tôi</h2>
              <div className="w-24 h-1 bg-white mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl">
                  <Quote className="w-8 h-8 text-indigo-300 mb-6" />
                  <p className="text-lg leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30"
                    />
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className="text-sm text-indigo-200">{t.job}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
