import { useParams, Navigate, Link } from "react-router";
import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import Slider from "react-slick";
import { Button } from "@mui/material";
import { getApiUrl } from "../context/AuthContext";

export function DisciplineDetail() {
  const { id } = useParams();
  const [discipline, setDiscipline] = useState<any>(null);
  const [cmsData, setCmsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${getApiUrl()}/api/disciplines/${id}`).then((res) => res.json()),
      fetch(`${getApiUrl()}/api/settings/homepage`).then((res) => res.json()),
    ])
      .then(([discRes, cmsRes]) => {
        setDiscipline(discRes?.data || discRes);
        if (cmsRes?.data?.disciplinesPage)
          setCmsData(cmsRes.data.disciplinesPage);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải dữ liệu:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Đang tải thông tin bộ môn...
      </div>
    );
  if (!discipline || discipline.message === "Discipline not found")
    return <Navigate to="/" />;

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  const benefits =
    cmsData?.benefits?.length > 0
      ? cmsData.benefits
      : [
          "Tăng cường sức mạnh và độ bền",
          "Cải thiện sức khỏe tim mạch",
          "Giảm mỡ thừa hiệu quả",
          "Môi trường tập luyện chuyên nghiệp",
        ];

  const facilities =
    cmsData?.facilities?.length > 0
      ? cmsData.facilities
      : [
          {
            title: "Tủ Đồ Khóa Từ",
            desc: "An toàn tuyệt đối cho tài sản.",
            img: "https://images.unsplash.com/photo-1676012088690-d2197f76db9b?auto=format&fit=crop&q=80&w=400",
          },
        ];

  const bannerImg =
    cmsData?.banner ||
    (discipline.images?.length > 0
      ? discipline.images[0]
      : "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80");

  return (
    <div className="bg-white min-h-screen">
      <div className="relative h-[50vh] bg-slate-900 flex items-center overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img
            src={bannerImg}
            alt={discipline.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            {discipline.name}
          </h1>
          {/* Sửa lại ưu tiên hiển thị Slogan CMS ở đây */}
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {cmsData?.description ||
              discipline.description ||
              "Khu vực tập luyện tự do với thiết bị hiện đại."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Trải Nghiệm Tập Luyện Đẳng Cấp
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Bộ môn {discipline.name} tại ZENFITNESS được thiết kế bài bản với
              giáo trình chuẩn quốc tế.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((benefit: string, idx: number) => (
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
                  Đăng ký tập thử
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px]">
            <Slider {...sliderSettings} className="h-full w-full">
              {discipline.images?.length > 0 ? (
                discipline.images.map((img: string, idx: number) => (
                  <div key={idx} className="h-[500px] outline-none">
                    <img src={img} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="h-[500px] outline-none bg-slate-200">
                  <img src={bannerImg} className="w-full h-full object-cover" />
                </div>
              )}
            </Slider>
          </div>
        </section>

        <section className="bg-white">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Tiện Ích Đi Kèm Bộ Môn
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Khi tham gia bộ môn {discipline.name}, bạn sẽ được tận hưởng các
              đặc quyền tiện ích chuẩn 5 sao.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {facilities.map((svc: any, i: number) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={svc.img}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {svc.title}
                  </h3>
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
