import { useState, useEffect } from 'react';
import { User, Camera, Plus, X, Award, Save } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuth, getApiUrl, getAuthHeaders } from '../../context/AuthContext';

export function TrainerProfile() {
  const { user } = useAuth();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [profile, setProfile] = useState({
    name: '',
    specialties: [] as string[],
    description: '',
    avatar: '',
    coverImage: '',
    gender: 'Nam',
    experience: '',
    certifications: [] as string[],
    pricePerSession: 500000
  });

  const allSpecialties = ['Yoga', 'Cardio', 'Weight Training', 'Boxing', 'Pilates', 'CrossFit', 'Swimming', 'Martial Arts', 'Zumba', 'Dance'];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/staff/${user.id}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data) {
          setProfile({
            name: data.fullName || '',
            specialties: data.specialties || [],
            description: data.description || '',
            avatar: data.avatar || '',
            coverImage: data.coverImage || '',
            gender: data.gender || 'Nam',
            experience: data.experience || '',
            certifications: data.certifications || [],
            pricePerSession: data.pricePerSession || 500000
          });
          setSelectedImages(data.gallery || []);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleImageUpload = (field: 'avatar' | 'coverImage' | 'gallery') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (field === 'gallery') setSelectedImages(prev => [...prev, result]);
      else setProfile(prev => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
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

  const addCertification = () => {
    setProfile(prev => ({ ...prev, certifications: [...prev.certifications, ''] }));
  };

  const updateCertification = (index: number, value: string) => {
    setProfile(prev => {
      const certs = [...prev.certifications];
      certs[index] = value;
      return { ...prev, certifications: certs };
    });
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/staff/${user?.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders() as any, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profile.name,
          description: profile.description,
          specialties: profile.specialties,
          avatar: profile.avatar,
          coverImage: profile.coverImage,
          gender: profile.gender,
          experience: profile.experience,
          certifications: profile.certifications,
          gallery: selectedImages,
          pricePerSession: profile.pricePerSession
        })
      });
      if (!res.ok) throw new Error('Lỗi lưu');
      alert('Lưu thành công!');
    } catch (e: any) {
      alert('Lỗi: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-slate-500">Đang tải...</div>
      </AdminLayout>
    );
  }

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh đại diện</label>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={profile.avatar || 'https://images.unsplash.com/photo-1548690312-e3b507d17a4d?auto=format&fit=crop&q=80&w=200'}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                  />
                  <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload('avatar')} className="hidden" />
                  </label>
                </div>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors text-sm">
                  Chọn ảnh
                  <input type="file" accept="image/*" onChange={handleImageUpload('avatar')} className="hidden" />
                </label>
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ảnh bìa</label>
              <div className="flex items-center gap-4">
                <div className="relative group w-40 h-24 rounded-xl overflow-hidden bg-slate-100">
                  {profile.coverImage ? (
                    <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Camera className="w-6 h-6" /></div>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleImageUpload('coverImage')} className="hidden" />
                  </label>
                </div>
                <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors text-sm">
                  Chọn ảnh
                  <input type="file" accept="image/*" onChange={handleImageUpload('coverImage')} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
              <input type="text" value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
              <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white">
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kinh nghiệm</label>
              <input type="text" value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="VD: 5 năm kinh nghiệm"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phí / buổi (VNĐ)</label>
              <input type="number" value={profile.pricePerSession}
                onChange={(e) => setProfile({ ...profile, pricePerSession: Number(e.target.value) })}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
            <textarea value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={5} />
          </div>
        </div>

        {/* Images Gallery */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Thư viện ảnh</h2>
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" /> Thêm ảnh
              <input type="file" accept="image/*" multiple onChange={handleImageUpload('gallery')} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img src={image} alt={`${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                <button onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <Camera className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">Thêm ảnh</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload('gallery')} className="hidden" />
            </label>
          </div>
        </div>

        {/* Specialties */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Các bộ môn chuyên môn</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {allSpecialties.map((specialty) => (
              <button key={specialty} onClick={() => toggleSpecialty(specialty)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${profile.specialties.includes(specialty) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {specialty}
              </button>
            ))}
          </div>
          {profile.specialties.length > 0 && (
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-900">
                <span className="font-semibold">Đã chọn {profile.specialties.length} bộ môn:</span>{' '}
                {profile.specialties.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Chứng chỉ</h2>
            <button onClick={addCertification}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Thêm chứng chỉ
            </button>
          </div>
          <div className="space-y-3">
            {profile.certifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                <input type="text" value={cert}
                  onChange={(e) => updateCertification(index, e.target.value)}
                  placeholder="Nhập tên chứng chỉ..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button onClick={() => removeCertification(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {profile.certifications.length === 0 && (
              <p className="text-slate-500 text-sm">Chưa có chứng chỉ nào</p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
