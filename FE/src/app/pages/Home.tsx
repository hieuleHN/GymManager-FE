import { ArrowRight, Users, Trophy, Target, ChevronRight, Zap, MapPin, Play, Quote, Check, QrCode, Newspaper, Calendar, Eye, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { FloatingContact } from '../components/FloatingContact';
import { useAuth, getApiUrl } from '../context/AuthContext';
import { clubsData, disciplinesData } from '../data';

const bannerImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200'
];

export function Home() {
  const [activeDiscipline, setActiveDiscipline] = useState(disciplinesData[0]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allDisciplines, setAllDisciplines] = useState<{ _id: string; name: string }[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [durationSelections, setDurationSelections] = useState<Record<string, number>>({});
  const [homeArticles, setHomeArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    if (!price) return '0đ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    arrows: false,
  };

  const disciplineSliderSettings = {
    dots: true,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  useEffect(() => {
    fetch(`${getApiUrl()}/api/disciplines?limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) setAllDisciplines(data.data);
      })
      .catch(() => { });
    fetch(`${getApiUrl()}/api/packages?limit=100`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) setPackages(data.data.filter((p: any) => p.is_active));
      })
      .catch(() => { })
      .finally(() => setLoadingPackages(false));
    fetch(`${getApiUrl()}/api/articles?page=1&limit=3`)
      .then(res => res.json())
      .then(data => {
        if (data?.data) setHomeArticles(data.data);
      })
      .catch(() => { })
      .finally(() => setLoadingArticles(false));
  }, []);

  const uniqueNames = Array.from(new Set(allDisciplines.map(d => d.name)));
  const filteredPackages = selectedDiscipline === 'all'
    ? packages
    : packages.filter(p => p.disciplineId?.name === selectedDiscipline);

  const handleRegister = (pkgId: string) => {
    if (!user) return navigate('/auth');
    navigate(`/packages/${pkgId}`);
  };

  const handleViewDetail = (pkgId: string) => {
    navigate(`/packages/${pkgId}`);
  };

  return (
    <div className="bg-white">
      <FloatingContact phoneNumber="1900 1234" />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 mb-6">
                <Zap className="w-4 h-4 mr-2" />
                Mới: Mở cửa 24/7 từ hôm nay
              </span>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
                Thay đổi <span className="text-indigo-600">Cơ thể</span>, Nâng tầm <span className="text-indigo-600">Cuộc sống</span>.
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                Gia nhập ZENFITNESS và trải nghiệm môi trường tập luyện cao cấp với đội ngũ huấn luyện viên ưu tú,
                công nghệ tiên tiến và cộng đồng tận tâm vì sự thành công của bạn.
              </p>

              <div className="flex flex-wrap gap-4">
                {/* ĐOẠN TỐI ƯU: Nút Mã QR Điểm Danh hiển thị nhanh khi Hội viên đã đăng nhập */}
                {user && (
                  <Link to="/dashboard/qr">
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: '#ff5722',
                        py: 1.5,
                        px: 4,
                        '&:hover': { bgcolor: '#e64a19' },
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(255,87,34,0.3)'
                      }}
                      startIcon={<QrCode />}
                    >
                      QR Điểm Danh
                    </Button>
                  </Link>
                )}
                <Link to="/articles">
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#0f172a',
                      py: 1.5,
                      px: 4,
                      '&:hover': { bgcolor: '#334155' },
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                    startIcon={<Newspaper />}
                  >
                    Bài viết
                  </Button>
                </Link>

                <Link to="/auth?mode=register">
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ bgcolor: '#4f46e5', py: 1.5, px: 4, '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', fontSize: '1.1rem' }}
                    endIcon={<ArrowRight />}
                  >
                    Bắt đầu dùng thử miễn phí
                  </Button>
                </Link>
                <Link to="/packages">
                  <Button variant="outlined" size="large" sx={{ py: 1.5, px: 4, textTransform: 'none', fontSize: '1.1rem' }}>
                    Xem các gói hội viên
                  </Button>
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-8">
                <div>
                  <p className="text-2xl font-bold text-slate-900">10k+</p>
                  <p className="text-sm text-slate-500">Hội viên</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">50+</p>
                  <p className="text-sm text-slate-500">HLV ưu tú</p>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">6+</p>
                  <p className="text-sm text-slate-500">Cơ sở tập luyện</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 lg:mt-0 relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[600px]">
                <Slider {...bannerSettings} className="h-full w-full">
                  {bannerImages.map((img, idx) => (
                    <div key={idx} className="h-[600px] outline-none">
                      <img
                        src={img}
                        alt="Phòng tập hiện đại"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </Slider>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 z-20">
                <div className="bg-green-100 p-3 rounded-full">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Được đánh giá #1</p>
                  <p className="text-lg font-bold text-slate-900">Trung tâm Thể hình 2026</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Facilities / Clubs Section */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Hệ Thống Câu Lạc Bộ ZENFITNESS</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Không gian tập luyện sang trọng, đẳng cấp with vị trí đắc địa trải dài khắp cả nước.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubsData.map((club) => (
              <motion.div
                key={club.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
              >
                <div className="h-48 overflow-hidden">
                  <img src={club.image} alt={club.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{club.name}</h3>
                  <div className="flex flex-col gap-2 mb-6">
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      {club.address}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <Link to={`/clubs/${club.id}`}>
                      <Button variant="outlined" fullWidth sx={{ textTransform: 'none', color: '#4f46e5', borderColor: '#4f46e5' }}>
                        Xem thêm cơ sở
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Khám Phá Các Bộ Môn</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Đa dạng các bộ môn tập luyện phù hợp với mọi thể trạng và mục tiêu sức khỏe của bạn.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 items-center">
            {/* Left side - List & Description */}
            <div className="w-full lg:w-1/2 space-y-6">
              <div className="flex flex-wrap gap-3 mb-8">
                {disciplinesData.map(disc => (
                  <button
                    key={disc.id}
                    onClick={() => setActiveDiscipline(disc)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${activeDiscipline.id === disc.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {disc.name}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDiscipline.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-50 p-8 rounded-2xl"
                >
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{activeDiscipline.name}</h3>
                  <p className="text-slate-600 text-lg leading-relaxed mb-8">
                    {activeDiscipline.description}
                  </p>
                  <Link to={`/disciplines/${activeDiscipline.id}`}>
                    <Button
                      variant="contained"
                      endIcon={<ArrowRight />}
                      sx={{ bgcolor: '#0f172a', '&:hover': { bgcolor: '#334155' }, textTransform: 'none' }}
                    >
                      Tìm hiểu chi tiết
                    </Button>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right side - Image Slider */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-3xl overflow-hidden shadow-xl h-[500px]">
                <Slider {...disciplineSliderSettings} key={activeDiscipline.id} className="h-full w-full">
                  {activeDiscipline.images.map((img, idx) => (
                    <div key={idx} className="h-[500px] outline-none relative group">
                      <img
                        src={img}
                        alt={activeDiscipline.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Package Registration Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Đăng Ký Gói Tập Ngay</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Chọn bộ môn và gói tập phù hợp với bạn. Thanh toán linh hoạt theo tháng hoặc năm.
            </p>
          </div>

          {/* Discipline Filter Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button
              onClick={() => setSelectedDiscipline('all')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedDiscipline === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              Tất cả
            </button>
            {uniqueNames.map(name => (
              <button
                key={name}
                onClick={() => setSelectedDiscipline(name)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedDiscipline === name
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Package Grid */}
          {loadingPackages ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Đang tải gói tập...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Không có gói tập nào cho bộ môn này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPackages.map((plan, index) => {
                const durIdx = durationSelections[plan._id] ?? 0;
                const durations = plan.durations || [];
                const selectedDur = durations[durIdx] || { months: 1, discount: 0 };
                const totalPrice = plan.unitPrice * selectedDur.months * (1 - selectedDur.discount / 100);

                return (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow p-6 flex flex-col"
                  >
                    {plan.disciplineId && (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start mb-3">
                        {plan.disciplineId.name}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {formatPrice(plan.unitPrice)}
                      </span>
                      <span className="text-sm text-slate-500 ml-1">/ tháng</span>
                    </div>

                    {/* Duration Selector */}
                    {durations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Thời hạn</p>
                        <div className="flex flex-wrap gap-2">
                          {durations.map((d: { months: number; discount: number }, idx: number) => {
                            const isSelected = durIdx === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setDurationSelections(prev => ({ ...prev, [plan._id]: idx }))}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                                  }`}
                              >
                                {d.months} tháng{d.discount > 0 && ` (-${d.discount}%)`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total Price */}
                    <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
                      <p className="text-xs text-slate-600 mb-1">Tổng tiền:</p>
                      <p className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6 flex-1">
                      {(plan.features || []).slice(0, 4).map((feature: string) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {(plan.features || []).length > 4 && (
                        <li className="text-xs text-slate-400">+ thêm {plan.features.length - 4} quyền lợi</li>
                      )}
                    </ul>

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={() => handleViewDetail(plan._id)}
                      sx={{
                        height: 48,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        bgcolor: '#4f46e5',
                        '&:hover': { bgcolor: '#4338ca' }
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Bài viết & Kiến thức</h2>
              <p className="text-slate-600 max-w-2xl">
                Cập nhật kiến thức thể hình, dinh dưỡng và các sự kiện mới nhất từ ZENFITNESS
              </p>
            </div>
            <Link to="/articles" className="hidden sm:inline-flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingArticles ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500">Đang tải bài viết...</p>
            </div>
          ) : homeArticles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Chưa có bài viết nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {homeArticles.map((article, index) => (
                <motion.div
                  key={article._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/articles/${article._id}`}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full"
                  >
                    <div className="h-48 bg-slate-100 overflow-hidden">
                      {article.image ? (
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <FileText className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 self-start bg-indigo-100 text-indigo-700">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-1">
                        {stripHtml(article.content)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(article.publishedAt || article.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {article.views} lượt xem
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-indigo-600 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 translate-x-1/3 -translate-y-1/3">
          <Quote className="w-64 h-64 text-white" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Hội Viên Nói Gì Về Chúng Tôi</h2>
            <div className="w-24 h-1 bg-white mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
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
            ].map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl"
              >
                <Quote className="w-8 h-8 text-indigo-300 mb-6" />
                <p className="text-lg leading-relaxed mb-6 text-white">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30"
                  />
                  <div>
                    <div className="font-bold text-white">{testimonial.name}</div>
                    <div className="text-sm text-indigo-200">{testimonial.job}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}