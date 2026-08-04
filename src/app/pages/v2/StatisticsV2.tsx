import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";

export const StatisticsV2 = () => {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Biểu đồ tăng trưởng
            </h2>
            <p className="text-sm text-slate-500">
              Thống kê lượng khách hàng mới và booking
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">
            Tháng này
          </button>
          <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="h-80 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 font-medium mb-2">
            Khu vực render biểu đồ Chart.js
          </p>
        </div>
      </div>
    </div>
  );
};
