import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  activeBookings: number;
  revenueGrowth: number;
}

export const DashboardV2: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalRevenue: 125000000,
        totalCustomers: 1420,
        activeBookings: 320,
        revenueGrowth: 15.5,
      });
      setIsLoading(false);
    }, 1500);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-green-500 bg-green-50 px-2 py-1 rounded-md">
              +{stats?.revenueGrowth}%
            </span>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">
            Tổng doanh thu
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.totalRevenue.toLocaleString("vi-VN")} ₫
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-slate-500 text-sm font-medium mb-1">
            Hội viên đang hoạt động
          </h3>
          <p className="text-2xl font-bold text-slate-900">
            {stats?.totalCustomers}
          </p>
        </div>
      </div>
    </div>
  );
};
