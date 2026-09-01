import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';

interface Job {
  _id: string;
  name: string;
}

interface Feature {
  id: string;
  name: string;
}

export function StaffPermissions() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [jobPermissions, setJobPermissions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/jobs?page=1&limit=50`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const list = data.data || [];
        if (Array.isArray(list)) {
          setJobs(list);
          if (list.length > 0) setSelectedJob(list[0]._id);
        }
      })
      .catch(() => {});

    fetch(`${getApiUrl()}/api/permissions/features`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFeatures(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    fetch(`${getApiUrl()}/api/permissions/${selectedJob}`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data && data.permissions) {
          const perms = data.permissions
            .filter(p => p.actions && p.actions.length > 0)
            .map(p => p.feature);
          setJobPermissions(prev => ({ ...prev, [selectedJob]: perms }));
        } else {
          setJobPermissions(prev => ({ ...prev, [selectedJob]: [] }));
        }
      })
      .catch(() => {});
  }, [selectedJob]);

  const togglePermission = (featureId: string) => {
    const current = jobPermissions[selectedJob] || [];
    const updated = current.includes(featureId)
      ? current.filter(f => f !== featureId)
      : [...current, featureId];
    setJobPermissions({ ...jobPermissions, [selectedJob]: updated });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const enabledFeatures = jobPermissions[selectedJob] || [];
      const perms = features
        .filter(f => enabledFeatures.includes(f.id))
        .map(f => ({ feature: f.id, actions: ['view'] }));
      const res = await fetch(`${getApiUrl()}/api/permissions`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ jobId: selectedJob, permissions: perms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Cập nhật phân quyền thành công!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Phân quyền theo chức vụ</h1>
          <p className="text-slate-600">Chọn chức vụ và bật/tắt các chức năng được phép truy cập</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Chức vụ</h2>
              <div className="space-y-2">
                {jobs.map((job) => (
                  <button key={job._id} onClick={() => setSelectedJob(job._id)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedJob === job._id
                        ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}>
                    <p className="font-bold text-sm">{job.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Phân quyền cho: <span className="text-indigo-600">{jobs.find(j => j._id === selectedJob)?.name || 'Chưa chọn'}</span>
              </h2>
              <p className="text-slate-600 mb-6">
                {selectedJob ? 'Bật chức năng nào thì chức vụ này được phép truy cập. Tắt thì ẩn và chặn truy cập.' : 'Chọn một chức vụ bên trái để bắt đầu'}
              </p>

              <div className="space-y-3">
                {features.map((feature) => {
                  const isChecked = (jobPermissions[selectedJob] || []).includes(feature.id);
                  return (
                    <div key={feature.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{feature.name}</p>
                        <p className="text-sm text-slate-500">{isChecked ? 'Được phép truy cập' : 'Bị chặn'}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isChecked} onChange={() => togglePermission(feature.id)} className="sr-only peer" />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <Button variant="contained" onClick={handleSave} disabled={loading}
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, textTransform: 'none', borderRadius: 2, px: 4 }}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}