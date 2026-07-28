import { AdminLayout } from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank,
  Package as PackageIcon, ShoppingBag, Wrench, AlertTriangle,
  BarChart3, Activity, Loader2, Download
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Line
} from 'recharts';
import { api } from '../../../lib/api';
import { useClub } from '../../context/ClubContext';
import { exportToExcel } from '../../../lib/exportExcel';

const PERIODS = [
  { key: 'month', label: 'Th├íng n├áy' },
  { key: 'quarter', label: 'Qu├╜ n├áy' },
  { key: 'year', label: 'N─âm nay' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#14b8a6'];

const fmt = (v: number) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${v}`;
const fmtVnd = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + 'Γé½';
const fmtChange = (v: number) => `${v > 0 ? '+' : ''}${v}%`;
const pct = (val: number, total: number) => `${Math.round((val / (total || 1)) * 100)}%`;
const prevVal = (cur: number, change: number) => cur - (cur * (change ?? 0)) / 100;
const changeStr = (v: number) => `${v > 0 ? '+' : ''}${v ?? 0}%`;

const emptyFinance = {
  summary: { realCashIn: 0, accrualRevenue: 0, totalExpense: 0, totalProfit: 0, profitMargin: 0, change: { realCashIn: 0, accrualRevenue: 0, totalExpense: 0, totalProfit: 0 } },
  cashFlowData: [], profitData: [], expenseStructure: [], participation: [], topProducts: [],
};

export function Statistics() {
  const [tab, setTab] = useState<'finance' | 'operations'>('finance');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [finance, setFinance] = useState<any>(null);
  const [operations, setOperations] = useState<any>(null);
  const { selectedClub } = useClub();
  const locParam = selectedClub && selectedClub !== 'all' ? `&locationId=${selectedClub}` : '';

  useEffect(() => {
    setLoading(true);
    const url = tab === 'finance'
      ? `/api/statistics/finance?period=${period}${locParam}`
      : `/api/statistics/operations?period=${period}${locParam}`;
    api.get(url).then(data => tab === 'finance' ? setFinance(data) : setOperations(data))
      .catch(() => tab === 'finance' ? setFinance(emptyFinance) : setOperations(null))
      .finally(() => setLoading(false));
  }, [tab, period, selectedClub]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">B├ío c├ío & Thß╗æng k├¬</h1>
            <p className="text-slate-600">Ph├ón t├¡ch t├ái ch├¡nh v├á vß║¡n h├ánh ph├▓ng tß║¡p</p>
          </div>
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {(['finance', 'operations'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                {t === 'finance' ? <BarChart3 className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                {t === 'finance' ? 'T├ái ch├¡nh' : 'Vß║¡n h├ánh'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />}
        </div>

        {tab === 'finance' ? <FinanceTab data={finance || emptyFinance} /> : <OperationsTab data={operations} />}
      </div>
    </AdminLayout>
  );
}

function StatCard({ stat }: { stat: any }) {
  const Icon = stat.icon;
  const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`${stat.color} p-2.5 rounded-xl`}><Icon className="w-5 h-5 text-white" /></div>
        <div className={`flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{stat.change}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
      <p className="text-xl font-bold text-slate-900">{stat.value}</p>
    </div>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
        <Download className="w-4 h-4" /> Xuß║Ñt Excel
      </button>
    </div>
  );
}

function FinanceTab({ data }: { data: any }) {
  if (!data?.summary) return <div className="text-slate-400 text-sm">─Éang tß║úi dß╗» liß╗çu t├ái ch├¡nh...</div>;
  const s = data.summary;
  const c = s.change || {};

  const stats = [
    { label: 'Doanh thu thß╗▒c thu', value: fmtVnd(s.realCashIn), change: fmtChange(c.realCashIn ?? 0), trend: (c.realCashIn ?? 0) >= 0 ? 'up' : 'down', icon: Wallet, color: 'bg-emerald-500' },
    { label: 'Doanh thu ghi nhß║¡n', value: fmtVnd(s.accrualRevenue), change: fmtChange(c.accrualRevenue ?? 0), trend: (c.accrualRevenue ?? 0) >= 0 ? 'up' : 'down', icon: DollarSign, color: 'bg-indigo-500' },
    { label: 'Tß╗òng chi ph├¡', value: fmtVnd(s.totalExpense), change: fmtChange(c.totalExpense ?? 0), trend: (c.totalExpense ?? 0) >= 0 ? 'down' : 'up', icon: Activity, color: 'bg-orange-500' },
    { label: 'Lß╗úi nhuß║¡n', value: fmtVnd(s.totalProfit), change: fmtChange(c.totalProfit ?? 0), trend: (c.totalProfit ?? 0) >= 0 ? 'up' : 'down', icon: PiggyBank, color: 'bg-green-500' },
  ];

  const summaryRows = [
    { key: 'realCashIn', label: 'Doanh thu thß╗▒c thu' },
    { key: 'accrualRevenue', label: 'Doanh thu ghi nhß║¡n' },
    { key: 'totalExpense', label: 'Tß╗òng chi ph├¡' },
    { key: 'totalProfit', label: 'Lß╗úi nhuß║¡n' },
  ];

  const handleExport = () => {
    exportToExcel([
      { name: 'Tong quan', headers: ['Chß╗ë sß╗æ', 'Gi├í trß╗ï', 'Thay ─æß╗òi (%)'], data: [...summaryRows.map(r => ({ 'Chß╗ë sß╗æ': r.label, 'Gi├í trß╗ï': s[r.key], 'Thay ─æß╗òi (%)': changeStr(c[r.key]) })), { 'Chß╗ë sß╗æ': 'Bi├¬n lß╗úi nhuß║¡n', 'Gi├í trß╗ï': `${s.profitMargin}%`, 'Thay ─æß╗òi (%)': '' }] },
      { name: 'So sanh ky truoc', headers: ['Chß╗ë sß╗æ', 'Kß╗│ n├áy', 'Kß╗│ tr╞░ß╗¢c', 'Thay ─æß╗òi'], data: summaryRows.map(r => ({ 'Chß╗ë sß╗æ': r.label, 'Kß╗│ n├áy': s[r.key], 'Kß╗│ tr╞░ß╗¢c': prevVal(s[r.key], c[r.key]), 'Thay ─æß╗òi': changeStr(c[r.key]) })) },
      { name: 'Chi tiet theo thang', headers: ['Th├íng', 'DT thß╗▒c thu', 'DT ghi nhß║¡n', 'Chi ph├¡', 'Lß╗úi nhuß║¡n', 'Bi├¬n LN (%)'], data: data.cashFlowData.map((i: any) => ({ 'Th├íng': i.month, 'DT thß╗▒c thu': i.cash, 'DT ghi nhß║¡n': i.revenue, 'Chi ph├¡': i.expense, 'Lß╗úi nhuß║¡n': i.profit, 'Bi├¬n LN (%)': `${i.revenue > 0 ? Math.round((i.profit / i.revenue) * 100) : 0}%` })) },
      { name: 'Chi phi theo loai', headers: ['Loß║íi chi ph├¡', 'Sß╗æ tiß╗ün', 'Tß╗╖ trß╗ìng (%)'], data: data.expenseStructure.map((i: any) => ({ 'Loß║íi chi ph├¡': i.name, 'Sß╗æ tiß╗ün': i.value, 'Tß╗╖ trß╗ìng (%)': pct(i.value, data.expenseStructure.reduce((s: number, x: any) => s + x.value, 0)) })) },
      { name: 'Top san pham', headers: ['Sß║ún phß║⌐m', '─É╞ín gi├í', 'Gi├í vß╗æn', 'SL b├ín', 'Doanh thu', 'Lß╗úi nhuß║¡n', 'Tß╗╖ trß╗ìng (%)'], data: data.topProducts.map((i: any) => ({ 'Sß║ún phß║⌐m': i.name, '─É╞ín gi├í': i.price, 'Gi├í vß╗æn': i.costPrice, 'SL b├ín': i.quantity, 'Doanh thu': i.revenue, 'Lß╗úi nhuß║¡n': i.profit, 'Tß╗╖ trß╗ìng (%)': pct(i.revenue, data.topProducts.reduce((s: number, x: any) => s + x.revenue, 0)) })) },
      { name: 'Dong tien chi tiet', headers: ['Th├íng', 'Tiß╗ün thß╗▒c thu', 'Tiß╗ün ghi nhß║¡n', 'Chi ph├¡', 'Lß╗úi nhuß║¡n', '% DT thß╗▒c thu'], data: (() => { const tc = data.cashFlowData.reduce((s: number, i: any) => s + i.cash, 0); return data.cashFlowData.map((i: any) => ({ 'Th├íng': i.month, 'Tiß╗ün thß╗▒c thu': i.cash, 'Tiß╗ün ghi nhß║¡n': i.revenue, 'Chi ph├¡': i.expense, 'Lß╗úi nhuß║¡n': i.profit, '% DT thß╗▒c thu': pct(i.cash, tc) })); })() },
    ], `BaoCaoTaiChinh_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat, i) => <StatCard key={i} stat={stat} />)}</div>
      <ExportBtn onClick={handleExport} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Tß╗òng quan t├ái ch├¡nh theo th├íng</h2>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">VN─É</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">D├▓ng tiß╗ün thß╗▒c thu, doanh thu ghi nhß║¡n, chi ph├¡ v├á lß╗úi nhuß║¡n theo tß╗½ng th├íng</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.cashFlowData}>
            <defs>
              {[
                { id: 'gCash', color: '#10b981' }, { id: 'gRev', color: '#6366f1' },
                { id: 'gExp', color: '#f59e0b' }, { id: 'gProfit', color: '#8b5cf6' },
              ].map(g => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => fmtVnd(v)} />
            <Legend />
            <Area type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2.5} fill="url(#gCash)" name="Doanh thu thß╗▒c thu" />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#gRev)" name="Doanh thu ghi nhß║¡n" />
            <Area type="monotone" dataKey="expense" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gExp)" name="Tß╗òng chi ph├¡" />
            <Area type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gProfit)" name="Lß╗úi nhuß║¡n" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-slate-900">Chi ph├¡ & Lß╗úi nhuß║¡n theo th├íng</h2>
            <span className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded-full font-medium">Bi├¬n l├úi {s.profitMargin}%</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Theo d├╡i ph├▓ng gym c├│ vß║¡n h├ánh hiß╗çu quß║ú kh├┤ng</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data.profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
              <Legend />
              <Bar dataKey="revenue" fill="#6366f1" name="Doanh thu" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#f59e0b" name="Chi ph├¡" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name="Lß╗úi nhuß║¡n" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">C╞í cß║Ñu chi ph├¡</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data.expenseStructure} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {data.expenseStructure.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {data.expenseStructure.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-slate-600">{item.name}</span></div>
                <span className="font-medium text-slate-800">{fmtVnd(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Doanh sß╗æ theo g├│i & Tß╗ë lß╗ç tham gia</h2>
          <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-medium">Sß╗æ l╞░ß╗úng & L╞░ß╗út/ HV</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">G├│i n├áo mang lß║íi nhiß╗üu tiß╗ün nhß║Ñt v├á mß╗⌐c ─æß╗Ö ch─âm chß╗ë cß╗ºa hß╗Öi vi├¬n</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.participation} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="package" tick={{ fontSize: 12 }} width={80} />
            <Tooltip formatter={(v: number, n) => n === 'revenue' ? fmtVnd(v) : [v, '']} />
            <Legend />
            <Bar dataKey="sales" fill="#6366f1" name="Sß╗æ g├│i b├ín" radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="revenue" fill="#8b5cf6" name="Doanh thu" radius={[0, 4, 4, 0]} barSize={14} />
            <Line type="monotone" dataKey="participation" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="L╞░ß╗út tham gia / HV" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Top sß║ún phß║⌐m b├ín chß║íy</h2>
          <span className="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> H├áng phß╗Ñ trß╗ú</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => fmtVnd(v)} />
              <Bar dataKey="revenue" name="Doanh thu" radius={[0, 4, 4, 0]}>
                {data.topProducts.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Sß║ún phß║⌐m', 'SL', 'Doanh thu', 'Lß╗úi nhuß║¡n', 'Tß╗╖ trß╗ìng'].map(h => (
                    <th key={h} className={`py-3 px-2 text-slate-500 font-medium ${h === 'Tß╗╖ trß╗ìng' ? 'text-left' : h === 'Sß║ún phß║⌐m' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((item: any, i: number) => {
                  const p = pct(item.revenue, data.topProducts.reduce((s: number, d: any) => s + d.revenue, 0));
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2.5 px-2 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(item.revenue)}</td>
                      <td className="py-2.5 px-2 text-right text-slate-700">{fmtVnd(item.profit)}</td>
                      <td className="py-2.5 px-2"><div className="flex items-center gap-2"><div className="flex-1 bg-slate-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full" style={{ width: p }} /></div><span className="text-slate-600 text-xs w-8">{p}</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function OperationsTab({ data }: { data: any }) {
  if (!data) return <div className="text-slate-400 text-sm">─Éang tß║úi dß╗» liß╗çu vß║¡n h├ánh...</div>;

  const stats = [
    { label: 'Tß╗òng sß╗æ thiß║┐t bß╗ï', value: `${data.totalQuantity}`, icon: PackageIcon, color: 'bg-blue-500' },
    { label: 'Gi├í trß╗ï thiß║┐t bß╗ï', value: fmtVnd(data.totalValue), icon: DollarSign, color: 'bg-emerald-500' },
    { label: 'Tß╗òng b├ío c├ío', value: `${data.totalReports}`, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Chß╗¥ xß╗¡ l├╜', value: `${data.pendingReports}`, trend: 'up', icon: Wrench, color: 'bg-red-500' },
  ];

  const withPct = (arr: any[]) => arr.map(i => ({ ...i, pct: pct(i.value, arr.reduce((s, x) => s + x.value, 0)) }));

  const handleExport = () => {
    exportToExcel([
      { name: 'Tong quan van hanh', headers: ['Chß╗ë sß╗æ', 'Gi├í trß╗ï'], data: stats.map(s => ({ 'Chß╗ë sß╗æ': s.label, 'Gi├í trß╗ï': s.value.replace('Γé½', '').trim() })) },
      { name: 'Tinh trang thiet bi', headers: ['Trß║íng th├íi', 'Sß╗æ l╞░ß╗úng', 'Tß╗╖ trß╗ìng (%)'], data: withPct(data.equipmentStatus).map((i: any) => ({ 'Trß║íng th├íi': i.name, 'Sß╗æ l╞░ß╗úng': i.value, 'Tß╗╖ trß╗ìng (%)': i.pct })) },
      { name: 'Phan loai su co', headers: ['Loß║íi sß╗▒ cß╗æ', 'Sß╗æ b├ío c├ío', 'Tß╗╖ trß╗ìng (%)'], data: withPct(data.equipmentReports).map((i: any) => ({ 'Loß║íi sß╗▒ cß╗æ': i.name, 'Sß╗æ b├ío c├ío': i.value, 'Tß╗╖ trß╗ìng (%)': i.pct })) },
      { name: 'Chi tiet bao cao', headers: ['Thiß║┐t bß╗ï', 'Loß║íi sß╗▒ cß╗æ', 'Sß╗æ m├íy', 'L├╜ do', 'Thß╗¥i gian', 'Trß║íng th├íi'], data: (data.reportDetails || []).map((r: any) => ({ 'Thiß║┐t bß╗ï': r.equipmentName, 'Loß║íi sß╗▒ cß╗æ': r.statusType, 'Sß╗æ m├íy': r.affectedQuantity, 'L├╜ do': r.reason, 'Thß╗¥i gian': r.reportedAt ? new Date(r.reportedAt).toLocaleDateString('vi-VN') : '', 'Trß║íng th├íi': r.status === 'pending' ? 'Chß╗¥ xß╗¡ l├╜' : 'Ho├án th├ánh' })) },
      { name: 'Thiet bi can bao tri', headers: ['Thiß║┐t bß╗ï', 'Tß╗òng sß╗æ', 'Bß╗ï ß║únh h╞░ß╗ƒng', 'Trß║íng th├íi', 'B├ío c├ío chß╗¥', 'Bß║úo h├ánh c├▓n (th├íng)'], data: data.needMaintenance.map((i: any) => ({ 'Thiß║┐t bß╗ï': i.name, 'Tß╗òng sß╗æ': i.quantity, 'Bß╗ï ß║únh h╞░ß╗ƒng': i.affectedQuantity ?? 'ΓÇö', 'Trß║íng th├íi': i.status === 'maintenance' ? '─Éang bß║úo tr├¼' : 'Hoß║ít ─æß╗Öng', 'B├ío c├ío chß╗¥ xß╗¡ l├╜': i.reports, 'Bß║úo h├ánh c├▓n (th├íng)': i.warrantyLeft ?? 'ΓÇö' })) },
    ], `BaoCaoVanHanh_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map((stat, i) => <StatCard key={i} stat={stat} />)}</div>
      <ExportBtn onClick={handleExport} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">T├¼nh trß║íng thiß║┐t bß╗ï</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.equipmentStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {data.equipmentStatus.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} m├íy`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.equipmentStatus.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-slate-600">{item.name}</span></div>
                <span className="font-semibold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Ph├ón loß║íi sß╗▒ cß╗æ thiß║┐t bß╗ï</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.equipmentReports}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} b├ío c├ío`, '']} />
              <Bar dataKey="value" name="Sß╗æ b├ío c├ío" radius={[6, 6, 0, 0]}>
                {data.equipmentReports.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {data.reportDetails && data.reportDetails.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
              {data.reportDetails.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-slate-800 truncate min-w-0 max-w-[120px]">{r.equipmentName}</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${
                    r.statusType === 'bß║úo tr├¼' ? 'bg-yellow-100 text-yellow-700' :
                    r.statusType === 'hoß║ít ─æß╗Öng' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>{r.statusType}</span>
                  <span className="text-slate-500 shrink-0">{r.affectedQuantity} m├íy</span>
                  <span className="text-slate-400 truncate min-w-0">{r.reason}</span>
                  {r.status === 'pending' && <span className="ml-auto shrink-0 px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">Chß╗¥ xß╗¡ l├╜</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Thiß║┐t bß╗ï cß║ºn l├¬n kß║┐ hoß║ích bß║úo tr├¼</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Thiß║┐t bß╗ï', 'Tß╗òng sß╗æ', 'Bß╗ï ß║únh h╞░ß╗ƒng', 'Trß║íng th├íi', 'B├ío c├ío chß╗¥', 'Bß║úo h├ánh (th)'].map(h => (
                  <th key={h} className={`py-3 px-4 text-slate-500 font-medium ${h === 'Thiß║┐t bß╗ï' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.needMaintenance.map((eq: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-800">{eq.name}</td>
                  <td className="py-3 px-4 text-right text-slate-700">{eq.quantity}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-amber-600">{eq.affectedQuantity ?? 'ΓÇö'}</span>
                    <span className="text-slate-400"> / {eq.quantity}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${eq.status === 'maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {eq.status === 'maintenance' ? 'Bß║úo tr├¼' : 'Hoß║ít ─æß╗Öng'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">{eq.reports}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-medium ${eq.warrantyLeft !== null && eq.warrantyLeft <= 3 ? 'text-red-600' : 'text-slate-700'}`}>
                      {eq.warrantyLeft ?? 'ΓÇö'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
