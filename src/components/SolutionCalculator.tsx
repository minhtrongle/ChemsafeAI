import React, { useState, useMemo } from 'react';
import { Chemical } from '../types/chemical';
import { Calculator, Beaker, ArrowRight, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SolutionCalculatorProps {
  chemicals: Chemical[];
}

export const SolutionCalculator: React.FC<SolutionCalculatorProps> = ({ chemicals }) => {
  const [selectedChemKey, setSelectedChemKey] = useState<string>('hcl');

  // Mode 1: Molar mass & Molarity from mass
  const [massG, setMassG] = useState<string>('10');
  const [volumeL, setVolumeL] = useState<string>('0.5');

  // Mode 2: Prepare target solution (Grams needed)
  const [targetM, setTargetM] = useState<string>('1.0');
  const [targetVolumeL, setTargetVolumeL] = useState<string>('0.5');

  // Mode 3: Dilution C1*V1 = C2*V2
  const [stockM, setStockM] = useState<string>('12.0');
  const [finalM, setFinalM] = useState<string>('1.0');
  const [finalVolumeL, setFinalVolumeL] = useState<string>('0.5');

  // Mode 4: Quy đổi nồng độ phần trăm C% sang nồng độ mol CM
  const [percentC, setPercentC] = useState<string>('37');
  const [densityD, setDensityD] = useState<string>('1.19');

  const selectedChem = chemicals.find(c => c.key === selectedChemKey) || chemicals[0];
  const molarMass = selectedChem?.molarMass || 36.46;

  // Mode 1 calculations
  const calcM1 = useMemo(() => {
    const m = parseFloat(massG.replace(',', '.'));
    const v = parseFloat(volumeL.replace(',', '.'));
    if (isNaN(m) || isNaN(v) || m <= 0 || v <= 0 || molarMass <= 0) {
      return { moles: null, molarity: null };
    }
    const moles = m / molarMass;
    const molarity = moles / v;
    return { moles, molarity };
  }, [massG, volumeL, molarMass]);

  // Mode 2 calculations
  const calcM2 = useMemo(() => {
    const c = parseFloat(targetM.replace(',', '.'));
    const v = parseFloat(targetVolumeL.replace(',', '.'));
    if (isNaN(c) || isNaN(v) || c <= 0 || v <= 0 || molarMass <= 0) {
      return { molesNeeded: null, gramsNeeded: null };
    }
    const moles = c * v;
    const grams = moles * molarMass;
    return { molesNeeded: moles, gramsNeeded: grams };
  }, [targetM, targetVolumeL, molarMass]);

  // Mode 3 calculations
  const calcM3 = useMemo(() => {
    const c1 = parseFloat(stockM.replace(',', '.'));
    const c2 = parseFloat(finalM.replace(',', '.'));
    const v2 = parseFloat(finalVolumeL.replace(',', '.'));
    if (isNaN(c1) || isNaN(c2) || isNaN(v2) || c1 <= 0 || c2 <= 0 || v2 <= 0 || c1 < c2) {
      return { stockVolL: null, stockVolMl: null, waterVolL: null, waterVolMl: null, isInvalid: c1 < c2 };
    }
    const v1 = (c2 * v2) / c1;
    const water = v2 - v1;
    return {
      stockVolL: v1,
      stockVolMl: v1 * 1000,
      waterVolL: water,
      waterVolMl: water * 1000,
      isInvalid: false
    };
  }, [stockM, finalM, finalVolumeL]);

  // Mode 4 calculations: CM = 10 × d × C% / M  (d tính bằng g/mL)
  const calcM4 = useMemo(() => {
    const c = parseFloat(percentC.replace(',', '.'));
    const d = parseFloat(densityD.replace(',', '.'));
    if (isNaN(c) || isNaN(d) || c <= 0 || c > 100 || d <= 0 || molarMass <= 0) {
      return { molarity: null as number | null };
    }
    return { molarity: (10 * d * c) / molarMass };
  }, [percentC, densityD, molarMass]);

  const needsFumeHood = selectedChem?.danger === 'danger' || selectedChem?.danger === 'extreme';

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Máy tính <span className="text-emerald-400">Pha chế & Pha loãng nồng độ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tính toán khối lượng cân, nồng độ mol/L (M) và thể tích dung dịch mẹ theo công thức $C_1 V_1 = C_2 V_2$
          </p>
        </div>

        {/* Chemical Selector */}
        <div className="flex items-center gap-2 bg-[#12161f] border border-[#262f3d] rounded-lg px-3 py-1.5 text-xs">
          <span className="text-slate-400 font-mono">Hóa chất:</span>
          <select
            value={selectedChemKey}
            onChange={(e) => setSelectedChemKey(e.target.value)}
            className="bg-transparent text-emerald-400 font-mono font-bold outline-none cursor-pointer"
          >
            {chemicals.map((c) => (
              <option key={c.key} value={c.key} className="bg-[#12161f] text-slate-200">
                {c.formula} — {c.name} ({c.molar})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Banner: Selected Chemical Info & Safety Alert */}
      {selectedChem && (
        <div className="p-4 rounded-xl bg-[#12161f] border border-[#1f2633] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Công thức & Tên</span>
            <div className="font-mono text-xl font-bold text-slate-100">{selectedChem.formula}</div>
            <div className="text-xs text-slate-400 truncate">{selectedChem.name}</div>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Khối lượng mol M</span>
            <div className="font-mono text-xl font-bold text-emerald-400">{selectedChem.molar}</div>
            <span className="text-[11px] text-slate-400 font-mono">g/mol</span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">Tính chất an toàn</span>
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold mt-1 uppercase ${
              selectedChem.danger === 'danger' || selectedChem.danger === 'extreme'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {selectedChem.dangerLabel}
            </span>
          </div>

          <div className="text-xs text-slate-300 font-sans leading-relaxed border-l border-[#1f2633] pl-4">
            {selectedChem.formula.includes('H₂SO₄') || selectedChem.formula === 'H2SO4' ? (
              <div className="text-rose-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>QUY TẮC VÀNG: Luôn rót axit H₂SO₄ vào nước, không làm ngược lại!</span>
              </div>
            ) : selectedChem.formula.includes('NaOH') ? (
              <div className="text-amber-400 font-medium">
                Tỏa nhiệt mạnh khi hòa tan xút trong nước, dùng cốc chịu nhiệt và khuấy đều.
              </div>
            ) : (
              <div className="text-slate-400 text-[11px]">
                {selectedChem.msds.slice(0, 95)}...
              </div>
            )}
            <div className="mt-2 text-[11px] text-sky-300">
              Bảo hộ (PPE): kính bảo hộ, găng tay hóa chất, áo blouse
              {needsFumeHood ? '; thao tác trong tủ hút.' : '.'}
            </div>
          </div>
        </div>
      )}

      {/* 4 Worksheets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: C = n / V */}
        <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1f2633] pb-2.5">
              <Beaker className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                1. Tính nồng độ mol từ khối lượng
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Công thức: $n = m / M$ và $C_M = n / V$
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Khối lượng chất tan m (gam)</label>
                <input
                  type="number"
                  step="any"
                  value={massG}
                  onChange={(e) => setMassG(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Thể tích dung dịch V (lít)</label>
                <input
                  type="number"
                  step="any"
                  value={volumeL}
                  onChange={(e) => setVolumeL(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Số mol n:</span>
              <span className="text-slate-200 font-bold">
                {calcM1.moles !== null ? `${calcM1.moles.toFixed(4)} mol` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/5">
              <span className="text-emerald-400 font-bold">Nồng độ mol (C_M):</span>
              <span className="text-emerald-400 text-base font-bold">
                {calcM1.molarity !== null ? `${calcM1.molarity.toFixed(4)} M` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: Target preparation */}
        <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1f2633] pb-2.5">
              <Beaker className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                2. Khối lượng cân để pha dung dịch
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Xác định khối lượng cần cân để đạt nồng độ mục tiêu
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nồng độ mong muốn C_M (M)</label>
                <input
                  type="number"
                  step="any"
                  value={targetM}
                  onChange={(e) => setTargetM(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Thể tích cần pha V (lít)</label>
                <input
                  type="number"
                  step="any"
                  value={targetVolumeL}
                  onChange={(e) => setTargetVolumeL(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Số mol cần:</span>
              <span className="text-slate-200 font-bold">
                {calcM2.molesNeeded !== null ? `${calcM2.molesNeeded.toFixed(4)} mol` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/5">
              <span className="text-emerald-400 font-bold">Khối lượng cần cân (m):</span>
              <span className="text-emerald-400 text-base font-bold">
                {calcM2.gramsNeeded !== null ? `${calcM2.gramsNeeded.toFixed(3)} gam` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Module 3: Dilution C1*V1 = C2*V2 */}
        <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1f2633] pb-2.5">
              <Beaker className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                3. Pha loãng dung dịch (C₁V₁ = C₂V₂)
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Hạ nồng độ từ dung dịch mẹ đậm đặc sang dung dịch làm việc
            </p>

            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nồng độ mẹ C₁ (M)</label>
                <input
                  type="number"
                  step="any"
                  value={stockM}
                  onChange={(e) => setStockM(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nồng độ đích C₂ (M)</label>
                <input
                  type="number"
                  step="any"
                  value={finalM}
                  onChange={(e) => setFinalM(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Thể tích đích V₂ (lít)</label>
                <input
                  type="number"
                  step="any"
                  value={finalVolumeL}
                  onChange={(e) => setFinalVolumeL(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] space-y-1.5 font-mono text-xs">
            {calcM3.isInvalid ? (
              <div className="text-rose-400 text-xs">
                Lỗi: Nồng độ mẹ C₁ phải lớn hơn nồng độ đích C₂!
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Hút dung dịch mẹ (V₁):</span>
                  <span className="text-emerald-400 font-bold">
                    {calcM3.stockVolMl !== null ? `${calcM3.stockVolMl.toFixed(2)} mL` : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-white/5">
                  <span>Thêm dung môi / Nước cất:</span>
                  <span className="text-slate-200 font-bold">
                    {calcM3.waterVolMl !== null ? `${calcM3.waterVolMl.toFixed(2)} mL` : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Module 4: C% → CM */}
        <div className="bg-[#12161f] border border-[#1f2633] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-[#1f2633] pb-2.5">
              <Calculator className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                4. Quy đổi C% sang CM (CM = 10·d·C% / M)
              </h2>
            </div>
            <p className="text-[11px] text-slate-400">
              Đổi nồng độ phần trăm ghi trên chai sang nồng độ mol, dùng khối lượng mol của chất đang chọn
            </p>

            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Nồng độ phần trăm C (%)</label>
                <input
                  type="number"
                  step="any"
                  value={percentC}
                  onChange={(e) => setPercentC(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Khối lượng riêng d (g/mL) – xem trên nhãn chai hoặc SDS</label>
                <input
                  type="number"
                  step="any"
                  value={densityD}
                  onChange={(e) => setDensityD(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Nồng độ mol CM:</span>
              <span className="text-sky-400 font-bold">
                {calcM4.molarity !== null ? `${calcM4.molarity.toFixed(2)} M` : '—'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-white/5">
              Ví dụ: HCl 37%, d = 1,19 g/mL → khoảng 12,1 M
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
