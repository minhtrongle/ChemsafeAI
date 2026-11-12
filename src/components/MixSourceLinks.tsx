import React from 'react';
import { ExternalLink, BadgeCheck, HelpCircle } from 'lucide-react';
import type { Chemical, MixWarning } from '../types/chemical';
import { CAMEO_REACTIVITY_URL } from '../data/mixWarnings';

interface Props {
  warning: MixWarning;
  /** Gọn: chỉ hiện các nút liên kết (dùng trong danh sách dài) */
  compact?: boolean;
}

/** Nhãn xác nhận + liên kết CAMEO Chemicals / ICSC cho một cặp tương kỵ */
export const MixSourceLinks: React.FC<Props> = ({ warning, compact = false }) => {
  const sources = warning.sources || [];
  return (
    <div className={compact ? 'flex flex-wrap items-center gap-1.5 pt-1' : 'pt-2 border-t border-white/10 space-y-1.5'}>
      {!compact && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {warning.verified === false ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              <HelpCircle className="w-3 h-3" /> Chưa xác nhận bằng nguồn quốc tế
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              <BadgeCheck className="w-3 h-3" /> Đã đối chiếu nguồn quốc tế
            </span>
          )}
          {warning.evidence && <span className="text-slate-400 leading-snug">{warning.evidence}</span>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        {!compact && <span className="text-[10.5px] font-mono text-violet-300 font-semibold">Kiểm chứng:</span>}
        {compact && warning.verified === false && (
          <span className="text-[10px] font-mono text-amber-300">(chưa xác nhận)</span>
        )}
        {sources.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`px-2 py-0.5 rounded text-[10.5px] font-mono flex items-center gap-1 border transition-colors ${
              s.label.startsWith('CAMEO')
                ? 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border-violet-500/30'
                : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30'
            }`}
            title={s.url}
          >
            <span>{s.label}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
      </div>
    </div>
  );
};

/** Khi không có cảnh báo: gợi ý tự kiểm tra trên CAMEO Chemicals */
export const CameoSelfCheck: React.FC<{ chems: (Chemical | undefined)[] }> = ({ chems }) => (
  <div className="flex flex-wrap items-center gap-1.5 pt-1">
    <span className="text-[10.5px] font-mono text-slate-400">Tự kiểm tra trên CAMEO Chemicals:</span>
    {chems.filter(Boolean).map((c) => c!.cameoId ? (
      <a
        key={c!.key}
        href={`https://cameochemicals.noaa.gov/chemical/${c!.cameoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 flex items-center gap-1"
      >
        {c!.formula} <ExternalLink className="w-2.5 h-2.5" />
      </a>
    ) : null)}
    <a
      href={CAMEO_REACTIVITY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/30 flex items-center gap-1"
    >
      Công cụ dự đoán phản ứng (Predict Reactivity) <ExternalLink className="w-2.5 h-2.5" />
    </a>
  </div>
);
