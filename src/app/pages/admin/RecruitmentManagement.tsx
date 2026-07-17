import { useState } from 'react';
import { Mail, Edit2, Save, X, FileText, Download, Eye, Calendar, User } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface CV {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  description: string;
  fileName: string;
  fileSize: string;
  submittedAt: string;
  status: 'new' | 'reviewing' | 'approved' | 'rejected';
}

export function RecruitmentManagement() {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [recruitmentEmail, setRecruitmentEmail] = useState('recruitment@zenfitness.com');
  const [selectedCV, setSelectedCV] = useState<CV | null>(null);

  const [cvList] = useState<CV[]>([
    {
      id: '1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0901234567',
      position: 'Huấn luyện viên',
      description: '5 năm kinh nghiệm huấn luyện, chứng chỉ PT quốc tế, chuyên môn Yoga và Cardio',
      fileName: 'CV_NguyenVanA.pdf',
      fileSize: '2.5 MB',
      submittedAt: '2026-06-01',
      status: 'new'
    },
    {
      id: '2',
      name: 'Trần Thị B',
      email: 'tranthib@email.com',
      phone: '0912345678',
      position: 'Lễ tân',
      description: '3 năm kinh nghiệm làm việc trong lĩnh vực dịch vụ, giao tiếp tốt, ngoại hình ưa nhìn',
      fileName: 'CV_TranThiB.pdf',
      fileSize: '1.8 MB',
      submittedAt: '2026-06-02',
      status: 'reviewing'
    },
    {
      id: '3',
      name: 'Lê Văn C',
      email: 'levanc@email.com',
      phone: '0923456789',
      position: 'Huấn luyện viên',
      description: 'Cử nhân Giáo dục thể chất, 2 năm kinh nghiệm, chuyên môn Gym và Boxing',
      fileName: 'CV_LeVanC.pdf',
      fileSize: '3.1 MB',
      submittedAt: '2026-06-03',
      status: 'approved'
    }
  ]);

  const handleEmailSave = () => {
    setIsEditingEmail(false);
    // TODO: Save to backend
  };

  const getStatusColor = (status: CV['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'reviewing':
        return 'bg-yellow-100 text-yellow-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
    }
  };

  const getStatusText = (status: CV['status']) => {
    switch (status) {
      case 'new':
        return 'Mới';
      case 'reviewing':
        return 'Đang xem xét';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quản lý tuyển dụng</h1>
          <p className="text-slate-600 mt-2">Quản lý CV ứng tuyển và thông tin liên hệ</p>
      </div>

      {/* Email Configuration */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Mail className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Email nhận CV</h2>
              <p className="text-sm text-slate-600">Email để nhận CV từ ứng viên</p>
            </div>
          </div>
          {!isEditingEmail ? (
            <button
              onClick={() => setIsEditingEmail(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Thay đổi
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleEmailSave}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Lưu
              </button>
              <button
                onClick={() => setIsEditingEmail(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
                Hủy
              </button>
            </div>
          )}
        </div>
        {isEditingEmail ? (
          <input
            type="email"
            value={recruitmentEmail}
            onChange={(e) => setRecruitmentEmail(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="email@example.com"
          />
        ) : (
          <div className="px-4 py-3 bg-slate-50 rounded-lg">
            <p className="text-lg font-semibold text-slate-900">{recruitmentEmail}</p>
          </div>
        )}
      </div>

      {/* CV List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Danh sách CV ứng tuyển</h2>
          <p className="text-sm text-slate-600 mt-1">Tổng cộng {cvList.length} CV</p>
        </div>

        <div className="divide-y divide-slate-200">
          {cvList.map((cv) => (
            <div key={cv.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{cv.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cv.status)}`}>
                          {getStatusText(cv.status)}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Vị trí: <span className="font-semibold text-slate-900">{cv.position}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {cv.email}
                          </div>
                          <div>📞 {cv.phone}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Nộp ngày: {new Date(cv.submittedAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                        {cv.description}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">{cv.fileName}</span>
                        <span>•</span>
                        <span>{cv.fileSize}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedCV(cv)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm">
                    <Download className="w-4 h-4" />
                    Tải CV
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CV Detail Modal */}
      {selectedCV && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-slate-900">Chi tiết CV - {selectedCV.name}</h3>
              <button
                onClick={() => setSelectedCV(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Họ tên</label>
                  <p className="text-slate-900 font-semibold mt-1">{selectedCV.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Vị trí ứng tuyển</label>
                  <p className="text-slate-900 font-semibold mt-1">{selectedCV.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <p className="text-slate-900 mt-1">{selectedCV.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                  <p className="text-slate-900 mt-1">{selectedCV.phone}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Mô tả</label>
                <p className="text-slate-900 mt-2 p-4 bg-slate-50 rounded-lg">{selectedCV.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Trạng thái</label>
                <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="new">Mới</option>
                  <option value="reviewing">Đang xem xét</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                  Duyệt ứng viên
                </button>
                <button className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold">
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
