import React, { useState, useEffect, useMemo } from 'react';
import { Chemical, EmergencyProtocol, SafetyKnowledge } from '../types/chemical';
import { findProtocol, findKnowledge, findChemical } from '../utils/safetySearch';
import {
  getAllEmergencyProtocols,
  saveEmergencyProtocol,
  deleteEmergencyProtocol,
  resetEmergencyProtocolsToDefault,
  getAllSafetyKnowledge,
  saveSafetyKnowledge,
  deleteSafetyKnowledge
} from '../data/emergencyProtocols';
import {
  ShieldCheck,
  HeartPulse,
  Search,
  Sparkles,
  BookOpen,
  AlertOctagon,
  Plus,
  Edit3,
  Trash2,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  HelpCircle,
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { SafetyHandbookPrintModal } from './SafetyHandbookPrintModal';
import { IntlLinks } from './IntlLinks';
import { getIntlLinks } from '../data/emergencyProtocols';

interface SafetyAdvisorProps {
  chemicals: Chemical[];
  initialQuery?: string;
}

export const SafetyAdvisor: React.FC<SafetyAdvisorProps> = ({ chemicals, initialQuery = '' }) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'protocols' | 'knowledge'>('protocols');

  // Dynamic Data
  const [protocols, setProtocols] = useState<EmergencyProtocol[]>([]);
  const [knowledgeList, setKnowledgeList] = useState<SafetyKnowledge[]>([]);

  // Modal State for Emergency Protocol
  const [showProtocolModal, setShowProtocolModal] = useState<boolean>(false);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);
  const [protoTitle, setProtoTitle] = useState('');
  const [protoSeverity, setProtoSeverity] = useState<'critical' | 'danger' | 'caution' | 'standard'>('danger');
  const [protoStepsText, setProtoStepsText] = useState('');
  const [protoNotes, setProtoNotes] = useState('');
  const [protoKeywords, setProtoKeywords] = useState('');
  const [protoPubChemText, setProtoPubChemText] = useState('');

  // Modal State for Safety Knowledge
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [knowTitle, setKnowTitle] = useState('');
  const [knowCategory, setKnowCategory] = useState('An toàn chung');
  const [knowContent, setKnowContent] = useState('');
  const [knowKeywords, setKnowKeywords] = useState('');
  const [knowPubChemText, setKnowPubChemText] = useState('');

  // Selective Print State
  const [selectedProtocolIdForPrint, setSelectedProtocolIdForPrint] = useState<string | null>(null);
  const [selectedKnowledgeIdForPrint, setSelectedKnowledgeIdForPrint] = useState<string | null>(null);

  // Load from local storage
  const loadData = () => {
    setProtocols(getAllEmergencyProtocols());
    setKnowledgeList(getAllSafetyKnowledge());
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Export States
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#safety-export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  // Export Safety Data to CSV
  const exportSafetyToCSV = () => {
    const escapeCSV = (str: string | undefined | null) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const protocolHeaders = ['Mã phác đồ', 'Tiêu đề tình huống', 'Mức độ nguy cấp', 'Các bước xử lý khẩn cấp', 'Lưu ý & Chống chỉ định', 'Từ khóa'];
    const protocolRows = protocols.map(p => [
      escapeCSV(p.id),
      escapeCSV(p.title),
      escapeCSV(p.severity.toUpperCase()),
      escapeCSV(p.steps.map((s, idx) => `${idx + 1}. ${s}`).join(' | ')),
      escapeCSV(p.notes || ''),
      escapeCSV((p.keywords || []).join('; '))
    ]);

    const knowledgeHeaders = ['Mã tri thức', 'Tiêu đề cẩm nang', 'Chuyên mục', 'Nội dung quy chuẩn', 'Từ khóa'];
    const knowledgeRows = knowledgeList.map(k => [
      escapeCSV(k.id),
      escapeCSV(k.title),
      escapeCSV(k.category),
      escapeCSV(k.content.replace(/\r?\n/g, ' ')),
      escapeCSV((k.keywords || []).join('; '))
    ]);

    let csv = '\uFEFF';
    csv += '=== PHÁC ĐỒ CẤP CỨU SƠ CỨU PHÒNG THÍ NGHIỆM ===\r\n';
    csv += protocolHeaders.map(h => `"${h}"`).join(',') + '\r\n';
    csv += protocolRows.map(r => r.join(',')).join('\r\n') + '\r\n\r\n';
    csv += '=== CẨM NANG & NGUYÊN TẮC AN TOÀN PHÒNG LAB ===\r\n';
    csv += knowledgeHeaders.map(h => `"${h}"`).join(',') + '\r\n';
    csv += knowledgeRows.map(r => r.join(',')).join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChemSafe_SoCuu_AnToan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export Safety Data to JSON
  const exportSafetyToJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      system: 'ChemSafe AI Lab Safety System',
      version: '2.5.0',
      emergencyProtocolsCount: protocols.length,
      emergencyProtocols: protocols,
      safetyKnowledgeCount: knowledgeList.length,
      safetyKnowledge: knowledgeList
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChemSafe_SoCuu_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Quick Chips
  const quickChips = useMemo(() => [
    'Sơ cứu khi dính axit vào mắt',
    'Quy tắc pha loãng H2SO4 đặc',
    'Xử lý tràn đổ dung môi hữu cơ',
    'Phòng ngừa Peroxide trong Ete',
    'Bỏng Phenol',
    'Hướng dẫn đọc 16 mục SDS'
  ], []);

  // PubChem PUG REST API query for external chemicals
  const searchPubChem = async (cleanQuery: string): Promise<string | null> => {
    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanQuery)}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const prop = data?.PropertyTable?.Properties?.[0];
      if (prop) {
        return `[PubChem Tra cứu Quốc tế]:\n• Tên hợp chất: ${prop.Title || prop.IUPACName || cleanQuery}\n• Công thức hóa học: ${prop.MolecularFormula || 'N/A'}\n• Khối lượng mol: ${prop.MolecularWeight ? `${prop.MolecularWeight} g/mol` : 'N/A'}\n• Tên IUPAC: ${prop.IUPACName || 'N/A'}\n\n* Khuyến cáo an toàn: Hãy đối chiếu bản SDS chính thức của nhà sản xuất trước khi thao tác.`;
      }
    } catch {
      // fallback
    }
    return null;
  };

  const handleSearch = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResponse(null);


    // 1. Search in Emergency Protocols (both default & user-added)
    const matchedProto = findProtocol(text, protocols);

    if (matchedProto) {
      const res = [
        `🚨 QUY TRÌNH SƠ CỨU: ${matchedProto.title.toUpperCase()}`,
        `• Mức độ khẩn cấp: ${matchedProto.severity === 'critical' ? 'CỰC KỲ NGUY CẤP' : matchedProto.severity === 'danger' ? 'NGUY HIỂM' : 'THẬN TRỌNG'}`,
        `• Các bước thực hiện:`,
        ...matchedProto.steps.map((s, idx) => `  ${idx + 1}. ${s}`),
        matchedProto.notes ? `\n• Lưu ý & Chống chỉ định: ${matchedProto.notes}` : '',
        ...(getIntlLinks(matchedProto).length ? ['\n• Tài liệu quốc tế:', ...getIntlLinks(matchedProto).map(l => `  - [${l.org}] ${l.label}: ${l.url}`)] : [])
      ].filter(Boolean).join('\n');

      setResponse(res);
      setIsLoading(false);
      return;
    }

    // 2. Search in Safety Knowledge (both default & user-added)
    const matchedKnow = findKnowledge(text, knowledgeList);

    if (matchedKnow) {
      const res = [
        `📖 CẨM NANG AN TOÀN: ${matchedKnow.title}`,
        `• Chuyên mục: ${matchedKnow.category}`,
        `• Nội dung hướng dẫn:\n${matchedKnow.content}`,
        ...(getIntlLinks(matchedKnow).length ? [`• Tài liệu quốc tế:\n${getIntlLinks(matchedKnow).map(l => `  - [${l.org}] ${l.label}: ${l.url}`).join('\n')}`] : [])
      ].join('\n\n');

      setResponse(res);
      setIsLoading(false);
      return;
    }

    // 3. Search in Chemical Catalog
    const matchedChem = findChemical(text, chemicals);

    if (matchedChem) {
      const res = [
        `🔬 THÔNG TIN AN TOÀN CHO: ${matchedChem.formula} — ${matchedChem.name}`,
        `• Khối lượng mol: ${matchedChem.molar} | Điểm sôi: ${matchedChem.boiling} | pH: ${matchedChem.ph}`,
        `• Mức độ nguy hiểm: [${matchedChem.dangerLabel}] - ${matchedChem.msds || matchedChem.properties}`,
        `• Bảo hộ cá nhân (PPE): Kính bảo hộ chống văng bắn, găng tay hóa chất phù hợp, áo blouse phòng thí nghiệm.`,
        `• Quy tắc lưu trữ: ${matchedChem.storage}`,
        `• Đặc tính lý hóa: ${matchedChem.properties}`,
        ...(matchedChem.pubChemCid ? [`• Nguồn thông tin (PubChem): https://pubchem.ncbi.nlm.nih.gov/compound/${matchedChem.pubChemCid}`] : []),
        ...(matchedChem.icscId ? [`• Thẻ an toàn ICSC ${matchedChem.icscId}: https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${matchedChem.icscId}&p_version=2&p_lang=en`] : [])
      ].join('\n\n');

      setResponse(res);
      setIsLoading(false);
      return;
    }

    // 4. Fallback: Query PubChem API
    const pubChemRes = await searchPubChem(text.trim());
    if (pubChemRes) {
      setResponse(pubChemRes);
    } else {
      setResponse(
        `Không tìm thấy dữ liệu cho "${text}" trong quy trình sơ cứu, cẩm nang an toàn nội bộ hoặc PubChem.\n\n` +
        `💡 Bạn có thể tự thêm hướng dẫn sơ cứu hoặc tri thức mới bằng nút "+ Thêm quy trình sơ cứu" hoặc "+ Thêm tri thức an toàn" ở phía trên!`
      );
    }

    setIsLoading(false);
  };

  const handleQuickPrintProtocol = (protocolId: string) => {
    setSelectedKnowledgeIdForPrint(null);
    setSelectedProtocolIdForPrint(protocolId);
    setShowPrintModal(true);
  };

  const handleQuickPrintKnowledge = (knowledgeId: string) => {
    setSelectedProtocolIdForPrint(null);
    setSelectedKnowledgeIdForPrint(knowledgeId);
    setShowPrintModal(true);
  };

  const parsePubChemRefs = (text: string) => {
    return text
      .split(/[,;\n]/)
      .map(part => {
        const t = part.trim();
        if (!t) return null;
        if (t.includes(':')) {
          const [namePart, cidPart] = t.split(':');
          const cleanCid = cidPart.trim().replace(/[^0-9a-zA-Z]/g, '');
          const cleanName = namePart.trim();
          if (!cleanCid && !cleanName) return null;
          return {
            name: cleanName || `CID ${cleanCid}`,
            cid: cleanCid || '0',
            type: 'lcss' as const,
            url: cleanCid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cleanCid}#datasheet=LCSS` : undefined
          };
        } else {
          const clean = t.trim();
          const isNum = /^\d+$/.test(clean);
          return {
            name: isNum ? `PubChem CID ${clean}` : clean,
            cid: isNum ? clean : clean,
            type: 'lcss' as const,
            url: isNum ? `https://pubchem.ncbi.nlm.nih.gov/compound/${clean}#datasheet=LCSS` : undefined
          };
        }
      })
      .filter(Boolean) as { name: string; cid: number | string; url?: string; type?: 'lcss' }[];
  };

  // Open Modal: Create / Edit Emergency Protocol
  const handleOpenAddProtocol = () => {
    setEditingProtocolId(null);
    setProtoTitle('');
    setProtoSeverity('danger');
    setProtoStepsText('');
    setProtoNotes('');
    setProtoKeywords('');
    setProtoPubChemText('');
    setShowProtocolModal(true);
  };

  const handleOpenEditProtocol = (p: EmergencyProtocol) => {
    setEditingProtocolId(p.id);
    setProtoTitle(p.title);
    setProtoSeverity(p.severity);
    setProtoStepsText(p.steps.join('\n'));
    setProtoNotes(p.notes || '');
    setProtoKeywords((p.keywords || []).join(', '));
    setProtoPubChemText((p.pubchemRefs || []).map(r => `${r.name}: ${r.cid}`).join(', '));
    setShowProtocolModal(true);
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protoTitle.trim()) {
      alert('Vui lòng nhập tên tình huống sự cố!');
      return;
    }

    const steps = protoStepsText
      .split('\n')
      .map(s => s.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter(Boolean);

    if (steps.length === 0) {
      alert('Vui lòng nhập ít nhất 1 bước sơ cứu!');
      return;
    }

    const keywords = protoKeywords
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    const pubchemRefs = parsePubChemRefs(protoPubChemText);

    const protocolToSave: EmergencyProtocol = {
      id: editingProtocolId || `ep_${Date.now()}`,
      title: protoTitle.trim(),
      severity: protoSeverity,
      steps,
      notes: protoNotes.trim() || undefined,
      keywords: keywords.length > 0 ? keywords : [protoTitle.trim().toLowerCase()],
      pubchemRefs: pubchemRefs.length > 0 ? pubchemRefs : undefined,
      custom: true
    };

    saveEmergencyProtocol(protocolToSave);
    loadData();
    setShowProtocolModal(false);
  };

  const handleDeleteProtocol = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa quy trình sơ cứu "${title}"?`)) {
      deleteEmergencyProtocol(id);
      loadData();
    }
  };

  const handleResetProtocols = () => {
    if (confirm('Khôi phục danh mục quy trình sơ cứu về thiết lập chuẩn ban đầu?')) {
      resetEmergencyProtocolsToDefault();
      loadData();
    }
  };

  // Open Modal: Create / Edit Safety Knowledge
  const handleOpenAddKnowledge = () => {
    setEditingKnowledgeId(null);
    setKnowTitle('');
    setKnowCategory('An toàn chung');
    setKnowContent('');
    setKnowKeywords('');
    setKnowPubChemText('');
    setShowKnowledgeModal(true);
  };

  const handleOpenEditKnowledge = (k: SafetyKnowledge) => {
    setEditingKnowledgeId(k.id);
    setKnowTitle(k.title);
    setKnowCategory(k.category);
    setKnowContent(k.content);
    setKnowKeywords((k.keywords || []).join(', '));
    setKnowPubChemText((k.pubchemRefs || []).map(r => `${r.name}: ${r.cid}`).join(', '));
    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!knowTitle.trim() || !knowContent.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung hướng dẫn!');
      return;
    }

    const keywords = knowKeywords
      .split(',')
      .map(kw => kw.trim())
      .filter(Boolean);

    const pubchemRefs = parsePubChemRefs(knowPubChemText);

    const itemToSave: SafetyKnowledge = {
      id: editingKnowledgeId || `sk_${Date.now()}`,
      title: knowTitle.trim(),
      category: knowCategory.trim() || 'An toàn chung',
      content: knowContent.trim(),
      keywords: keywords.length > 0 ? keywords : [knowTitle.trim().toLowerCase()],
      pubchemRefs: pubchemRefs.length > 0 ? pubchemRefs : undefined,
      custom: true
    };

    saveSafetyKnowledge(itemToSave);
    loadData();
    setShowKnowledgeModal(false);
  };

  const handleDeleteKnowledge = (id: string, title: string) => {
    if (confirm(`Bạn có chắc muốn xóa bài cẩm nang "${title}"?`)) {
      deleteSafetyKnowledge(id);
      loadData();
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          border: 'border-rose-500/50',
          bg: 'bg-rose-950/20',
          text: 'text-rose-400',
          badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          label: 'CỰC KỲ NGUY CẤP'
        };
      case 'danger':
        return {
          border: 'border-amber-500/50',
          bg: 'bg-amber-950/20',
          text: 'text-amber-400',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          label: 'NGUY HIỂM'
        };
      case 'caution':
        return {
          border: 'border-yellow-500/50',
          bg: 'bg-yellow-950/20',
          text: 'text-yellow-400',
          badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
          label: 'THẬN TRỌNG'
        };
      default:
        return {
          border: 'border-emerald-500/50',
          bg: 'bg-emerald-950/20',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          label: 'TIÊU CHUẨN'
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <HeartPulse className="w-6 h-6 text-rose-400" />
            Cẩm nang an toàn & <span className="text-emerald-400">Sơ cứu phòng thí nghiệm</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu quy trình ứng phó tai nạn hóa chất, quản lý và thêm mới các hướng dẫn sơ cứu riêng cho lab của bạn
          </p>
        </div>

        {/* Action button cluster to add new information & export */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Export Dropdown */}
          <div id="safety-export-menu-container" className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Xuất dữ liệu sơ cứu, cẩm nang an toàn sang PDF, CSV hoặc JSON"
              className="px-3 py-2 text-xs font-mono font-medium text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#2b3547] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Xuất dữ liệu</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-[#12161f] border border-[#262f3d] rounded-xl shadow-2xl py-1.5 z-40 animate-scaleUp">
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    setSelectedProtocolIdForPrint(null);
                    setSelectedKnowledgeIdForPrint(null);
                    setShowPrintModal(true);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-rose-300 flex items-center gap-2.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-semibold">Xuất PDF / In phác đồ SOP</div>
                    <div className="text-[10px] text-slate-400">In ấn sổ tay phác đồ chọn lọc chuẩn lab</div>
                  </div>
                </button>

                <button
                  onClick={exportSafetyToCSV}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-emerald-300 flex items-center gap-2.5 transition-colors border-t border-[#1f2633]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Xuất CSV (Excel / Sheets)</div>
                    <div className="text-[10px] text-slate-400">Danh mục phác đồ & cẩm nang an toàn</div>
                  </div>
                </button>

                <button
                  onClick={exportSafetyToJSON}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-amber-300 flex items-center gap-2.5 transition-colors border-t border-[#1f2633]"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold">Xuất JSON (Sao lưu dữ liệu)</div>
                    <div className="text-[10px] text-slate-400">Sao lưu nguyên vẹn phác đồ và tri thức</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAddProtocol}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm quy trình sơ cứu</span>
          </button>

          <button
            onClick={handleOpenAddKnowledge}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>+ Thêm tri thức an toàn</span>
          </button>

          <button
            onClick={handleResetProtocols}
            title="Khôi phục danh mục quy trình sơ cứu tiêu chuẩn ban đầu"
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#2b3547] rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Query Area */}
      <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Tra cứu tình huống sơ cứu, hóa chất hoặc nhập câu hỏi (VD: bỏng axit, HF, phenol, tràn đổ, ether)..."
              className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={isLoading}
            className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Đang tra cứu...' : 'Tra cứu'}</span>
          </button>
        </div>

        {/* Quick query chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-400">Câu hỏi nhanh:</span>
          {quickChips.map((chip, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(chip);
                handleSearch(chip);
              }}
              className="text-[11px] px-2.5 py-1 rounded bg-[#0c0f14] hover:bg-[#1a212e] text-slate-300 border border-[#232b3b] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Search Response Box */}
        {response && (
          <div className="mt-4 p-4 rounded-lg bg-[#0c0f14] border border-emerald-500/30 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans shadow-inner">
            {response}
          </div>
        )}
      </div>

      {/* Tabs Navigation: Protocols vs Knowledge */}
      <div className="flex items-center gap-2 border-b border-[#1f2633] pb-2">
        <button
          onClick={() => setActiveSubTab('protocols')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
            activeSubTab === 'protocols'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#12161f]'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Quy trình ứng phó khẩn cấp ({protocols.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
            activeSubTab === 'knowledge'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#12161f]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Cẩm nang & Tri thức an toàn ({knowledgeList.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Emergency Protocols Grid */}
      {activeSubTab === 'protocols' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Danh mục các tình huống cấp cứu trong phòng thí nghiệm:</span>
            <span>Tổng cộng: {protocols.length} quy trình</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {protocols.map((p, idx) => {
              const style = getSeverityStyle(p.severity);
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4.5 space-y-3.5 ${style.border} ${style.bg} transition-all hover:border-opacity-80 flex flex-col justify-between`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">0{idx + 1}.</span>
                        <h3 className="font-semibold text-sm tracking-tight text-slate-100">
                          {p.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${style.badge}`}>
                          {style.label}
                        </span>
                        {p.custom && (
                          <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            Tự thêm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step list */}
                    <ul className="space-y-2 text-xs text-slate-300 font-sans">
                      {p.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5 leading-relaxed">
                          <span className="text-emerald-400 font-mono font-bold text-xs mt-0.5">
                            {sIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Notes & Contraindications */}
                    {p.notes && (
                      <div className="p-2.5 rounded bg-black/40 border border-white/5 text-[11px] text-amber-200/90 leading-snug">
                        <strong>Lưu ý / Chống chỉ định:</strong> {p.notes}
                      </div>
                    )}
                    {/* PubChem LCSS Reference Links */}
                    {p.pubchemRefs && p.pubchemRefs.length > 0 && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs font-mono">
                        <span className="text-[10.5px] text-sky-400 font-semibold flex items-center gap-1">
                          🔬 PubChem LCSS:
                        </span>
                        {p.pubchemRefs.map((ref, rIdx) => (
                          <a
                            key={rIdx}
                            href={ref.url || `https://pubchem.ncbi.nlm.nih.gov/compound/${ref.cid}#datasheet=LCSS`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[10.5px] flex items-center gap-1 transition-colors"
                            title="Xem Thẻ an toàn hóa chất phòng lab (LCSS) trên PubChem NIH"
                          >
                            <span>{ref.name}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    )}
                    <IntlLinks item={p} />
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                      <span>Từ khóa:</span>
                      <span className="text-slate-300">{(p.keywords || []).slice(0, 3).join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleQuickPrintProtocol(p.id)}
                        className="text-xs font-mono text-rose-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                        title="Tùy chọn in ấn riêng phác đồ sơ cứu này sang bản in PDF A4"
                      >
                        <Printer className="w-3 h-3" />
                        <span>In phác đồ</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditProtocol(p)}
                        className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded bg-[#0c0f14] border border-[#242c3b] transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>

                      {p.custom && (
                        <button
                          onClick={() => handleDeleteProtocol(p.id, p.title)}
                          className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Safety Knowledge Grid */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Cẩm nang, quy định phòng ngừa và bài học an toàn hóa chất:</span>
            <span>Tổng cộng: {knowledgeList.length} bài</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {knowledgeList.map((k) => (
              <div
                key={k.id}
                className="rounded-xl border border-[#1f2633] bg-[#12161f] p-4.5 space-y-3 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm tracking-tight text-slate-100 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{k.title}</span>
                    </h3>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {k.category}
                      </span>
                      {k.custom && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          Tự thêm
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                    {k.content}
                  </p>

                  {/* PubChem Reference Links */}
                  {k.pubchemRefs && k.pubchemRefs.length > 0 && (
                    <div className="pt-2 border-t border-[#1f2633] flex flex-wrap items-center gap-1.5 text-xs font-mono">
                      <span className="text-[10.5px] text-sky-400 font-semibold flex items-center gap-1">
                        🔬 PubChem:
                      </span>
                      {k.pubchemRefs.map((ref, rIdx) => (
                        <a
                          key={rIdx}
                          href={ref.url || `https://pubchem.ncbi.nlm.nih.gov/compound/${ref.cid}#datasheet=LCSS`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-0.5 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[10px] flex items-center gap-1 transition-colors"
                          title="Xem thông số an toàn và dữ liệu hợp chất trên PubChem"
                        >
                          <span>{ref.name}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                  <IntlLinks item={k} />
                </div>

                <div className="pt-2 border-t border-[#1f2633] flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                    Từ khóa: {(k.keywords || []).slice(0, 3).join(', ')}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuickPrintKnowledge(k.id)}
                      className="text-xs font-mono text-emerald-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors"
                      title="Tùy chọn in ấn riêng cẩm nang an toàn này sang bản in PDF A4"
                    >
                      <Printer className="w-3 h-3" />
                      <span>In cẩm nang</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditKnowledge(k)}
                      className="text-xs font-mono text-slate-300 hover:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded bg-[#0c0f14] border border-[#242c3b] transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>

                    {k.custom && (
                      <button
                        onClick={() => handleDeleteKnowledge(k.id, k.title)}
                        className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Thêm / Sửa Quy trình sơ cứu */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProtocol}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>{editingProtocolId ? 'Chỉnh sửa quy trình sơ cứu' : 'Thêm quy trình sơ cứu khẩn cấp mới'}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Quy trình mới sẽ xuất hiện trong danh mục và tự động tìm thấy khi tra cứu từ khóa liên quan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Tên tình huống / Sự cố hóa chất *</label>
                <input
                  type="text"
                  required
                  value={protoTitle}
                  onChange={(e) => setProtoTitle(e.target.value)}
                  placeholder="VD: Bỏng Phốt pho trắng, Dính Bromine vào da, Cháy pin Lithium..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-rose-400 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Mức độ khẩn cấp</label>
                <select
                  value={protoSeverity}
                  onChange={(e) => setProtoSeverity(e.target.value as any)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                >
                  <option value="critical">🔴 Cực kỳ nguy cấp (Đe dọa tính mạng / Bỏng sâu)</option>
                  <option value="danger">🟠 Nguy hiểm (Ăn mòn / Tổn thương nặng)</option>
                  <option value="caution">🟡 Thận trọng (Kích ứng / Tràn đổ nhỏ)</option>
                  <option value="standard">🟢 Tiêu chuẩn (Quy trình thông thường)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Các bước sơ cứu chi tiết (Mỗi bước 1 dòng) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={protoStepsText}
                  onChange={(e) => setProtoStepsText(e.target.value)}
                  placeholder="Bước 1: Ngắt nguồn nhiệt hoặc đưa nạn nhân ra nơi thoáng khí.&#10;Bước 2: Xối nước liên tục 15-20 phút...&#10;Bước 3: Dùng gạc vô trùng che vết thương..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-rose-400 rounded px-3 py-2 text-slate-200 outline-none font-sans resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Lưu ý đặc biệt / Chống chỉ định</label>
                <input
                  type="text"
                  value={protoNotes}
                  onChange={(e) => setProtoNotes(e.target.value)}
                  placeholder="VD: Tuyệt đối không dùng nước, không gây nôn, dùng gel calcium gluconate..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Từ khóa tra cứu (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={protoKeywords}
                  onChange={(e) => setProtoKeywords(e.target.value)}
                  placeholder="VD: phot pho, p, chay kim loai, bong mat..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
                <span className="text-[10px] text-slate-400 block">
                  Khi người dùng tìm kiếm từ khóa này trên thanh tìm kiếm, hệ thống sẽ tự động hiển thị quy trình này.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-sky-400 font-bold">🔬 Liên kết PubChem LCSS (Tên chất : CID)</span>
                </label>
                <input
                  type="text"
                  value={protoPubChemText}
                  onChange={(e) => setProtoPubChemText(e.target.value)}
                  placeholder="VD: H2SO4: 1118, HCl: 313, HNO3: 944"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-sky-400 rounded px-3 py-2 text-slate-200 outline-none text-xs"
                />
                <span className="text-[10px] text-slate-400 block">
                  Định dạng: "Tên: CID" hoặc nhập danh sách CID cách nhau bằng dấu phẩy. Hệ thống sẽ tự động liên kết thẻ an toàn phòng lab PubChem LCSS.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-rose-400 hover:bg-rose-300 text-slate-950 rounded shadow-xs"
              >
                {editingProtocolId ? 'Cập nhật quy trình' : 'Lưu quy trình sơ cứu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Thêm / Sửa Tri thức an toàn & Cẩm nang */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveKnowledge}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>{editingKnowledgeId ? 'Chỉnh sửa bài cẩm nang' : 'Thêm bài cẩm nang & tri thức an toàn mới'}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lưu các quy tắc phòng lab, hướng dẫn thao tác an toàn hoặc lưu ý kỹ thuật
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Tiêu đề bài học / Tri thức *</label>
                <input
                  type="text"
                  required
                  value={knowTitle}
                  onChange={(e) => setKnowTitle(e.target.value)}
                  placeholder="VD: Quy trình xử lý kim loại kiềm dư thừa, Cách kiểm tra tủ hút..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Chuyên mục</label>
                <input
                  type="text"
                  value={knowCategory}
                  onChange={(e) => setKnowCategory(e.target.value)}
                  placeholder="VD: Pha chế & An toàn, Lưu trữ & Dung môi, Chữa cháy..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nội dung hướng dẫn chi tiết *</label>
                <textarea
                  rows={5}
                  required
                  value={knowContent}
                  onChange={(e) => setKnowContent(e.target.value)}
                  placeholder="Ghi lại nguyên tắc khoa học, trình tự thao tác, rủi ro tiềm ẩn và các kinh nghiệm thực tế..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 outline-none font-sans resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">
                  Từ khóa tra cứu (cách nhau bằng dấu phẩy)
                </label>
                <input
                  type="text"
                  value={knowKeywords}
                  onChange={(e) => setKnowKeywords(e.target.value)}
                  placeholder="VD: kim loai kiem, tieu huy hoa chat, xu ly rac thai..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-sky-400 font-bold">🔬 Liên kết PubChem LCSS / Hợp chất (Tên : CID)</span>
                </label>
                <input
                  type="text"
                  value={knowPubChemText}
                  onChange={(e) => setKnowPubChemText(e.target.value)}
                  placeholder="VD: Diethyl ether: 3283, Tetrahydrofuran: 8028"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-sky-400 rounded px-3 py-2 text-slate-200 outline-none text-xs"
                />
                <span className="text-[10px] text-slate-400 block">
                  Định dạng: "Tên: CID" hoặc danh sách CID cách nhau bằng dấu phẩy. Sẽ hiển thị ở chân cẩm nang và trong bản in PDF.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setShowKnowledgeModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded shadow-xs"
              >
                {editingKnowledgeId ? 'Cập nhật cẩm nang' : 'Lưu vào cẩm nang'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Safety Handbook Printable Modal (PDF / SOP) */}
      {showPrintModal && (
        <SafetyHandbookPrintModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setSelectedProtocolIdForPrint(null);
            setSelectedKnowledgeIdForPrint(null);
          }}
          protocols={protocols}
          knowledgeList={knowledgeList}
          initialSelectedProtocolId={selectedProtocolIdForPrint}
          initialSelectedKnowledgeId={selectedKnowledgeIdForPrint}
        />
      )}
    </div>
  );
};
