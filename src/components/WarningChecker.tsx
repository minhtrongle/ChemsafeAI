import React, { useState, useMemo } from 'react';
import { Chemical, MixWarning } from '../types/chemical';
import { getMixKey, MIX_WARNINGS, checkIncompatibility } from '../data/mixWarnings';
import { getChemicalCategory, compactFormula } from '../data/chemicals';
import { MixSourceLinks, CameoSelfCheck } from './MixSourceLinks';
import { AlertTriangle, ShieldCheck, ArrowRight, Flame, Skull, Sparkles, RefreshCw } from 'lucide-react';

interface WarningCheckerProps {
  chemicals: Chemical[];
  onConsultAdvisor?: (query: string) => void;
  onNavigateToQR?: (chem: Chemical) => void;
}

export const WarningChecker: React.FC<WarningCheckerProps> = ({
  chemicals,
  onConsultAdvisor,
  onNavigateToQR
}) => {
  const [chem1Key, setChem1Key] = useState<string>('naclo');
  const [chem2Key, setChem2Key] = useState<string>('hcl');

  // Group chemicals by category
  const groupedChemicals = useMemo(() => {
    const categories: Record<string, Chemical[]> = {
      'Axit': [],
      'Bazơ / Kiềm': [],
      'Oxy hóa / Nitrate': [],
      'Dung môi / Hữu cơ': [],
      'Khí': [],
      'Muối vô cơ': [],
      'Kim loại / Đơn chất': [],
      'Khác': []
    };

    chemicals.forEach((chem) => {
      const cat = getChemicalCategory(chem);
      if (categories[cat]) {
        categories[cat].push(chem);
      } else {
        categories['Khác'].push(chem);
      }
    });

    return categories;
  }, [chemicals]);

  const chem1 = chemicals.find(c => c.key === chem1Key || compactFormula(c.formula) === compactFormula(chem1Key));
  const chem2 = chemicals.find(c => c.key === chem2Key || compactFormula(c.formula) === compactFormula(chem2Key));

  // Determine mix warning result
  const mixWarning: MixWarning | null = useMemo(() => {
    if (!chem1Key || !chem2Key || chem1Key === chem2Key) return null;
    return checkIncompatibility(chem1Key, chem2Key);
  }, [chem1Key, chem2Key]);

  const isIdentical = chem1Key && chem2Key && (chem1Key === chem2Key || compactFormula(chem1?.formula || '') === compactFormula(chem2?.formula || ''));

  const handleSwap = () => {
    const temp = chem1Key;
    setChem1Key(chem2Key);
    setChem2Key(temp);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            Kiểm tra tương kỵ & <span className="text-emerald-400">Cảnh báo trộn hóa chất</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu phản ứng nguy hiểm trước khi pha trộn hoặc xếp chung ngăn tủ trong phòng thí nghiệm
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Dữ liệu đối chiếu: {Object.keys(MIX_WARNINGS).length} cặp nguy cơ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Checker Box */}
        <div className="lg:col-span-8 lg:col-start-3 space-y-5">
          <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Tổ hợp 2 hóa chất phản ứng
              </span>
              <button
                onClick={handleSwap}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2 py-1 rounded bg-[#171d28] border border-[#262f3d] transition-colors"
                title="Đảo vị trí 2 hóa chất"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đảo vị trí</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
              {/* Select 1 */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-400 block">Hóa chất thứ nhất</label>
                <select
                  value={chem1Key}
                  onChange={(e) => setChem1Key(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                >
                  <option value="">— Chọn hóa chất —</option>
                  {Object.entries(groupedChemicals).map(([category, items]) => (
                    items.length > 0 && (
                      <optgroup key={category} label={category}>
                        {items.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.formula} — {c.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                </select>
                {chem1 && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-emerald-300">{chem1.formula}</span>
                    <span>·</span>
                    <span className="truncate">{chem1.name}</span>
                  </div>
                )}
              </div>

              {/* Plus icon */}
              <div className="md:col-span-1 flex justify-center text-slate-400 font-mono text-lg font-bold">
                +
              </div>

              {/* Select 2 */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-slate-400 block">Hóa chất thứ hai</label>
                <select
                  value={chem2Key}
                  onChange={(e) => setChem2Key(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors"
                >
                  <option value="">— Chọn hóa chất —</option>
                  {Object.entries(groupedChemicals).map(([category, items]) => (
                    items.length > 0 && (
                      <optgroup key={category} label={category}>
                        {items.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.formula} — {c.name}
                          </option>
                        ))}
                      </optgroup>
                    )
                  ))}
                </select>
                {chem2 && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                    <span className="font-mono text-emerald-300">{chem2.formula}</span>
                    <span>·</span>
                    <span className="truncate">{chem2.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Result display area */}
            <div className="mt-5 pt-5 border-t border-[#1f2633]">
              {!chem1Key || !chem2Key ? (
                <div className="p-4 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-center text-xs text-slate-400">
                  Vui lòng chọn 2 hóa chất để hệ thống chạy thuật toán đối chiếu ma trận tương kỵ.
                </div>
              ) : isIdentical ? (
                <div className="p-4 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>— Cùng một chất</span>
                  </div>
                  <p className="text-slate-400">
                    Không có phản ứng hóa học tự phát sinh nhiệt độc hại khi hòa trộn một chất với chính nó.
                  </p>
                </div>
              ) : mixWarning ? (
                <div className={`p-4 rounded-lg border ${
                  mixWarning.level === 'danger'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-100'
                    : 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                } space-y-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {mixWarning.level === 'danger' ? (
                        <Skull className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : (
                        <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className={`font-mono text-xs uppercase font-bold tracking-wide ${
                          mixWarning.level === 'danger' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {mixWarning.level === 'danger' ? 'CẢNH BÁO NGUY HIỂM' : 'THẬN TRỌNG'}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-100 mt-0.5">
                          {mixWarning.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {mixWarning.reaction && (
                    <div className="p-2.5 rounded bg-black/40 border border-white/5 font-mono text-xs text-amber-300 overflow-x-auto">
                      {mixWarning.reaction}
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-slate-300">
                    {mixWarning.desc}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mixWarning.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-black/30 text-slate-300 border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <MixSourceLinks warning={mixWarning} />

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Quy tắc: Không thực hiện ngoài quy trình SOP và tủ hút chuyên dụng
                    </span>
                    {onConsultAdvisor && (
                      <button
                        onClick={() => onConsultAdvisor(`Phân tích chi tiết rủi ro và SOP ứng phó khi trộn ${chem1?.formula} với ${chem2?.formula}`)}
                        className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 flex items-center gap-1"
                      >
                        <span>Hỏi chi tiết sơ cứu</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-100 space-y-1.5">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Không có cảnh báo tương kỵ đặc biệt đã ghi nhận</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tổ hợp <strong>{chem1?.formula}</strong> và <strong>{chem2?.formula}</strong> không nằm trong danh mục phản ứng nguy hiểm tức thì trong cơ sở dữ liệu.
                    Tuy nhiên, luôn thao tác với lượng nhỏ trước, kiểm soát nhiệt và đối chiếu SDS của nhà sản xuất.
                  </p>
                  <CameoSelfCheck chems={[chem1, chem2]} />
                </div>
              )}
            </div>
          </div>

          {/* Individual chemical snapshots */}
          {(chem1 || chem2) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chem1 && (
                <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-100">{chem1.formula}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{chem1.dangerLabel}</span>
                  </div>
                  <div className="text-slate-300 font-medium">{chem1.name}</div>
                  <div className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                    {chem1.msds || chem1.properties}
                  </div>
                  <div className="pt-2 border-t border-[#1f2633] flex justify-between items-center text-[11px]">
                    <span className="font-mono text-slate-400">{chem1.molar}</span>
                    {onNavigateToQR && (
                      <button
                        onClick={() => onNavigateToQR(chem1)}
                        className="text-emerald-400 hover:underline"
                      >
                        In nhãn dán
                      </button>
                    )}
                  </div>
                </div>
              )}

              {chem2 && (
                <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-slate-100">{chem2.formula}</span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{chem2.dangerLabel}</span>
                  </div>
                  <div className="text-slate-300 font-medium">{chem2.name}</div>
                  <div className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                    {chem2.msds || chem2.properties}
                  </div>
                  <div className="pt-2 border-t border-[#1f2633] flex justify-between items-center text-[11px]">
                    <span className="font-mono text-slate-400">{chem2.molar}</span>
                    {onNavigateToQR && (
                      <button
                        onClick={() => onNavigateToQR(chem2)}
                        className="text-emerald-400 hover:underline"
                      >
                        In nhãn dán
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
