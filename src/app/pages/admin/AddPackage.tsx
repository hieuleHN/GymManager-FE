import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function AddPackage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    disciplineType: 'Gym',
    monthlyPrice: ''
  });

  const [features, setFeatures] = useState<string[]>(['']);
  const [durations, setDurations] = useState<Array<{months: string, discount: string}>>([{months: '', discount: ''}]);
  const [commitmentA, setCommitmentA] = useState('');
  const [commitmentB, setCommitmentB] = useState('');
  const [otherTerms, setOtherTerms] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addFeature = () => {
    setFeatures([...features, '']);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const addDuration = () => {
    setDurations([...durations, {months: '', discount: ''}]);
  };

  const removeDuration = (index: number) => {
    setDurations(durations.filter((_, i) => i !== index));
  };

  const updateDuration = (index: number, field: 'months' | 'discount', value: string) => {
    const newDurations = [...durations];
    newDurations[index][field] = value;
    setDurations(newDurations);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thêm gói tập thành công!');
    navigate('/admin/packages');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Thêm gói tập</h1>
          <p className="text-slate-600">Tạo gói tập mới cho hệ thống</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tên gói tập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: PREMIUM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Loại gói (Bộ môn) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.disciplineType}
                  onChange={(e) => handleChange('disciplineType', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Gym">Gym</option>
                  <option value="Yoga">Yoga</option>
                  <option value="Boxing">Boxing</option>
                  <option value="Pilates">Pilates</option>
                  <option value="Combo">Combo</option>
                  <option value="PT">PT</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Đơn giá gói theo tháng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.monthlyPrice}
                  onChange={(e) => handleChange('monthlyPrice', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: 2000000"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tính năng / Quyền lợi
              </label>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="VD: Không giới hạn tập luyện"
                    />
                    {features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Thêm tính năng</span>
                </button>
              </div>
            </div>

            {/* Duration & Discount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Thời gian tập & Giảm giá
              </label>
              <div className="space-y-3">
                {durations.map((duration, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="number"
                      value={duration.months}
                      onChange={(e) => updateDuration(index, 'months', e.target.value)}
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Số tháng (VD: 6)"
                    />
                    <input
                      type="number"
                      value={duration.discount}
                      onChange={(e) => updateDuration(index, 'discount', e.target.value)}
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="% Giảm giá (VD: 15)"
                    />
                    {durations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDuration(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDuration}
                  className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Thêm thời gian</span>
                </button>
              </div>
            </div>

            {/* Contract Terms */}
            <div className="space-y-6 pt-6 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cam kết bên A (Phòng gym)
                </label>
                <textarea
                  value={commitmentA}
                  onChange={(e) => setCommitmentA(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các cam kết của phòng gym..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cam kết bên B (Khách hàng)
                </label>
                <textarea
                  value={commitmentB}
                  onChange={(e) => setCommitmentB(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các cam kết của khách hàng..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Điều khoản khác
                </label>
                <textarea
                  value={otherTerms}
                  onChange={(e) => setOtherTerms(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập các điều khoản khác..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/packages')}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Thêm gói tập
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
