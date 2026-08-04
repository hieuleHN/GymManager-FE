import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";

export const DashboardV2: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-500 font-medium">
          Đang tải dữ liệu hệ thống V2...
        </span>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Bảng điều khiển (V2)
          </h1>
          <p className="text-slate-500 mt-1">
            Tổng quan tình hình hoạt động của phòng tập
          </p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Xuất báo cáo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"></div>
    </div>
  );
};
