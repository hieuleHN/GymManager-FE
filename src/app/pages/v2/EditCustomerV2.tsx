import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { User, Phone, Mail, ShieldAlert, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function EditCustomerV2() {
    const [customerData, setCustomerData] = useState({
        id: 'CUS-2026-001',
        fullName: 'Nguyễn Văn A',
        phone: '0987654321',
        email: 'nguyenvana@gmail.com',
        packageName: 'Gói Gym Gold 6 tháng',
        assignedLocker: 'LK-101',
        status: 'ACTIVE'
    });

    const [isSaved, setIsSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Cập nhật Thông tin Hội viên (V2)</h1>
                        <p className="text-slate-500 text-sm mt-1">Chỉnh sửa hồ sơ khách hàng, gia hạn gói và đổi tủ đồ</p>
                    </div>
                </div>

                {isSaved && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-semibold">Cập nhật hồ sơ hội viên V2 thành công!</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Mã Hội Viên</label>
                            <input
                                type="text"
                                disabled
                                value={customerData.id}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Họ và Tên</label>
                            <input
                                type="text"
                                required
                                value={customerData.fullName}
                                onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Số Điện Thoại</label>
                            <input
                                type="text"
                                required
                                value={customerData.phone}
                                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tủ Đồ Đang Thuê</label>
                            <input
                                type="text"
                                value={customerData.assignedLocker}
                                onChange={(e) => setCustomerData({ ...customerData, assignedLocker: e.target.value })}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Cập Nhật Hồ Sơ
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}