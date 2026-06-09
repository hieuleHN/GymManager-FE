import { AdminLayout } from '../../components/AdminLayout';
import { useState } from 'react';
import { Edit, Trash2, Pause, Play } from 'lucide-react';
import { disciplinesData, packagesData } from '../../data';

export function PackageList() {
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [packageStatuses, setPackageStatuses] = useState<{[key: string]: 'active' | 'paused'}>({});

  const filteredPackages = selectedDiscipline === 'all'
    ? packagesData
    : packagesData.filter(pkg => pkg.discipline === selectedDiscipline);

  const toggleStatus = (packageId: string) => {
    setPackageStatuses(prev => ({
      ...prev,
      [packageId]: prev[packageId] === 'paused' ? 'active' : 'paused'
    }));
  };

  const handleEdit = (id: string) => {
    alert(`Sửa gói tập ID: ${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa gói tập này?')) {
      alert(`Đã xóa gói tập ID: ${id}`);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Danh sách gói tập</h1>
          <p className="text-slate-600">Quản lý các gói tập của phòng gym</p>
        </div>

        {/* Discipline Filter */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedDiscipline('all')}
            className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
              selectedDiscipline === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Tất cả
          </button>
          {disciplinesData.map((discipline) => (
            <button
              key={discipline.id}
              onClick={() => setSelectedDiscipline(discipline.name)}
              className={`px-6 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                selectedDiscipline === discipline.name
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {discipline.name}
            </button>
          ))}
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => {
            const status = packageStatuses[pkg.id] || 'active';
            return (
              <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Status Badge */}
                <div className="p-4 pb-0 flex justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>

                <div className="p-6 pt-3">
                  <div className="mb-4">
                    <p className="text-sm text-indigo-600 font-semibold mb-1">{pkg.discipline}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-slate-900">{pkg.price.toLocaleString('vi-VN')}</p>
                      <span className="text-slate-500">đ/tháng</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEdit(pkg.id)}
                      className="flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Sửa</span>
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Xóa</span>
                    </button>
                    <button
                      onClick={() => toggleStatus(pkg.id)}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                        status === 'active'
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span className="text-sm font-medium">Tạm ngưng</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="text-sm font-medium">Kích hoạt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
