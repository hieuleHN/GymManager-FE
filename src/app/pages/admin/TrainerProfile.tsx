import { useState } from 'react';
import { User, Camera, Plus, X, Award } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

export function TrainerProfile() {
  const [selectedImages, setSelectedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1567598508481-65985588e295?auto=format&fit=crop&q=80&w=400',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=400'
  ]);

  const [profile, setProfile] = useState({
    name: 'Nguyễn Văn A',
    specialties: ['Yoga', 'Cardio', 'Weight Training'],
    description: 'Huấn luyện viên với 5 năm kinh nghiệm, chứng chỉ PT quốc tế. Chuyên về Yoga, Cardio và tập tạ. Đã giúp hơn 100 học viên đạt được mục tiêu sức khỏe của mình.'
  });

  const allSpecialties = ['Yoga', 'Cardio', 'Weight Training', 'Boxing', 'Pilates', 'CrossFit', 'Swimming', 'Martial Arts'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSpecialty = (specialty: string) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hồ sơ huấn luyện viên</h1>
        <p className="text-slate-600 mt-2">Cập nhật thông tin hồ sơ huấn luyện viên</p>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin cơ bản</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
            <textarea
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={5}
            />
          </div>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Ảnh của bạn</h2>
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" />
            Thêm ảnh
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {selectedImages.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={image}
                alt={`Trainer ${index + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
            <Camera className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-600">Thêm ảnh</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Các bộ môn chuyên môn</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allSpecialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => toggleSpecialty(specialty)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                profile.specialties.includes(specialty)
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm text-indigo-900">
            <span className="font-semibold">Đã chọn {profile.specialties.length} bộ môn:</span>{' '}
            {profile.specialties.join(', ')}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
          Hủy
        </button>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
          Lưu thay đổi
        </button>
      </div>
      </div>
    </AdminLayout>
  );
}
