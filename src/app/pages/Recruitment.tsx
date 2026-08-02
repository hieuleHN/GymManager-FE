
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  UploadCloud,
  CheckCircle,
  Briefcase,
  User,
  Mail,
  Phone,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface RecruitmentFormData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  description: string;
}

export function Recruitment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thêm state để lưu danh sách công việc gọi từ DB
  const [jobOptions, setJobOptions] = useState<any[]>([]);

  const {
    register,
    handleSubmit: formHandleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecruitmentFormData>();

  // Gọi API lấy danh sách công việc khi load trang
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/jobs");

        // Cố gắng tìm ra cái mảng trong đống response trả về để chống lỗi
        const rawData = response.data;
        const jobList = Array.isArray(rawData)
          ? rawData
          : rawData.data || rawData.jobs || [];

        // Lọc bỏ chức vụ Admin / Quản trị viên
        const validJobs = jobList.filter(
          (job: any) =>
            job.name &&
            job.name.toLowerCase() !== "admin" &&
            job.name.toLowerCase() !== "quản trị viên",
        );

        setJobOptions(validJobs);
      } catch (error) {
        console.error("Lỗi khi kéo dữ liệu công việc:", error);
        setJobOptions([
          { name: "Huấn luyện viên (PT)" },
          { name: "Lễ tân" },
          { name: "Sale / Tư vấn viên" },
          { name: "Quản lý câu lạc bộ" },
        ]);
      }
    };

    fetchJobs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
  };

  const onSubmit = async (data: RecruitmentFormData) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Vui lòng tải lên CV của bạn!");
      return;
    }

    // --- BỘ LỌC VALIDATE BẢO MẬT ---

    // 1. Validate Dung lượng file (Giới hạn tối đa 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dung lượng CV quá lớn! Vui lòng chọn file dưới 5MB.");
      return;
    }

    // ------------------------------

    // Đóng gói dữ liệu chữ và file vào FormData
    const submitData = new FormData();
    submitData.append("fullName", data.fullName);
    submitData.append("email", data.email);
    submitData.append("phone", data.phone);
    submitData.append("position", data.position);
    submitData.append("description", data.description);
    submitData.append("cv", file);

    try {
      setIsSubmitting(true);
      await axios.post(
        "http://localhost:5000/api/recruitments/apply",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      toast.success("Nộp hồ sơ thành công! Chúng tôi sẽ sớm liên hệ với bạn.");

      // Reset form sau khi gửi thành công
      reset();
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Có lỗi xảy ra khi nộp hồ sơ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Banner Header */}
        <div className="bg-indigo-600 px-8 py-12 text-center">
          <h1 className="text-3xl font-extrabold text-white mb-4">
            Gia nhập đội ngũ ZenFitness
          </h1>
          <p className="text-indigo-100 text-lg">
            Môi trường làm việc chuyên nghiệp, năng động và đam mê thể thao.
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 py-10">
          <form onSubmit={formHandleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    {...register("fullName", { required: "Vui lòng nhập họ và tên" })}
                    className="pl-10 block w-full border border-slate-300 rounded-lg py-2.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                {errors.fullName && (
                  <span className="text-red-500 text-sm mt-1">{errors.fullName.message}</span>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Vui lòng nhập số điện thoại",
                      pattern: {
                        value: /^(0[3|5|7|8|9])+([0-9]{8})$/,
                        message:
                          "Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số hợp lệ tại Việt Nam.",
                      },
                    })}
                    className="pl-10 block w-full border border-slate-300 rounded-lg py-2.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="0901234567"
                  />
                </div>
                {errors.phone && (
                  <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    {...register("email", {
                      required: "Vui lòng nhập email",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email không hợp lệ",
                      },
                    })}
                    className="pl-10 block w-full border border-slate-300 rounded-lg py-2.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                    placeholder="nguyenvana@email.com"
                  />
                </div>
                {errors.email && (
                  <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>
                )}
              </div>

              {/* Vị trí ứng tuyển */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Vị trí ứng tuyển *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    {...register("position", { required: "Vui lòng chọn vị trí ứng tuyển" })}
                    className="pl-10 block w-full border border-slate-300 rounded-lg py-2.5 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-white"
                  >
                    <option value="" disabled>
                      -- Chọn vị trí --
                    </option>

                    {/* Render động danh sách công việc từ Database */}
                    {jobOptions.length > 0 ? (
                      jobOptions.map((job) => (
                        <option key={job._id || job.name} value={job.name}>
                          {job.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        Đang tải dữ liệu...
                      </option>
                    )}
                  </select>
                </div>
                {errors.position && (
                  <span className="text-red-500 text-sm mt-1">{errors.position.message}</span>
                )}
              </div>
            </div>

            {/* Giới thiệu bản thân */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Giới thiệu ngắn về bản thân
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="block w-full border border-slate-300 rounded-lg py-3 px-4 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                placeholder="Ví dụ: Có 3 năm kinh nghiệm làm PT, chứng chỉ Yoga quốc tế..."
              ></textarea>
            </div>

            {/* Upload CV */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tải lên CV (PDF, DOCX) *
              </label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-500 transition-colors bg-slate-50 relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-2 text-center">
                  {fileName ? (
                    <div className="flex flex-col items-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                      <p className="mt-2 text-sm text-slate-900 font-medium">
                        {fileName}
                      </p>
                      <p className="text-xs text-indigo-600 cursor-pointer hover:underline">
                        Nhấn để đổi file khác
                      </p>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="text-sm text-slate-600">
                        <span className="text-indigo-600 font-semibold hover:text-indigo-500">
                          Nhấn để tải lên
                        </span>{" "}
                        hoặc kéo thả file vào đây
                      </div>
                      <p className="text-xs text-slate-500">
                        Giới hạn dung lượng 5MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Nút Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Đang gửi hồ sơ..." : "Nộp Hồ Sơ Ngay"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
