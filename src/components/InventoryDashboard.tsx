import React, { useMemo } from 'react';
import { InventoryItem, Chemical } from '../types/chemical';
import { compactFormula, getChemicalCategory, getChemicalCategories } from '../data/chemicals';
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
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, ShieldAlert, Layers, MapPin, Package, X, RotateCcw } from 'lucide-react';

interface InventoryDashboardProps {
  inventory: InventoryItem[];
  chemicals: Chemical[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedDanger?: string;
  onSelectDanger?: (danger: string) => void;
}

const HAZARD_COLORS: Record<string, { fill: string; label: string; textClass: string }> = {
  safe: { fill: '#10b981', label: 'An toàn', textClass: 'text-emerald-400' },
  caution: { fill: '#f59e0b', label: 'Thận trọng', textClass: 'text-amber-400' },
  danger: { fill: '#ef4444', label: 'Nguy hiểm', textClass: 'text-rose-400' },
  extreme: { fill: '#be123c', label: 'Cực kỳ nguy hiểm', textClass: 'text-rose-600' }
};

const CATEGORY_PALETTE = [
  '#00d4a8', // phosphor cyan
  '#3b82f6', // laser blue
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#10b981', // emerald
  '#ef4444', // red
  '#06b6d4', // sky cyan
  '#6366f1'  // indigo
];

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({
  inventory,
  chemicals,
  selectedCategory = 'all',
  onSelectCategory,
  selectedDanger = 'all',
  onSelectDanger
}) => {
  // 1. Compute Category Statistics for Bar Chart (supports multi-category items)
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};

    inventory.forEach((item) => {
      const cats = getChemicalCategories(item);
      cats.forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const total = inventory.length || 1;

    return Object.entries(counts)
      .map(([name, count], index) => ({
        name,
        count,
        percent: Math.round((count / total) * 100),
        fill: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [inventory, chemicals]);

  // 2. Compute Hazard Level Statistics for Pie Chart
  const hazardData = useMemo(() => {
    const counts: Record<string, number> = {
      safe: 0,
      caution: 0,
      danger: 0,
      extreme: 0
    };

    inventory.forEach((item) => {
      const level = item.danger || 'caution';
      counts[level] = (counts[level] || 0) + 1;
    });

    const total = inventory.length || 1;

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([level, count]) => {
        const info = HAZARD_COLORS[level] || { fill: '#64748b', label: level, textClass: 'text-slate-400' };
        const percent = Math.round((count / total) * 100);
        return {
          key: level,
          name: info.label,
          count,
          percent,
          color: info.fill,
          textClass: info.textClass
        };
      });
  }, [inventory]);

  // 3. Compute KPI Summary Metrics
  const metrics = useMemo(() => {
    const uniqueLocations = new Set(inventory.map((i) => i.location.trim())).size;
    const highRiskCount = inventory.filter(
      (i) => i.danger === 'danger' || i.danger === 'extreme'
    ).length;
    const highRiskPercent = inventory.length
      ? Math.round((highRiskCount / inventory.length) * 100)
      : 0;

    return {
      total: inventory.length,
      locations: uniqueLocations,
      categoriesCount: categoryData.length,
      highRiskCount,
      highRiskPercent
    };
  }, [inventory, categoryData]);

  if (inventory.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-[#12161f] border border-[#1f2633] text-center text-xs text-slate-400 space-y-2">
        <Package className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-slate-300 font-medium">Chưa có dữ liệu thống kê biểu đồ</p>
        <p>Hãy thêm các hóa chất vào kho để Recharts tự động tạo biểu đồ phân loại và mức độ rủi ro.</p>
      </div>
    );
  }

  const isFiltered = selectedCategory !== 'all' || selectedDanger !== 'all';

  return (
    <div className="space-y-4 bg-[#12161f] border border-[#1f2633] rounded-xl p-5 shadow-sm">
      {/* Dashboard Top Header & KPIs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f2633] pb-3 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Bảng Thống Kê & Phân Tích Kho Hóa Chất (Recharts Dashboard)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={() => {
                  onSelectCategory?.('all');
                  onSelectDanger?.('all');
                }}
                className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition-colors"
                title="Hủy bộ lọc từ biểu đồ"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại lọc biểu đồ</span>
              </button>
            )}
            <span className="text-[11px] font-mono text-slate-400">
              Dữ liệu: {metrics.total} mẫu hóa chất
            </span>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-[#0c0f14] border border-[#1f2633]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Tổng số lượng</span>
              <Package className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-mono font-bold text-slate-100">
              {metrics.total}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Chai / Bình chứa</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0f14] border border-[#1f2633]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Vị trí lưu trữ</span>
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-mono font-bold text-slate-100">
              {metrics.locations}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Tủ / Kệ riêng biệt</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0f14] border border-[#1f2633]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Nhóm phân loại</span>
              <Layers className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-mono font-bold text-slate-100">
              {metrics.categoriesCount}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Nhóm hóa chất</span>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0f14] border border-[#1f2633]">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Tỉ lệ nguy cơ cao</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-mono font-bold text-rose-400">
              {metrics.highRiskPercent}%
            </div>
            <span className="text-[10px] text-rose-400/80 font-mono">
              {metrics.highRiskCount} chất Nguy hiểm & Cực độc
            </span>
          </div>
        </div>
      </div>

      {/* Filter indicator banner if active */}
      {isFiltered && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-lg p-2.5 px-3 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Đang lọc danh sách theo biểu đồ:</span>
            {selectedCategory !== 'all' && (
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                Nhóm: <strong>{selectedCategory}</strong>
              </span>
            )}
            {selectedDanger !== 'all' && (
              <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/40">
                Mức độ: <strong>{HAZARD_COLORS[selectedDanger]?.label || selectedDanger}</strong>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              onSelectCategory?.('all');
              onSelectDanger?.('all');
            }}
            className="hover:text-emerald-100 flex items-center gap-1 text-[11px]"
          >
            <X className="w-3.5 h-3.5" />
            <span>Bỏ lọc</span>
          </button>
        </div>
      )}

      {/* 2 Charts Grid: Bar Chart (7 cols) + Pie Chart (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* CHART 1: Chemical Categories Bar Chart */}
        <div className="lg:col-span-7 bg-[#0c0f14] border border-[#1f2633] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200">
                  Phân bố theo Nhóm hóa chất
                </h3>
                <p className="text-[10px] text-slate-400">
                  Nhấp vào cột để lọc danh sách kho theo nhóm đó
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
                data={categoryData}
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
                            Nhấp chuột để lọc bảng kho
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
                    if (onSelectCategory && entry && entry.name) {
                      onSelectCategory(String(entry.name));
                    }
                  }}
                >
                  {categoryData.map((entry, index) => {
                    const isSelected = selectedCategory.toLowerCase() === entry.name.toLowerCase();
                    const isDimmed = selectedCategory !== 'all' && !isSelected;
                    return (
                      <Cell
                        key={`cell-${index}`}
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

        {/* CHART 2: Hazard Levels Pie / Donut Chart */}
        <div className="lg:col-span-5 bg-[#0c0f14] border border-[#1f2633] rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-400" />
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200">
                  Tỉ lệ Mức độ Nguy hiểm
                </h3>
                <p className="text-[10px] text-slate-400">
                  Nhấp vào phần biểu đồ để lọc theo cấp độ rủi ro
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#12161f] px-2 py-0.5 rounded border border-[#1f2633]">
              Recharts Pie
            </span>
          </div>

          <div className="w-full h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardData}
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
                    if (onSelectDanger && entry && entry.key) {
                      onSelectDanger(String(entry.key));
                    }
                  }}
                >
                  {hazardData.map((entry, index) => {
                    const isSelected = selectedDanger === entry.key;
                    const isDimmed = selectedDanger !== 'all' && !isSelected;
                    return (
                      <Cell
                        key={`cell-pie-${index}`}
                        fill={entry.color}
                        opacity={isDimmed ? 0.35 : 1}
                        stroke={isSelected ? '#ffffff' : '#0c0f14'}
                        strokeWidth={isSelected ? 2.5 : 1}
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
                          <div
                            className="font-bold mb-1"
                            style={{ color: data.color }}
                          >
                            {data.name}
                          </div>
                          <div className="text-slate-300">
                            Số lượng: <strong>{data.count}</strong> mẫu ({data.percent}%)
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Nhấp chuột để lọc bảng kho
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={38}
                  content={() => (
                    <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px] font-mono">
                      {hazardData.map((item) => {
                        const isSelected = selectedDanger === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => onSelectDanger?.(item.key)}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors ${
                              isSelected
                                ? 'bg-slate-800 text-slate-100 ring-1 ring-slate-400'
                                : 'text-slate-300 hover:text-slate-100'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>
                              {item.name}: <strong>{item.count}</strong> ({item.percent}%)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
