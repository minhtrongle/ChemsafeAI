import React, { useState } from 'react';
import { Chemical, DangerLevel } from '../types/chemical';
import { compactFormula, detectChemicalCategories, getAllCategories } from '../data/chemicals';
import {
  fetchChemicalsFromUrl,
  lookupPubChem,
  PubChemLookupResult
} from '../utils/externalDataFetcher';
import {
  X,
  Globe,
  Search,
  Sparkles,
  Link as LinkIcon,
  FileSpreadsheet,
  FileJson,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Database,
  ArrowRight,
  BookOpen,
  ShieldAlert
} from 'lucide-react';
import { getIcscUrl, detectIcscId } from '../utils/icscHelper';

interface ExternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportChemicals: (chemicals: Chemical[], overwrite: boolean) => void;
  onOpenAddWithPrefill?: (prefilled: Partial<Chemical>) => void;
}

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({
  isOpen,
  onClose,
  onImportChemicals,
  onOpenAddWithPrefill
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'pubchem'>('url');

  // URL Import State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    items: Chemical[];
    format: 'json' | 'csv';
    sourceUrl: string;
  } | null>(null);
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);

  // PubChem Lookup State
  const [pubchemQuery, setPubchemQuery] = useState<string>('');
  const [isSearchingPubchem, setIsSearchingPubchem] = useState<boolean>(false);
  const [pubchemError, setPubchemError] = useState<string | null>(null);
  const [pubchemResult, setPubchemResult] = useState<PubChemLookupResult | null>(null);
  const [pubchemDanger, setPubchemDanger] = useState<DangerLevel>('caution');
  const [pubchemCategories, setPubchemCategories] = useState<string[]>(['Dung môi']);
  const [customSdsUrl, setCustomSdsUrl] = useState<string>('');
  const [addedSuccessMsg, setAddedSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset example URLs for testing
  const samplePresets = [
    {
      title: 'Google Sheets mẫu (Công khai)',
      url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
      type: 'Sheets (CSV)'
    },
    {
      title: 'Dữ liệu JSON mẫu (GitHub raw)',
      url: 'https://raw.githubusercontent.com/datasets/gdp/master/data/gdp.csv',
      type: 'Raw CSV'
    }
  ];

  const quickPubchemChips = [
    'Ethanol',
    'Aspirin',
    'Acetone',
    'Caffeine',
    'Sulfuric acid',
    'Benzene',
    'Sodium chloride',
    'Citric acid'
  ];

  // Handle URL Fetch
  const handleFetchUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) {
      setUrlError('Vui lòng nhập đường link URL của tệp JSON, CSV hoặc Google Sheets.');
      return;
    }

    setIsLoadingUrl(true);
    setUrlError(null);
    setPreviewData(null);

    try {
      const result = await fetchChemicalsFromUrl(urlInput.trim());
      setPreviewData({
        items: result.items,
        format: result.format,
        sourceUrl: urlInput.trim()
      });
    } catch (err) {
      setUrlError((err as Error).message || 'Không thể tải hoặc phân tích dữ liệu từ đường dẫn này.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // Confirm URL Import
  const handleConfirmUrlImport = () => {
    if (!previewData || previewData.items.length === 0) return;
    onImportChemicals(previewData.items, overwriteMode);
    onClose();
  };

  // Handle PubChem Search
  const handleSearchPubchem = async (queryTerm?: string) => {
    const term = queryTerm || pubchemQuery;
    if (!term.trim()) {
      setPubchemError('Vui lòng nhập tên hóa chất hoặc công thức cần tra cứu.');
      return;
    }

    setIsSearchingPubchem(true);
    setPubchemError(null);
    setPubchemResult(null);
    setAddedSuccessMsg(null);

    try {
      const res = await lookupPubChem(term.trim());
      setPubchemResult(res);
      // Auto-detect danger and category
      const detectedCats = detectChemicalCategories({ formula: res.formula, name: res.name });
      setPubchemCategories(detectedCats.length > 0 ? detectedCats : ['Khác']);
      setPubchemDanger('caution');
      setCustomSdsUrl('');
    } catch (err) {
      setPubchemError((err as Error).message || 'Không tìm thấy hóa chất trên PubChem NIH.');
    } finally {
      setIsSearchingPubchem(false);
    }
  };

  // Add PubChem Result directly to database
  const handleAddPubchemToDb = () => {
    if (!pubchemResult) return;

    const dangerLabels: Record<DangerLevel, string> = {
      safe: 'AN TOÀN',
      caution: 'THẬN TRỌNG',
      danger: 'NGUY HIỂM',
      extreme: 'CỰC KỲ NGUY HIỂM'
    };

    const finalCats = pubchemCategories.length > 0 ? pubchemCategories : ['Khác'];
    const detectedIcsc = detectIcscId(pubchemResult.formula, pubchemResult.name);
    const icscInfo = getIcscUrl({ formula: pubchemResult.formula, name: pubchemResult.name, icscId: detectedIcsc });

    const newChem: Chemical = {
      key: compactFormula(pubchemResult.formula) || `pubchem_${pubchemResult.cid}`,
      formula: pubchemResult.formula || pubchemResult.name,
      name: pubchemResult.name || pubchemResult.formula,
      danger: pubchemDanger,
      dangerLabel: dangerLabels[pubchemDanger],
      categories: finalCats,
      category: finalCats.join(', '),
      molar: pubchemResult.molarStr || (pubchemResult.molarMass ? `${pubchemResult.molarMass} g/mol` : 'Chưa xác định'),
      molarMass: pubchemResult.molarMass || 0,
      boiling: 'Chưa có dữ liệu',
      ph: 'Chưa có dữ liệu',
      color: pubchemDanger === 'danger' || pubchemDanger === 'extreme' ? '#ff4757' : pubchemDanger === 'caution' ? '#ffa502' : '#2ed573',
      colorBg: 'rgba(255,255,255,0.05)',
      properties: pubchemResult.iupacName
        ? `Tên IUPAC: ${pubchemResult.iupacName}. Tra cứu trực tiếp từ PubChem NIH (CID: ${pubchemResult.cid}).`
        : `Dữ liệu nạp từ PubChem NIH (CID: ${pubchemResult.cid}).`,
      msds: pubchemResult.safetySummary
        ? `${pubchemResult.safetySummary} (Nguồn: PubChem Compound #${pubchemResult.cid})`
        : 'Tham khảo tài liệu SDS/MSDS quốc tế từ cơ sở dữ liệu PubChem NIH.',
      storage: 'Bảo quản nơi khô ráo, đậy kín nắp theo tiêu chuẩn phòng lab.',
      pubChemCid: pubchemResult.cid,
      icscId: detectedIcsc,
      sdsUrl: customSdsUrl.trim() || undefined,
      externalLinks: [
        { label: 'PubChem Record', url: pubchemResult.pubchemUrl },
        { label: 'Wikipedia', url: pubchemResult.wikipediaUrl },
        { label: 'Sigma-Aldrich', url: pubchemResult.sigmaUrl },
        { label: 'ChemSpider', url: pubchemResult.chemSpiderUrl },
        { label: 'ILO ICSC Card', url: icscInfo.url }
      ],
      custom: true
    };

    onImportChemicals([newChem], false);
    setAddedSuccessMsg(`Đã thêm thành công "${newChem.formula} — ${newChem.name}" vào Cơ sở dữ liệu!`);
  };

  // Open Add modal with pre-filled PubChem data
  const handleCustomizeInAddForm = () => {
    if (!pubchemResult || !onOpenAddWithPrefill) return;

    onOpenAddWithPrefill({
      formula: pubchemResult.formula,
      name: pubchemResult.name,
      molar: pubchemResult.molarStr,
      molarMass: pubchemResult.molarMass,
      pubChemCid: pubchemResult.cid,
      icscId: detectIcscId(pubchemResult.formula, pubchemResult.name),
      sdsUrl: customSdsUrl.trim() || undefined,
      categories: pubchemCategories,
      properties: pubchemResult.iupacName ? `Tên IUPAC: ${pubchemResult.iupacName}. Nạp từ PubChem CID: ${pubchemResult.cid}.` : undefined,
      msds: pubchemResult.safetySummary || undefined
    });
    onClose();
  };

  const allAvailableCats = getAllCategories();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#12161f] border border-[#2b3547] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f2633] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>Liên kết & Nhập dữ liệu từ bên ngoài</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập danh mục từ đường link URL trực tuyến hoặc nạp thông số tự động từ PubChem NIH
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-[#1a212e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#1f2633] gap-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-3 text-xs font-mono font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === 'url'
                ? 'text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Nhập từ URL (JSON / CSV / Sheets)</span>
          </button>

          <button
            onClick={() => setActiveTab('pubchem')}
            className={`pb-3 px-3 text-xs font-mono font-medium flex items-center gap-2 transition-colors relative ${
              activeTab === 'pubchem'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Tra cứu & Nạp trực tiếp từ PubChem</span>
          </button>
        </div>

        {/* TAB 1: REMOTE URL IMPORT */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <form onSubmit={handleFetchUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                  Đường dẫn URL tệp dữ liệu trực tuyến:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/chemicals.json hoặc link Google Sheets chia sẻ công khai"
                      className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-sky-400 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoadingUrl}
                    className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    {isLoadingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Tải dữ liệu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Explanatory note */}
              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/25 text-[11px] text-sky-300/90 leading-relaxed flex items-start gap-2.5">
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
                <div>
                  <strong className="text-sky-300">Hỗ trợ tự động Google Sheets công khai:</strong> Chỉ cần dán link Google Sheets của bạn (ở chế độ <em>"Bất kỳ ai có đường liên kết đều có thể xem"</em>). Hệ thống sẽ tự động chuyển đổi sang định dạng CSV tải về và nhập vào CSDL!
                </div>
              </div>
            </form>

            {/* Error Message */}
            {urlError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{urlError}</span>
              </div>
            )}

            {/* Preview loaded data */}
            {previewData && (
              <div className="space-y-3.5 p-4 rounded-xl bg-[#0c0f14] border border-sky-500/40 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-slate-100 uppercase">
                      Đã đọc thành công {previewData.items.length} hóa chất ({previewData.format.toUpperCase()})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    Sẵn sàng nạp
                  </span>
                </div>

                {/* Chemical Preview Items */}
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[#1f2633] bg-[#12161f] divide-y divide-[#171d27]">
                  {previewData.items.slice(0, 5).map((chem, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-emerald-400">{chem.formula}</span>
                        <span className="text-slate-300 truncate">— {chem.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {chem.molar || 'N/A'} • {chem.dangerLabel}
                      </span>
                    </div>
                  ))}
                  {previewData.items.length > 5 && (
                    <div className="p-2 text-center text-[10.5px] text-slate-500 font-mono">
                      ... và {previewData.items.length - 5} hóa chất khác.
                    </div>
                  )}
                </div>

                {/* Overwrite mode selection */}
                <div className="flex items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urlOverwrite"
                      checked={!overwriteMode}
                      onChange={() => setOverwriteMode(false)}
                      className="text-sky-500"
                    />
                    <span>Gộp & Cập nhật dữ liệu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="urlOverwrite"
                      checked={overwriteMode}
                      onChange={() => setOverwriteMode(true)}
                      className="text-rose-500"
                    />
                    <span>Ghi đè toàn bộ</span>
                  </label>
                </div>

                {/* Action button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleConfirmUrlImport}
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Xác nhận nhập vào CSDL ({previewData.items.length} chất)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PUBCHEM API DIRECT SEARCH */}
        {activeTab === 'pubchem' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300 font-medium">
                Tìm kiếm hợp chất trên cơ sở dữ liệu PubChem (NIH / NLM Hoa Kỳ):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pubchemQuery}
                    onChange={(e) => setPubchemQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchPubchem()}
                    placeholder="Nhập tên hóa chất tiếng Anh/Việt hoặc công thức (VD: Ethanol, Aspirin, H2SO4, Caffeine)..."
                    className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg pl-9 pr-3.5 py-2.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchPubchem()}
                  disabled={isSearchingPubchem}
                  className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-mono text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  {isSearchingPubchem ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tra cứu PubChem</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-500">Gợi ý nhanh:</span>
                {quickPubchemChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setPubchemQuery(chip);
                      handleSearchPubchem(chip);
                    }}
                    className="text-[10.5px] px-2 py-0.5 rounded bg-[#0c0f14] hover:bg-[#1a212e] text-slate-400 hover:text-emerald-300 border border-[#232b3b] font-mono transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {pubchemError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{pubchemError}</span>
              </div>
            )}

            {/* Success toast */}
            {addedSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{addedSuccessMsg}</span>
              </div>
            )}

            {/* PubChem Search Result Display */}
            {pubchemResult && (
              <div className="space-y-4 p-4 rounded-xl bg-[#0c0f14] border border-emerald-500/40 animate-fadeIn">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1f2633] pb-3">
                  <div className="flex items-center gap-3">
                    {/* 2D Structure image from PubChem */}
                    <div className="w-16 h-16 rounded-lg bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubchemResult.cid}/PNG?image_size=small`}
                        alt={pubchemResult.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // Hide broken image fallback
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-emerald-400">
                          {pubchemResult.formula}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          CID: {pubchemResult.cid}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5">
                        {pubchemResult.name}
                      </div>
                      {pubchemResult.iupacName && (
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                          IUPAC: {pubchemResult.iupacName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right sm:text-right shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono block">Khối lượng phân tử:</span>
                    <span className="font-mono text-sm font-bold text-slate-200">
                      {pubchemResult.molarStr || `${pubchemResult.molarMass} g/mol`}
                    </span>
                  </div>
                </div>

                {/* Safety summary from PubChem */}
                {pubchemResult.safetySummary && (
                  <div className="p-3 rounded-lg bg-[#12161f] border border-[#202838] text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-amber-400 font-mono font-bold block mb-1">
                      Mô tả an toàn (PubChem / GHS):
                    </span>
                    <p className="line-clamp-3 text-slate-400">{pubchemResult.safetySummary}</p>
                  </div>
                )}

                {/* External Cross Links preview */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    Đường dẫn liên kết trang web tra cứu bên ngoài:
                  </span>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <a
                      href={pubchemResult.pubchemUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1f283a] text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>PubChem NIH</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={pubchemResult.wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1f283a] text-slate-300 border border-[#262f3d] flex items-center gap-1.5 transition-colors"
                    >
                      <span>Wikipedia</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={pubchemResult.sigmaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1f283a] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>Sigma-Aldrich</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={pubchemResult.chemSpiderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1f283a] text-teal-300 border border-teal-500/30 flex items-center gap-1.5 transition-colors"
                    >
                      <span>ChemSpider</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {(() => {
                      const icsc = getIcscUrl({ formula: pubchemResult.formula, name: pubchemResult.name });
                      return (
                        <a
                          href={icsc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#1f283a] text-blue-300 border border-blue-500/35 flex items-center gap-1.5 transition-colors"
                          title="Mở Thẻ An Toàn Hóa Chất Quốc Tế ILO / WHO (ICSC)"
                        >
                          <ShieldAlert className="w-3 h-3 text-blue-400" />
                          <span>{icsc.cardId ? `ILO ICSC #${icsc.cardId}` : 'ILO ICSC (WHO)'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      );
                    })()}
                  </div>
                </div>

                {/* User customizable inputs for Danger & SDS link before adding */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#1f2633]">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Mức độ nguy hiểm:
                    </label>
                    <select
                      value={pubchemDanger}
                      onChange={(e) => setPubchemDanger(e.target.value as DangerLevel)}
                      className="w-full bg-[#12161f] border border-[#2a3445] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    >
                      <option value="safe">🟢 An toàn</option>
                      <option value="caution">🟡 Thận trọng</option>
                      <option value="danger">🔴 Nguy hiểm</option>
                      <option value="extreme">⚫ Cực kỳ nguy hiểm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Link SDS/MSDS ngoài (tùy chọn):
                    </label>
                    <input
                      type="url"
                      value={customSdsUrl}
                      onChange={(e) => setCustomSdsUrl(e.target.value)}
                      placeholder="https://...sds.pdf"
                      className="w-full bg-[#12161f] border border-[#2a3445] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Categories selector */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Nhóm phân loại:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-[#12161f] rounded-lg border border-[#2a3445]">
                    {allAvailableCats.map((cat) => {
                      const isSel = pubchemCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              setPubchemCategories(pubchemCategories.filter(c => c !== cat));
                            } else {
                              setPubchemCategories([...pubchemCategories, cat]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            isSel
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                              : 'bg-[#181f2c] text-slate-400 border border-[#242e40] hover:text-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f2633]">
                  {onOpenAddWithPrefill && (
                    <button
                      type="button"
                      onClick={handleCustomizeInAddForm}
                      className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-slate-100 bg-[#161c28] hover:bg-[#202738] border border-[#262f3d] rounded-lg transition-colors"
                    >
                      Tùy chỉnh trong Form
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAddPubchemToDb}
                    className="px-4 py-1.5 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>+ Thêm vào Cơ sở dữ liệu ngay</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
