import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FileText, ShieldCheck, ChevronRight, Loader2, ScrollText } from 'lucide-react';
import { getApiUrl } from '../context/AuthContext';

interface Policy {
  _id: string;
  menuTitle: string;
  title: string;
  description: string;
}

export function Policies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const groupParam = searchParams.get('group') || '';

  useEffect(() => {
    fetch(`${getApiUrl()}/api/policies/public`)
      .then(res => res.json())
      .then(data => setPolicies(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Gom các chính sách theo tiêu đề menu
  const groups = useMemo(() => {
    const map = new Map<string, Policy[]>();
    policies.forEach(p => {
      const key = p.menuTitle?.trim() || 'Khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [policies]);

  // Chọn nhóm: ưu tiên theo ?group= trên URL, nếu không có thì chọn nhóm đầu tiên
  const selectedGroup = useMemo(() => {
    if (groups.length === 0) return null;
    const found = groups.find(g => g.name.toLowerCase() === groupParam.trim().toLowerCase());
    return found || groups[0];
  }, [groups, groupParam]);

  const selectGroup = (name: string) => {
    setSearchParams({ group: name });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải chính sách...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[70vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">Chính sách & Quy định</h1>
          </div>
          <p className="text-indigo-100 max-w-2xl">
            Tất cả các chính sách, điều khoản và quy định áp dụng tại ZenFitness. Vui lòng chọn mục bên dưới để xem nội dung chi tiết.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Chưa có chính sách nào</h2>
            <p className="text-slate-500">Các chính sách sẽ được cập nhật sớm. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
            {/* Sidebar - danh sách tiêu đề menu */}
            <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-24">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-slate-900 uppercase tracking-wide">Danh mục chính sách</span>
              </div>
              <nav className="p-3 space-y-1">
                {groups.map(group => {
                  const active = selectedGroup?.name === group.name;
                  return (
                    <button key={group.name} onClick={() => selectGroup(group.name)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}>
                      <span className="flex items-center gap-3">
                        <FileText className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-indigo-500'}`} />
                        {group.name}
                      </span>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${active ? 'rotate-90' : ''}`} />
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Nội dung chính sách */}
            <section className="space-y-6">
              {selectedGroup!.items.map((policy, idx) => (
                <article key={policy._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 font-bold text-indigo-600">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">{selectedGroup!.name}</p>
                      <h2 className="text-2xl font-bold text-slate-900">{policy.title}</h2>
                    </div>
                  </div>
                  <div className="pl-14">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{policy.description}</p>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
