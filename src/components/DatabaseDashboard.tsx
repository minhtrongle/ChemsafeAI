import React, { useMemo } from 'react';
import { Chemical, DangerLevel } from '../types/chemical';
import { getChemicalCategories } from '../data/chemicals';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  ShieldAlert,
  Layers,
  Database,
  Sparkles,
  X,
  RotateCcw,
  Scale,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Beaker
} from 'lucide-react';

interface DatabaseDashboardProps {
  chemicals: Chemical[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedDanger: string;
  onSelectDanger: (danger: string) => void;
  totalAvailableCount: number;
}

const HAZARD_CONFIG: Record<DangerLevel, { fill: string; label: string; textClass: string; badgeBg: string }> = {
  safe: {
    fill: '#10b981',
    label: 'An toàn',
    textClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30'
  },
  caution: {
    fill: '#f59e0b',
    label: 'Thận trọng',
    textClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/30'
  },
  danger: {
    fill: '#ef4444',
    label: 'Nguy hiểm',
    textClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/30'
  },
  extreme: {
    fill: '#be123c',
    label: 'Cực kỳ nguy hiểm',
    textClass: 'text-rose-600',
    badgeBg: 'bg-rose-900/20 border-rose-600/40'
  }
};

const CATEGORY_COLORS = [
  '#00d4a8', // phosphor cyan
  '#3b82f6', // laser blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // sky cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7'  // fuchsia
];

export const DatabaseDashboard: React.FC<DatabaseDashboardProps> = ({
  chemicals,
  selectedCategory,
  onSelectCategory,
  selectedDanger,
  onSelectDanger,
  totalAvailableCount
}) => {
  // 1. Category Distribution (Multi-category aware)
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};

    chemicals.forEach((chem) => {
      const cats = getChemicalCategories(chem);
      cats.forEach((c) => {
        counts[c] = (counts[c] || 0) + 1;
      });
    });

    const totalChem = chemicals.length || 1;

    return Object.entries(counts)
      .map(([name, count], idx) => ({
        name,
        count,
        percent: Math.round((count / totalChem) * 100),
        fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [chemicals]);

  // 2. Hazard Levels Distribution
  const hazardStats = useMemo(() => {
    const counts: Record<DangerLevel, number> = {
      safe: 0,
      caution: 0,
      danger: 0,
      extreme: 0
    };

    chemicals.forEach((chem) => {
      const lvl = (chem.danger || 'caution') as DangerLevel;
      if (counts[lvl] !== undefined) {
        counts[lvl] += 1;
      } else {
        counts['caution'] += 1;
      }
    });

    const total = chemicals.length || 1;

    return (Object.keys(counts) as DangerLevel[])
      .filter((lvl) => counts[lvl] > 0)
      .map((lvl) => {
        const conf = HAZARD_CONFIG[lvl] || HAZARD_CONFIG.caution;
        return {
          key: lvl,
          name: conf.label,
          count: counts[lvl],
          percent: Math.round((counts[lvl] / total) * 100),
          fill: conf.fill,
          textClass: conf.textClass
        };
      });
  }, [chemicals]);

  // 3. Molar Mass Brackets Distribution for Lab Analysis
  const molarMassBrackets = useMemo(() => {
    const brackets = [
      { range: '< 50 g/mol', min: 0, max: 50, count: 0, sample: 'Khí nhẹ, HCl, NH₃...' },
      { range: '50 - 100', min: 50, max: 100, count: 0, sample: 'H₂SO₄, HNO₃, NaOH...' },
      { range: '100 - 200', min: 100, max: 200, count: 0, sample: 'KMnO₄, CuSO₄, Axit Hữu Cơ...' },
      { range: '200 - 350', min: 200, max: 350, count: 0, sample: 'K₂Cr₂O₇, Muối phức, Thuốc nhuộm...' },
      { range: '> 350 g/mol', min: 350, max: 9999, count: 0, sample: 'Hợp chất hữu cơ lớn, Phức chất...' }
    ];

    chemicals.forEach((chem) => {
      const mass = typeof chem.molarMass === 'number' && chem.molarMass > 0
        ? chem.molarMass
        : parseFloat(String(chem.molar || '').replace(',', '.'));

      if (Number.isFinite(mass) && mass > 0) {
        const found = brackets.find((b) => mass >= b.min && mass < b.max);
        if (found) found.count += 1;
      }
    });

    return brackets;
  }, [chemicals]);

  // 4. Key Metrics Calculation
  const metrics = useMemo(() => {
    const customCount = chemicals.filter((c) => c.custom).length;
    const editedCount = chemicals.filter((c) => c.isEdited).length;
    const highRiskCount = chemicals.filter((c) => c.danger === 'danger' || c.danger === 'extreme').length;
    const highRiskPercent = chemicals.length ? Math.round((highRiskCount / chemicals.length) * 100) : 0;

    // Average Molar Mass
    const validMasses = chemicals
      .map((c) => (typeof c.molarMass === 'number' && c.molarMass > 0 ? c.molarMass : parseFloat(String(c.molar || '').replace(',', '.'))))
      .filter((m) => Number.isFinite(m) && m > 0);
    const avgMolar = validMasses.length
      ? (validMasses.reduce((acc, v) => acc + v, 0) / validMasses.length).toFixed(1)
      : 'N/A';

    return {
      total: chemicals.length,
      categoriesCount: categoryStats.length,
      highRiskCount,
      highRiskPercent,
      customCount,
      editedCount,
      avgMolar
    };
  }, [chemicals, categoryStats]);

  const isFiltered = selectedCategory !== 'all' || selectedDanger !== 'all';

  return (
    <div className="space-y-4 bg-[#12161f] border border-[#1f2633] rounded-xl p-5 shadow-sm transition-all animate-fadeIn">
      {/* Header and Filter Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f2633] pb-3.5 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>Trực Quan Hóa & Phân Tích CSDL Hóa Chất</span>
              <span className="text-[10px] font-mono font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Interactive Charts
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Nhấp trực tiếp vào các cột hoặc lát bánh biểu đồ để tự động lọc hóa chất theo nhóm và cấp độ rủi ro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isFiltered && (
            <button
              onClick={() => {
                onSelectCategory('all');
                onSelectDanger('all');
              }}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
              title="Đặt lại bộ lọc từ biểu đồ"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại lọc biểu đồ</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 bg-[#0c0f14] px-2.5 py-1 rounded border border-[#1f2633]">
            CSDL: {chemicals.length} chất
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total in DB */}
        <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Tổng hóa chất</span>
            <Database className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {metrics.total}
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-[#1a212e] mt-1">
            <span>Tự thêm: <strong className="text-emerald-400">{metrics.customCount}</strong></span>
            <span>Đã hiệu chỉnh: <strong className="text-amber-400">{metrics.editedCount}</strong></span>
          </div>
        </div>

        {/* Categories Count */}
        <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Nhóm phân loại</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {metrics.categoriesCount}
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-[#1a212e] mt-1 truncate">
            Đa phân loại linh hoạt
          </div>
        </div>

        {/* High Risk Proportion */}
        <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Hóa chất rủi ro cao</span>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-mono font-bold text-rose-400">
            {metrics.highRiskPercent}%
          </div>
          <div className="text-[10px] text-rose-400/90 font-mono pt-1 border-t border-[#1a212e] mt-1 truncate">
            {metrics.highRiskCount} chất Nguy hiểm & Cực độc
          </div>
        </div>

        {/* Average Molar Mass */}
        <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px]">Khối lượng mol TB</span>
            <Scale className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-xl font-mono font-bold text-teal-400">
            {metrics.avgMolar} <span className="text-xs font-normal text-slate-400">g/mol</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-[#1a212e] mt-1">
            Tính toán trên dữ liệu phân tử
          </div>
        </div>
      </div>

      {/* Filter Tag Bar if active */}
      {isFiltered && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5 px-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400">Đang lọc danh sách theo biểu đồ:</span>
            {selectedCategory !== 'all' && (
              <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/40">
                Nhóm: <strong>{selectedCategory}</strong>
              </span>
            )}
            {selectedDanger !== 'all' && (
              <span className="bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded border border-rose-500/40">
                Mức độ: <strong>{HAZARD_CONFIG[selectedDanger as DangerLevel]?.label || selectedDanger}</strong>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onSelectCategory('all');
              onSelectDanger('all');
            }}
            className="hover:text-emerald-100 flex items-center gap-1 text-[11px] underline"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      )}

      {/* Chart Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* CHART 1: Category Distribution Bar Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0c0f14] border border-[#1f2633] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200">
                  Phân bố Hóa chất theo Nhóm phân loại
                </h3>
                <p className="text-[10px] text-slate-400">
                  Nhấp vào cột bất kỳ để lọc nhanh danh mục bên dưới
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#12161f] px-2 py-0.5 rounded border border-[#1f2633]">
              Recharts Bar
            </span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryStats}
                margin={{ top: 15, right: 10, left: -20, bottom: 35 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f2633"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Space Mono' }}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Space Mono' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#12161f] border border-[#262f3d] rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <div className="font-bold text-slate-200 mb-1">
                            {data.name}
                          </div>
                          <div className="text-emerald-400">
                            Số lượng: <strong>{data.count}</strong> hóa chất ({data.percent}%)
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Nhấp để lọc danh sách
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    if (entry && entry.name) {
                      onSelectCategory(String(entry.name));
                    }
                  }}
                >
                  {categoryStats.map((entry, index) => {
                    const isSelected = selectedCategory.toLowerCase() === entry.name.toLowerCase();
                    const isDimmed = selectedCategory !== 'all' && !isSelected;
                    return (
                      <Cell
                        key={`db-cat-${index}`}
                        fill={entry.fill}
                        opacity={isDimmed ? 0.35 : 1}
                        stroke={isSelected ? '#ffffff' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Hazard Levels Donut Pie Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0c0f14] border border-[#1f2633] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200">
                  Cơ cấu Mức độ Nguy hiểm
                </h3>
                <p className="text-[10px] text-slate-400">
                  Nhấp vào lát cắt biểu đồ để lọc
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#12161f] px-2 py-0.5 rounded border border-[#1f2633]">
              Recharts Donut
            </span>
          </div>

          <div className="w-full h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardStats}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  stroke="#0c0f14"
                  strokeWidth={2}
                  cursor="pointer"
                  onClick={(entry: any) => {
                    if (entry && entry.key) {
                      onSelectDanger(entry.key);
                    }
                  }}
                >
                  {hazardStats.map((entry) => {
                    const isSelected = selectedDanger === entry.key;
                    const isDimmed = selectedDanger !== 'all' && !isSelected;
                    return (
                      <Cell
                        key={`db-pie-${entry.key}`}
                        fill={entry.fill}
                        opacity={isDimmed ? 0.35 : 1}
                        stroke={isSelected ? '#ffffff' : undefined}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#12161f] border border-[#262f3d] rounded-lg p-2.5 shadow-xl text-xs font-mono">
                          <div className={`font-bold ${data.textClass} mb-1`}>
                            {data.name}
                          </div>
                          <div className="text-slate-200">
                            Số lượng: <strong>{data.count}</strong> chất ({data.percent}%)
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Nhấp để lọc danh sách
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Label */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-xl font-mono font-bold text-slate-100">
                {chemicals.length}
              </span>
              <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Chất
              </span>
            </div>
          </div>

          {/* Interactive Legend Row */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1a212e]">
            {hazardStats.map((item) => {
              const isSelected = selectedDanger === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onSelectDanger(isSelected ? 'all' : item.key)}
                  className={`flex items-center justify-between px-2 py-1 rounded text-[11px] font-mono transition-all text-left ${
                    isSelected
                      ? 'bg-white/10 border border-white/30 text-white'
                      : 'hover:bg-[#12161f] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold ml-1">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CHART 3: Molar Mass Range Distribution Breakdown */}
      <div className="bg-[#0c0f14] border border-[#1f2633] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-teal-400" />
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-200">
                Phân bố Phổ khối lượng mol phân tử (Molar Mass Spectrum)
              </h3>
              <p className="text-[10px] text-slate-400">
                Thống kê số lượng hóa chất theo các dải khối lượng mol g/mol trong cơ sở dữ liệu
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-[#12161f] px-2 py-0.5 rounded border border-[#1f2633]">
            Molecular Weight
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {molarMassBrackets.map((bracket, i) => {
            const pct = chemicals.length ? Math.round((bracket.count / chemicals.length) * 100) : 0;
            return (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#12161f] border border-[#1f2633] space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-semibold">{bracket.range}</span>
                  <span className="text-teal-400 font-bold">{bracket.count} chất</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#0c0f14] rounded-full h-1.5 overflow-hidden border border-[#1f2633]">
                  <div
                    className="bg-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct * 2, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400">
                  <span>{pct}% CSDL</span>
                  <span className="truncate ml-1 max-w-[100px] text-slate-500" title={bracket.sample}>
                    {bracket.sample}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
