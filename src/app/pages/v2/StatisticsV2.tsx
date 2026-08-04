import React from "react";

export const StatisticsV2 = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Biểu đồ tăng trưởng</h2>
      <div className="h-64 bg-slate-100 rounded-lg border flex items-center justify-center">
        {/* Chỗ này mốt nhúng thư viện Chart.js hoặc Recharts vào */}
        <p className="text-gray-400">Khu vực render biểu đồ Chart.js</p>
      </div>
    </div>
  );
};
