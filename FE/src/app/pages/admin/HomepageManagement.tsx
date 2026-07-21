import { AdminLayout } from '../../components/AdminLayout';
import { useState } from 'react';
import {
  Image, Type, Star, Users, BookOpen, MessageSquare, Trophy,
  Plus, Trash2, Edit3, Save, Eye, GripVertical, ChevronDown, ChevronUp,
  ToggleLeft, ToggleRight, Upload, Link2, Video, Award
} from 'lucide-react';

// ─── Data Types ────────────────────────────────────────────────────────────────

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  image: string;
  active: boolean;
  order: number;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar: string;
  active: boolean;
}

interface Trainer {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  image: string;
  featured: boolean;
}

interface Achievement {
  id: number;
  number: string;
  label: string;
  icon: string;
  active: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  featured: boolean;
  publishDate: string;
}

interface PartnerLogo {
  id: number;
  name: string;
  logo: string;
  website: string;
  active: boolean;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  active: boolean;
}

// ─── Initial Data ───────────────────────────────────────────────────────────

const initBanners: BannerSlide[] = [
  { id: 1, title: 'Bắt đầu hành trình khỏe mạnh của bạn', subtitle: 'Trang thiết bị hiện đại, HLV chuyên nghiệp', cta: 'Đăng ký ngay', image: '/banner1.jpg', active: true, order: 1 },
  { id: 2, title: 'Yoga & Mindfulness', subtitle: 'Cân bằng thể chất và tinh thần', cta: 'Khám phá', image: '/banner2.jpg', active: true, order: 2 },
  { id: 3, title: 'Boxing Training', subtitle: 'Rèn luyện bản lĩnh, nâng cao thể lực', cta: 'Tìm hiểu thêm', image: '/banner3.jpg', active: false, order: 3 },
];

const initTestimonials: Testimonial[] = [
  { id: 1, name: 'Nguyễn Thị Lan', role: 'Hội viên 2 năm', content: 'ZenFitness đã thay đổi hoàn toàn lối sống của tôi. Đội ngũ HLV rất tận tâm và chuyên nghiệp!', rating: 5, avatar: 'NL', active: true },
  { id: 2, name: 'Trần Văn Minh', role: 'Hội viên 1 năm', content: 'Cơ sở vật chất hiện đại, sạch sẽ. Tôi đặc biệt thích các lớp Boxing buổi sáng.', rating: 5, avatar: 'TM', active: true },
  { id: 3, name: 'Lê Thị Hương', role: 'Hội viên 3 năm', content: 'Giá cả hợp lý, không gian thoáng đãng. Đã giới thiệu cho nhiều bạn bè của mình.', rating: 4, avatar: 'LH', active: true },
  { id: 4, name: 'Phạm Quốc Tuấn', role: 'Hội viên 6 tháng', content: 'App đặt lịch rất tiện lợi, HLV nhiệt tình hỗ trợ. Giảm được 8kg trong 3 tháng!', rating: 5, avatar: 'PT', active: false },
];

const initTrainers: Trainer[] = [
  { id: 1, name: 'Nguyễn Minh Tuấn', specialty: 'Gym & Fitness', experience: '8 năm kinh nghiệm', image: '', featured: true },
  { id: 2, name: 'Trần Thị Mai', specialty: 'Yoga & Pilates', experience: '6 năm kinh nghiệm', image: '', featured: true },
  { id: 3, name: 'Lê Văn Hùng', specialty: 'Boxing & MMA', experience: '10 năm kinh nghiệm', image: '', featured: true },
  { id: 4, name: 'Phạm Thu Hà', specialty: 'Zumba & Aerobic', experience: '5 năm kinh nghiệm', image: '', featured: false },
];

const initAchievements: Achievement[] = [
  { id: 1, number: '5,000+', label: 'Hội viên tin tưởng', icon: 'users', active: true },
  { id: 2, number: '15+', label: 'HLV chuyên nghiệp', icon: 'award', active: true },
  { id: 3, number: '8', label: 'Cơ sở trên toàn quốc', icon: 'map', active: true },
  { id: 4, number: '10+', label: 'Năm kinh nghiệm', icon: 'trophy', active: true },
];

const initBlogs: BlogPost[] = [
  { id: 1, title: '5 bài tập Gym tốt nhất cho người mới bắt đầu', excerpt: 'Hướng dẫn chi tiết các bài tập phù hợp cho người mới...', category: 'Gym', image: '', featured: true, publishDate: '2026-05-20' },
  { id: 2, title: 'Chế độ dinh dưỡng sau buổi tập Yoga', excerpt: 'Những thực phẩm tốt nhất giúp phục hồi cơ thể sau tập Yoga...', category: 'Yoga', image: '', featured: true, publishDate: '2026-05-15' },
  { id: 3, title: 'Lợi ích của Boxing đối với sức khỏe tâm thần', excerpt: 'Nghiên cứu mới nhất cho thấy Boxing không chỉ tốt cho thể chất...', category: 'Boxing', image: '', featured: false, publishDate: '2026-05-10' },
];

const initPartners: PartnerLogo[] = [
  { id: 1, name: 'Nike', logo: 'NIKE', website: 'https://nike.com', active: true },
  { id: 2, name: 'Adidas', logo: 'ADIDAS', website: 'https://adidas.com', active: true },
  { id: 3, name: 'Optimum Nutrition', logo: 'ON', website: 'https://on.com', active: true },
  { id: 4, name: 'Garmin', logo: 'GARMIN', website: 'https://garmin.com', active: false },
];

const initFAQs: FAQ[] = [
  { id: 1, question: 'Phòng gym mở cửa từ mấy giờ?', answer: 'Chúng tôi mở cửa từ 5:30 sáng đến 11:00 đêm các ngày trong tuần, cuối tuần từ 6:00 sáng đến 10:00 đêm.', category: 'Giờ hoạt động', active: true },
  { id: 2, question: 'Có thể tập thử trước khi đăng ký không?', answer: 'Có! Chúng tôi cung cấp 1 buổi tập thử miễn phí cho hội viên mới. Liên hệ lễ tân để đặt lịch.', category: 'Đăng ký', active: true },
  { id: 3, question: 'Gói tập có thể chuyển nhượng không?', answer: 'Gói tập không thể chuyển nhượng nhưng có thể tạm hoãn tối đa 30 ngày trong trường hợp sức khỏe.', category: 'Gói tập', active: true },
  { id: 4, question: 'Có chỗ giữ xe không?', answer: 'Có bãi xe miễn phí tại tất cả các cơ sở của chúng tôi với sức chứa 200 xe máy và 50 ô tô.', category: 'Tiện ích', active: false },
];

// ─── Sub Components ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'banner', label: 'Banner Slider', icon: Image },
  { id: 'achievements', label: 'Thành tựu', icon: Trophy },
  { id: 'trainers', label: 'HLV nổi bật', icon: Users },
  { id: 'testimonials', label: 'Đánh giá KH', icon: MessageSquare },
  { id: 'blogs', label: 'Bài viết', icon: BookOpen },
  { id: 'partners', label: 'Đối tác', icon: Award },
  { id: 'faq', label: 'FAQ', icon: Type },
];

function SectionHeader({ title, subtitle, onSave }: { title: string; subtitle: string; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onSave}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
      >
        <Save className="w-4 h-4" />
        Lưu thay đổi
      </button>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex-shrink-0">
      {checked
        ? <ToggleRight className="w-8 h-8 text-indigo-600" />
        : <ToggleLeft className="w-8 h-8 text-slate-400" />}
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function HomepageManagement() {
  const [activeTab, setActiveTab] = useState('banner');
  const [saved, setSaved] = useState(false);

  const [banners, setBanners] = useState<BannerSlide[]>(initBanners);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initTestimonials);
  const [trainers, setTrainers] = useState<Trainer[]>(initTrainers);
  const [achievements, setAchievements] = useState<Achievement[]>(initAchievements);
  const [blogs, setBlogs] = useState<BlogPost[]>(initBlogs);
  const [partners, setPartners] = useState<PartnerLogo[]>(initPartners);
  const [faqs, setFAQs] = useState<FAQ[]>(initFAQs);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Banner handlers
  const updateBanner = (id: number, field: keyof BannerSlide, value: string | boolean | number) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const addBanner = () => {
    const id = Math.max(...banners.map(b => b.id)) + 1;
    setBanners(prev => [...prev, { id, title: 'Banner mới', subtitle: '', cta: 'Xem thêm', image: '', active: false, order: prev.length + 1 }]);
  };
  const deleteBanner = (id: number) => setBanners(prev => prev.filter(b => b.id !== id));

  // Testimonial handlers
  const updateTestimonial = (id: number, field: keyof Testimonial, value: string | boolean | number) => {
    setTestimonials(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const addTestimonial = () => {
    const id = Math.max(...testimonials.map(t => t.id)) + 1;
    setTestimonials(prev => [...prev, { id, name: 'Hội viên mới', role: 'Hội viên', content: '', rating: 5, avatar: 'HV', active: false }]);
  };
  const deleteTestimonial = (id: number) => setTestimonials(prev => prev.filter(t => t.id !== id));

  // Trainer handlers
  const updateTrainer = (id: number, field: keyof Trainer, value: string | boolean) => {
    setTrainers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  // Achievement handlers
  const updateAchievement = (id: number, field: keyof Achievement, value: string | boolean) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };
  const addAchievement = () => {
    const id = Math.max(...achievements.map(a => a.id)) + 1;
    setAchievements(prev => [...prev, { id, number: '0+', label: 'Thành tích mới', icon: 'star', active: false }]);
  };
  const deleteAchievement = (id: number) => setAchievements(prev => prev.filter(a => a.id !== id));

  // Blog handlers
  const updateBlog = (id: number, field: keyof BlogPost, value: string | boolean) => {
    setBlogs(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  const addBlog = () => {
    const id = Math.max(...blogs.map(b => b.id)) + 1;
    setBlogs(prev => [...prev, { id, title: 'Bài viết mới', excerpt: '', category: 'Gym', image: '', featured: false, publishDate: '2026-06-04' }]);
  };
  const deleteBlog = (id: number) => setBlogs(prev => prev.filter(b => b.id !== id));

  // Partner handlers
  const updatePartner = (id: number, field: keyof PartnerLogo, value: string | boolean) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const addPartner = () => {
    const id = Math.max(...partners.map(p => p.id)) + 1;
    setPartners(prev => [...prev, { id, name: 'Đối tác mới', logo: 'NEW', website: '', active: false }]);
  };
  const deletePartner = (id: number) => setPartners(prev => prev.filter(p => p.id !== id));

  // FAQ handlers
  const updateFAQ = (id: number, field: keyof FAQ, value: string | boolean) => {
    setFAQs(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  const addFAQ = () => {
    const id = Math.max(...faqs.map(f => f.id)) + 1;
    setFAQs(prev => [...prev, { id, question: 'Câu hỏi mới?', answer: '', category: 'Chung', active: false }]);
  };
  const deleteFAQ = (id: number) => setFAQs(prev => prev.filter(f => f.id !== id));

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Quản lý Giao diện Trang chủ</h1>
            <p className="text-slate-600">Quản lý nội dung hiển thị trên trang chủ website ZenFitness</p>
          </div>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Xem trang chủ
          </a>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" />
            Đã lưu thay đổi thành công!
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-slate-100">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">

            {/* ── TAB: BANNER ── */}
            {activeTab === 'banner' && (
              <div>
                <SectionHeader
                  title="Banner Slider"
                  subtitle="Quản lý các slide hiển thị trên đầu trang chủ"
                  onSave={handleSave}
                />
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                        <span className="text-sm font-semibold text-slate-700">Slide #{banner.order}</span>
                        <div className="ml-auto flex items-center gap-3">
                          <Toggle checked={banner.active} onChange={v => updateBanner(banner.id, 'active', v)} />
                          <button onClick={() => deleteBanner(banner.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tiêu đề chính</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={banner.title}
                            onChange={e => updateBanner(banner.id, 'title', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Phụ đề</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={banner.subtitle}
                            onChange={e => updateBanner(banner.id, 'subtitle', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nút CTA</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={banner.cta}
                            onChange={e => updateBanner(banner.id, 'cta', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Hình ảnh</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              placeholder="URL hình ảnh..."
                              value={banner.image}
                              onChange={e => updateBanner(banner.id, 'image', e.target.value)}
                            />
                            <button className="border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-1">
                              <Upload className="w-3.5 h-3.5" /> Tải lên
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addBanner} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Thêm slide mới
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: ACHIEVEMENTS ── */}
            {activeTab === 'achievements' && (
              <div>
                <SectionHeader
                  title="Thành tựu nổi bật"
                  subtitle="Các con số ấn tượng hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map(item => (
                    <div key={item.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold text-slate-700">Thành tựu #{item.id}</span>
                        <div className="flex items-center gap-2">
                          <Toggle checked={item.active} onChange={v => updateAchievement(item.id, 'active', v)} />
                          <button onClick={() => deleteAchievement(item.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Con số</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={item.number}
                            onChange={e => updateAchievement(item.id, 'number', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nhãn</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={item.label}
                            onChange={e => updateAchievement(item.id, 'label', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addAchievement} className="mt-4 w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Thêm thành tựu
                </button>
              </div>
            )}

            {/* ── TAB: TRAINERS ── */}
            {activeTab === 'trainers' && (
              <div>
                <SectionHeader
                  title="HLV nổi bật"
                  subtitle="Chọn HLV hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-5">
                  Khuyến nghị hiển thị tối đa <strong>4 HLV</strong> trên trang chủ để đảm bảo giao diện đẹp.
                </p>
                <div className="space-y-3">
                  {trainers.map(trainer => (
                    <div key={trainer.id} className={`border rounded-xl p-4 flex items-center gap-4 ${trainer.featured ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                        {trainer.name.charAt(0)}
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tên HLV</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={trainer.name}
                            onChange={e => updateTrainer(trainer.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Chuyên môn</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={trainer.specialty}
                            onChange={e => updateTrainer(trainer.id, 'specialty', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Kinh nghiệm</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={trainer.experience}
                            onChange={e => updateTrainer(trainer.id, 'experience', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <Toggle checked={trainer.featured} onChange={v => updateTrainer(trainer.id, 'featured', v)} />
                        <span className="text-xs text-slate-500">Nổi bật</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: TESTIMONIALS ── */}
            {activeTab === 'testimonials' && (
              <div>
                <SectionHeader
                  title="Đánh giá khách hàng"
                  subtitle="Quản lý nhận xét hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <div className="space-y-4">
                  {testimonials.map(t => (
                    <div key={t.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {t.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Toggle checked={t.active} onChange={v => updateTestimonial(t.id, 'active', v)} />
                          <button onClick={() => deleteTestimonial(t.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tên khách hàng</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={t.name}
                            onChange={e => updateTestimonial(t.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Vai trò / Thời gian</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={t.role}
                            onChange={e => updateTestimonial(t.id, 'role', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nội dung đánh giá</label>
                          <textarea
                            rows={3}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                            value={t.content}
                            onChange={e => updateTestimonial(t.id, 'content', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Số sao</label>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button
                                key={s}
                                onClick={() => updateTestimonial(t.id, 'rating', s)}
                                className={`w-8 h-8 rounded-lg text-lg ${s <= t.rating ? 'text-yellow-400' : 'text-slate-200'}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addTestimonial} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Thêm đánh giá
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: BLOGS ── */}
            {activeTab === 'blogs' && (
              <div>
                <SectionHeader
                  title="Bài viết nổi bật"
                  subtitle="Quản lý bài viết hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <div className="space-y-4">
                  {blogs.map(blog => (
                    <div key={blog.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          blog.featured ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {blog.featured ? '★ Nổi bật' : 'Bình thường'}
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-slate-600 flex items-center gap-1.5">
                            <input type="checkbox" checked={blog.featured} onChange={e => updateBlog(blog.id, 'featured', e.target.checked)} className="rounded" />
                            Hiển thị nổi bật
                          </label>
                          <button onClick={() => deleteBlog(blog.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tiêu đề bài viết</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={blog.title}
                            onChange={e => updateBlog(blog.id, 'title', e.target.value)}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tóm tắt</label>
                          <textarea
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                            value={blog.excerpt}
                            onChange={e => updateBlog(blog.id, 'excerpt', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Danh mục</label>
                          <select
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={blog.category}
                            onChange={e => updateBlog(blog.id, 'category', e.target.value)}
                          >
                            {['Gym', 'Yoga', 'Boxing', 'Pilates', 'Dinh dưỡng', 'Chung'].map(c => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Ngày đăng</label>
                          <input
                            type="date"
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={blog.publishDate}
                            onChange={e => updateBlog(blog.id, 'publishDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addBlog} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Thêm bài viết
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: PARTNERS ── */}
            {activeTab === 'partners' && (
              <div>
                <SectionHeader
                  title="Đối tác & Thương hiệu"
                  subtitle="Logo đối tác hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partners.map(partner => (
                    <div key={partner.id} className="border border-slate-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 font-bold text-sm">
                          {partner.logo}
                        </div>
                        <div className="flex items-center gap-2">
                          <Toggle checked={partner.active} onChange={v => updatePartner(partner.id, 'active', v)} />
                          <button onClick={() => deletePartner(partner.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Tên đối tác</label>
                          <input
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            value={partner.name}
                            onChange={e => updatePartner(partner.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                          <div className="flex gap-2">
                            <Link2 className="w-4 h-4 text-slate-400 self-center flex-shrink-0" />
                            <input
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={partner.website}
                              onChange={e => updatePartner(partner.id, 'website', e.target.value)}
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Logo URL / Upload</label>
                          <div className="flex gap-2">
                            <input
                              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              placeholder="URL logo..."
                              value={partner.logo.startsWith('http') ? partner.logo : ''}
                              onChange={e => updatePartner(partner.id, 'logo', e.target.value)}
                            />
                            <button className="border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 flex items-center gap-1 text-sm">
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addPartner} className="mt-4 w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Thêm đối tác
                </button>
              </div>
            )}

            {/* ── TAB: FAQ ── */}
            {activeTab === 'faq' && (
              <div>
                <SectionHeader
                  title="Câu hỏi thường gặp (FAQ)"
                  subtitle="Quản lý câu hỏi và trả lời hiển thị trên trang chủ"
                  onSave={handleSave}
                />
                <div className="space-y-3">
                  {faqs.map(faq => (
                    <div key={faq.id} className={`border rounded-xl overflow-hidden ${faq.active ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          faq.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {faq.active ? 'Hiển thị' : 'Ẩn'}
                        </span>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{faq.category}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <Toggle checked={faq.active} onChange={v => updateFAQ(faq.id, 'active', v)} />
                          <button onClick={() => deleteFAQ(faq.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-600 mb-1">Câu hỏi</label>
                            <input
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={faq.question}
                              onChange={e => updateFAQ(faq.id, 'question', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Danh mục</label>
                            <select
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                              value={faq.category}
                              onChange={e => updateFAQ(faq.id, 'category', e.target.value)}
                            >
                              {['Giờ hoạt động', 'Đăng ký', 'Gói tập', 'Tiện ích', 'Chung'].map(c => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Trả lời</label>
                          <textarea
                            rows={2}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                            value={faq.answer}
                            onChange={e => updateFAQ(faq.id, 'answer', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={addFAQ} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    <Plus className="w-4 h-4" /> Thêm câu hỏi
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
