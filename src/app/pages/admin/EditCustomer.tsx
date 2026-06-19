import { AdminLayout } from '../../components/AdminLayout';
import { Button } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getAuthHeaders, getApiUrl } from '../../context/AuthContext';
import { toast } from 'sonner';

export function EditCustomer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    account: '',
    fullName: '',
    gender: 'Nam',
    phone: '',
    email: '',
    address: '',
    idNumber: ''
  });
  const [idCardFront, setIdCardFront] = useState<File | null>(null);
  const [idCardBack, setIdCardBack] = useState<File | null>(null);
  const [idCardFrontPreview, setIdCardFrontPreview] = useState('');
  const [idCardBackPreview, setIdCardBackPreview] = useState('');
  const [currentIdCardFront, setCurrentIdCardFront] = useState('');
  const [currentIdCardBack, setCurrentIdCardBack] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field: string, value: any) => {
    let msg = '';
    if (!value && (field === 'account' || field === 'fullName' || field === 'phone' || field === 'email' || field === 'password')) {
      const labels: Record<string, string> = { account: 'tài khoản', fullName: 'họ tên', phone: 'số điện thoại', email: 'email', password: 'mật khẩu' };
      msg = 'Vui lòng nhập ' + labels[field];
    } else if (field === 'phone' && value && !/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(value)) {
      msg = 'Số điện thoại không hợp lệ';
    } else if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      msg = 'Email không hợp lệ';
    } else if (field === 'password' && value && value.length < 6) {
      msg = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    setErrors(prev => ({ ...prev, [field]: msg }));
  };

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/customers/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      const customer = data.data || data;
      setFormData({
        account: customer.account || '',
        fullName: customer.fullName || '',
        gender: customer.gender || 'Nam',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        idNumber: customer.idNumber || ''
      });
      if (customer.idCardFront) setCurrentIdCardFront(customer.idCardFront);
      if (customer.idCardBack) setCurrentIdCardBack(customer.idCardBack);
    } catch {
      toast.error('Không thể tải thông tin khách hàng');
      navigate('/admin/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchCustomer(); }, [id]);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardFront(file);
      setIdCardFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdCardBack(file);
      setIdCardBackPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!formData.account) newErrors.account = 'Vui lòng nhập tài khoản';
    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.phone) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!formData.email) newErrors.email = 'Vui lòng nhập email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email không hợp lệ';
    if ('password' in formData && !formData.password) newErrors.password = 'Vui lòng nhập mật khẩu';
    else if ('password' in formData && formData.password && formData.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('account', formData.account);
      fd.append('fullName', formData.fullName);
      fd.append('gender', formData.gender);
      fd.append('phone', formData.phone);
      fd.append('email', formData.email);
      fd.append('address', formData.address);
      fd.append('idNumber', formData.idNumber);
      if (idCardFront) fd.append('idCardFront', idCardFront);
      if (idCardBack) fd.append('idCardBack', idCardBack);

      const res = await fetch(`${getApiUrl()}/api/customers/${id}`, {
        method: 'PUT',
        headers: { Authorization: (getAuthHeaders() as any).Authorization || '' },
        body: fd
      });
      if (res.ok) {
        toast.success('Cập nhật khách hàng thành công!');
        navigate('/admin/customers');
      } else {
        const data = await res.json();
        toast.error(data.error || data.message || 'Cập nhật thất bại');
      }
    } catch {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <p className="text-slate-500">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sửa thông tin khách hàng</h1>
          <p className="text-slate-600">Cập nhật thông tin khách hàng</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.account}
                  onChange={(e) => handleChange('account', e.target.value)}
                  onBlur={() => handleBlur('account', formData.account)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.account ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Nhập tài khoản"
                />
                {errors.account && <p className="text-red-500 text-sm mt-1">{errors.account}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName', formData.fullName)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.fullName ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone', formData.phone)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="0901234567"
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email', formData.email)}
                  className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-slate-200'}`}
                  placeholder="email@example.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Số căn cước
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleChange('idNumber', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="001234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Địa chỉ
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nhập địa chỉ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ảnh mặt trước căn cước
                </label>
                {currentIdCardFront && (
                  <div className="mb-3">
                    <img src={`${getApiUrl()}/uploads/customers/${currentIdCardFront}`} alt="Current front" className="w-full max-w-xs rounded-lg border" />
                    <p className="text-xs text-slate-400 mt-1">Ảnh hiện tại</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontChange}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {idCardFrontPreview && (
                  <img src={idCardFrontPreview} alt="Preview front" className="mt-2 w-full max-w-xs rounded-lg border" />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ảnh mặt sau căn cước
                </label>
                {currentIdCardBack && (
                  <div className="mb-3">
                    <img src={`${getApiUrl()}/uploads/customers/${currentIdCardBack}`} alt="Current back" className="w-full max-w-xs rounded-lg border" />
                    <p className="text-xs text-slate-400 mt-1">Ảnh hiện tại</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackChange}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {idCardBackPreview && (
                  <img src={idCardBackPreview} alt="Preview back" className="mt-2 w-full max-w-xs rounded-lg border" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/admin/customers')}
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
                {submitting ? 'Đang lưu...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
