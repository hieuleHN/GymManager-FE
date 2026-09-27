import {
  ArrowRight,
  Users,
  Trophy,
  Target,
  ChevronRight,
  Zap,
  MapPin,
  Play,
  Quote,
  Check,
  QrCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "@mui/material";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { FloatingContact } from "../components/FloatingContact";
import { useAuth, getApiUrl } from "../context/AuthContext";

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── ĐỒNG BỘ DATA TỪ API ───
  const [clubs, setClubs] = useState<any[]>([]);
  const [allDisciplines, setAllDisciplines] = useState<any[]>([]);
  const [activeDiscipline, setActiveDiscipline] = useState<any>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [durationSelections, setDurationSelections] = useState<
    Record<string, number>
  >({});

  // State từ CMS Admin
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // State bài viết & sự kiện từ Database
  const [articles, setArticles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const formatPrice = (price: number) => {
    if (!price) return "0đ";
    return price.toLocaleString("vi-VN") + "đ";
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
    // 1. Kéo dữ liệu Cơ sở (Câu Lạc Bộ) từ DB
    fetch(`${getApiUrl()}/api/locations`)
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setClubs(list);
      })
      .catch(() => {});

    // 2. Kéo dữ liệu Bộ môn từ DB
    fetch(`${getApiUrl()}/api/disciplines?limit=50`)
      .then((res) => res.json())
      .then((data) => {
        const list = data?.data || [];
        setAllDisciplines(list);
        if (list.length > 0) setActiveDiscipline(list[0]);
      })
      .catch(() => {});

    // 3. Kéo dữ liệu Gói tập từ DB
    fetch(`${getApiUrl()}/api/packages?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setPackages(data.data.filter((p: any) => p.is_active));
      })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));

    // 4. Kéo cấu hình CMS từ Admin
    fetch(`${getApiUrl()}/api/settings/homepage`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setSiteSettings(data.data);
      })
      .catch(() => {});

    // 5. Kéo bài viết từ Database
    fetch(`${getApiUrl()}/api/articles?limit=6`)
      .then((res) => res.json())
      .then((data) => {
        const list = data?.data || [];
        setArticles(list.filter((a: any) => a.category !== 'su-kien'));
        setEvents(list.filter((a: any) => a.category === 'su-kien'));
      })
      .catch(() => {});
  }, []);

  const uniqueNames = Array.from(new Set(allDisciplines.map((d) => d.name)));
  const filteredPackages =
    selectedDiscipline === "all"
      ? packages
      : packages.filter((p) => p.disciplineId?.name === selectedDiscipline);

  const handleViewDetail = (pkgId: string) => navigate(`/packages/${pkgId}`);

  // ─── TÁCH DỮ LIỆU TỪ CMS ĐỂ HIỂN THỊ ───
  const activeBanners =
    siteSettings?.banners?.filter((b: any) => b.active) || [];
  const activeAchievements =
    siteSettings?.achievements?.filter((a: any) => a.active) || [];
  const activeTestimonials =
    siteSettings?.testimonials?.filter((t: any) => t.active) || [];
  const activeTrainers =
    siteSettings?.staffList?.filter((s: any) => s.featured) || [];
  const activeBlogs = siteSettings?.blogs?.filter((b: any) => b.featured) || [];
  const activePartners =
    siteSettings?.partners?.filter((p: any) => p.active) || [];
  const activeFaqs = siteSettings?.faqs?.filter((f: any) => f.active) || [];

  const displayTestimonials =
    activeTestimonials.length > 0
      ? activeTestimonials
      : [
          {
            name: "Minh Tuấn",
            role: "Hội viên",
            content: "Môi trường tập luyện tuyệt vời...",
            avatar: "https://ui-avatars.com/api/?name=MT",
          },
        ];

  return (
    <div className="bg-white">
      <FloatingContact phoneNumber="1900 1234" />

      {/* ── HERO BANNER ── */}
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
                Thay đổi <span className="text-indigo-600">Cơ thể</span>, Nâng
                tầm <span className="text-indigo-600">Cuộc sống</span>.
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                Gia nhập ZENFITNESS và trải nghiệm môi trường tập luyện cao cấp
                với đội ngũ huấn luyện viên ưu tú.
              </p>

              <div className="flex flex-wrap gap-4">
                {user && (
                  <Link to="/dashboard/qr">
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        bgcolor: "#ff5722",
                        py: 1.5,
                        px: 4,
                        "&:hover": { bgcolor: "#e64a19" },
                        textTransform: "none",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                      startIcon={<QrCode />}
                    >
                      QR Điểm Danh
                    </Button>
                  </Link>
                )}
                <Link to="/auth?mode=register">
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: "#4f46e5",
                      py: 1.5,
                      px: 4,
                      "&:hover": { bgcolor: "#4338ca" },
                      textTransform: "none",
                      fontSize: "1.1rem",
                    }}
                    endIcon={<ArrowRight />}
                  >
                    Bắt đầu dùng thử miễn phí
                  </Button>
                </Link>
              </div>

              {/* ACHIEVEMENTS */}
              <div className="mt-12 flex items-center gap-8">
                {activeAchievements.length > 0 ? (
                  activeAchievements
                    .slice(0, 3)
                    .map((ach: any, idx: number, arr: any[]) => (
                      <div key={idx} className="flex items-center gap-8">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">
                            {ach.number}
                          </p>
                          <p className="text-sm text-slate-500">{ach.label}</p>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className="h-8 w-px bg-slate-200" />
                        )}
                      </div>
                    ))
                ) : (
                  <>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">10k+</p>
                      <p className="text-sm text-slate-500">Hội viên</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900">50+</p>
                      <p className="text-sm text-slate-500">HLV ưu tú</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* BANNERS SLIDER TỪ CMS */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 lg:mt-0 relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[600px] bg-slate-100">
                <Slider {...bannerSettings} className="h-full w-full">
                  {activeBanners.length > 0 ? (
                    activeBanners.map((banner: any, idx: number) => (
                      <div
                        key={idx}
                        className="h-[600px] outline-none relative group"
                      >
                        <img
                          src={
                            banner.image ||
                            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200"
                          }
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        {(banner.title || banner.subtitle) && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
                            {banner.title && (
                              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                {banner.title}
                              </h2>
                            )}
                            {banner.subtitle && (
                              <p className="text-white/90 text-lg mb-6">
                                {banner.subtitle}
                              </p>
                            )}
                            {banner.cta && (
                              <button className="self-start px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium">
                                {banner.cta}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-[600px] outline-none relative">
                      <img
                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1200"
                        className="w-full h-full object-cover"
                        alt="Banner mặc định"
                      />
                    </div>
                  )}
                </Slider>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 z-20">
                <div className="bg-green-100 p-3 rounded-full">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Được đánh giá #1
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    Trung tâm Thể hình 2026
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── KHU VỰC CÂU LẠC BỘ (LẤY TỪ DATABASE) ── */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Hệ Thống Câu Lạc Bộ ZENFITNESS
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Không gian tập luyện đẳng cấp với vị trí đắc địa trải dài khắp cả
              nước.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clubs.length > 0 ? (
              clubs.map((club) => (
                <motion.div
                  key={club._id}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col"
                >
                  <div className="h-48 overflow-hidden bg-slate-200">
                    <img
                      src={
                        club.images?.[0] ||
                        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600"
                      }
                      alt={club.name || club.address}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {club.name || club.address}
                    </h3>
                    <div className="flex flex-col gap-2 mb-6">
                      <p className="text-sm text-slate-600 flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        {club.address}
                      </p>
                    </div>
                    <div className="mt-auto">
                      <Link to={`/clubs/${club._id}`}>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{
                            textTransform: "none",
                            color: "#4f46e5",
                            borderColor: "#4f46e5",
                          }}
                        >
                          Xem thêm cơ sở
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-3 text-center text-slate-500 py-10">
                Đang tải danh sách câu lạc bộ...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── KHU VỰC BỘ MÔN (LẤY TỪ DATABASE) ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Khám Phá Các Bộ Môn
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Đa dạng các bộ môn tập luyện phù hợp với mọi thể trạng và mục
              tiêu.
            </p>
          </div>

          {allDisciplines.length > 0 && activeDiscipline && (
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="w-full lg:w-1/2 space-y-6">
                <div className="flex flex-wrap gap-3 mb-8">
                  {allDisciplines.map((disc) => (
                    <button
                      key={disc._id}
                      onClick={() => setActiveDiscipline(disc)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                        activeDiscipline._id === disc._id
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {disc.name}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDiscipline._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-slate-50 p-8 rounded-2xl"
                  >
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">
                      {activeDiscipline.name}
                    </h3>
                    <p className="text-slate-600 text-lg leading-relaxed mb-8">
                      {activeDiscipline.description ||
                        "Chưa có mô tả chi tiết cho bộ môn này."}
                    </p>
                    <Link to={`/disciplines/${activeDiscipline._id}`}>
                      <Button
                        variant="contained"
                        endIcon={<ArrowRight />}
                        sx={{
                          bgcolor: "#0f172a",
                          "&:hover": { bgcolor: "#334155" },
                          textTransform: "none",
                        }}
                      >
                        Tìm hiểu chi tiết
                      </Button>
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="w-full lg:w-1/2">
                <div className="rounded-3xl overflow-hidden shadow-xl h-[500px] bg-slate-200">
                  <Slider
                    {...disciplineSliderSettings}
                    key={activeDiscipline._id}
                    className="h-full w-full"
                  >
                    {activeDiscipline.images?.length > 0 ? (
                      activeDiscipline.images.map(
                        (img: string, idx: number) => (
                          <div
                            key={idx}
                            className="h-[500px] outline-none relative group"
                          >
                            <img
                              src={img}
                              alt={activeDiscipline.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ),
                      )
                    ) : (
                      <div className="h-[500px] outline-none relative group">
                        <img
                          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80"
                          alt="Placeholder"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </Slider>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── GÓI TẬP (PACKAGES) ── */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Đăng Ký Gói Tập Ngay
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Chọn bộ môn và gói tập phù hợp với bạn.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button
              onClick={() => setSelectedDiscipline("all")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedDiscipline === "all" ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"}`}
            >
              Tất cả
            </button>
            {uniqueNames.map((name: any) => (
              <button
                key={name}
                onClick={() => setSelectedDiscipline(name)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${selectedDiscipline === name ? "bg-indigo-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"}`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPackages.map((plan, index) => {
              const durIdx = durationSelections[plan._id] ?? 0;
              const durations = plan.durations || [];
              const selectedDur = durations[durIdx] || {
                months: 1,
                discount: 0,
              };
              const totalPrice =
                plan.unitPrice *
                selectedDur.months *
                (1 - selectedDur.discount / 100);

              return (
                <motion.div
                  key={plan._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col"
                >
                  {plan.disciplineId && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full self-start mb-3">
                      {plan.disciplineId.name}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatPrice(plan.unitPrice)}
                    </span>
                    <span className="text-sm text-slate-500 ml-1">/ tháng</span>
                  </div>
                  {durations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">
                        Thời hạn
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {durations.map((d: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() =>
                              setDurationSelections((prev) => ({
                                ...prev,
                                [plan._id]: idx,
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${durIdx === idx ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}
                          >
                            {d.months} tháng{" "}
                            {d.discount > 0 && ` (-${d.discount}%)`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-4 p-3 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-slate-600 mb-1">Tổng tiền:</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {(plan.features || []).slice(0, 4).map((f: string) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleViewDetail(plan._id)}
                    sx={{
                      bgcolor: "#4f46e5",
                      textTransform: "none",
                      py: 1.5,
                      borderRadius: 2,
                    }}
                  >
                    Xem chi tiết
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── KHU VỰC HLV NỔI BẬT (CMS ADMIN) ── */}
      {activeTrainers.length > 0 && (
        <section className="py-24 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Huấn Luyện Viên Tiêu Biểu
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeTrainers.map((trainer: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100"
                >
                  <img
                    src={
                      trainer.avatar ||
                      `https://ui-avatars.com/api/?name=${trainer.fullName}`
                    }
                    alt={trainer.fullName}
                    className="w-32 h-32 mx-auto rounded-full object-cover mb-4 ring-4 ring-indigo-50"
                  />
                  <h3 className="text-xl font-bold">{trainer.fullName}</h3>
                  <p className="text-indigo-600 text-sm mb-2">
                    {trainer.specialties?.join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS (CMS ADMIN) ── */}
      <section className="bg-indigo-600 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Hội Viên Nói Gì Về Chúng Tôi
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayTestimonials.map((t: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20"
              >
                <Quote className="w-8 h-8 text-indigo-300 mb-6" />
                <p className="text-lg text-white mb-6">
                  "{t.content || t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      t.avatar?.startsWith("http")
                        ? t.avatar
                        : `https://ui-avatars.com/api/?name=${t.name}`
                    }
                    className="w-12 h-12 rounded-full ring-2 ring-white/30"
                  />
                  <div className="text-white">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-indigo-200">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BÀI VIẾT TỪ DATABASE ── */}
      {articles.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Kiến Thức & Cẩm Nang
                </h2>
                <p className="text-slate-600 mt-2">
                  Cập nhật kiến thức thể hình và dinh dưỡng mỗi ngày
                </p>
              </div>
              <Link
                to="/articles"
                className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.slice(0, 3).map((article: any) => (
                <Link
                  key={article._id}
                  to={`/articles/${article._id}`}
                  className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
                        ZenFitness
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-semibold">
                      {article.category === 'tin-tuc' ? 'Tin tức' :
                       article.category === 'meo-tap' ? 'Mẹo tập' :
                       article.category === 'dinh-duong' ? 'Dinh dưỡng' : 'Khác'}
                    </span>
                    <h3 className="text-lg font-bold mt-4 mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {(() => {
                        if (article.excerpt) return article.excerpt;
                        const tmp = document.createElement('div');
                        tmp.innerHTML = article.content || '';
                        return (tmp.textContent || tmp.innerText || '').slice(0, 150);
                      })()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10 sm:hidden">
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SỰ KIỆN TỪ DATABASE ── */}
      {events.length > 0 && (
        <section className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Sự Kiện Nổi Bật
                </h2>
                <p className="text-slate-600 mt-2">
                  Các sự kiện và hoạt động mới nhất tại ZENFITNESS
                </p>
              </div>
              <Link
                to="/articles?category=su-kien"
                className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {events.slice(0, 3).map((event: any) => (
                <Link
                  key={event._id}
                  to={`/articles/${event._id}`}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition group"
                >
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-50">
                        <span className="text-4xl">🎉</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                      Sự kiện
                    </span>
                    <h3 className="text-lg font-bold mt-4 mb-2 text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {(() => {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = event.content || '';
                        return tmp.textContent || tmp.innerText || '';
                      })()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10 sm:hidden">
              <Link
                to="/articles?category=su-kien"
                className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Xem tất cả <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ (CMS ADMIN) ── */}
      {activeFaqs.length > 0 && (
        <section className="py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              Câu Hỏi Thường Gặp
            </h2>
            <div className="space-y-4">
              {activeFaqs.map((faq: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full p-6 text-left flex justify-between font-semibold"
                  >
                    {faq.question}
                    {openFaq === idx ? (
                      <ChevronUp className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="p-6 pt-0 text-slate-600 border-t border-slate-50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ĐỐI TÁC (CMS ADMIN) ── */}
      {activePartners.length > 0 && (
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-10">
              Đối Tác Đồng Hành
            </p>
            <div className="flex flex-wrap justify-center gap-12 grayscale hover:grayscale-0 transition duration-500 opacity-60">
              {activePartners.map((p: any, idx: number) => (
                <a
                  key={idx}
                  href={p.website || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {p.logo?.startsWith("http") ? (
                    <img src={p.logo} className="h-10 object-contain" />
                  ) : (
                    <span className="text-xl font-bold">
                      {p.logo || p.name}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
