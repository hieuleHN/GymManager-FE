import React, { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export function ExportCustomerReportV2() {
    const [isExporting, setIsExporting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => {
            setIsExporting(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 2500);
        }, 1200);
    };

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">Xuất Báo Cáo Hội Viên & Tủ Đồ (V2)</h4>
                    <p className="text-xs text-slate-400">Tải dữ liệu danh sách hội viên kèm tủ đồ đính kèm dưới dạng file Excel/CSV</p>
                </div>
            </div>

            <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
                {isExporting ? (
                    <span>Đang xuất file...</span>
                ) : isSuccess ? (
                    <>
                        <CheckCircle2 className="w-4 h-4" /> Đã Tải Xuống
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" /> Tải Báo Cáo
                    </>
                )}
            </button>
        </div>
    );
}