import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, Chemical, LabCabinet, LabDrawer, CabinetType, DangerLevel, MixWarning } from '../types/chemical';
import { MixSourceLinks } from './MixSourceLinks';
import { getStoredLabCabinets, saveStoredLabCabinets, resetLabCabinets, resolveItemLocation } from '../data/labCabinets';
import { compactFormula, normalizeText } from '../data/chemicals';
import { checkIncompatibility, MIX_WARNINGS } from '../data/mixWarnings';
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Box,
  Layers,
  Flame,
  FlaskConical,
  Snowflake,
  Sparkles,
  Check,
  X,
  QrCode,
  MoveRight,
  Info,
  Maximize2,
  FolderPlus,
  HelpCircle,
  GripVertical,
  Move,
  RotateCcw,
  Grid,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';

interface LabMapProps {
  inventory: InventoryItem[];
  chemicals: Chemical[];
  onUpdateInventory: (updated: InventoryItem[]) => void;
  onPrintQR: (item: InventoryItem) => void;
  onOpenQuickAdd?: () => void;
}

export const LabMap: React.FC<LabMapProps> = ({
  inventory,
  chemicals,
  onUpdateInventory,
  onPrintQR,
  onOpenQuickAdd
}) => {
  const [cabinets, setCabinets] = useState<LabCabinet[]>(() => getStoredLabCabinets());
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>('cab_a');
  const [activeViewMode, setActiveViewMode] = useState<'floorplan' | 'racks'>('floorplan');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // 2D Drag & Drop interactive canvas states
  const blueprintRef = useRef<HTMLDivElement>(null);
  const [draggingCabinetId, setDraggingCabinetId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  const MAP_CANVAS_WIDTH = 760;
  const MAP_CANVAS_HEIGHT = 500;

  // Assignment Modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assignTargetCabinetId, setAssignTargetCabinetId] = useState<string>('cab_a');
  const [assignTargetDrawerId, setAssignTargetDrawerId] = useState<string>('drw_a1');
  const [selectedItemIdToAssign, setSelectedItemIdToAssign] = useState<string>('');

  // Move Chemical Modal state
  const [movingItem, setMovingItem] = useState<InventoryItem | null>(null);
  const [moveTargetCabinetId, setMoveTargetCabinetId] = useState<string>('cab_a');
  const [moveTargetDrawerId, setMoveTargetDrawerId] = useState<string>('drw_a1');

  // Add Cabinet Modal state
  const [isAddCabinetModalOpen, setIsAddCabinetModalOpen] = useState<boolean>(false);
  const [newCabCode, setNewCabCode] = useState<string>('');
  const [newCabName, setNewCabName] = useState<string>('');
  const [newCabZone, setNewCabZone] = useState<string>('');
  const [newCabType, setNewCabType] = useState<CabinetType>('general');
  const [newCabNotes, setNewCabNotes] = useState<string>('');

  // Add Drawer Modal state
  const [isAddDrawerModalOpen, setIsAddDrawerModalOpen] = useState<boolean>(false);
  const [drawerCabTargetId, setDrawerCabTargetId] = useState<string>('');
  const [newDrawerCode, setNewDrawerCode] = useState<string>('');
  const [newDrawerName, setNewDrawerName] = useState<string>('');
  const [newDrawerDesc, setNewDrawerDesc] = useState<string>('');

  // Map each inventory item to a cabinet and drawer
  const itemPlacementMap = useMemo(() => {
    const map = new Map<string, { cabinetId: string; drawerId: string }>();
    const unassigned: InventoryItem[] = [];

    inventory.forEach((item) => {
      const resolved = resolveItemLocation(item.location, cabinets);
      if (resolved.cabinet && resolved.drawer) {
        map.set(item.id, {
          cabinetId: resolved.cabinet.id,
          drawerId: resolved.drawer.id
        });
      } else {
        unassigned.push(item);
      }
    });

    return { placements: map, unassigned };
  }, [inventory, cabinets]);

  // Group inventory items by cabinet and drawer
  const cabinetItemGroups = useMemo(() => {
    const groups: Record<string, Record<string, InventoryItem[]>> = {};

    cabinets.forEach((cab) => {
      groups[cab.id] = {};
      cab.drawers.forEach((drw) => {
        groups[cab.id][drw.id] = [];
      });
    });

    inventory.forEach((item) => {
      const placement = itemPlacementMap.placements.get(item.id);
      if (placement && groups[placement.cabinetId]?.[placement.drawerId]) {
        groups[placement.cabinetId][placement.drawerId].push(item);
      }
    });

    return groups;
  }, [inventory, cabinets, itemPlacementMap]);

  // Auditor: Detect dangerous incompatibilities within each cabinet and drawer
  const cabinetIncompatibilityAudits = useMemo(() => {
    const cabinetWarnings: Record<string, { c1: string; c2: string; title: string; drawerName: string; warning: MixWarning }[]> = {};

    cabinets.forEach((cab) => {
      const warningsList: { c1: string; c2: string; title: string; drawerName: string; warning: MixWarning }[] = [];
      cab.drawers.forEach((drw) => {
        const items = cabinetItemGroups[cab.id]?.[drw.id] || [];
        if (items.length > 1) {
          for (let i = 0; i < items.length; i++) {
            for (let j = i + 1; j < items.length; j++) {
              const itemA = items[i];
              const itemB = items[j];
              const incomp = checkIncompatibility(itemA.formula, itemB.formula);
              if (incomp) {
                warningsList.push({
                  c1: `${itemA.name} (${itemA.formula})`,
                  c2: `${itemB.name} (${itemB.formula})`,
                  title: incomp.title,
                  drawerName: drw.code,
                  warning: incomp
                });
              }
            }
          }
        }
      });
      cabinetWarnings[cab.id] = warningsList;
    });

    return cabinetWarnings;
  }, [cabinets, cabinetItemGroups]);

  // Filtered cabinets
  const filteredCabinets = useMemo(() => {
    return cabinets.filter((cab) => {
      if (typeFilter !== 'all' && cab.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [cabinets, typeFilter]);

  // Currently inspected cabinet
  const selectedCabinet = useMemo(() => {
    return cabinets.find((c) => c.id === selectedCabinetId) || cabinets[0] || null;
  }, [cabinets, selectedCabinetId]);

  // Highlighted cabinet when searching
  const searchedItemLocation = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = normalizeText(searchQuery);
    const compactQ = compactFormula(searchQuery);

    const match = inventory.find((item) => {
      const text = normalizeText(`${item.name} ${item.formula} ${item.location}`);
      const fCompact = compactFormula(item.formula);
      return text.includes(q) || (compactQ && fCompact.includes(compactQ));
    });

    if (!match) return null;

    const placement = itemPlacementMap.placements.get(match.id);
    if (!placement) return { item: match, cabinet: null, drawer: null };

    const cab = cabinets.find((c) => c.id === placement.cabinetId) || null;
    const drw = cab?.drawers.find((d) => d.id === placement.drawerId) || null;
    return { item: match, cabinet: cab, drawer: drw };
  }, [searchQuery, inventory, itemPlacementMap, cabinets]);

  // Save cabinets modification
  const updateCabinets = (newCabs: LabCabinet[]) => {
    setCabinets(newCabs);
    saveStoredLabCabinets(newCabs);
  };

  // Pointer Drag & Drop handlers for 2D Floorplan
  const handleCabinetPointerDown = (e: React.PointerEvent, cab: LabCabinet) => {
    // Avoid triggering drag if user clicked an action button inside the card
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    e.preventDefault();
    if (!blueprintRef.current) return;
    const rect = blueprintRef.current.getBoundingClientRect();
    const currentX = cab.gridPos?.x ?? 50;
    const currentY = cab.gridPos?.y ?? 50;
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    setDragOffset({
      x: pointerX - currentX,
      y: pointerY - currentY
    });
    setDraggingCabinetId(cab.id);
    setDragCurrentPos({ x: currentX, y: currentY });
    setSelectedCabinetId(cab.id);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleCabinetPointerMove = (e: React.PointerEvent) => {
    if (!draggingCabinetId || !blueprintRef.current) return;
    const rect = blueprintRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left - dragOffset.x;
    const rawY = e.clientY - rect.top - dragOffset.y;

    const cab = cabinets.find((c) => c.id === draggingCabinetId);
    const cabW = cab?.gridPos?.w || 165;
    const cabH = cab?.gridPos?.h || 110;

    let targetX = snapToGrid ? Math.round(rawX / 10) * 10 : Math.round(rawX);
    let targetY = snapToGrid ? Math.round(rawY / 10) * 10 : Math.round(rawY);

    targetX = Math.max(10, Math.min(MAP_CANVAS_WIDTH - cabW - 10, targetX));
    targetY = Math.max(10, Math.min(MAP_CANVAS_HEIGHT - cabH - 10, targetY));

    setDragCurrentPos({ x: targetX, y: targetY });
  };

  const handleCabinetPointerUp = (e: React.PointerEvent) => {
    if (!draggingCabinetId) return;

    if (dragCurrentPos) {
      // Dynamic zone calculation based on coordinates
      let newZoneDesc = '';
      if (dragCurrentPos.x < 240) {
        newZoneDesc = dragCurrentPos.y < 200 ? 'Khu Tây Bắc — Dãy Tủ Axit' : 'Khu Tây Nam — Cạnh Bồn Rửa Khẩn Cấp';
      } else if (dragCurrentPos.x > 490) {
        newZoneDesc = dragCurrentPos.y < 200 ? 'Khu Đông Bắc — Khu Thoát Khí Riêng' : 'Khu Đông Nam — Tách Biệt Dung Môi';
      } else {
        newZoneDesc = dragCurrentPos.y < 150 ? 'Vách Phía Bắc — Hệ Thống Hút Khí Trực Tiếp' : 'Khu Trung Tâm — Dãy Bàn Thí Nghiệm';
      }

      const updated = cabinets.map((c) => {
        if (c.id === draggingCabinetId) {
          return {
            ...c,
            zone: newZoneDesc || c.zone,
            gridPos: {
              ...(c.gridPos || { w: 165, h: 110 }),
              x: dragCurrentPos.x,
              y: dragCurrentPos.y
            }
          };
        }
        return c;
      });
      updateCabinets(updated);
    }

    setDraggingCabinetId(null);
    setDragCurrentPos(null);
  };

  const handleNudgeCabinet = (cabId: string, dx: number, dy: number) => {
    const cab = cabinets.find((c) => c.id === cabId);
    if (!cab) return;
    const currentX = cab.gridPos?.x ?? 50;
    const currentY = cab.gridPos?.y ?? 50;
    const cabW = cab.gridPos?.w || 165;
    const cabH = cab.gridPos?.h || 110;

    let targetX = currentX + dx;
    let targetY = currentY + dy;
    if (snapToGrid) {
      targetX = Math.round(targetX / 10) * 10;
      targetY = Math.round(targetY / 10) * 10;
    }
    targetX = Math.max(10, Math.min(MAP_CANVAS_WIDTH - cabW - 10, targetX));
    targetY = Math.max(10, Math.min(MAP_CANVAS_HEIGHT - cabH - 10, targetY));

    const updated = cabinets.map((c) => {
      if (c.id === cabId) {
        return {
          ...c,
          gridPos: {
            ...(c.gridPos || { w: 165, h: 110 }),
            x: targetX,
            y: targetY
          }
        };
      }
      return c;
    });
    updateCabinets(updated);
  };

  const handleSetCabinetPos = (cabId: string, x: number, y: number) => {
    const cab = cabinets.find((c) => c.id === cabId);
    if (!cab) return;
    const cabW = cab.gridPos?.w || 165;
    const cabH = cab.gridPos?.h || 110;

    const targetX = Math.max(10, Math.min(MAP_CANVAS_WIDTH - cabW - 10, x));
    const targetY = Math.max(10, Math.min(MAP_CANVAS_HEIGHT - cabH - 10, y));

    const updated = cabinets.map((c) => {
      if (c.id === cabId) {
        return {
          ...c,
          gridPos: {
            ...(c.gridPos || { w: 165, h: 110 }),
            x: targetX,
            y: targetY
          }
        };
      }
      return c;
    });
    updateCabinets(updated);
  };

  const handleResetLayout = () => {
    if (window.confirm('Khôi phục toàn bộ các tủ về vị trí sơ đồ mặc định ban đầu?')) {
      const reset = resetLabCabinets();
      setCabinets(reset);
    }
  };

  // Assign Chemical to Drawer
  const handleAssignChemical = (itemId: string, cabId: string, drwId: string) => {
    const cab = cabinets.find((c) => c.id === cabId);
    const drw = cab?.drawers.find((d) => d.id === drwId);
    if (!cab || !drw) return;

    const locationText = `${cab.code} — Ngăn ${drw.code}: ${drw.name}`;

    const updatedInventory = inventory.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          location: locationText,
          updatedAt: new Date().toLocaleDateString('vi-VN')
        };
      }
      return item;
    });

    onUpdateInventory(updatedInventory);
    setIsAssignModalOpen(false);
    setSelectedCabinetId(cabId);
  };

  // Unassign Chemical
  const handleUnassignChemical = (itemId: string) => {
    const updatedInventory = inventory.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          location: 'Chưa phân vị trí tủ',
          updatedAt: new Date().toLocaleDateString('vi-VN')
        };
      }
      return item;
    });
    onUpdateInventory(updatedInventory);
  };

  // Add New Cabinet
  const handleCreateCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCabCode.trim() || !newCabName.trim()) return;

    const newId = `cab_custom_${Date.now()}`;
    const typeColorMap: Record<CabinetType, string> = {
      acid: '#f97316',
      base: '#06b6d4',
      flammable: '#ef4444',
      oxidizer: '#a855f7',
      general: '#10b981',
      cold: '#38bdf8',
      fume_hood: '#eab308',
      toxic: '#e11d48'
    };

    const newCabinet: LabCabinet = {
      id: newId,
      code: newCabCode.trim(),
      name: newCabName.trim(),
      zone: newCabZone.trim() || 'Khu Lưu Trữ Chung',
      type: newCabType,
      color: typeColorMap[newCabType] || '#10b981',
      iconName: 'Box',
      notes: newCabNotes.trim() || 'Tủ lưu trữ tiêu chuẩn',
      gridPos: {
        x: 285,
        y: 340,
        w: 175,
        h: 110
      },
      drawers: [
        {
          id: `drw_${newId}_1`,
          code: `${newCabCode.trim()}1`,
          name: `Ngăn ${newCabCode.trim()}1 — Lưu trữ chính`,
          description: 'Ngăn tiêu chuẩn',
          maxCapacity: 12
        }
      ]
    };

    const updated = [...cabinets, newCabinet];
    updateCabinets(updated);
    setSelectedCabinetId(newId);
    setIsAddCabinetModalOpen(false);
    setNewCabCode('');
    setNewCabName('');
    setNewCabZone('');
    setNewCabNotes('');
  };

  // Add Drawer to Cabinet
  const handleCreateDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrawerCode.trim() || !newDrawerName.trim()) return;

    const targetCab = cabinets.find((c) => c.id === drawerCabTargetId);
    if (!targetCab) return;

    const newDrawer: LabDrawer = {
      id: `drw_${Date.now()}`,
      code: newDrawerCode.trim(),
      name: newDrawerName.trim(),
      description: newDrawerDesc.trim() || 'Ngăn lưu trữ bổ sung',
      maxCapacity: 12
    };

    const updated = cabinets.map((cab) => {
      if (cab.id === drawerCabTargetId) {
        return {
          ...cab,
          drawers: [...cab.drawers, newDrawer]
        };
      }
      return cab;
    });

    updateCabinets(updated);
    setIsAddDrawerModalOpen(false);
    setNewDrawerCode('');
    setNewDrawerName('');
    setNewDrawerDesc('');
  };

  // Check compatibility warning before assigning
  const assignmentIncompatibilityCheck = useMemo(() => {
    if (!selectedItemIdToAssign || !assignTargetCabinetId || !assignTargetDrawerId) {
      return null;
    }
    const targetItem = inventory.find((i) => i.id === selectedItemIdToAssign);
    if (!targetItem) return null;

    const existingItemsInDrawer = cabinetItemGroups[assignTargetCabinetId]?.[assignTargetDrawerId] || [];
    for (const other of existingItemsInDrawer) {
      if (other.id === targetItem.id) continue;
      const incomp = checkIncompatibility(targetItem.formula, other.formula);
      if (incomp) {
        return {
          otherItem: other,
          incomp
        };
      }
    }
    return null;
  }, [selectedItemIdToAssign, assignTargetCabinetId, assignTargetDrawerId, inventory, cabinetItemGroups]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                Sơ đồ Phòng Thí Nghiệm & <span className="text-emerald-400">Bản Đồ Kệ Tủ</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Trực quan hóa không gian phòng lab 2D, gán hóa chất vào từng tủ và ngăn kéo chuyên dụng, tự động cảnh báo kỵ nhau
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="bg-[#12161f] p-1 rounded-lg border border-[#1f2633] flex items-center">
            <button
              onClick={() => setActiveViewMode('floorplan')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                activeViewMode === 'floorplan'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Mặt bằng 2D</span>
            </button>
            <button
              onClick={() => setActiveViewMode('racks')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                activeViewMode === 'racks'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dãy kệ chi tiết</span>
            </button>
          </div>

          {/* Quick Assign Button */}
          <button
            onClick={() => {
              if (itemPlacementMap.unassigned.length > 0) {
                setSelectedItemIdToAssign(itemPlacementMap.unassigned[0].id);
              } else if (inventory.length > 0) {
                setSelectedItemIdToAssign(inventory[0].id);
              }
              setIsAssignModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Gán vào tủ/ngăn</span>
          </button>

          {/* Add Cabinet Button */}
          <button
            onClick={() => setIsAddCabinetModalOpen(true)}
            className="px-3 py-2 text-xs font-mono font-medium text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#262f3d] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Tạo tủ mới</span>
          </button>
        </div>
      </div>

      {/* Lab Overview Metrics & KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2633] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tổng số tủ & kệ</span>
            <Box className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-slate-100">
            {cabinets.length} <span className="text-xs font-normal text-slate-400">tủ</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Tổng cộng {cabinets.reduce((acc, c) => acc + c.drawers.length, 0)} ngăn kéo
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2633] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Đã định vị trong tủ</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">
            {inventory.length - itemPlacementMap.unassigned.length}
            <span className="text-xs font-normal text-slate-400"> / {inventory.length}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {inventory.length > 0
              ? `${Math.round(((inventory.length - itemPlacementMap.unassigned.length) / inventory.length) * 100)}% đã có vị trí chuẩn`
              : 'Chưa có mẫu'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2633] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Chưa gán ngăn tủ</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-bold text-amber-400">
            {itemPlacementMap.unassigned.length} <span className="text-xs font-normal text-slate-400">mẫu</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Cần gán vị trí lưu kho
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12161f] border border-[#1f2633] space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cảnh báo kỵ nhau trong tủ</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          {(() => {
            const totalWarns = Object.values(cabinetIncompatibilityAudits).reduce(
              (acc, list) => acc + list.length,
              0
            );
            return (
              <>
                <div
                  className={`text-xl font-mono font-bold ${
                    totalWarns > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {totalWarns} <span className="text-xs font-normal text-slate-400">nguy cơ</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {totalWarns > 0 ? 'Xếp chung ngăn nguy hiểm!' : 'Kho an toàn tuyệt đối'}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Search Bar & Type Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#12161f] p-3 rounded-xl border border-[#1f2633]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Định vị nhanh hóa chất (nhập tên, công thức HCl, Ethanol)..."
            className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c0f14]'
            }`}
          >
            Tất cả tủ
          </button>
          <button
            onClick={() => setTypeFilter('acid')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              typeFilter === 'acid'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c0f14]'
            }`}
          >
            Tủ Axit
          </button>
          <button
            onClick={() => setTypeFilter('base')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              typeFilter === 'base'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c0f14]'
            }`}
          >
            Tủ Kiềm
          </button>
          <button
            onClick={() => setTypeFilter('flammable')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              typeFilter === 'flammable'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c0f14]'
            }`}
          >
            Tủ Chống cháy
          </button>
          <button
            onClick={() => setTypeFilter('cold')}
            className={`px-3 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
              typeFilter === 'cold'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-[#0c0f14]'
            }`}
          >
            Tủ Lạnh
          </button>
        </div>
      </div>

      {/* Searched Chemical Highlight Notification */}
      {searchedItemLocation && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              ⌖
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-300">
                Đã định vị thành công: {searchedItemLocation.item.name} ({searchedItemLocation.item.formula})
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {searchedItemLocation.cabinet && searchedItemLocation.drawer ? (
                  <>
                    Vị trí hiện tại:{' '}
                    <strong className="text-emerald-400">{searchedItemLocation.cabinet.name}</strong> →{' '}
                    <span className="text-slate-100 font-medium">{searchedItemLocation.drawer.name}</span>
                  </>
                ) : (
                  <span className="text-amber-300 italic">
                    Hóa chất này chưa được gán vào tủ cụ thể (Vị trí ghi nhận: {searchedItemLocation.item.location})
                  </span>
                )}
              </div>
            </div>
          </div>
          {searchedItemLocation.cabinet && (
            <button
              onClick={() => setSelectedCabinetId(searchedItemLocation.cabinet!.id)}
              className="px-3 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-mono font-medium border border-emerald-500/40 flex items-center gap-1 self-end sm:self-auto"
            >
              <span>Xem tủ này</span>
              <MoveRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* MAIN VIEW AREA: Floorplan OR Racks */}
      {activeViewMode === 'floorplan' ? (
        /* ================= 2D LABORATORY FLOORPLAN VIEW ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 2D Interactive Draggable Blueprint Map (8 cols) */}
          <div className="lg:col-span-8 bg-[#0c0f14] border border-[#1f2633] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
            {/* Blueprint Header with Drag Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2633] pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Mặt Bằng 2D Phòng Thí Nghiệm Trung Tâm (Lab Floorplan)
                  </h3>
                </div>
                <p className="text-[11px] font-mono text-emerald-400/90 mt-0.5 flex items-center gap-1.5">
                  <Move className="w-3 h-3 text-emerald-400" />
                  <span>Kéo & thả trực tiếp các khối tủ trên mặt bằng để thay đổi vị trí</span>
                </p>
              </div>

              {/* Blueprint Canvas Toolbar */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Snap to grid button */}
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  title="Bật/Tắt tự động hít lưới tọa độ 10px"
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1.5 border ${
                    snapToGrid
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#141923] text-slate-400 border-[#222a38] hover:text-slate-200'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Hít lưới 10px: {snapToGrid ? 'Bật' : 'Tắt'}</span>
                </button>

                {/* Show Grid Lines */}
                <button
                  onClick={() => setShowGridLines(!showGridLines)}
                  title="Hiện hoặc ẩn lưới kẻ ô kỹ thuật"
                  className={`px-2 py-1 rounded-md text-xs font-mono transition-colors flex items-center gap-1 border ${
                    showGridLines
                      ? 'bg-[#192231] text-sky-300 border-sky-500/40'
                      : 'bg-[#141923] text-slate-400 border-[#222a38] hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lưới</span>
                </button>

                {/* Reset Layout button */}
                <button
                  onClick={handleResetLayout}
                  title="Khôi phục toàn bộ các tủ về vị trí mặc định ban đầu"
                  className="px-2.5 py-1 rounded-md text-xs font-mono text-slate-400 hover:text-rose-300 bg-[#141923] hover:bg-rose-950/30 border border-[#222a38] hover:border-rose-500/40 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Khôi phục</span>
                </button>
              </div>
            </div>

            {/* Architectural Room Canvas Container (Horizontal Scrollable on small screens) */}
            <div className="overflow-x-auto w-full rounded-xl bg-[#070a0f] p-2 border border-[#1b2230]">
              <div
                ref={blueprintRef}
                style={{ width: `${MAP_CANVAS_WIDTH}px`, height: `${MAP_CANVAS_HEIGHT}px` }}
                className="relative rounded-lg border border-[#222b3b] bg-[#090d15] select-none mx-auto overflow-hidden touch-none"
              >
                {/* Blueprint Technical Grid Pattern */}
                {showGridLines && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage:
                        'radial-gradient(#38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                )}

                {/* Technical architectural wall labels */}
                <div className="absolute top-1.5 left-3 text-[9px] font-mono text-slate-400 tracking-wider pointer-events-none z-10">
                  [TÂY BẮC — DÃY TỦ CHỐNG ĂN MÒN]
                </div>
                <div className="absolute top-1.5 right-3 text-[9px] font-mono text-slate-400 tracking-wider pointer-events-none z-10">
                  [ĐÔNG BẮC — KHU THOÁT KHÍ & DUNG MÔI NFPA]
                </div>
                <div className="absolute bottom-1.5 left-3 text-[9px] font-mono text-slate-400 tracking-wider pointer-events-none z-10">
                  [TÂY NAM — BỒN RỬA & CỬA VÀO CHÍNH]
                </div>
                <div className="absolute bottom-1.5 right-3 text-[9px] font-mono text-slate-400 tracking-wider pointer-events-none z-10">
                  [ĐÔNG NAM — TRẠM CỨU HỎA & SƠ CỨU]
                </div>

                {/* Permanent Architectural Fixtures on the Blueprint */}
                {/* North Wall: Exhaust Ventilation Trunk */}
                <div
                  style={{ left: '20px', top: '6px', width: '720px', height: '18px' }}
                  className="absolute rounded bg-[#0f1520] border border-dashed border-[#20293a] flex items-center justify-center text-[9px] font-mono text-slate-400 pointer-events-none"
                >
                  ═══ HỆ THỐNG ĐƯỜNG ỐNG THÔNG GIÓ & HÚT KHÍ TRẦN PHÒNG LAB ═══
                </div>

                {/* Central Workbench Island 1 */}
                <div
                  style={{ left: '260px', top: '140px', width: '240px', height: '60px' }}
                  className="absolute rounded-lg bg-[#0e131d]/90 border border-dashed border-[#252f42] flex flex-col items-center justify-center text-center p-2 pointer-events-none z-0"
                >
                  <div className="text-[10px] font-mono font-bold text-slate-400">
                    BÀN THÍ NGHIỆM TRUNG TÂM 1
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Cân phân tích 4 số lẻ • Máy đo pH • Khuấy từ
                  </div>
                </div>

                {/* Central Workbench Island 2 */}
                <div
                  style={{ left: '260px', top: '350px', width: '240px', height: '60px' }}
                  className="absolute rounded-lg bg-[#0e131d]/90 border border-dashed border-[#252f42] flex flex-col items-center justify-center text-center p-2 pointer-events-none z-0"
                >
                  <div className="text-[10px] font-mono font-bold text-slate-400">
                    BÀN THÍ NGHIỆM TRUNG TÂM 2
                  </div>
                  <div className="text-[9px] text-slate-400">
                    Hệ chưng cất hồi lưu • Chuẩn độ dung dịch
                  </div>
                </div>

                {/* Main Entrance Door (South West) */}
                <div
                  style={{ left: '30px', top: '455px', width: '165px', height: '32px' }}
                  className="absolute rounded bg-[#10151f] border border-emerald-500/30 flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-400/80 pointer-events-none"
                >
                  <span>🚪 CỬA VÀO CHÍNH / THOÁT HIỂM</span>
                </div>

                {/* Emergency Eye Wash & Safety Shower (South East) */}
                <div
                  style={{ left: '550px', top: '455px', width: '175px', height: '32px' }}
                  className="absolute rounded bg-[#0f1724] border border-cyan-500/30 flex items-center justify-center gap-1.5 text-[10px] font-mono text-cyan-400 pointer-events-none"
                >
                  <span>🚿 BỒN RỬA MẮT & VÒI TẮM CẤP CỨU</span>
                </div>

                {/* Fire Safety CO2 & Dry Sand Station */}
                <div
                  style={{ left: '550px', top: '320px', width: '175px', height: '60px' }}
                  className="absolute rounded-lg bg-[#181116] border border-dashed border-rose-500/30 flex flex-col items-center justify-center gap-0.5 text-center p-1 pointer-events-none"
                >
                  <span className="text-[10px] font-mono font-bold text-rose-400 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>TRẠM CHỮA CHÁY CO₂</span>
                  </span>
                  <span className="text-[9px] text-rose-300/70">
                    Bình khí CO₂ 24kg & Thùng cát khô
                  </span>
                </div>

                {/* Dynamic Draggable Cabinets */}
                {filteredCabinets.map((cab) => {
                  const isDragging = draggingCabinetId === cab.id;
                  const posX = isDragging && dragCurrentPos ? dragCurrentPos.x : (cab.gridPos?.x ?? 50);
                  const posY = isDragging && dragCurrentPos ? dragCurrentPos.y : (cab.gridPos?.y ?? 50);
                  const width = cab.gridPos?.w ?? 165;
                  const height = cab.gridPos?.h ?? 110;
                  const isSelected = selectedCabinetId === cab.id;
                  const hasSearchedItem = searchedItemLocation?.cabinet?.id === cab.id;
                  const itemsCount = Object.values(cabinetItemGroups[cab.id] || {}).reduce(
                    (a, b) => a + b.length,
                    0
                  );
                  const warnings = cabinetIncompatibilityAudits[cab.id] || [];

                  return (
                    <div
                      key={cab.id}
                      onPointerDown={(e) => handleCabinetPointerDown(e, cab)}
                      onPointerMove={handleCabinetPointerMove}
                      onPointerUp={handleCabinetPointerUp}
                      onClick={() => setSelectedCabinetId(cab.id)}
                      style={{
                        left: `${posX}px`,
                        top: `${posY}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        zIndex: isDragging ? 50 : isSelected ? 40 : 20
                      }}
                      className={`absolute rounded-xl border p-2.5 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none ${
                        isDragging ? 'transition-none' : 'transition-all duration-150'
                      } ${
                        isDragging
                          ? 'ring-2 ring-emerald-400 shadow-2xl scale-105 bg-[#151d2a] border-emerald-400'
                          : hasSearchedItem
                          ? 'ring-2 ring-emerald-400 shadow-xl bg-[#17212e] border-emerald-500'
                          : isSelected
                          ? 'bg-[#141b27] border-emerald-500/70 shadow-lg ring-1 ring-emerald-500/40'
                          : 'bg-[#10151f] hover:bg-[#131924] border-[#222a3a] hover:border-slate-600 shadow-sm'
                      }`}
                    >
                      {/* Floating Coordinates Tooltip when Dragging */}
                      {isDragging && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono font-bold text-[10px] whitespace-nowrap shadow-md pointer-events-none flex items-center gap-1">
                          <Move className="w-2.5 h-2.5" />
                          <span>X: {posX}px • Y: {posY}px</span>
                        </div>
                      )}

                      {/* Cabinet Top Bar: Grip, Code badge, Warning indicator */}
                      <div className="flex items-center justify-between pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <GripVertical
                            className={`w-3.5 h-3.5 ${
                              isDragging ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          />
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold"
                            style={{
                              backgroundColor: `${cab.color}20`,
                              color: cab.color,
                              border: `1px solid ${cab.color}40`
                            }}
                          >
                            {cab.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {warnings.length > 0 && (
                            <span
                              className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-mono font-bold flex items-center gap-0.5 animate-pulse"
                              title="Phát hiện hóa chất kỵ nhau!"
                            >
                              ⚠ {warnings.length}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            {itemsCount} mẫu
                          </span>
                        </div>
                      </div>

                      {/* Cabinet Name */}
                      <div className="pointer-events-none my-1">
                        <div className="text-[11px] font-bold text-slate-200 line-clamp-1">
                          {cab.name}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center justify-between mt-0.5 font-mono">
                          <span>{cab.drawers.length} ngăn kéo</span>
                          <span className="text-slate-400 opacity-75">
                            ({posX}, {posY})
                          </span>
                        </div>
                      </div>

                      {/* Cabinet Bottom Bar */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1a2130] text-[9px] font-mono">
                        {warnings.length > 0 ? (
                          <span className="text-rose-400 font-bold">Kỵ nhau</span>
                        ) : (
                          <span className="text-emerald-400">✓ An toàn</span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCabinetId(cab.id);
                          }}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-300 hover:text-emerald-300 hover:bg-[#1f2738] transition-colors"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Status & Drag Legend Bar */}
            <div className="mt-3 pt-3 border-t border-[#1f2633] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Kéo chuột hoặc ngón tay để đổi vị trí</span>
                </span>
                <span className="hidden sm:inline text-slate-400">•</span>
                <span className="hidden sm:inline text-slate-400">
                  Vị trí được tự động lưu vào bộ nhớ trình duyệt
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">Tủ đang chọn:</span>
                <strong className="text-emerald-400">{selectedCabinet?.code} — {selectedCabinet?.name}</strong>
              </div>
            </div>
          </div>

          {/* Cabinet Inspector Panel (4 cols) */}
          <div className="lg:col-span-4 bg-[#12161f] border border-[#1f2633] rounded-2xl p-5 flex flex-col justify-between space-y-4">
            {selectedCabinet ? (
              <div className="space-y-4">
                {/* Cabinet Header */}
                <div className="border-b border-[#1f2633] pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${selectedCabinet.color}20`,
                        color: selectedCabinet.color,
                        border: `1px solid ${selectedCabinet.color}40`
                      }}
                    >
                      {selectedCabinet.code}
                    </span>
                    <button
                      onClick={() => {
                        setDrawerCabTargetId(selectedCabinet.id);
                        setNewDrawerCode(`${selectedCabinet.code}${selectedCabinet.drawers.length + 1}`);
                        setIsAddDrawerModalOpen(true);
                      }}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm ngăn kéo</span>
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">
                    {selectedCabinet.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedCabinet.zone}
                  </p>
                  {selectedCabinet.notes && (
                    <div className="mt-2 p-2 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-[11px] text-slate-300 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedCabinet.notes}</span>
                    </div>
                  )}
                </div>

                {/* 2D Position & Nudge Controller for Selected Cabinet */}
                <div className="p-3 rounded-xl bg-[#0c0f14] border border-[#1f2633] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tọa Độ 2D & Vị Trí</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      X: {selectedCabinet.gridPos?.x ?? 50}px • Y: {selectedCabinet.gridPos?.y ?? 50}px
                    </span>
                  </div>

                  {/* Manual Coordinate Inputs */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Tọa độ X (Ngang):</label>
                      <input
                        type="number"
                        min="10"
                        max={MAP_CANVAS_WIDTH - (selectedCabinet.gridPos?.w || 165) - 10}
                        step="10"
                        value={selectedCabinet.gridPos?.x ?? 50}
                        onChange={(e) =>
                          handleSetCabinetPos(
                            selectedCabinet.id,
                            Number(e.target.value),
                            selectedCabinet.gridPos?.y ?? 50
                          )
                        }
                        className="w-full bg-[#12161f] border border-[#232b3a] rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:border-emerald-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Tọa độ Y (Dọc):</label>
                      <input
                        type="number"
                        min="10"
                        max={MAP_CANVAS_HEIGHT - (selectedCabinet.gridPos?.h || 110) - 10}
                        step="10"
                        value={selectedCabinet.gridPos?.y ?? 50}
                        onChange={(e) =>
                          handleSetCabinetPos(
                            selectedCabinet.id,
                            selectedCabinet.gridPos?.x ?? 50,
                            Number(e.target.value)
                          )
                        }
                        className="w-full bg-[#12161f] border border-[#232b3a] rounded px-2.5 py-1 text-slate-200 font-mono text-xs focus:border-emerald-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Directional Nudge Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">Điều hướng nhanh:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleNudgeCabinet(selectedCabinet.id, -10, 0)}
                        title="Di chuyển sang Trái 10px"
                        className="p-1 rounded bg-[#161c27] hover:bg-[#202838] text-slate-300 border border-[#242c3d]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudgeCabinet(selectedCabinet.id, 0, -10)}
                        title="Di chuyển Lên 10px"
                        className="p-1 rounded bg-[#161c27] hover:bg-[#202838] text-slate-300 border border-[#242c3d]"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudgeCabinet(selectedCabinet.id, 0, 10)}
                        title="Di chuyển Xuống 10px"
                        className="p-1 rounded bg-[#161c27] hover:bg-[#202838] text-slate-300 border border-[#242c3d]"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudgeCabinet(selectedCabinet.id, 10, 0)}
                        title="Di chuyển sang Phải 10px"
                        className="p-1 rounded bg-[#161c27] hover:bg-[#202838] text-slate-300 border border-[#242c3d]"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    💡 Hoặc kéo trực tiếp khối tủ này trên bản đồ mặt bằng 2D bên trái.
                  </p>
                </div>

                {/* Cabinet Warning Alert if any */}
                {(cabinetIncompatibilityAudits[selectedCabinet.id] || []).length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-mono">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Phát hiện kỵ nhau trong tủ {selectedCabinet.code}!</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-rose-200 pl-5">
                      {cabinetIncompatibilityAudits[selectedCabinet.id].map((w, idx) => (
                        <div key={idx}>
                          • Tại ngăn <strong>[{w.drawerName}]</strong>: {w.c1} kỵ {w.c2} → {w.title}
                          <MixSourceLinks warning={w.warning} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drawers Rack List */}
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Danh sách ngăn kéo ({selectedCabinet.drawers.length})</span>
                    <button
                      onClick={() => {
                        setAssignTargetCabinetId(selectedCabinet.id);
                        if (selectedCabinet.drawers[0]) {
                          setAssignTargetDrawerId(selectedCabinet.drawers[0].id);
                        }
                        if (itemPlacementMap.unassigned.length > 0) {
                          setSelectedItemIdToAssign(itemPlacementMap.unassigned[0].id);
                        }
                        setIsAssignModalOpen(true);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-mono flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Gán hóa chất</span>
                    </button>
                  </div>

                  {selectedCabinet.drawers.map((drw) => {
                    const drawerItems = cabinetItemGroups[selectedCabinet.id]?.[drw.id] || [];

                    return (
                      <div
                        key={drw.id}
                        className="p-3 rounded-xl bg-[#0c0f14] border border-[#1f2633] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[#171d28] border border-[#2b3547] text-slate-200 font-mono font-bold text-xs flex items-center justify-center">
                              {drw.code}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-200">
                                {drw.name}
                              </div>
                              {drw.description && (
                                <div className="text-[10px] text-slate-400">
                                  {drw.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12161f] text-slate-400 border border-[#1f2633]">
                            {drawerItems.length} mẫu
                          </span>
                        </div>

                        {/* List of items inside this drawer */}
                        {drawerItems.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {drawerItems.map((item) => (
                              <div
                                key={item.id}
                                className="p-2 rounded-lg bg-[#141923] border border-[#222a38] flex items-center justify-between gap-2 text-xs group"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-emerald-300">
                                      {item.formula}
                                    </span>
                                    <span className="text-slate-300 truncate">
                                      {item.name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {item.quantity} • Mức độ: {item.danger}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                                  <button
                                    onClick={() => {
                                      setMovingItem(item);
                                      setMoveTargetCabinetId(selectedCabinet.id);
                                      setMoveTargetDrawerId(drw.id);
                                    }}
                                    title="Di chuyển sang ngăn khác"
                                    className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#1f2633]"
                                  >
                                    <MoveRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onPrintQR(item)}
                                    title="In nhãn QR hóa chất này"
                                    className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-[#1f2633]"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleUnassignChemical(item.id)}
                                    title="Gỡ khỏi ngăn tủ này"
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1f2633]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-2.5 px-3 rounded-lg bg-[#12161f]/50 border border-dashed border-[#1f2633] text-center text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Ngăn còn trống</span>
                            <button
                              onClick={() => {
                                setAssignTargetCabinetId(selectedCabinet.id);
                                setAssignTargetDrawerId(drw.id);
                                if (itemPlacementMap.unassigned.length > 0) {
                                  setSelectedItemIdToAssign(itemPlacementMap.unassigned[0].id);
                                }
                                setIsAssignModalOpen(true);
                              }}
                              className="text-emerald-400 hover:underline text-[10px] font-mono"
                            >
                              + Gán hóa chất vào đây
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chọn một tủ trên sơ đồ để xem chi tiết các ngăn kéo
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= DETAILED RACKS MATRIX VIEW ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCabinets.map((cab) => {
              const warnings = cabinetIncompatibilityAudits[cab.id] || [];
              const itemsCount = Object.values(cabinetItemGroups[cab.id] || {}).reduce(
                (a, b) => a + b.length,
                0
              );

              return (
                <div
                  key={cab.id}
                  className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                >
                  <div>
                    {/* Cabinet Card Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-mono font-bold"
                        style={{
                          backgroundColor: `${cab.color}20`,
                          color: cab.color,
                          border: `1px solid ${cab.color}40`
                        }}
                      >
                        {cab.code}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {itemsCount} hóa chất
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">
                      {cab.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cab.zone}
                    </p>

                    {/* Warnings Badge */}
                    {warnings.length > 0 && (
                      <div className="mt-2.5 p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Phát hiện {warnings.length} cặp phản ứng kỵ nhau!</span>
                      </div>
                    )}

                    {/* Drawers list inside card */}
                    <div className="mt-4 space-y-2">
                      <div className="text-[11px] font-mono text-slate-400 uppercase font-bold">
                        Ngăn kéo ({cab.drawers.length}):
                      </div>
                      {cab.drawers.map((drw) => {
                        const drwItems = cabinetItemGroups[cab.id]?.[drw.id] || [];
                        return (
                          <div
                            key={drw.id}
                            className="p-2.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-mono">
                              <span className="font-bold text-slate-200">
                                [{drw.code}] {drw.name}
                              </span>
                              <span className="text-slate-400 text-[10px]">
                                {drwItems.length} mẫu
                              </span>
                            </div>

                            {/* Chemicals preview chips */}
                            {drwItems.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {drwItems.map((item) => (
                                  <span
                                    key={item.id}
                                    className="px-1.5 py-0.5 rounded bg-[#171d28] border border-[#242c3b] font-mono text-[10px] text-emerald-300"
                                  >
                                    {item.formula}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">
                                Trống
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="pt-3 border-t border-[#1f2633] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedCabinetId(cab.id);
                        setActiveViewMode('floorplan');
                      }}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>Xem trên mặt bằng 2D</span>
                      <MoveRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setAssignTargetCabinetId(cab.id);
                        if (cab.drawers[0]) setAssignTargetDrawerId(cab.drawers[0].id);
                        if (itemPlacementMap.unassigned.length > 0) {
                          setSelectedItemIdToAssign(itemPlacementMap.unassigned[0].id);
                        }
                        setIsAssignModalOpen(true);
                      }}
                      className="text-xs font-mono text-slate-300 hover:text-slate-100 px-2 py-1 rounded bg-[#171d28] border border-[#2b3547]"
                    >
                      + Gán hóa chất
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unassigned Chemicals Shelf / Drawer (Kho tạm chưa phân bổ) */}
      {itemPlacementMap.unassigned.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#12161f] border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                Hóa chất chưa phân bổ vào tủ cụ thể ({itemPlacementMap.unassigned.length} mẫu)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Cần chọn ngăn lưu trữ an toàn theo phân loại axit/kiềm/dung môi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
            {itemPlacementMap.unassigned.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#0c0f14] border border-[#1f2633] space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {item.formula}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Chưa gán
                    </span>
                  </div>
                  <div className="font-medium text-slate-200 mt-1 line-clamp-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ghi chú hiện tại: {item.location || 'Chưa ghi'}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedItemIdToAssign(item.id);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full mt-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Gán vào tủ ngay</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: GÁN HÓA CHẤT VÀO TỦ & NGĂN ================= */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#242c3b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-[#1f2633] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Gán Vị Trí Lưu Kho (Chọn Tủ & Ngăn Kéo)
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Select Chemical */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  1. Chọn hóa chất cần gán:
                </label>
                <select
                  value={selectedItemIdToAssign}
                  onChange={(e) => setSelectedItemIdToAssign(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.formula} — {item.name} ({item.location || 'Chưa có vị trí'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Cabinet */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  2. Chọn tủ lưu trữ đích:
                </label>
                <select
                  value={assignTargetCabinetId}
                  onChange={(e) => {
                    const cabId = e.target.value;
                    setAssignTargetCabinetId(cabId);
                    const cab = cabinets.find((c) => c.id === cabId);
                    if (cab && cab.drawers[0]) {
                      setAssignTargetDrawerId(cab.drawers[0].id);
                    }
                  }}
                  className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  {cabinets.map((cab) => (
                    <option key={cab.id} value={cab.id}>
                      [{cab.code}] {cab.name} ({cab.zone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Drawer */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  3. Chọn ngăn kéo trong tủ:
                </label>
                {(() => {
                  const targetCab = cabinets.find((c) => c.id === assignTargetCabinetId);
                  return (
                    <select
                      value={assignTargetDrawerId}
                      onChange={(e) => setAssignTargetDrawerId(e.target.value)}
                      className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                    >
                      {targetCab?.drawers.map((drw) => (
                        <option key={drw.id} value={drw.id}>
                          Ngăn {drw.code}: {drw.name}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              {/* Incompatibility Live Check Banner */}
              {assignmentIncompatibilityCheck && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-1 text-xs">
                  <div className="flex items-center gap-2 font-bold text-rose-400 font-mono">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>CẢNH BÁO NGUY HIỂM: KỴ NHAU TRONG CÙNG NGĂN!</span>
                  </div>
                  <p className="text-rose-200 pl-6">
                    Ngăn này đang chứa{' '}
                    <strong>{assignmentIncompatibilityCheck.otherItem.name}</strong> kỵ với hóa chất bạn đang gán.
                  </p>
                  <p className="text-[11px] text-slate-400 pl-6 italic">
                    Phản ứng: {assignmentIncompatibilityCheck.incomp.title}
                  </p>
                  <div className="pl-6">
                    <MixSourceLinks warning={assignmentIncompatibilityCheck.incomp} compact />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#1f2633] flex items-center justify-end gap-3 bg-[#0e121a]">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() =>
                  handleAssignChemical(
                    selectedItemIdToAssign,
                    assignTargetCabinetId,
                    assignTargetDrawerId
                  )
                }
                disabled={!selectedItemIdToAssign}
                className="px-4 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận gán vị trí</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DI CHUYỂN HÓA CHẤT (MOVE) ================= */}
      {movingItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#242c3b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-[#1f2633] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MoveRight className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                  Di Chuyển Vị Trí: {movingItem.formula} — {movingItem.name}
                </h3>
              </div>
              <button
                onClick={() => setMovingItem(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-300">
                Vị trí hiện tại: <strong className="text-emerald-400">{movingItem.location}</strong>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Chuyển sang tủ:
                </label>
                <select
                  value={moveTargetCabinetId}
                  onChange={(e) => {
                    const cabId = e.target.value;
                    setMoveTargetCabinetId(cabId);
                    const cab = cabinets.find((c) => c.id === cabId);
                    if (cab && cab.drawers[0]) {
                      setMoveTargetDrawerId(cab.drawers[0].id);
                    }
                  }}
                  className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                >
                  {cabinets.map((cab) => (
                    <option key={cab.id} value={cab.id}>
                      [{cab.code}] {cab.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Chuyển sang ngăn kéo:
                </label>
                {(() => {
                  const targetCab = cabinets.find((c) => c.id === moveTargetCabinetId);
                  return (
                    <select
                      value={moveTargetDrawerId}
                      onChange={(e) => setMoveTargetDrawerId(e.target.value)}
                      className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                    >
                      {targetCab?.drawers.map((drw) => (
                        <option key={drw.id} value={drw.id}>
                          Ngăn {drw.code}: {drw.name}
                        </option>
                      ))}
                    </select>
                  );
                })()}
              </div>
            </div>

            <div className="p-5 border-t border-[#1f2633] flex items-center justify-end gap-3 bg-[#0e121a]">
              <button
                onClick={() => setMovingItem(null)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  handleAssignChemical(
                    movingItem.id,
                    moveTargetCabinetId,
                    moveTargetDrawerId
                  );
                  setMovingItem(null);
                }}
                className="px-4 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Hoàn tất chuyển ngăn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO TỦ MỚI ================= */}
      {isAddCabinetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#242c3b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <form onSubmit={handleCreateCabinet}>
              <div className="p-5 border-b border-[#1f2633] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    Tạo Tủ / Kệ Mới Trong Phòng Lab
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddCabinetModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Mã tủ (Code) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCabCode}
                      onChange={(e) => setNewCabCode(e.target.value)}
                      placeholder="VD: Tủ D, Tủ K2..."
                      className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      Loại tủ chuyên dụng
                    </label>
                    <select
                      value={newCabType}
                      onChange={(e) => setNewCabType(e.target.value as CabinetType)}
                      className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                    >
                      <option value="general">Kệ Thông thường / Muối</option>
                      <option value="acid">Tủ Axit Chống ăn mòn</option>
                      <option value="base">Tủ Kiềm & Bazơ</option>
                      <option value="flammable">Tủ Chống cháy (Dung môi)</option>
                      <option value="oxidizer">Tủ Chất Oxy hóa mạnh</option>
                      <option value="cold">Tủ Mát / Tủ Lạnh Lab</option>
                      <option value="fume_hood">Tủ Hút Khí Độc</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Tên đầy đủ của tủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCabName}
                    onChange={(e) => setNewCabName(e.target.value)}
                    placeholder="VD: Tủ Dung Dịch Chuẩn Độ & Hóa Chất Phân Tích"
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Vị trí khu vực (Zone) trong phòng
                  </label>
                  <input
                    type="text"
                    value={newCabZone}
                    onChange={(e) => setNewCabZone(e.target.value)}
                    placeholder="VD: Góc Tây Nam — Dãy Bàn Số 3"
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Ghi chú an toàn & Hướng dẫn lưu trữ
                  </label>
                  <textarea
                    rows={2}
                    value={newCabNotes}
                    onChange={(e) => setNewCabNotes(e.target.value)}
                    placeholder="Quy chuẩn bảo quản, khóa tủ, chống ẩm..."
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-[#1f2633] flex items-center justify-end gap-3 bg-[#0e121a]">
                <button
                  type="button"
                  onClick={() => setIsAddCabinetModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo tủ mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÊM NGĂN KÉO MỚI ================= */}
      {isAddDrawerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#242c3b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleUp">
            <form onSubmit={handleCreateDrawer}>
              <div className="p-5 border-b border-[#1f2633] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100">
                    Thêm Ngăn Kéo Mới Vào Tủ
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDrawerModalOpen(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Mã ngăn (VD: A3, B3, F4) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrawerCode}
                    onChange={(e) => setNewDrawerCode(e.target.value)}
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Tên ngăn kéo *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDrawerName}
                    onChange={(e) => setNewDrawerName(e.target.value)}
                    placeholder="VD: Ngăn Axit Hữu Cơ & Dung Dịch Đệm"
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">
                    Mô tả chức năng ngăn
                  </label>
                  <input
                    type="text"
                    value={newDrawerDesc}
                    onChange={(e) => setNewDrawerDesc(e.target.value)}
                    placeholder="VD: Khay nhựa lót teflon chống tràn"
                    className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-400 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="p-5 border-t border-[#1f2633] flex items-center justify-end gap-3 bg-[#0e121a]">
                <button
                  type="button"
                  onClick={() => setIsAddDrawerModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Thêm ngăn</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
