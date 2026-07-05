import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders } from '../../context/AuthContext';
import { toast } from 'sonner';

export function EditContract() {
  const navigate = useNavigate();
  const { id } = useParams();
  const headers = getAuthHeaders();

  const [contractA, setContractA] = useState('');
  const [contractB, setContractB] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/packages/${id}`, { headers });
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const pkg = data.data || data;
        setContractA(pkg.contractA || '');
        setContractB(pkg.contractB || '');
        setContractTerms(pkg.contractTerms || '');
      } catch {
        toast.error('Không tìm thấy hợp đồng');
        navigate('/admin/contracts');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ contractA, contractB, contractTerms }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Cập nhật hợp đồng thành công!');
      navigate('/admin/contracts');
    } catch {
      toast.error('Cập nhật hợp đồng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-8 text-center text-slate-500">Đang tải...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa chính sách</h1>
          <p className="text-slate-600">Cập nhật nội dung chính sách & điều khoản</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cam kết bên A (Phòng gym)
              </label>
              <textarea
                value={contractA}
                onChange={(e) => setContractA(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cam kết bên B (Khách hàng)
              </label>
              <textarea
                value={contractB}
                onChange={(e) => setContractB(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Điều khoản khác
              </label>
              <textarea
                value={contractTerms}
                onChange={(e) => setContractTerms(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                disabled={submitting}
                onClick={() => navigate('/admin/contracts')}
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
                disabled={submitting}
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: 4
                }}
              >
                Cập nhật
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
