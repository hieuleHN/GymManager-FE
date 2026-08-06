import React from 'react';
import { History, X, Clock, ShieldCheck } from 'lucide-react';

interface HistoryItem {
    id: string;
    action: string;
    date: string;
    details: string;
}

interface CustomerHistoryModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    customerName?: string;
}

export function CustomerHistoryModalV2({ isOpen, onClose, customerName = "Hội viên" }: CustomerHistoryModalV2Props) {
    if (!isOpen) return null;

    const historyLog: HistoryItem[] = [
        { id: '1', action: 'Gia hạn thẻ 6 tháng', date: '01/08/2026 09:30', details: 'Gói VIP - Thanh toán CK' },
        { id: '2', action: 'Mở tủ đồ LK-102', date: '30/07/2026 17:15', details: 'Check-in thành công' },
        { id: '3', action: 'Đổi tủ đồ LK-101 -> LK-102', date: '15/07/2026 10:00', details: 'Yêu cầu đổi khu vực VIP' },
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <History className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Lịch Sử Hoạt Động</h3>
                        <p className="text-xs text-slate-500">{customerName}</p>
                    </div>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {historyLog.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-800">{log.action}</p>
                                <p className="text-[11px] text-slate-500">{log.details}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {log.date}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}