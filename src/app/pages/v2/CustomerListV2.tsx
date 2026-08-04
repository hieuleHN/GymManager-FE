import React, { useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { User, Phone, Calendar, ShieldCheck, Search, UserPlus, Filter } from 'lucide-react';

interface CustomerItem {
    id: string;
    fullName: string;
    phone: string;
    packageName: string;
    expiryDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
    assignedLocker?: string;
}

export function CustomerListV2() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

    const [customers] = useState<CustomerItem[]>([
        { id: '1', fullName: 'Nguyễn Văn A', phone: '0987654321', packageName: 'Gói Gym Gold 6 tháng', expiryDate: '2026-12-31', status: 'ACTIVE', assignedLocker: 'LK-101' },
        { id: '2', fullName: 'Trần Thị B', phone: '0912345678', packageName: 'Gói Yoga Platinum 1 năm', expiryDate: '2026-08-08', status: 'EXPIRING_SOON', assignedLocker: 'LK-201' },
        { id: '3', fullName: 'Lê Văn C', phone: '0909090909', packageName: 'Gói PT 1-1', expiryDate: '2026-05-15', status: 'EXPIRED' },
    ]);

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm);
        const matchesStatus = selectedStatus === 'ALL' || customer.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Quản lý Khách hàng V2</h1>
                        <p className="text-slate-500 text-sm mt-1">Danh sách hội viên và thông tin gói đăng ký, tủ đồ đính kèm</p>
                    </div>
                </div>

                {/* Thanh tìm kiếm & lọc */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm tên hoặc số điện thoại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        {[
                            { key: 'ALL', label: 'Tất cả' },
                            { key: 'ACTIVE', label: 'Đang hoạt động' },
                            { key: 'EXPIRING_SOON', label: 'Sắp hết hạn' },
                            { key: 'EXPIRED', label: 'Đã hết hạn' }
                        ].map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setSelectedStatus(item.key)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedStatus === item.key
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bảng danh sách hội viên */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-bold uppercase">
                            <tr>
                                <th className="p-4">Hội Viên</th>
                                <th className="p-4">Số Điện Thoại</th>
                                <th className="p-4">Gói Tập</th>
                                <th className="p-4">Tủ Đồ</th>
                                <th className="p-4">Hạn Sử Dụng</th>
                                <th className="p-4">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                            {customer.fullName.charAt(0)}
                                        </div>
                                        {customer.fullName}
                                    </td>
                                    <td className="p-4">{customer.phone}</td>
                                    <td className="p-4 font-medium">{customer.packageName}</td>
                                    <td className="p-4 font-mono font-semibold text-slate-700">
                                        {customer.assignedLocker ? (
                                            <span className="px-2 py-1 bg-slate-100 rounded-md border text-xs">
                                                {customer.assignedLocker}
                                            </span>
                                        ) : <span className="text-slate-400 text-xs">Chưa gán</span>}
                                    </td>
                                    <td className="p-4 text-xs text-slate-500">{customer.expiryDate}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                customer.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {customer.status === 'ACTIVE' ? 'Đang hoạt động' :
                                                customer.status === 'EXPIRING_SOON' ? 'Sắp hết hạn' : 'Hết hạn'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}