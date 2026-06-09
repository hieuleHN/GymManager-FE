import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState } from 'react';

const roles = [
  { id: 1, name: 'Quản lý', description: 'Toàn quyền quản lý hệ thống' },
  { id: 2, name: 'Lễ tân', description: 'Quản lý khách hàng, điểm danh' },
  { id: 3, name: 'Huấn luyện viên', description: 'Quản lý lịch tập, tiến độ khách hàng' },
  { id: 4, name: 'Kế toán', description: 'Quản lý hóa đơn, thống kê doanh thu' }
];

const permissions = [
  { id: 'customers', name: 'Quản lý khách hàng', description: 'Xem, thêm, sửa, xóa khách hàng' },
  { id: 'equipment', name: 'Quản lý thiết bị', description: 'Xem, thêm, sửa, xóa thiết bị' },
  { id: 'services', name: 'Quản lý dịch vụ', description: 'Xem, thêm, sửa, xóa dịch vụ' },
  { id: 'attendance', name: 'Quản lý điểm danh', description: 'Xem, cập nhật điểm danh' },
  { id: 'invoices', name: 'Quản lý hóa đơn', description: 'Xem, tạo, cập nhật hóa đơn' },
  { id: 'notifications', name: 'Quản lý thông báo', description: 'Gửi thông báo cho khách hàng' },
  { id: 'staff', name: 'Quản lý nhân viên', description: 'Xem, thêm, sửa, xóa nhân viên' },
  { id: 'tasks', name: 'Quản lý công việc', description: 'Xem, tạo, cập nhật công việc' },
  { id: 'statistics', name: 'Quản lý thống kê', description: 'Xem báo cáo thống kê' }
];

const defaultPermissions: Record<string, string[]> = {
  'Quản lý': ['customers', 'equipment', 'services', 'attendance', 'invoices', 'notifications', 'staff', 'tasks', 'statistics'],
  'Lễ tân': ['customers', 'attendance', 'notifications'],
  'Huấn luyện viên': ['customers', 'attendance', 'tasks'],
  'Kế toán': ['invoices', 'statistics']
};

export function StaffPermissions() {
  const [selectedRole, setSelectedRole] = useState(roles[0].name);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(defaultPermissions);

  const togglePermission = (permissionId: string) => {
    const current = rolePermissions[selectedRole] || [];
    const updated = current.includes(permissionId)
      ? current.filter(p => p !== permissionId)
      : [...current, permissionId];

    setRolePermissions({
      ...rolePermissions,
      [selectedRole]: updated
    });
  };

  const handleSave = () => {
    alert('Cập nhật phân quyền thành công!');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Phân quyền người dùng</h1>
          <p className="text-slate-600">Quản lý quyền truy cập của từng vai trò</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Role List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Vai trò</h2>
              <div className="space-y-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.name)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selectedRole === role.name
                        ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <p className="font-bold text-sm">{role.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Phân quyền cho: <span className="text-indigo-600">{selectedRole}</span>
              </h2>
              <p className="text-slate-600 mb-6">Chọn các quyền truy cập cho vai trò này</p>

              <div className="space-y-3">
                {permissions.map((permission) => {
                  const isChecked = (rolePermissions[selectedRole] || []).includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        isChecked
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{permission.name}</p>
                        <p className="text-sm text-slate-600">{permission.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(permission.id)}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  Khôi phục mặc định
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 4
                  }}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
