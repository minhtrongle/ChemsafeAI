import React from 'react';
import { ExternalLink, Globe2 } from 'lucide-react';
import type { IntlLink } from '../types/chemical';
import { getIntlLinks } from '../data/emergencyProtocols';

interface Props {
  item: { id: string; intlLinks?: IntlLink[] };
  /** 'dark' cho giao diện ứng dụng, 'print' cho bản in nền trắng */
  variant?: 'dark' | 'print';
}

/** Danh sách tài liệu quốc tế (ICSC, CDC/ATSDR, OSHA, CAMEO...) cho một quy trình / kiến thức */
export const IntlLinks: React.FC<Props> = ({ item, variant = 'dark' }) => {
  const links = getIntlLinks(item);
  if (links.length === 0) return null;

  if (variant === 'print') {
    return (
      <div className="pt-1.5 border-t border-slate-200 text-[10px] font-mono text-emerald-900 space-y-0.5">
        <div className="font-bold">🌐 Tài liệu quốc tế:</div>
        {links.map((l, i) => (
          <div key={i}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline">
              [{l.org}] {l.label}
            </a>
            <span className="text-slate-500 break-all"> — {l.url}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs font-mono">
      <span className="text-[10.5px] text-emerald-400 font-semibold flex items-center gap-1">
        <Globe2 className="w-3 h-3" /> Tài liệu quốc tế:
      </span>
      {links.map((l, i) => (
        <a
          key={i}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10.5px] flex items-center gap-1 transition-colors"
          title={`${l.org}: ${l.label}`}
        >
          <span className="opacity-70">{l.org}:</span>
          <span>{l.label}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      ))}
    </div>
  );
};
