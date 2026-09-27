import { AdminLayout } from "../../components/AdminLayout";
import { useState, useEffect } from "react";
import axios from "axios";
import { getAuthHeaders, getApiUrl } from "../../context/AuthContext";
import {
  Image,
  Type,
  Users,
  BookOpen,
  MessageSquare,
  Trophy,
  Plus,
  Trash2,
  Save,
  Eye,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Award,
  Monitor,
  MapPin,
  Dumbbell,
  CheckCircle,
} from "lucide-react";

// ─── INTERFACES ───
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
interface Facility {
  id: number;
  title: string;
  desc: string;
  img: string;
  active: boolean;
}

// ─── INIT DATA ───
const initBanners: BannerSlide[] = [
  {
    id: 1,
    title: "Bắt đầu hành trình khỏe mạnh của bạn",
    subtitle: "Trang thiết bị hiện đại, HLV chuyên nghiệp",
    cta: "Đăng ký ngay",
    image: "/banner1.jpg",
    active: true,
    order: 1,
  },
];
const initTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Nguyễn Thị Lan",
    role: "Hội viên 2 năm",
    content: "ZenFitness đã thay đổi hoàn toàn lối sống của tôi.",
    rating: 5,
    avatar: "NL",
    active: true,
  },
];
const initAchievements: Achievement[] = [
  {
    id: 1,
    number: "10k+",
    label: "Hội viên",
    icon: "users",
    active: true,
  },
  {
    id: 2,
    number: "50+",
    label: "HLV ưu tú",
    icon: "award",
    active: true,
  },
];
const initBlogs: BlogPost[] = [
  {
    id: 1,
    title: "5 bài tập Gym tốt nhất cho người mới bắt đầu",
    excerpt: "Hướng dẫn chi tiết...",
    category: "Gym",
    image: "",
    featured: true,
    publishDate: "2026-05-20",
  },
];
const initPartners: PartnerLogo[] = [
  {
    id: 1,
    name: "Nike",
    logo: "NIKE",
    website: "https://nike.com",
    active: true,
  },
];
const initFAQs: FAQ[] = [
  {
    id: 1,
    question: "Phòng gym mở cửa từ mấy giờ?",
    answer: "Từ 5:30 sáng đến 11:00 đêm.",
    category: "Giờ hoạt động",
    active: true,
  },
];

// ─── TABS ───
const HOMEPAGE_TABS = [
  { id: "banner", label: "Banner Slider", icon: Image },
  { id: "achievements", label: "Thành tựu", icon: Trophy },
  { id: "trainers", label: "HLV nổi bật", icon: Users },
  { id: "testimonials", label: "Đánh giá KH", icon: MessageSquare },
  { id: "blogs", label: "Bài viết", icon: BookOpen },
  { id: "partners", label: "Đối tác", icon: Award },
  { id: "faq", label: "FAQ", icon: Type },
];

const CLUB_TABS = [
  { id: "intro", label: "Giới thiệu chung", icon: Type },
  { id: "facilities", label: "Tiện ích & Dịch vụ", icon: Award },
  { id: "transformations", label: "Thay đổi hình thể", icon: Image },
];

const DISCIPLINE_TABS = [
  { id: "intro", label: "Giới thiệu chung", icon: Type },
  { id: "benefits", label: "Lợi ích tập luyện", icon: CheckCircle },
  { id: "facilities", label: "Tiện ích đi kèm", icon: Award },
];

// ─── COMPONENTS PHỤ ───
function SectionHeader({
  title,
  subtitle,
  onSave,
}: {
  title: string;
  subtitle: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onSave}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
      >
        <Save className="w-4 h-4" /> Lưu thay đổi
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => onChange(!checked)} className="flex-shrink-0">
      {checked ? (
        <ToggleRight className="w-8 h-8 text-indigo-600" />
      ) : (
        <ToggleLeft className="w-8 h-8 text-slate-400" />
      )}
    </button>
  );
}

// ─── COMPONENT CHÍNH ───
export function HomepageManagement() {
  const [mainTab, setMainTab] = useState("homepage");
  const [activeTab, setActiveTab] = useState("banner");
  const [activeClubTab, setActiveClubTab] = useState("intro");
  const [activeDisciplineTab, setActiveDisciplineTab] = useState("intro");
  const [saved, setSaved] = useState(false);

  // States Dữ liệu Trang chủ
  const [banners, setBanners] = useState<BannerSlide[]>(initBanners);
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initTestimonials);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [achievements, setAchievements] =
    useState<Achievement[]>(initAchievements);
  const [blogs, setBlogs] = useState<BlogPost[]>(initBlogs);
  const [partners, setPartners] = useState<PartnerLogo[]>(initPartners);
  const [faqs, setFAQs] = useState<FAQ[]>(initFAQs);

  // States Dữ liệu Trang CLB & Bộ môn
  const [clubsPage, setClubsPage] = useState<{
    banner: string;
    description: string;
    facilities: Facility[];
    transformations: string[];
  }>({
    banner: "",
    description: "",
    facilities: [],
    transformations: [],
  });
  const [disciplinesPage, setDisciplinesPage] = useState<{
    banner: string;
    description: string;
    benefits: string[];
    facilities: Facility[];
  }>({
    banner: "",
    description: "",
    benefits: [],
    facilities: [],
  });

  // HÀM HỖ TRỢ UPLOAD & NÉN ẢNH TỰ ĐỘNG
  const handleImageUpload = (file: File, callback: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        callback(compressedBase64);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resSettings = await axios.get(
          `${getApiUrl()}/api/settings/homepage`,
          { headers: getAuthHeaders() },
        );
        const data = resSettings.data.data;
        if (data) {
          setBanners(data.banners?.length > 0 ? data.banners : initBanners);
          setAchievements(
            data.achievements?.length > 0
              ? data.achievements
              : initAchievements,
          );
          setTestimonials(
            data.testimonials?.length > 0
              ? data.testimonials
              : initTestimonials,
          );
          setBlogs(data.blogs?.length > 0 ? data.blogs : initBlogs);
          setPartners(data.partners?.length > 0 ? data.partners : initPartners);
          setFAQs(data.faqs?.length > 0 ? data.faqs : initFAQs);

          if (data.clubsPage) {
            setClubsPage({
              banner: data.clubsPage.banner || "",
              description: data.clubsPage.description || "",
              facilities: data.clubsPage.facilities || [],
              transformations: data.clubsPage.transformations || [],
            });
          }
          if (data.disciplinesPage) {
            setDisciplinesPage({
              banner: data.disciplinesPage.banner || "",
              description: data.disciplinesPage.description || "",
              benefits: data.disciplinesPage.benefits || [],
              facilities: data.disciplinesPage.facilities || [],
            });
          }
        } else {
          setBanners(initBanners);
          setAchievements(initAchievements);
        }

        const resStaff = await axios.get(`${getApiUrl()}/api/staff`, {
          headers: getAuthHeaders(),
        });
        if (resStaff.data) {
          const fetchedStaff = Array.isArray(resStaff.data)
            ? resStaff.data
            : resStaff.data.data || [];

          if (data && data.staffList && data.staffList.length > 0) {
            const mergedStaff = fetchedStaff.map((s: any) => {
              const found = data.staffList.find(
                (ds: any) =>
                  String(ds._id) === String(s._id) ||
                  ds.fullName === s.fullName,
              );
              return found ? { ...s, featured: Boolean(found.featured) } : s;
            });
            setStaffList(mergedStaff);
          } else {
            setStaffList(fetchedStaff);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        banners,
        achievements,
        testimonials,
        blogs,
        partners,
        faqs,
        staffList,
        clubsPage,
        disciplinesPage,
      };
      await axios.put(`${getApiUrl()}/api/settings/homepage`, payload, {
        headers: getAuthHeaders(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      alert("Lưu thất bại, vui lòng kiểm tra lại kết nối mạng!");
    }
  };

  // ─── HÀM CẬP NHẬT TRANG CHỦ ───
  const updateBanner = (id: number, field: keyof BannerSlide, value: any) =>
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  const addBanner = () => {
    const id =
      banners.length > 0 ? Math.max(...banners.map((b) => b.id)) + 1 : 1;
    setBanners((prev) => [
      ...prev,
      {
        id,
        title: "Banner mới",
        subtitle: "",
        cta: "Xem thêm",
        image: "",
        active: false,
        order: prev.length + 1,
      },
    ]);
  };
  const deleteBanner = (id: number) =>
    setBanners((prev) => prev.filter((b) => b.id !== id));

  const updateTestimonial = (
    id: number,
    field: keyof Testimonial,
    value: any,
  ) =>
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  const addTestimonial = () => {
    const id =
      testimonials.length > 0
        ? Math.max(...testimonials.map((t) => t.id)) + 1
        : 1;
    setTestimonials((prev) => [
      ...prev,
      {
        id,
        name: "Hội viên mới",
        role: "Hội viên",
        content: "",
        rating: 5,
        avatar: "HV",
        active: false,
      },
    ]);
  };
  const deleteTestimonial = (id: number) =>
    setTestimonials((prev) => prev.filter((t) => t.id !== id));

  const updateAchievement = (
    id: number,
    field: keyof Achievement,
    value: any,
  ) =>
    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    );
  const addAchievement = () => {
    const id =
      achievements.length > 0
        ? Math.max(...achievements.map((a) => a.id)) + 1
        : 1;
    setAchievements((prev) => [
      ...prev,
      {
        id,
        number: "0+",
        label: "Thành tích mới",
        icon: "star",
        active: false,
      },
    ]);
  };
  const deleteAchievement = (id: number) =>
    setAchievements((prev) => prev.filter((a) => a.id !== id));

  const updateBlog = (id: number, field: keyof BlogPost, value: any) =>
    setBlogs((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  const addBlog = () => {
    const id = blogs.length > 0 ? Math.max(...blogs.map((b) => b.id)) + 1 : 1;
    setBlogs((prev) => [
      ...prev,
      {
        id,
        title: "Bài viết mới",
        excerpt: "",
        category: "Gym",
        image: "",
        featured: false,
        publishDate: new Date().toISOString().split("T")[0],
      },
    ]);
  };
  const deleteBlog = (id: number) =>
    setBlogs((prev) => prev.filter((b) => b.id !== id));

  const updatePartner = (id: number, field: keyof PartnerLogo, value: any) =>
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  const addPartner = () => {
    const id =
      partners.length > 0 ? Math.max(...partners.map((p) => p.id)) + 1 : 1;
    setPartners((prev) => [
      ...prev,
      { id, name: "Đối tác mới", logo: "", website: "", active: false },
    ]);
  };
  const deletePartner = (id: number) =>
    setPartners((prev) => prev.filter((p) => p.id !== id));

  const updateFAQ = (id: number, field: keyof FAQ, value: any) =>
    setFAQs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    );
  const addFAQ = () => {
    const id = faqs.length > 0 ? Math.max(...faqs.map((f) => f.id)) + 1 : 1;
    setFAQs((prev) => [
      ...prev,
      {
        id,
        question: "Câu hỏi mới?",
        answer: "",
        category: "Chung",
        active: false,
      },
    ]);
  };
  const deleteFAQ = (id: number) =>
    setFAQs((prev) => prev.filter((f) => f.id !== id));

  // ─── HÀM CẬP NHẬT TRANG CÂU LẠC BỘ ───
  const updateClubFacility = (
    id: number,
    field: keyof Facility,
    value: any,
  ) => {
    setClubsPage((prev) => ({
      ...prev,
      facilities: prev.facilities.map((f) =>
        f.id === id ? { ...f, [field]: value } : f,
      ),
    }));
  };
  const addClubFacility = () => {
    const id =
      clubsPage.facilities.length > 0
        ? Math.max(...clubsPage.facilities.map((f) => f.id)) + 1
        : 1;
    setClubsPage((prev) => ({
      ...prev,
      facilities: [
        ...prev.facilities,
        { id, title: "Tiện ích mới", desc: "", img: "", active: true },
      ],
    }));
  };
  const deleteClubFacility = (id: number) => {
    setClubsPage((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f.id !== id),
    }));
  };

  const updateClubTrans = (index: number, value: string) => {
    const newTrans = [...clubsPage.transformations];
    newTrans[index] = value;
    setClubsPage((prev) => ({ ...prev, transformations: newTrans }));
  };
  const addClubTrans = () => {
    setClubsPage((prev) => ({
      ...prev,
      transformations: [...prev.transformations, ""],
    }));
  };
  const deleteClubTrans = (index: number) => {
    setClubsPage((prev) => ({
      ...prev,
      transformations: prev.transformations.filter((_, i) => i !== index),
    }));
  };

  // ─── HÀM CẬP NHẬT TRANG BỘ MÔN ───
  const updateDiscBenefit = (index: number, value: string) => {
    const newB = [...disciplinesPage.benefits];
    newB[index] = value;
    setDisciplinesPage((prev) => ({ ...prev, benefits: newB }));
  };
  const addDiscBenefit = () =>
    setDisciplinesPage((prev) => ({
      ...prev,
      benefits: [...prev.benefits, ""],
    }));
  const deleteDiscBenefit = (index: number) =>
    setDisciplinesPage((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));

  const updateDiscFacility = (
    id: number,
    field: keyof Facility,
    value: any,
  ) => {
    setDisciplinesPage((prev) => ({
      ...prev,
      facilities: prev.facilities.map((f) =>
        f.id === id ? { ...f, [field]: value } : f,
      ),
    }));
  };
  const addDiscFacility = () => {
    const id =
      disciplinesPage.facilities.length > 0
        ? Math.max(...disciplinesPage.facilities.map((f) => f.id)) + 1
        : 1;
    setDisciplinesPage((prev) => ({
      ...prev,
      facilities: [
        ...prev.facilities,
        { id, title: "Tiện ích bộ môn", desc: "", img: "", active: true },
      ],
    }));
  };
  const deleteDiscFacility = (id: number) => {
    setDisciplinesPage((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((f) => f.id !== id),
    }));
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Toàn Cục */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              Quản lý Giao diện Website
            </h1>
            <p className="text-slate-600">
              Kiểm soát nội dung hiển thị cho 3 trang chính của hệ thống
              ZenFitness
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" /> Xem Website
          </a>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" /> Đã lưu toàn bộ thay đổi thành công!
          </div>
        )}

        {/* ─── 3 NÚT TABS CHÍNH ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setMainTab("homepage")}
            className={`p-4 rounded-2xl flex items-center gap-3 font-semibold transition-all shadow-sm border ${mainTab === "homepage" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
          >
            <div
              className={`p-2 rounded-xl ${mainTab === "homepage" ? "bg-white/20" : "bg-indigo-50"}`}
            >
              <Monitor
                className={`w-6 h-6 ${mainTab === "homepage" ? "text-white" : "text-indigo-600"}`}
              />
            </div>
            <div className="text-left">
              <p className="text-lg">Trang Chủ</p>
              <p
                className={`text-xs font-normal ${mainTab === "homepage" ? "text-indigo-100" : "text-slate-400"}`}
              >
                Banner, Testimonial, HLV...
              </p>
            </div>
          </button>

          <button
            onClick={() => setMainTab("clubs")}
            className={`p-4 rounded-2xl flex items-center gap-3 font-semibold transition-all shadow-sm border ${mainTab === "clubs" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
          >
            <div
              className={`p-2 rounded-xl ${mainTab === "clubs" ? "bg-white/20" : "bg-amber-50"}`}
            >
              <MapPin
                className={`w-6 h-6 ${mainTab === "clubs" ? "text-white" : "text-amber-600"}`}
              />
            </div>
            <div className="text-left">
              <p className="text-lg">Trang Câu Lạc Bộ</p>
              <p
                className={`text-xs font-normal ${mainTab === "clubs" ? "text-indigo-100" : "text-slate-400"}`}
              >
                Intro, Tiện ích, Hình ảnh...
              </p>
            </div>
          </button>

          <button
            onClick={() => setMainTab("disciplines")}
            className={`p-4 rounded-2xl flex items-center gap-3 font-semibold transition-all shadow-sm border ${mainTab === "disciplines" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
          >
            <div
              className={`p-2 rounded-xl ${mainTab === "disciplines" ? "bg-white/20" : "bg-emerald-50"}`}
            >
              <Dumbbell
                className={`w-6 h-6 ${mainTab === "disciplines" ? "text-white" : "text-emerald-600"}`}
              />
            </div>
            <div className="text-left">
              <p className="text-lg">Trang Bộ Môn</p>
              <p
                className={`text-xs font-normal ${mainTab === "disciplines" ? "text-indigo-100" : "text-slate-400"}`}
              >
                Slogan, Banner, Tiện ích...
              </p>
            </div>
          </button>
        </div>

        {/* ─── NỘI DUNG TỪNG TAB CHÍNH ─── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* TAB 1: TRANG CHỦ */}
          {mainTab === "homepage" && (
            <>
              <div className="flex overflow-x-auto border-b border-slate-100">
                {HOMEPAGE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {activeTab === "banner" && (
                  <div>
                    <SectionHeader
                      title="Banner Slider"
                      subtitle="Quản lý các slide hiển thị trên đầu trang chủ"
                      onSave={handleSave}
                    />
                    <div className="space-y-4">
                      {banners.map((banner) => (
                        <div
                          key={banner.id}
                          className="border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <GripVertical className="w-5 h-5 text-slate-400 cursor-grab" />
                            <span className="text-sm font-semibold text-slate-700">
                              Slide #{banner.order}
                            </span>
                            <div className="ml-auto flex items-center gap-3">
                              <Toggle
                                checked={banner.active}
                                onChange={(v) =>
                                  updateBanner(banner.id, "active", v)
                                }
                              />
                              <button
                                onClick={() => deleteBanner(banner.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Tiêu đề chính
                              </label>
                              <input
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={banner.title}
                                onChange={(e) =>
                                  updateBanner(
                                    banner.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Phụ đề
                              </label>
                              <input
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={banner.subtitle}
                                onChange={(e) =>
                                  updateBanner(
                                    banner.id,
                                    "subtitle",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Nút CTA
                              </label>
                              <input
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={banner.cta}
                                onChange={(e) =>
                                  updateBanner(banner.id, "cta", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-2">
                                Hình ảnh (Tải lên từ thiết bị)
                              </label>
                              {banner.image &&
                                (banner.image.startsWith("data:image") ||
                                  banner.image.startsWith("http")) && (
                                  <img
                                    src={banner.image}
                                    alt="preview"
                                    className="h-16 w-32 object-cover rounded-lg border border-slate-200 mb-3 shadow-sm"
                                  />
                                )}
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    handleImageUpload(file, (url) =>
                                      updateBanner(banner.id, "image", url),
                                    );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addBanner}
                        className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" /> Thêm slide mới
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "achievements" && (
                  <div>
                    <SectionHeader
                      title="Thành tựu nổi bật"
                      subtitle="Các con số ấn tượng hiển thị trên trang chủ"
                      onSave={handleSave}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {achievements.map((item) => (
                        <div
                          key={item.id}
                          className="border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-slate-700">
                              Thành tựu #{item.id}
                            </span>
                            <div className="flex items-center gap-2">
                              <Toggle
                                checked={item.active}
                                onChange={(v) =>
                                  updateAchievement(item.id, "active", v)
                                }
                              />
                              <button
                                onClick={() => deleteAchievement(item.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Con số
                              </label>
                              <input
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={item.number}
                                onChange={(e) =>
                                  updateAchievement(
                                    item.id,
                                    "number",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Nhãn
                              </label>
                              <input
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                value={item.label}
                                onChange={(e) =>
                                  updateAchievement(
                                    item.id,
                                    "label",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addAchievement}
                      className="mt-4 w-full border-2 border-dashed border-slate-200 rounded-xl py-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" /> Thêm thành tựu
                    </button>
                  </div>
                )}
                {activeTab === "trainers" && (
                  <div>
                    <SectionHeader
                      title="HLV nổi bật"
                      subtitle="Chọn HLV hiển thị trên trang chủ từ danh sách nhân sự"
                      onSave={handleSave}
                    />
                    <div className="space-y-3">
                      {staffList.map((staff: any) => (
                        <div
                          key={staff._id}
                          className={`border rounded-xl p-4 flex items-center gap-4 ${staff.featured ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200"}`}
                        >
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-lg overflow-hidden">
                            {staff.avatar ? (
                              <img
                                src={staff.avatar}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (staff.fullName || "H").charAt(0)
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-slate-600">
                                Tên HLV
                              </label>
                              <p className="font-bold">{staff.fullName}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600">
                                SĐT
                              </label>
                              <p>{staff.phone}</p>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-600">
                                Chuyên môn
                              </label>
                              <p>{staff.specialties?.join(", ")}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <Toggle
                              checked={staff.featured || false}
                              onChange={(v) =>
                                setStaffList((prev) =>
                                  prev.map((s) =>
                                    s._id === staff._id
                                      ? { ...s, featured: v }
                                      : s,
                                  ),
                                )
                              }
                            />
                            <span className="text-xs text-slate-500">
                              Nổi bật
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "testimonials" && (
                  <div>
                    <SectionHeader
                      title="Đánh giá khách hàng"
                      subtitle="Quản lý nhận xét hiển thị trên trang chủ"
                      onSave={handleSave}
                    />
                    <div className="space-y-4">
                      {testimonials.map((t) => (
                        <div
                          key={t.id}
                          className="border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold text-slate-700">
                              Khách hàng: {t.name}
                            </span>
                            <div className="flex items-center gap-3">
                              <Toggle
                                checked={t.active}
                                onChange={(v) =>
                                  updateTestimonial(t.id, "active", v)
                                }
                              />
                              <button
                                onClick={() => deleteTestimonial(t.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs">Tên</label>
                              <input
                                className="w-full border rounded-lg p-2"
                                value={t.name}
                                onChange={(e) =>
                                  updateTestimonial(
                                    t.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs">Vai trò</label>
                              <input
                                className="w-full border rounded-lg p-2"
                                value={t.role}
                                onChange={(e) =>
                                  updateTestimonial(
                                    t.id,
                                    "role",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs">Nội dung</label>
                              <textarea
                                className="w-full border rounded-lg p-2"
                                value={t.content}
                                onChange={(e) =>
                                  updateTestimonial(
                                    t.id,
                                    "content",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addTestimonial}
                        className="w-full border-2 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 text-slate-500"
                      >
                        <Plus className="w-4 h-4" /> Thêm đánh giá
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "blogs" && (
                  <div>
                    <SectionHeader
                      title="Bài viết nổi bật"
                      subtitle="Quản lý bài viết hiển thị trên trang chủ"
                      onSave={handleSave}
                    />
                    <div className="space-y-4">
                      {blogs.map((blog) => (
                        <div
                          key={blog.id}
                          className="border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold">
                              {blog.title || "Bài viết mới"}
                            </span>
                            <div className="flex gap-2 items-center">
                              <label className="text-xs flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={blog.featured}
                                  onChange={(e) =>
                                    updateBlog(
                                      blog.id,
                                      "featured",
                                      e.target.checked,
                                    )
                                  }
                                />{" "}
                                Nổi bật
                              </label>
                              <button
                                onClick={() => deleteBlog(blog.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <label className="text-xs">Tiêu đề</label>
                              <input
                                className="w-full border rounded-lg p-2"
                                value={blog.title}
                                onChange={(e) =>
                                  updateBlog(blog.id, "title", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs">Tóm tắt</label>
                              <textarea
                                className="w-full border rounded-lg p-2"
                                value={blog.excerpt}
                                onChange={(e) =>
                                  updateBlog(blog.id, "excerpt", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-2">
                                Ảnh (Tải lên từ thiết bị)
                              </label>
                              {blog.image &&
                                (blog.image.startsWith("data:image") ||
                                  blog.image.startsWith("http")) && (
                                  <img
                                    src={blog.image}
                                    alt="preview"
                                    className="h-16 w-32 object-cover rounded-lg border border-slate-200 mb-3 shadow-sm"
                                  />
                                )}
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    handleImageUpload(file, (url) =>
                                      updateBlog(blog.id, "image", url),
                                    );
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-xs mb-2 block">
                                Ngày đăng
                              </label>
                              <input
                                type="date"
                                className="w-full border rounded-lg p-3 text-sm"
                                value={blog.publishDate}
                                onChange={(e) =>
                                  updateBlog(
                                    blog.id,
                                    "publishDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addBlog}
                        className="w-full border-2 border-dashed py-4 rounded-xl flex justify-center items-center gap-2 text-slate-500 hover:text-indigo-600"
                      >
                        <Plus className="w-4 h-4" /> Thêm bài viết
                      </button>
                    </div>
                  </div>
                )}
                {activeTab === "partners" && (
                  <div>
                    <SectionHeader
                      title="Đối tác & Thương hiệu"
                      subtitle="Quản lý Logo đối tác"
                      onSave={handleSave}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      {partners.map((p) => (
                        <div key={p.id} className="border p-4 rounded-xl">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold">{p.name}</span>
                            <div className="flex gap-2">
                              <Toggle
                                checked={p.active}
                                onChange={(v) =>
                                  updatePartner(p.id, "active", v)
                                }
                              />
                              <button
                                onClick={() => deletePartner(p.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <label className="text-xs">Tên</label>
                          <input
                            className="w-full border p-2 mb-3 rounded-lg text-sm"
                            value={p.name}
                            onChange={(e) =>
                              updatePartner(p.id, "name", e.target.value)
                            }
                          />
                          <label className="text-xs mt-2 block">
                            Link Website
                          </label>
                          <input
                            className="w-full border p-2 mb-3 rounded-lg text-sm"
                            value={p.website || ""}
                            onChange={(e) =>
                              updatePartner(p.id, "website", e.target.value)
                            }
                            placeholder="https://..."
                          />
                          <label className="block text-xs font-medium text-slate-600 mb-2">
                            Logo (Tải lên từ thiết bị)
                          </label>
                          {p.logo &&
                            (p.logo.startsWith("data:image") ||
                              p.logo.startsWith("http")) && (
                              <img
                                src={p.logo}
                                alt="preview"
                                className="h-16 w-32 object-contain rounded-lg border border-slate-200 mb-3 shadow-sm p-2 bg-slate-50"
                              />
                            )}
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleImageUpload(file, (url) =>
                                  updatePartner(p.id, "logo", url),
                                );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addPartner}
                      className="w-full mt-4 border-2 border-dashed py-4 flex justify-center gap-2 text-slate-500 rounded-xl hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" /> Thêm đối tác
                    </button>
                  </div>
                )}
                {activeTab === "faq" && (
                  <div>
                    <SectionHeader
                      title="Câu hỏi thường gặp (FAQ)"
                      subtitle="Quản lý bộ câu hỏi dưới chân trang"
                      onSave={handleSave}
                    />
                    <div className="space-y-4">
                      {faqs.map((f) => (
                        <div key={f.id} className="border p-4 rounded-xl">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold line-clamp-1">
                              {f.question}
                            </span>
                            <div className="flex gap-2">
                              <Toggle
                                checked={f.active}
                                onChange={(v) => updateFAQ(f.id, "active", v)}
                              />
                              <button
                                onClick={() => deleteFAQ(f.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <label className="text-xs">Câu hỏi</label>
                          <input
                            className="w-full border p-2 mb-2 rounded"
                            value={f.question}
                            onChange={(e) =>
                              updateFAQ(f.id, "question", e.target.value)
                            }
                          />
                          <label className="text-xs">Trả lời</label>
                          <textarea
                            className="w-full border p-2 rounded"
                            value={f.answer}
                            onChange={(e) =>
                              updateFAQ(f.id, "answer", e.target.value)
                            }
                          />
                        </div>
                      ))}
                      <button
                        onClick={addFAQ}
                        className="w-full border-2 border-dashed py-4 flex justify-center gap-2 text-slate-500 rounded-xl hover:text-indigo-600"
                      >
                        <Plus className="w-4 h-4" /> Thêm câu hỏi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: TRANG CÂU LẠC BỘ */}
          {mainTab === "clubs" && (
            <>
              <div className="flex overflow-x-auto border-b border-slate-100">
                {CLUB_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveClubTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeClubTab === tab.id ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {/* ── TAB CON: Giới thiệu chung ── */}
                {activeClubTab === "intro" && (
                  <div>
                    <SectionHeader
                      title="Giới thiệu chung"
                      subtitle="Quản lý Slogan và Banner chính của Trang Hệ Thống Cơ Sở"
                      onSave={handleSave}
                    />
                    <div className="max-w-3xl space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Đoạn văn Giới thiệu (Slogan)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="VD: Không gian tập luyện sang trọng, đẳng cấp..."
                          className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={clubsPage.description}
                          onChange={(e) =>
                            setClubsPage((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Banner Trang Câu Lạc Bộ (Tải ảnh lên từ thiết bị)
                        </label>
                        {clubsPage.banner &&
                          (clubsPage.banner.startsWith("data:image") ||
                            clubsPage.banner.startsWith("http")) && (
                            <div className="mt-4 mb-4 h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                              <img
                                src={clubsPage.banner}
                                alt="Preview Banner CLB"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleImageUpload(file, (url) =>
                                setClubsPage((prev) => ({
                                  ...prev,
                                  banner: url,
                                })),
                              );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB CON: Tiện ích & Dịch vụ ── */}
                {activeClubTab === "facilities" && (
                  <div>
                    <SectionHeader
                      title="Dịch Vụ & Tiện Ích"
                      subtitle="Quản lý danh sách các tiện ích đi kèm tại cơ sở (VD: Tủ đồ, Xông hơi...)"
                      onSave={handleSave}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clubsPage.facilities.map((fac) => (
                        <div
                          key={fac.id}
                          className="border border-slate-200 rounded-xl p-5"
                        >
                          <div className="flex justify-between mb-4">
                            <span className="font-semibold text-slate-700">
                              Tiện ích #{fac.id}
                            </span>
                            <button
                              onClick={() => deleteClubFacility(fac.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs">Tên tiện ích</label>
                              <input
                                className="w-full border rounded-lg p-2 text-sm"
                                value={fac.title}
                                onChange={(e) =>
                                  updateClubFacility(
                                    fac.id,
                                    "title",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs">Mô tả ngắn</label>
                              <textarea
                                className="w-full border rounded-lg p-2 text-sm"
                                rows={2}
                                value={fac.desc}
                                onChange={(e) =>
                                  updateClubFacility(
                                    fac.id,
                                    "desc",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-2">
                                Ảnh minh họa (Tải lên từ thiết bị)
                              </label>
                              {fac.img &&
                                (fac.img.startsWith("data:image") ||
                                  fac.img.startsWith("http")) && (
                                  <img
                                    src={fac.img}
                                    alt="preview"
                                    className="h-16 w-32 object-cover rounded-lg border border-slate-200 mb-3 shadow-sm"
                                  />
                                )}
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    handleImageUpload(file, (url) =>
                                      updateClubFacility(fac.id, "img", url),
                                    );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addClubFacility}
                      className="mt-4 w-full border-2 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" /> Thêm tiện ích
                    </button>
                  </div>
                )}

                {/* ── TAB CON: Thay đổi hình thể ── */}
                {activeClubTab === "transformations" && (
                  <div>
                    <SectionHeader
                      title="Hình ảnh Thay đổi hình thể"
                      subtitle="Quản lý bộ ảnh chạy Slider khách hàng lột xác thành công"
                      onSave={handleSave}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {clubsPage.transformations.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="border border-slate-200 rounded-xl p-3 relative group"
                        >
                          <button
                            onClick={() => deleteClubTrans(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="h-32 bg-slate-100 rounded-lg mb-3 overflow-hidden border border-slate-200">
                            {imgUrl &&
                            (imgUrl.startsWith("data:image") ||
                              imgUrl.startsWith("http")) ? (
                              <img
                                src={imgUrl}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                Chưa có ảnh hợp lệ
                              </div>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleImageUpload(file, (url) =>
                                  updateClubTrans(index, url),
                                );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addClubTrans}
                      className="mt-4 w-full border-2 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600"
                    >
                      <Plus className="w-4 h-4" /> Thêm ảnh mới
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 3: TRANG BỘ MÔN */}
          {mainTab === "disciplines" && (
            <>
              <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50">
                {DISCIPLINE_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveDisciplineTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px ${activeDisciplineTab === tab.id ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                    >
                      <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="p-6">
                {activeDisciplineTab === "intro" && (
                  <div className="max-w-3xl space-y-6">
                    <SectionHeader
                      title="Giới thiệu chung"
                      subtitle="Quản lý Slogan và Banner của trang Bộ môn"
                      onSave={handleSave}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Đoạn văn Giới thiệu (Slogan)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        value={disciplinesPage.description}
                        onChange={(e) =>
                          setDisciplinesPage((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Banner Trang Bộ Môn (Tải ảnh lên từ thiết bị)
                      </label>
                      {disciplinesPage.banner &&
                        (disciplinesPage.banner.startsWith("data:image") ||
                          disciplinesPage.banner.startsWith("http")) && (
                          <div className="mt-4 mb-4 h-64 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <img
                              src={disciplinesPage.banner}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            handleImageUpload(file, (url) =>
                              setDisciplinesPage((prev) => ({
                                ...prev,
                                banner: url,
                              })),
                            );
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeDisciplineTab === "benefits" && (
                  <div>
                    <SectionHeader
                      title="Lợi ích tập luyện"
                      subtitle="Quản lý danh sách các gạch đầu dòng lợi ích"
                      onSave={handleSave}
                    />
                    <div className="space-y-3 max-w-3xl">
                      {disciplinesPage.benefits.map((ben, index) => (
                        <div key={index} className="flex gap-3">
                          <input
                            className="flex-1 border border-slate-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none"
                            value={ben}
                            onChange={(e) =>
                              updateDiscBenefit(index, e.target.value)
                            }
                            placeholder="VD: Tăng cường sức mạnh và độ bền..."
                          />
                          <button
                            onClick={() => deleteDiscBenefit(index)}
                            className="bg-red-50 text-red-500 px-4 rounded-lg hover:bg-red-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addDiscBenefit}
                        className="w-full border-2 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-600"
                      >
                        <Plus className="w-4 h-4" /> Thêm lợi ích
                      </button>
                    </div>
                  </div>
                )}

                {activeDisciplineTab === "facilities" && (
                  <div>
                    <SectionHeader
                      title="Tiện ích đi kèm Bộ môn"
                      subtitle="Quản lý các tiện ích như Tủ đồ, Theo dõi chỉ số..."
                      onSave={handleSave}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {disciplinesPage.facilities.map((fac) => (
                        <div
                          key={fac.id}
                          className="border border-slate-200 rounded-xl p-4"
                        >
                          <div className="flex justify-between mb-3">
                            <span className="font-semibold text-emerald-700">
                              Card #{fac.id}
                            </span>
                            <button
                              onClick={() => deleteDiscFacility(fac.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3">
                            <input
                              className="w-full border rounded-lg p-2 text-sm outline-none focus:border-emerald-500"
                              placeholder="Tên tiện ích"
                              value={fac.title}
                              onChange={(e) =>
                                updateDiscFacility(
                                  fac.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                            />
                            <textarea
                              className="w-full border rounded-lg p-2 text-sm outline-none focus:border-emerald-500"
                              rows={2}
                              placeholder="Mô tả"
                              value={fac.desc}
                              onChange={(e) =>
                                updateDiscFacility(
                                  fac.id,
                                  "desc",
                                  e.target.value,
                                )
                              }
                            />
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-2">
                                Ảnh tiện ích (Tải lên từ thiết bị)
                              </label>
                              {fac.img &&
                                (fac.img.startsWith("data:image") ||
                                  fac.img.startsWith("http")) && (
                                  <img
                                    src={fac.img}
                                    alt="preview"
                                    className="h-16 w-32 object-cover rounded-lg border border-slate-200 mb-3 shadow-sm"
                                  />
                                )}
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-slate-500 file:cursor-pointer border border-slate-200 rounded-xl p-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file)
                                    handleImageUpload(file, (url) =>
                                      updateDiscFacility(fac.id, "img", url),
                                    );
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={addDiscFacility}
                      className="mt-4 w-full border-2 border-dashed py-4 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-600"
                    >
                      <Plus className="w-4 h-4" /> Thêm tiện ích
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
