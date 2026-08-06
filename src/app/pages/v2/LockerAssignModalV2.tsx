import React, { useState } from 'react';
import { KeyRound, X, CheckCircle } from 'lucide-react';

interface LockerAssignModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    customerName?: string;
}

export function LockerAssignModalV2({ isOpen, onClose, customerName = "Hội viên" }: LockerAssignModalV2Props) {
    const [selectedLocker, setSelectedLocker] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <KeyRound className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-lg">Gán Tủ Đồ Cho Hội Viên</h3>
                        <p className="text-xs text-slate-500">{customerName}</p>
                    </div>
                </div>

                {isSuccess ? (
                    <div className="py-6 text-center text-emerald-600 font-semibold flex flex-col items-center gap-2">
                        <CheckCircle className="w-10 h-10" />
                        <span>Đã gán tủ đồ {selectedLocker} thành công!</span>
                    </div>
                ) : (
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Nhập Mã Tủ Đồ Trống</label>
                            <input
                                type="text"
                                required
                                placeholder="Ví dụ: LK-205"
                                value={selectedLocker}
                                onChange={(e) => setSelectedLocker(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm"
                            >
                                Xác Nhận Gán
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}