import { AdminLayout } from '../../components/AdminLayout';
import { ActivityStats } from '../admin/ActivityStats';

export function AdminStats() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trung tâm Phân tích & Báo cáo</h1>
          <p className="text-slate-500 text-sm mt-1">Dữ liệu liên kết trực tiếp từ Database thời gian thực</p>
        </div>
        <ActivityStats />
      </div>
    </AdminLayout>
  );
}
