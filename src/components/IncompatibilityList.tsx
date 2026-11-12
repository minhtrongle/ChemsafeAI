import React, { useMemo, useState } from 'react';
import { ExternalLink, ListChecks, Search, BadgeCheck } from 'lucide-react';
import { ALL_CAMEO_PAIRS } from '../data/cameoPairs';
import type { CameoConclusion } from '../data/cameoPairs';
import { checkIncompatibility, CAMEO_REACTIVITY_URL } from '../data/mixWarnings';

type Filter = CameoConclusion | 'Tất cả';

const PAGE = 50;

const BADGE: Record<CameoConclusion, string> = {
  'Tương kỵ': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'Thận trọng': 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  'Tương thích': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
};

/** Bỏ dấu tiếng Việt, đưa chỉ số dưới (H₂SO₄) về chữ thường để tìm kiếm */
const fold = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

/** Danh sách mọi cặp hóa chất theo CAMEO Chemicals, mỗi cặp có liên kết tới trang CAMEO của cặp đó */
export const IncompatibilityList: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('Tương kỵ');
  const [query, setQuery] = useState('');
  const [onlyChecked, setOnlyChecked] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const rows = useMemo(
    () =>
      ALL_CAMEO_PAIRS.map((p) => ({
        pair: p,
        rule: checkIncompatibility(p.chemicalA, p.chemicalB),
        haystack: fold(`${p.chemicalA} ${p.chemicalB} ${p.nameA} ${p.nameB}`),
      })),
    []
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { 'Tất cả': rows.length, 'Tương kỵ': 0, 'Thận trọng': 0, 'Tương thích': 0 };
    rows.forEach((r) => { c[r.pair.conclusion] += 1; });
    return c;
  }, [rows]);

  const checkedCount = useMemo(() => rows.filter((r) => r.rule).length, [rows]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return rows.filter(
      (r) =>
        (filter === 'Tất cả' || r.pair.conclusion === filter) &&
        (!onlyChecked || r.rule) &&
        (!q || r.haystack.includes(q))
    );
  }, [rows, filter, query, onlyChecked]);

  const shown = filtered.slice(0, visible);
  const reset = () => setVisible(PAGE);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <ListChecks className="w-6 h-6 text-amber-400" />
            Danh sách <span className="text-emerald-400">cặp hóa chất tương kỵ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Dữ liệu từ CAMEO Chemicals (NOAA), công cụ Reactivity. CAMEO dự đoán theo cặp nhóm phản ứng và nghiêng về trường hợp xấu nhất,
            nên hãy mở liên kết của từng cặp để xem chi tiết trước khi kết luận.
          </p>
        </div>
        <a
          href={CAMEO_REACTIVITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 rounded text-[11px] font-mono bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 flex items-center gap-1 shrink-0"
        >
          Công cụ Predict Reactivity <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); reset(); }}
            placeholder="Tìm theo công thức hoặc tên (ví dụ: HCl, axit nitric, cồn)…"
            className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['Tương kỵ', 'Thận trọng', 'Tương thích', 'Tất cả'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); reset(); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap border transition-all ${
                filter === f
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151a24] border-[#262f3d]'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer pl-2">
            <input
              type="checkbox"
              checked={onlyChecked}
              onChange={(e) => { setOnlyChecked(e.target.checked); reset(); }}
              className="accent-emerald-400"
            />
            Chỉ cặp đã đối chiếu ({checkedCount})
          </label>
        </div>
      </div>

      <div className="text-[11px] font-mono text-slate-400">
        Hiển thị {shown.length} / {filtered.length} cặp
      </div>

      <div className="space-y-2">
        {shown.map(({ pair, rule }) => (
          <div
            key={`${pair.chemicalA}|${pair.chemicalB}`}
            className="bg-[#12161f] border border-[#1f2633] rounded-lg p-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-100">
                  {pair.chemicalA} + {pair.chemicalB}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase ${BADGE[pair.conclusion]}`}>
                  {pair.conclusion}
                </span>
                {rule && (
                  <span
                    title={rule.title}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                  >
                    <BadgeCheck className="w-3 h-3" /> Có trong bộ luật đã đối chiếu
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-300">{pair.nameA} + {pair.nameB}</div>
              {pair.hazardsVi.length > 0 && (
                <div className="text-[11px] text-slate-400 leading-snug">
                  <span className="text-slate-500">Nguy cơ: </span>{pair.hazardsVi.join('; ')}
                </div>
              )}
              {pair.possibleGasesVi.length > 0 && (
                <div className="text-[11px] text-slate-400 leading-snug">
                  <span className="text-slate-500">Khí có thể sinh ra: </span>{pair.possibleGasesVi.join('; ')}
                </div>
              )}
            </div>
            <a
              href={pair.url}
              target="_blank"
              rel="noopener noreferrer"
              title={pair.url}
              className="px-2.5 py-1.5 rounded text-[11px] font-mono bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 flex items-center gap-1 shrink-0 self-start whitespace-nowrap"
            >
              Xem trên CAMEO <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-xs text-slate-400 py-10">Không có cặp nào khớp bộ lọc.</div>
        )}
      </div>

      {filtered.length > shown.length && (
        <div className="text-center pt-2">
          <button
            onClick={() => setVisible((v) => v + PAGE)}
            className="px-4 py-2 text-xs font-medium rounded-md border border-[#262f3d] text-slate-300 hover:bg-[#151a24] transition-all"
          >
            Hiện thêm {Math.min(PAGE, filtered.length - shown.length)} cặp
          </button>
        </div>
      )}
    </div>
  );
};
