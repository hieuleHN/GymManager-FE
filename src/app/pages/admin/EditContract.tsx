import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export function EditContract() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [commitmentA, setCommitmentA] = useState('Bên A cam kết cung cấp đầy đủ trang thiết bị tập luyện...');
  const [commitmentB, setCommitmentB] = useState('Bên B cam kết tuân thủ quy định của phòng gym...');
  const [otherTerms, setOtherTerms] = useState('Các điều khoản khác sẽ được thỏa thuận trực tiếp...');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Cập nhật hợp đồng thành công!');
    navigate('/admin/contracts');
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa hợp đồng</h1>
          <p className="text-slate-600">Cập nhật nội dung hợp đồng gói tập</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cam kết bên A (Phòng gym)
              </label>
              <textarea
                value={commitmentA}
                onChange={(e) => setCommitmentA(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cam kết bên B (Khách hàng)
              </label>
              <textarea
                value={commitmentB}
                onChange={(e) => setCommitmentB(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Điều khoản khác
              </label>
              <textarea
                value={otherTerms}
                onChange={(e) => setOtherTerms(e.target.value)}
                rows={6}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
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
