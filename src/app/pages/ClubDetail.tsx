import { useParams, Navigate, Link } from "react-router";
import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Play, Quote, ArrowRight } from "lucide-react";
import Slider from "react-slick";
import { FloatingContact } from "../components/FloatingContact";
import { motion } from "motion/react";
import { getApiUrl } from "../context/AuthContext";
import { Button } from "@mui/material";

export function ClubDetail() {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getApiUrl()}/api/locations/${id}`).then((res) => res.json()),
      fetch(`${getApiUrl()}/api/disciplines?limit=50`).then((res) =>
        res.json(),
      ),
      fetch(`${getApiUrl()}/api/settings/homepage`).then((res) => res.json()),
    ])
      .then(([locData, discData, cmsRes]) => {
        setClub(locData.data || locData);
        setDisciplines(discData?.data || []);
        setCmsData(cmsRes?.data || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải dữ liệu CLB:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang tải thông tin câu lạc bộ...
      </div>
    );
  if (!club || club.message === "Location not found")
    return <Navigate to="/" />;

  // ─── 1. LẤY DỮ LIỆU ĐỘNG 100% TỪ DATABASE (XÓA SẠCH DỮ LIỆU GIẢ) ───
  const activeTrainers =
    cmsData?.staffList?.filter((s: any) => s.featured === true) || [];
  const activeTestimonials =
    cmsData?.testimonials?.filter((t: any) => t.active === true) || [];
  const displayFacilities = cmsData?.clubsPage?.facilities || [];
  const displayTransformations = cmsData?.clubsPage?.transformations || [];

  // ─── 2. CẤU HÌNH SLIDER THÔNG MINH TỰ CO GIÃN ───
  const sliderSettings = {
    dots: true,
    infinite: activeTrainers.length > 1, // Fix lỗi crash Slider nếu chỉ có 1 HLV
    speed: 500,
    slidesToShow: activeTrainers.length === 1 ? 1 : 2,
    slidesToScroll: 1,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 1 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  const transformationSettings = {
    dots: true,
    infinite: displayTransformations.length > 4,
    speed: 600,
    slidesToShow: Math.min(displayTransformations.length || 4, 4) || 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 3 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="bg-white min-h-screen">
      <FloatingContact phoneNumber={club.phone || "1900 1234"} />

      {/* ── HERO BANNER ── */}
      <div className="relative h-[60vh] md:h-[80vh]">
        <img
          src={
            cmsData?.clubsPage?.banner ||
            club.images?.[0] ||
            "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80"
          }
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-8 md:p-16">
          <div className="max-w-7xl mx-auto w-full">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {club.name || `ZenFitness ${club.address?.split(",")[0]}`}
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl">
              {cmsData?.clubsPage?.description ||
                "Cơ sở cao cấp với không gian rộng rãi, trang thiết bị hiện đại bậc nhất."}
            </p>

            <div className="flex flex-col md:flex-row gap-6 text-white bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 inline-flex">
              <div className="flex items-center gap-3">
                <MapPin className="text-indigo-400" />
                <span>{club.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-indigo-400" />
                <span>{club.hours || "Thứ 2 - CN: 05:30 - 22:00"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-indigo-400" />
                <span className="font-bold text-lg">
                  {club.phone || "1900 1234"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {/* ── DỊCH VỤ & TIỆN ÍCH ── */}
        {displayFacilities.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Dịch Vụ & Tiện Ích
              </h2>
              <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayFacilities.map((svc: any, idx: number) => (
                <motion.div
                  whileHover={{ y: -5 }}
                  key={idx}
                  className="group cursor-pointer rounded-2xl overflow-hidden shadow-lg relative h-80 bg-slate-100"
                >
                  {svc.img && (
                    <img
                      src={svc.img}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt={svc.title}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white font-bold text-xl mb-1">
                      {svc.title}
                    </h3>
                    <p className="text-slate-200 text-sm line-clamp-2">
                      {svc.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── CÁC BỘ MÔN ── */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Các Bộ Môn Giảng Dạy
            </h2>
            <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {disciplines.length > 0 ? (
              disciplines.map((disc) => (
                <div
                  key={disc._id}
                  className="bg-slate-50 rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row"
                >
                  <div className="md:w-1/2 relative h-64 md:h-auto group">
                    <img
                      src={
                        disc.images?.[0] ||
                        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80"
                      }
                      alt={disc.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Link to={`/disciplines/${disc._id}`}>
                        <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform cursor-pointer">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div className="p-8 md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {disc.name}
                    </h3>
                    <p className="text-slate-600 line-clamp-3 leading-relaxed">
                      {disc.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center text-slate-500 py-10">
                Đang tải danh sách bộ môn...
              </div>
            )}
          </div>
        </section>

        {/* ── ĐỘI NGŨ HLV ── */}
        {activeTrainers.length > 0 && (
          <section className="bg-slate-50 p-12 rounded-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Đội Ngũ Huấn Luyện Viên
              </h2>
              <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
            </div>
            <div className="px-4">
              <Slider {...sliderSettings}>
                {activeTrainers.map((trainer: any, i: number) => (
                  <div key={i} className="px-3 outline-none">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col md:flex-row h-full">
                      <div className="md:w-2/5 h-64 md:h-auto shrink-0">
                        <img
                          src={
                            trainer.avatar ||
                            `https://ui-avatars.com/api/?name=${trainer.fullName}`
                          }
                          alt={trainer.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6 flex flex-col justify-center md:w-3/5">
                        <h4 className="text-xl font-bold text-slate-900 mb-2">
                          {trainer.fullName}
                        </h4>
                        <p className="text-indigo-600 font-medium mb-4">
                          {trainer.specialties?.join(", ") ||
                            trainer.role ||
                            "Huấn luyện viên"}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {trainer.experience ||
                            trainer.desc ||
                            "Sẵn sàng đồng hành cùng mục tiêu thể hình của bạn."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </section>
        )}

        {/* ── THAY ĐỔI HÌNH THỂ ── */}
        {displayTransformations.length > 0 && (
          <section>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
                Thay Đổi Hình Thể Cùng ZenFitness
              </h2>
              <div className="w-24 h-1 bg-indigo-600 mx-auto rounded-full" />
            </div>
            <div className="px-4">
              <Slider {...transformationSettings}>
                {displayTransformations.map((img: string, i: number) => (
                  <div key={i} className="px-3 outline-none">
                    <div className="rounded-2xl overflow-hidden shadow-md h-80 group bg-slate-100">
                      {img && (
                        <img
                          src={img}
                          alt="Transformation"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </section>
        )}

        {/* ── FEEDBACK KHÁCH HÀNG ── */}
        {activeTestimonials.length > 0 && (
          <section className="bg-indigo-600 rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 translate-x-1/3 -translate-y-1/3">
              <Quote className="w-64 h-64" />
            </div>
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  Hội Viên Nói Gì Về Chúng Tôi
                </h2>
                <div className="w-24 h-1 bg-white mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {activeTestimonials.map((t: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl"
                  >
                    <Quote className="w-8 h-8 text-indigo-300 mb-6" />
                    <p className="text-lg leading-relaxed mb-6">
                      "{t.content || t.text}"
                    </p>
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          t.avatar?.startsWith("http")
                            ? t.avatar
                            : `https://ui-avatars.com/api/?name=${t.name}`
                        }
                        alt={t.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30"
                      />
                      <div>
                        <div className="font-bold">{t.name}</div>
                        <div className="text-sm text-indigo-200">
                          {t.role || t.job}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
