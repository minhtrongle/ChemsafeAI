import React, { useState, useMemo, useEffect } from 'react';
import { EmergencyProtocol, SafetyKnowledge } from '../types/chemical';
import { IntlLinks } from './IntlLinks';
import {
  X,
  Printer,
  FileText,
  ShieldAlert,
  PhoneCall,
  CheckSquare,
  Square,
  HeartPulse,
  Download,
  Filter,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings2
} from 'lucide-react';

interface SafetyHandbookPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocols: EmergencyProtocol[];
  knowledgeList: SafetyKnowledge[];
  initialSelectedProtocolId?: string | null;
  initialSelectedKnowledgeId?: string | null;
}

export const SafetyHandbookPrintModal: React.FC<SafetyHandbookPrintModalProps> = ({
  isOpen,
  onClose,
  protocols,
  knowledgeList,
  initialSelectedProtocolId,
  initialSelectedKnowledgeId
}) => {
  const [labName, setLabName] = useState<string>('Phòng Thí Nghiệm Hóa Học ChemSafe');
  const [includeHotlines, setIncludeHotlines] = useState<boolean>(true);
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [includePubChemLCSS, setIncludePubChemLCSS] = useState<boolean>(true);

  // Selection state
  const [selectedProtocolIds, setSelectedProtocolIds] = useState<Set<string>>(() => {
    if (initialSelectedProtocolId) {
      return new Set([initialSelectedProtocolId]);
    }
    if (initialSelectedKnowledgeId) {
      return new Set();
    }
    return new Set(protocols.map(p => p.id));
  });

  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<Set<string>>(() => {
    if (initialSelectedKnowledgeId) {
      return new Set([initialSelectedKnowledgeId]);
    }
    if (initialSelectedProtocolId) {
      return new Set();
    }
    return new Set(knowledgeList.map(k => k.id));
  });

  // Selector Drawer / Panel State
  const [showSelectorPanel, setShowSelectorPanel] = useState<boolean>(() => !initialSelectedProtocolId && !initialSelectedKnowledgeId);
  const [selectorTab, setSelectorTab] = useState<'protocols' | 'knowledge'>(() => initialSelectedKnowledgeId ? 'knowledge' : 'protocols');
  const [selectorSearch, setSelectorSearch] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'danger' | 'caution'>('all');

  // Reset when initialSelectedProtocolId / initialSelectedKnowledgeId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedProtocolId) {
        setSelectedProtocolIds(new Set([initialSelectedProtocolId]));
        setSelectedKnowledgeIds(new Set());
        setSelectorTab('protocols');
        setShowSelectorPanel(false);
      } else if (initialSelectedKnowledgeId) {
        setSelectedProtocolIds(new Set());
        setSelectedKnowledgeIds(new Set([initialSelectedKnowledgeId]));
        setSelectorTab('knowledge');
        setShowSelectorPanel(false);
      } else {
        setSelectedProtocolIds(new Set(protocols.map(p => p.id)));
        setSelectedKnowledgeIds(new Set(knowledgeList.map(k => k.id)));
        setSelectorTab('protocols');
        setShowSelectorPanel(false);
      }
    }
  }, [isOpen, initialSelectedProtocolId, initialSelectedKnowledgeId, protocols, knowledgeList]);

  if (!isOpen) return null;

  // Filtered protocols in preview
  const displayProtocols = protocols.filter(p => selectedProtocolIds.has(p.id));
  const displayKnowledge = knowledgeList.filter(k => selectedKnowledgeIds.has(k.id));

  // Protocols in selector list (with search and severity filter)
  const selectableProtocols = protocols.filter(p => {
    if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
    if (selectorSearch.trim()) {
      const q = selectorSearch.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchKeywords = (p.keywords || []).some(k => k.toLowerCase().includes(q));
      const matchRefs = (p.pubchemRefs || []).some(r => r.name.toLowerCase().includes(q) || String(r.cid).includes(q));
      return matchTitle || matchKeywords || matchRefs;
    }
    return true;
  });

  // Knowledge in selector list
  const selectableKnowledge = knowledgeList.filter(k => {
    if (selectorSearch.trim()) {
      const q = selectorSearch.toLowerCase();
      const matchTitle = k.title.toLowerCase().includes(q);
      const matchCategory = k.category.toLowerCase().includes(q);
      const matchKeywords = (k.keywords || []).some(w => w.toLowerCase().includes(q));
      return matchTitle || matchCategory || matchKeywords;
    }
    return true;
  });

  // Selection toggle handlers
  const toggleProtocol = (id: string) => {
    setSelectedProtocolIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleKnowledge = (id: string) => {
    setSelectedKnowledgeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllProtocols = () => {
    setSelectedProtocolIds(new Set(protocols.map(p => p.id)));
  };

  const handleDeselectAllProtocols = () => {
    setSelectedProtocolIds(new Set());
  };

  const handleSelectOnlyUrgent = () => {
    const urgentIds = protocols
      .filter(p => p.severity === 'critical' || p.severity === 'danger')
      .map(p => p.id);
    setSelectedProtocolIds(new Set(urgentIds));
  };

  const handleSelectAllKnowledge = () => {
    setSelectedKnowledgeIds(new Set(knowledgeList.map(k => k.id)));
  };

  const handleDeselectAllKnowledge = () => {
    setSelectedKnowledgeIds(new Set());
  };

  const handleTriggerPrint = () => {
    if (selectedProtocolIds.size === 0 && selectedKnowledgeIds.size === 0) {
      alert('Vui lòng chọn ít nhất 1 phác đồ hoặc cẩm nang để in!');
      return;
    }
    document.body.classList.add('printing-safety-handbook');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-safety-handbook');
    }, 1000);
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'CỰC KỲ NGUY CẤP (MỨC ĐỘ 1)';
      case 'danger':
        return 'NGUY HIỂM (MỨC ĐỘ 2)';
      case 'caution':
        return 'THẬN TRỌNG (MỨC ĐỘ 3)';
      default:
        return 'TIÊU CHUẨN';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#12161f] border border-[#2b3547] rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header Toolbar (Hidden during print) */}
        <div className="p-4 border-b border-[#1f2633] bg-[#0f131a] flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <span>Xuất PDF & In ấn phác đồ chọn lọc</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Đã chọn: {selectedProtocolIds.size} phác đồ • {selectedKnowledgeIds.size} cẩm nang
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Tùy chọn từng quy trình cần in ấn hoặc xuất toàn bộ sổ tay phác đồ SOP A4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSelectorPanel(!showSelectorPanel)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
                showSelectorPanel
                  ? 'bg-blue-600/25 border-blue-500/50 text-blue-300'
                  : 'bg-[#18202e] border-[#2b3547] text-slate-300 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{showSelectorPanel ? 'Thu gọn bộ chọn' : 'Tùy chọn mục in'}</span>
              {showSelectorPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleTriggerPrint}
              disabled={selectedProtocolIds.size === 0 && selectedKnowledgeIds.size === 0}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-rose-950/50"
            >
              <Printer className="w-4 h-4" />
              <span>In ấn / Lưu thành PDF ({selectedProtocolIds.size + selectedKnowledgeIds.size})</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#1a212e] rounded-lg transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SELECTIVE PICKER DRAWER / COLLAPSIBLE PANEL (Hidden during print) */}
        {showSelectorPanel && (
          <div className="p-4 bg-[#141a26] border-b border-[#222d3f] space-y-3 shrink-0 max-h-72 overflow-y-auto no-print">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#1f2633]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectorTab('protocols')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                    selectorTab === 'protocols'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Phác đồ sơ cứu ({selectedProtocolIds.size}/{protocols.length})
                </button>
                <button
                  onClick={() => setSelectorTab('knowledge')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                    selectorTab === 'knowledge'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cẩm nang an toàn ({selectedKnowledgeIds.size}/{knowledgeList.length})
                </button>
              </div>

              {/* Search filter in selector */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={selectorSearch}
                  onChange={(e) => setSelectorSearch(e.target.value)}
                  placeholder="Tìm kiếm mục cần in..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 outline-none font-mono"
                />
              </div>

              {/* Quick action buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                {selectorTab === 'protocols' ? (
                  <>
                    <button
                      onClick={handleSelectAllProtocols}
                      className="px-2 py-1 rounded bg-[#1c2436] hover:bg-[#253046] text-slate-300 border border-[#2e3b52]"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={handleSelectOnlyUrgent}
                      className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30"
                    >
                      Chỉ chọn khẩn cấp (Mức 1 & 2)
                    </button>
                    <button
                      onClick={handleDeselectAllProtocols}
                      className="px-2 py-1 rounded bg-[#1c2436] hover:bg-[#253046] text-slate-400 border border-[#2e3b52]"
                    >
                      Bỏ chọn hết
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSelectAllKnowledge}
                      className="px-2 py-1 rounded bg-[#1c2436] hover:bg-[#253046] text-slate-300 border border-[#2e3b52]"
                    >
                      Chọn tất cả cẩm nang
                    </button>
                    <button
                      onClick={handleDeselectAllKnowledge}
                      className="px-2 py-1 rounded bg-[#1c2436] hover:bg-[#253046] text-slate-400 border border-[#2e3b52]"
                    >
                      Bỏ chọn hết
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Selector Grid Cards */}
            {selectorTab === 'protocols' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectableProtocols.map(p => {
                  const isChecked = selectedProtocolIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProtocol(p.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-100 shadow-xs'
                          : 'bg-[#10151f] border-[#222c3d] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="mt-0.5 rounded text-rose-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate text-slate-200">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                          <span className={`px-1.5 py-0.2 rounded uppercase border ${
                            p.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : p.severity === 'danger'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}>
                            {p.severity === 'critical' ? 'Khẩn cấp 1' : p.severity === 'danger' ? 'Nguy hiểm 2' : 'Thận trọng'}
                          </span>
                          {p.pubchemRefs && p.pubchemRefs.length > 0 && (
                            <span className="text-sky-400">
                              🔬 {p.pubchemRefs.length} PubChem
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {selectableKnowledge.map(k => {
                  const isChecked = selectedKnowledgeIds.has(k.id);
                  return (
                    <div
                      key={k.id}
                      onClick={() => toggleKnowledge(k.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                        isChecked
                          ? 'bg-blue-950/20 border-blue-500/40 text-blue-100 shadow-xs'
                          : 'bg-[#10151f] border-[#222c3d] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate text-slate-200">
                          {k.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-slate-400">
                          <span className="bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                            {k.category}
                          </span>
                          {k.pubchemRefs && k.pubchemRefs.length > 0 && (
                            <span className="text-sky-400">
                              🔬 {k.pubchemRefs.length} PubChem
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Configuration Options Bar (Hidden during print) */}
        <div className="p-3 bg-[#161c28] border-b border-[#1f2633] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Đơn vị / Lab in ấn:</span>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              className="bg-[#0c0f14] border border-[#2a3445] rounded px-2.5 py-1 text-slate-200 text-xs outline-none w-64"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHotlines}
                onChange={(e) => setIncludeHotlines(e.target.checked)}
                className="rounded text-rose-500"
              />
              <span>Đường dây nóng 115/114</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer border-l border-[#2a3445] pl-3">
              <input
                type="checkbox"
                checked={includePubChemLCSS}
                onChange={(e) => setIncludePubChemLCSS(e.target.checked)}
                className="rounded text-sky-500"
              />
              <span>In kèm tham chiếu PubChem LCSS</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer border-l border-[#2a3445] pl-3">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="rounded text-rose-500"
              />
              <span>Khối ký duyệt</span>
            </label>
          </div>
        </div>

        {/* Printable Handbook Document Body (Preview & Print Target) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/60 flex justify-center">
          <div
            id="chemsafe-printable-handbook"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-2xl rounded-sm print:rounded-none print:shadow-none print:p-0 print:w-full space-y-6 text-sm leading-normal font-sans"
          >
            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-widest font-mono text-slate-500 font-bold">
                  TÀI LIỆU QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (LABORATORY SOP)
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                  SỔ TAY PHÁC ĐỒ SƠ CỨU & AN TOÀN PHÒNG THÍ NGHIỆM
                </h1>
                <div className="text-xs font-semibold text-slate-700">
                  {labName} • Hệ thống an toàn hóa chất ChemSafe AI
                </div>
              </div>

              <div className="text-right font-mono text-[11px] text-slate-600 shrink-0 border border-slate-300 p-2 rounded">
                <div>Mã văn bản: <strong>SOP-SAF-2026</strong></div>
                <div>Ngày in: <strong>{new Date().toLocaleDateString('vi-VN')}</strong></div>
                <div>Trạng thái: <strong className="text-emerald-700">HIỆU LỰC</strong></div>
              </div>
            </div>

            {/* Emergency Hotline Bar */}
            {includeHotlines && (
              <div className="p-3 bg-rose-50 border-2 border-rose-600 rounded flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <PhoneCall className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>ĐƯỜNG DÂY NÓNG CỨU HỘ & CẤP CỨU KHẨN CẤP:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono font-bold text-slate-900">
                  <span className="text-rose-700">🚨 CẤP CỨU: 115</span>
                  <span className="text-rose-700">🚒 CỨU HỎA: 114</span>
                  <span className="text-slate-900">☠️ TT CHỐNG ĐỘC: 024.3869.3731</span>
                </div>
              </div>
            )}

            {/* General Instructions */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
              <strong>NGUYÊN TẮC VÀNG TRONG SƠ CỨU PHÒNG THÍ NGHIỆM:</strong>
              <span className="ml-1">
                Bình tĩnh, ngắt ngay nguồn nguy hiểm, hô hoán người hỗ trợ. Khi hóa chất dính vào mắt hoặc da, rửa ngay lập tức dưới vòi nước chảy liên tục trong ít nhất 15-20 phút trước khi áp dụng các biện pháp tiếp theo. Luôn mang theo nhãn hoặc SDS của hóa chất khi chuyển nạn nhân tới cơ sở y tế.
              </span>
            </div>

            {/* SECTION 1: EMERGENCY PROTOCOLS */}
            {displayProtocols.length > 0 ? (
              <div className="space-y-4">
                <div className="border-b border-slate-400 pb-1 flex items-center justify-between">
                  <h2 className="font-bold font-mono text-sm uppercase text-slate-900 tracking-wider">
                    PHẦN I. DANH MỤC PHÁC ĐỒ CẤP CỨU SƠ CỨU ({displayProtocols.length} TÌNH HUỐNG ĐƯỢC CHỌN)
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">Thao tác từng bước tuần tự</span>
                </div>

                <div className="space-y-4">
                  {displayProtocols.map((p, idx) => (
                    <div
                      key={p.id}
                      className="border border-slate-300 rounded p-3.5 space-y-2.5 page-break-inside-avoid bg-white"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h3 className="font-bold text-slate-950 text-sm">
                            {p.title}
                          </h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                          p.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 border-rose-400'
                            : p.severity === 'danger'
                            ? 'bg-amber-100 text-amber-800 border-amber-400'
                            : 'bg-blue-100 text-blue-800 border-blue-400'
                        }`}>
                          {getSeverityLabel(p.severity)}
                        </span>
                      </div>

                      {/* Step-by-step actions */}
                      <div className="space-y-1 pl-2">
                        <div className="text-[11px] font-mono font-bold text-slate-700 uppercase">
                          Các bước xử trí khẩn cấp:
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-800 pl-1 leading-relaxed">
                          {p.steps.map((st, sIdx) => (
                            <li key={sIdx} className="font-medium">
                              <span className="font-normal">{st}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Important Notes & Warnings */}
                      {p.notes && (
                        <div className="text-[11px] p-2 bg-amber-50 border-l-4 border-amber-500 text-slate-800 leading-relaxed">
                          <strong>LƯU Ý ĐẶC BIỆT & CHỐNG CHỈ ĐỊNH:</strong> {p.notes}
                        </div>
                      )}

                      {/* PubChem LCSS Reference Section in Printout */}
                      {includePubChemLCSS && p.pubchemRefs && p.pubchemRefs.length > 0 && (
                        <div className="pt-2 border-t border-dashed border-slate-300 flex flex-wrap items-center gap-2 text-[10.5px] font-mono text-slate-600">
                          <span className="font-bold text-sky-800 flex items-center gap-1">
                            🔬 Tham chiếu an toàn PubChem LCSS:
                          </span>
                          {p.pubchemRefs.map((ref, rIdx) => (
                            <a
                              key={rIdx}
                              href={ref.url || `https://pubchem.ncbi.nlm.nih.gov/compound/${ref.cid}#datasheet=LCSS`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200 text-sky-900 hover:underline flex items-center gap-1"
                            >
                              <span>{ref.name} (CID: {ref.cid})</span>
                            </a>
                          ))}
                        </div>
                      )}
                      <IntlLinks item={p} variant="print" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* SECTION 2: SAFETY KNOWLEDGE & GUIDELINES */}
            {displayKnowledge.length > 0 ? (
              <div className="space-y-4 pt-4 border-t-2 border-slate-900 page-break-before-always">
                <div className="border-b border-slate-400 pb-1 flex items-center justify-between">
                  <h2 className="font-bold font-mono text-sm uppercase text-slate-900 tracking-wider">
                    PHẦN II. CẨM NANG & NGUYÊN TẮC AN TOÀN PHÒNG THÍ NGHIỆM ({displayKnowledge.length} HƯỚNG DẪN)
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">Quy chuẩn tuân thủ bắt buộc</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displayKnowledge.map((k) => (
                    <div
                      key={k.id}
                      className="border border-slate-300 rounded p-3 space-y-1.5 bg-slate-50/50 page-break-inside-avoid"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                        <h4 className="font-bold text-slate-950 text-xs">
                          {k.title}
                        </h4>
                        <span className="text-[9.5px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                          {k.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                        {k.content}
                      </p>
                      {includePubChemLCSS && k.pubchemRefs && k.pubchemRefs.length > 0 && (
                        <div className="pt-1.5 border-t border-slate-200 flex flex-wrap items-center gap-1 text-[10px] font-mono text-sky-800">
                          <span>🔬 PubChem:</span>
                          {k.pubchemRefs.map((ref, rIdx) => (
                            <span key={rIdx} className="underline">
                              {ref.name} (CID: {ref.cid})
                            </span>
                          ))}
                        </div>
                      )}
                      <IntlLinks item={k} variant="print" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {displayProtocols.length === 0 && displayKnowledge.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                Chưa có mục nào được chọn để in. Vui lòng bấm "Tùy chọn mục in" ở thanh công cụ phía trên để tích chọn các phác đồ hoặc cẩm nang cần in.
              </div>
            )}

            {/* SECTION 3: SIGNATURE & APPROVAL BLOCK */}
            {includeSignature && (displayProtocols.length > 0 || displayKnowledge.length > 0) && (
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center font-mono text-xs page-break-inside-avoid">
                <div className="space-y-16">
                  <div>
                    <div className="font-bold text-slate-900 uppercase">Người lập sổ tay</div>
                    <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1 text-[11px] text-slate-600">
                    Cán bộ kỹ thuật lab
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <div className="font-bold text-slate-900 uppercase">Cán bộ an toàn (EHS)</div>
                    <div className="text-[10px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1 text-[11px] text-slate-600">
                    Phụ trách an toàn lab
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <div className="font-bold text-slate-900 uppercase">Trưởng phòng thí nghiệm</div>
                    <div className="text-[10px] text-slate-500">(Ký duyệt và đóng dấu)</div>
                  </div>
                  <div className="border-t border-dashed border-slate-400 mx-6 pt-1 text-[11px] text-slate-600">
                    Giám đốc / Trưởng lab
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="text-[10px] font-mono text-slate-400 text-center border-t border-slate-200 pt-3">
              ChemSafe AI Lab Safety Protocol Handbook • Phát hành bởi Hệ thống quản trị an toàn hóa chất thông minh
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
