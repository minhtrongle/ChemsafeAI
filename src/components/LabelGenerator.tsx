import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Chemical, DangerLevel } from '../types/chemical';
import { getChemicalCategory, compactFormula, isBaseChemical } from '../data/chemicals';
import { buildQrUrl, cleanBaseUrl } from '../utils/qrLink';
import { Download, Printer, RefreshCw, CheckCircle2, AlertOctagon, Link2, ExternalLink } from 'lucide-react';

const QR_BASE_KEY = 'chemsafe_qr_base_url';

function defaultBaseUrl(): string {
  try {
    const saved = localStorage.getItem(QR_BASE_KEY);
    if (saved) return saved;
  } catch { /* ignore */ }
  if (typeof window === 'undefined') return '/';
  return `${window.location.origin}${window.location.pathname}`;
}

interface LabelGeneratorProps {
  initialChemical?: Chemical | null;
  chemicals: Chemical[];
}

export const LabelGenerator: React.FC<LabelGeneratorProps> = ({
  initialChemical,
  chemicals
}) => {
  const [name, setName] = useState<string>(initialChemical?.name || 'Axit Clohydric');
  const [formula, setFormula] = useState<string>(initialChemical?.formula || 'HCl');
  const [danger, setDanger] = useState<DangerLevel>(initialChemical?.danger || 'danger');
  const [location, setLocation] = useState<string>('Tủ A3 — Kệ 2 (Chuyên dụng)');
  const [contact, setContact] = useState<string>('Cấp cứu 115 · Phòng thiết bị: ...');
  const [category, setCategory] = useState<string>('Axit vô cơ mạnh');
  const [notes, setNotes] = useState<string>('Ăn mòn mạnh. Thao tác bắt buộc trong tủ hút.');
  const [createdDate, setCreatedDate] = useState<string>(new Date().toLocaleDateString('vi-VN'));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [qrGenerated, setQrGenerated] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>(defaultBaseUrl);

  useEffect(() => {
    try { localStorage.setItem(QR_BASE_KEY, baseUrl); } catch { /* ignore */ }
  }, [baseUrl]);

  // Chất đang chọn có thuộc bộ dữ liệu gốc không (để QR chỉ cần mang khóa ngắn gọn)
  const matchedBase = chemicals.find(c => compactFormula(c.formula) === compactFormula(formula) && isBaseChemical(c.formula));

  const qrUrl = buildQrUrl(baseUrl, matchedBase
    ? { chem: matchedBase.key, location, contact, date: createdDate }
    : { name, formula, danger, notes: notes.slice(0, 160), location, contact, date: createdDate });
  const isLocalhost = /\/\/(localhost|127\.0\.0\.1|\[::1\])/.test(cleanBaseUrl(baseUrl));

  // Sync if initial chemical changed
  useEffect(() => {
    if (initialChemical) {
      setName(initialChemical.name);
      setFormula(initialChemical.formula);
      setDanger(initialChemical.danger);
      setCategory(getChemicalCategory(initialChemical));
      setNotes(initialChemical.msds.slice(0, 80));
    }
  }, [initialChemical]);

  // Generate QR code onto canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    // Mã QR chứa đường dẫn tới trang thông tin riêng của chất (nền trắng)
    const qrText = qrUrl;

    QRCode.toCanvas(
      canvasRef.current,
      qrText,
      {
        width: 180,
        margin: 1,
        color: {
          dark: '#0a0c10',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      },
      (error) => {
        if (error) console.error('QR code error:', error);
        else setQrGenerated(true);
      }
    );
  }, [qrUrl]);

  // Download high-resolution label
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.lineWidth = 12;
    ctx.strokeStyle = danger === 'extreme' ? '#111827' : danger === 'danger' ? '#ef4444' : danger === 'caution' ? '#f59e0b' : '#10b981';
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Header bar
    ctx.fillStyle = danger === 'extreme' ? '#111827' : danger === 'danger' ? '#ef4444' : danger === 'caution' ? '#f59e0b' : '#10b981';
    ctx.fillRect(20, 20, width - 40, 160);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 58px Space Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formula, width / 2, 95);

    ctx.font = '500 28px Plus Jakarta Sans, sans-serif';
    ctx.fillText(name, width / 2, 145);

    // Hazard Badge
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px Space Mono, monospace';
    const hazardText = danger === 'extreme' ? '☠ CỰC KỲ NGUY HIỂM' : danger === 'danger' ? '⚠ NGUY HIỂM' : danger === 'caution' ? '⚡ THẬN TRỌNG' : '✔ AN TOÀN';
    ctx.fillText(hazardText, width / 2, 225);

    // Draw QR in center
    if (canvasRef.current) {
      const qrSize = 360;
      ctx.drawImage(canvasRef.current, (width - qrSize) / 2, 260, qrSize, qrSize);
    }

    // Detail box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(50, 650, width - 100, 260);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 650, width - 100, 260);

    ctx.fillStyle = '#334155';
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`Vị trí: ${location}`, 80, 700);
    ctx.fillText(`Nhóm: ${category}`, 80, 745);
    ctx.fillText(`Liên hệ khẩn cấp: ${contact}`, 80, 790);

    ctx.font = 'normal 18px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Ghi chú: ${notes.slice(0, 60)}`, 80, 835);
    ctx.fillText(`Ngày đóng gói/kiểm tra: ${createdDate}`, 80, 875);

    // Footer
    ctx.font = 'bold 16px Space Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('CHEMSAFE AI — HỆ THỐNG AN TOÀN PHÒNG THÍ NGHIỆM', width / 2, 950);

    const a = document.createElement('a');
    a.download = `Nhan_${formula.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLoadPreset = (selectedFormula: string) => {
    const chem = chemicals.find(c => c.formula === selectedFormula);
    if (chem) {
      setName(chem.name);
      setFormula(chem.formula);
      setDanger(chem.danger);
      setNotes(chem.msds.slice(0, 90));
    }
  };

  const dangerColors = {
    safe: { border: 'border-emerald-500', headerBg: 'bg-emerald-500', text: 'text-emerald-400', label: 'AN TOÀN' },
    caution: { border: 'border-amber-500', headerBg: 'bg-amber-500', text: 'text-amber-400', label: 'THẬN TRỌNG' },
    danger: { border: 'border-rose-500', headerBg: 'bg-rose-500', text: 'text-rose-400', label: 'NGUY HIỂM' },
    extreme: { border: 'border-slate-800', headerBg: 'bg-slate-900', text: 'text-slate-100', label: 'CỰC KỲ NGUY HIỂM' }
  };

  const activeColor = dangerColors[danger];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <AlertOctagon className="w-6 h-6 text-emerald-400" />
            Tạo nhãn hóa chất & <span className="text-emerald-400">Mã QR phòng Lab</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thiết kế tem nhãn dán chai lọ hóa chất tiêu chuẩn, đính kèm mã QR định vị và thông tin ứng phó sự cố
          </p>
        </div>

        {/* Preset quick selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400">Mẫu có sẵn:</label>
          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="bg-[#12161f] border border-[#262f3d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            defaultValue=""
          >
            <option value="" disabled>Chọn hóa chất mẫu...</option>
            {chemicals.slice(0, 20).map(c => (
              <option key={c.key} value={c.formula}>{c.formula} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-[#12161f] border border-[#1f2633] rounded-xl p-5 space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-2">
            Thông số nhãn dán
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Công thức hóa học *</label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="VD: HCl, H2SO4, NaOH"
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Tên hóa chất tiếng Việt *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Axit Clohydric"
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Mức độ cảnh báo nguy hiểm</label>
              <select
                value={danger}
                onChange={(e) => setDanger(e.target.value as DangerLevel)}
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              >
                <option value="safe">🟢 An toàn (Độc tính thấp)</option>
                <option value="caution">🟡 Thận trọng (Kích ứng / Oxy hóa)</option>
                <option value="danger">🔴 Nguy hiểm (Ăn mòn / Độc tính)</option>
                <option value="extreme">⚫ Cực kỳ nguy hiểm (Chết người / Ung thư)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Nhóm phân loại</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="VD: Axit vô cơ, Dung môi cháy..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Vị trí lưu trữ trong Lab *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Tủ A3 - Kệ 2, Phòng 105"
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase text-slate-400">Liên hệ khẩn cấp *</label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="VD: 0901-234-567 hoặc hotline 115"
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Địa chỉ trang web khi quét mã QR
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="VD: https://chemsafe-ai.vercel.app/"
              className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none transition-colors"
            />
            {isLocalhost && (
              <p className="text-[10.5px] text-amber-300 leading-snug">
                ⚠ Đang là địa chỉ localhost – điện thoại khác sẽ không mở được. Hãy nhập địa chỉ ứng dụng đã triển khai
                (Vercel, Netlify, GitHub Pages…) hoặc IP mạng LAN của máy (vd. http://192.168.1.10:5173/).
              </p>
            )}
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10.5px] font-mono text-emerald-300 hover:underline break-all"
            >
              <ExternalLink className="w-3 h-3 shrink-0" /> Mở thử trang QR: {qrUrl}
            </a>
            {!matchedBase && (
              <p className="text-[10.5px] text-slate-400">
                Chất không có trong bộ dữ liệu gốc → mã QR mang theo tên, công thức, mức nguy hiểm và ghi chú (không có liên kết PubChem/ICSC tự động).
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase text-slate-400">Ghi chú an toàn & Hướng dẫn sử dụng</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Ăn mòn mạnh. Thao tác bắt buộc trong tủ hút. Tránh tiếp xúc da."
              className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 min-w-[140px] px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Tải file ảnh PNG HD</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#171d28] hover:bg-[#202736] border border-[#2b3547] text-slate-200 font-mono text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>In nhãn dán</span>
            </button>
          </div>
        </div>

        {/* Right Label Preview: 5 cols */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
            Bản xem trước nhãn dán thực tế
          </div>

          {/* Physical Label Card */}
          <div
            ref={cardRef}
            className={`w-[320px] bg-white text-slate-900 rounded-xl overflow-hidden shadow-2xl border-4 ${activeColor.border} transition-all`}
          >
            {/* Header banner */}
            <div className={`${activeColor.headerBg} text-white p-4 text-center select-none`}>
              <div className="font-mono text-3xl font-bold tracking-tight">{formula || '???'}</div>
              <div className="text-xs font-medium opacity-90 truncate mt-0.5">{name || 'Chưa đặt tên'}</div>
              <div className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-black/30">
                {activeColor.label}
              </div>
            </div>

            {/* QR Canvas Box */}
            <div className="p-4 bg-white flex flex-col items-center justify-center border-b border-slate-100">
              <canvas ref={canvasRef} className="rounded-md shadow-xs" />
              <span className="text-[10px] font-mono text-slate-400 mt-2">
                Quét mã để mở trang thông tin an toàn (PubChem · ICSC)
              </span>
            </div>

            {/* Information Rows */}
            <div className="p-3.5 space-y-2 text-xs bg-slate-50 text-slate-700 font-sans">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Vị trí:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">{location}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Nhóm:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[190px]">{category}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-400 text-[11px]">Khẩn cấp:</span>
                <span className="font-mono text-slate-900 font-bold">{contact}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-400 text-[11px]">Ngày niêm yết:</span>
                <span className="font-mono text-slate-500 text-[11px]">{createdDate}</span>
              </div>

              {notes && (
                <div className="mt-2 p-2 rounded bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900 leading-snug">
                  {notes}
                </div>
              )}
            </div>

            {/* Bottom Brand */}
            <div className="px-3 py-1.5 bg-slate-200 text-center font-mono text-[9px] text-slate-500 tracking-wider uppercase">
              ChemSafe AI · Laboratory Standards
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center mt-4 max-w-xs leading-relaxed font-mono">
            * Kích thước chuẩn tỉ lệ tem dán chai lọ 60x80mm hoặc 75x100mm giấy decal chống nước.
          </div>
        </div>
      </div>
    </div>
  );
};
