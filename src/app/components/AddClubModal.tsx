import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useClub } from '../context/ClubContext';

interface AddClubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormValues {
  address: string;
  phone: string;
}

export function AddClubModal({ isOpen, onClose }: AddClubModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { setClubs } = useClub();

  if (!isOpen) return null;

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: data.address.trim(), phone: data.phone.trim() })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Thêm cơ sở thất bại!');

      toast.success('Thêm cơ sở thành công!');
      const updated = await fetch('/api/locations');
      const updatedData = await updated.json();
      const clubList = Array.isArray(updatedData) ? updatedData : (updatedData?.data || []);
      setClubs(clubList);
      reset();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Thêm câu lạc bộ mới</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Địa chỉ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address', { required: 'Vui lòng nhập địa chỉ cơ sở!' })}
              placeholder="Nhập địa chỉ cơ sở"
              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.address ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.address && <span className="text-red-500 text-sm mt-1">{errors.address.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              {...register('phone', { required: 'Vui lòng nhập số điện thoại!' })}
              placeholder="Nhập số điện thoại"
              className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
            />
            {errors.phone && <span className="text-red-500 text-sm mt-1">{errors.phone.message}</span>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Đang thêm...' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
