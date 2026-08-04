import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { User, Phone, Mail, Calendar, Shield, Save, CheckCircle2 } from 'lucide-react';

export function CustomerRegisterV2() {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        gender: 'MALE',
        packageType: 'GYM_MONTHLY',
        assignedLocker: ''
    });

    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Đăng ký Khách hàng Mới (V2)</h1>
                    <p className="text-slate-500 text-sm mt-1">Tạo hồ sơ hội viên mới và gán tủ đồ kèm theo</p>
                </div>

                {isSubmitted && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">Tạo hồ sơ hội viên mới V2 thành công!</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Họ và Tên</label>
                            <div className="relative">
                                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Điện Thoại</label>
                            <div className="relative">
                                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: 0987654321"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    placeholder="example@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Gán Tủ Đồ (Tùy chọn)</label>
                            <input
                                type="text"
                                placeholder="Ví dụ: LK-102"
                                value={formData.assignedLocker}
                                onChange={(e) => setFormData({ ...formData, assignedLocker: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Lưu Hoàn Tất
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}