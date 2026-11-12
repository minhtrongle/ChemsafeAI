import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Chemical, DangerLevel, MixWarning } from '../types/chemical';
import { MixSourceLinks } from './MixSourceLinks';
import {
  compactFormula,
  normalizeText,
  getChemicalCategory,
  getChemicalCategories,
  detectChemicalCategories,
  getAllCategories,
  saveNewCategory
} from '../data/chemicals';
import { MIX_WARNINGS, checkIncompatibility, findIncompatibilitiesFor } from '../data/mixWarnings';
import { Box, Plus, Search, Trash2, Edit3, QrCode, AlertTriangle, ShieldCheck, MapPin, X, Download, Upload, FileSpreadsheet, FileCode, Check, FolderPlus, BarChart3, Tags } from 'lucide-react';
import { InventoryDashboard } from './InventoryDashboard';
import { CategoryManagerModal } from './CategoryManagerModal';

const INVENTORY_STORAGE_KEY = 'chemsafe_user_inventory';

interface InventoryManagerProps {
  chemicals: Chemical[];
  onPrintQR: (item: InventoryItem) => void;
  isOpenAddModal?: boolean;
  onCloseAddModal?: () => void;
  onOpenLabMap?: () => void;
  inventoryProp?: InventoryItem[];
  onUpdateInventory?: (items: InventoryItem[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  chemicals,
  onPrintQR,
  isOpenAddModal = false,
  onCloseAddModal,
  onOpenLabMap,
  inventoryProp,
  onUpdateInventory
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => inventoryProp || []);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDanger, setSelectedDanger] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(isOpenAddModal);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formFormula, setFormFormula] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formDanger, setFormDanger] = useState<DangerLevel>('danger');
  const [formCategory, setFormCategory] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');
  const [formHazardDetails, setFormHazardDetails] = useState('');

  // Auto-analysis card state inside the modal
  const [autoAnalysis, setAutoAnalysis] = useState<{
    matchedChem: Chemical | null;
    incompatibilities: { otherFormula: string; title: string; tags: string[]; warning: MixWarning }[];
  } | null>(null);

  // Load inventory and categories from localStorage or initialize
  useEffect(() => {
    setAvailableCategories(getAllCategories());

    const handleCategoryUpdate = () => {
      setAvailableCategories(getAllCategories());
      try {
        const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setInventory(parsed);
          onUpdateInventory?.(parsed);
        }
      } catch {}
    };

    window.addEventListener('chemsafe_categories_changed', handleCategoryUpdate);

    try {
      const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (saved) {
        setInventory(JSON.parse(saved));
      } else {
        // Initial demo inventory items
        const initialItems: InventoryItem[] = [
          {
            id: 'inv_1',
            name: 'Axit Clohydric 37%',
            formula: 'HCl',
            location: 'Tủ A1 — Ngăn Axit',
            quantity: '2 chai (1000 mL)',
            danger: 'danger',
            categories: ['Axit'],
            category: 'Axit',
            notes: 'HSD: 12/2027. Đậy kín nắp, bốc khói trong không khí.',
            hazardDetails: '[Ăn mòn & Hô hấp]: Gây bỏng da/mắt nặng. Bắt buộc dùng tủ hút.\n[Cảnh báo]: Kỵ Natri Hypochlorite (Javel), kiềm mạnh NaOH và Sulfide.',
            createdAt: new Date().toLocaleDateString('vi-VN')
          },
          {
            id: 'inv_2',
            name: 'Natri Hydroxide (Xút vảy)',
            formula: 'NaOH',
            location: 'Tủ B2 — Ngăn Bazơ',
            quantity: '1 kg',
            danger: 'danger',
            categories: ['Bazơ / Kiềm'],
            category: 'Bazơ / Kiềm',
            notes: 'Hút ẩm mạnh. Tránh dính mắt.',
            hazardDetails: '[Ăn mòn kiềm]: Bỏng kiềm sâu, nguy cơ mù lòa nếu bắn mắt.\n[Cảnh báo]: Tỏa nhiệt cực mạnh khi hòa tan hoặc trộn với axit vô cơ mạnh.',
            createdAt: new Date().toLocaleDateString('vi-VN')
          },
          {
            id: 'inv_3',
            name: 'Cồn Ethanol 96°',
            formula: 'C₂H₅OH',
            location: 'Tủ F3 — Dung môi dễ cháy',
            quantity: '5000 mL',
            danger: 'caution',
            categories: ['Dung môi / Hữu cơ'],
            category: 'Dung môi / Hữu cơ',
            notes: 'Dùng pha chế và sát khuẩn lab.',
            hazardDetails: '[Dễ cháy]: Điểm chớp cháy thấp. Cách xa tia lửa điện và chất oxy hóa mạnh như HNO3, KMnO4.',
            createdAt: new Date().toLocaleDateString('vi-VN')
          }
        ];
        setInventory(initialItems);
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialItems));
      }
    } catch {
      // fallback
    }

    return () => {
      window.removeEventListener('chemsafe_categories_changed', handleCategoryUpdate);
    };
  }, [onUpdateInventory]);

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    const updated = saveNewCategory(trimmed);
    setAvailableCategories(updated);
    setSelectedCategory(trimmed);
    if (isModalOpen) {
      setFormCategories(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
      setFormCategory(trimmed);
    }
    setShowAddCategoryModal(false);
  };

  // Sync external isOpenAddModal
  useEffect(() => {
    if (isOpenAddModal) {
      handleOpenCreate();
    }
  }, [isOpenAddModal]);

  useEffect(() => {
    if (inventoryProp) {
      setInventory(inventoryProp);
    }
  }, [inventoryProp]);

  const saveToStorage = (items: InventoryItem[]) => {
    setInventory(items);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    onUpdateInventory?.(items);
  };

  // Real-time auto analyze when formula changes in modal
  const handleFormulaChange = (val: string) => {
    setFormFormula(val);
    const compactInput = compactFormula(val);
    if (!compactInput) {
      setAutoAnalysis(null);
      return;
    }

    const matched = chemicals.find(c => compactFormula(c.formula) === compactInput || c.key === compactInput);
    if (matched) {
      if (!formName || formName === '') setFormName(matched.name);
      setFormDanger(matched.danger);
      const detectedCats = getChemicalCategories(matched);
      setFormCategories(detectedCats);
      setFormCategory(detectedCats.join(', '));

      // Find all incompatibilities from matrix
      const rawIncompat = findIncompatibilitiesFor(matched.key, chemicals.map(c => c.key));
      const incompatList = rawIncompat.map(item => {
        const otherChem = chemicals.find(c => c.key === item.otherKey || compactFormula(c.formula) === item.otherKey);
        return {
          otherFormula: otherChem ? otherChem.formula : item.otherKey,
          title: item.warning.title,
          tags: item.warning.tags,
          warning: item.warning
        };
      });

      setAutoAnalysis({
        matchedChem: matched,
        incompatibilities: incompatList
      });

      // Auto generate hazard text
      let textWarning = `[Độc tính & Rủi ro]: ${matched.msds || matched.properties}\n[Bảo quản]: ${matched.storage}`;
      if (incompatList.length > 0) {
        textWarning += `\n\n[TƯƠNG KỴ ĐẶC BIỆT]:\n` + incompatList.slice(0, 4).map(i => `- Kỵ ${i.otherFormula}: ${i.title}`).join('\n');
      }
      setFormHazardDetails(textWarning);
    } else {
      const autoDetected = detectChemicalCategories({ formula: val });
      setFormCategories(autoDetected);
      setFormCategory(autoDetected.join(', '));
      setAutoAnalysis(null);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormFormula('');
    setFormLocation('Tủ A1 — Kệ 1');
    setFormQuantity('1 chai (500 mL)');
    setFormDanger('danger');
    setFormCategories([]);
    setFormCategory('');
    setFormNotes('');
    setFormHazardDetails('');
    setAutoAnalysis(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormFormula(item.formula);
    setFormLocation(item.location);
    setFormQuantity(item.quantity);
    setFormDanger(item.danger);
    const itemCats = getChemicalCategories(item);
    setFormCategories(itemCats);
    setFormCategory(item.category || itemCats.join(', '));
    setFormNotes(item.notes);
    setFormHazardDetails(item.hazardDetails);
    setAutoAnalysis(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formFormula.trim() || !formLocation.trim()) {
      alert('Vui lòng điền đủ Tên, Công thức và Vị trí lưu trữ!');
      return;
    }

    const finalCategories = formCategories.length > 0 ? formCategories : ['Chưa phân loại'];

    if (editingId) {
      // Edit
      const updated = inventory.map(item =>
        item.id === editingId
          ? {
              ...item,
              name: formName.trim(),
              formula: formFormula.trim(),
              location: formLocation.trim(),
              quantity: formQuantity.trim() || 'Chưa ghi',
              danger: formDanger,
              categories: finalCategories,
              category: finalCategories.join(', '),
              notes: formNotes.trim() || '—',
              hazardDetails: formHazardDetails.trim() || 'Chưa có thông tin chi tiết.',
              updatedAt: new Date().toLocaleDateString('vi-VN')
            }
          : item
      );
      saveToStorage(updated);
    } else {
      // Create new
      const newItem: InventoryItem = {
        id: 'inv_' + Date.now(),
        name: formName.trim(),
        formula: formFormula.trim(),
        location: formLocation.trim(),
        quantity: formQuantity.trim() || '1 đơn vị',
        danger: formDanger,
        categories: finalCategories,
        category: finalCategories.join(', '),
        notes: formNotes.trim() || '—',
        hazardDetails: formHazardDetails.trim() || 'Chưa có thông tin chi tiết.',
        createdAt: new Date().toLocaleDateString('vi-VN')
      };
      saveToStorage([newItem, ...inventory]);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa hóa chất này khỏi kho ảo?')) {
      saveToStorage(inventory.filter(i => i.id !== id));
    }
  };

  // Filter inventory
  const filteredInventory = useMemo(() => {
    const q = normalizeText(searchQuery);
    const compactQ = compactFormula(searchQuery);

    return inventory.filter(item => {
      // Danger / Hazard level filter
      if (selectedDanger !== 'all') {
        if (item.danger !== selectedDanger) {
          return false;
        }
      }

      // Multi-Category filter: matching if ANY category matches selectedCategory
      if (selectedCategory !== 'all') {
        const itemCats = getChemicalCategories(item);
        if (!itemCats.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())) {
          return false;
        }
      }

      if (!q) return true;

      const itemCats = getChemicalCategories(item);
      const text = normalizeText(`${item.name} ${item.formula} ${item.location} ${item.notes} ${itemCats.join(' ')} ${item.category || ''}`);
      const fCompact = compactFormula(item.formula);
      return text.includes(q) || (compactQ && fCompact.includes(compactQ));
    });
  }, [inventory, searchQuery, selectedCategory, selectedDanger, chemicals]);

  // SHELF AUDITOR: Check if chemicals sharing the same location are mutually incompatible!
  const shelfWarnings = useMemo(() => {
    const warnings: { loc: string; c1: string; c2: string; title: string; warning: MixWarning }[] = [];
    const locationMap = new Map<string, InventoryItem[]>();

    inventory.forEach(item => {
      const locKey = normalizeText(item.location);
      if (!locationMap.has(locKey)) locationMap.set(locKey, []);
      locationMap.get(locKey)!.push(item);
    });

    locationMap.forEach((items, loc) => {
      if (items.length >= 2) {
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const warning = checkIncompatibility(items[i].formula, items[j].formula);
            if (warning) {
              warnings.push({
                loc: items[0].location,
                c1: items[i].formula,
                c2: items[j].formula,
                title: warning.title,
                warning
              });
            }
          }
        }
      }
    });

    return warnings;
  }, [inventory]);

  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Export Inventory Catalog Report to CSV format
  const exportToCSV = (itemsToExport: InventoryItem[] = inventory) => {
    if (itemsToExport.length === 0) {
      alert('Kho hàng hiện đang trống, chưa có dữ liệu để xuất file báo cáo.');
      return;
    }

    const escapeCSV = (val: string | undefined) => {
      const text = String(val ?? '').replace(/"/g, '""');
      return `"${text}"`;
    };

    // Columns specifically organized for laboratory reporting:
    // Prioritizing Chemical Name, Storage Location, and Hazard Warning Details as required
    const headers = [
      'Tên hóa chất',
      'Công thức hóa học',
      'Vị trí lưu trữ',
      'Chi tiết cảnh báo an toàn & Tương kỵ',
      'Mức độ nguy hiểm',
      'Số lượng / Thể tích',
      'Phân loại nhóm chất',
      'Ghi chú & Hạn dùng',
      'Ngày nhập / Kiểm kê',
      'Mã định danh (ID)'
    ];

    const dangerLabels: Record<DangerLevel, string> = {
      safe: 'AN TOÀN',
      caution: 'THẬN TRỌNG',
      danger: 'NGUY HIỂM',
      extreme: 'CỰC KỲ NGUY HIỂM'
    };

    const rows = itemsToExport.map(item => [
      escapeCSV(item.name),
      escapeCSV(item.formula),
      escapeCSV(item.location),
      escapeCSV(item.hazardDetails || 'Chưa có thông tin cảnh báo cụ thể'),
      escapeCSV(dangerLabels[item.danger] || item.danger.toUpperCase()),
      escapeCSV(item.quantity),
      escapeCSV(item.categories && item.categories.length > 0 ? item.categories.join('; ') : (item.category || 'Chưa phân loại')),
      escapeCSV(item.notes || '—'),
      escapeCSV(item.createdAt),
      escapeCSV(item.id)
    ]);

    // \uFEFF ensures UTF-8 BOM so Microsoft Excel & Google Sheets display Vietnamese characters cleanly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `Bao_cao_danh_muc_kho_hoa_chat_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotification(`Đã xuất báo cáo danh mục kho hàng (${itemsToExport.length} hóa chất) sang tệp tin CSV thành công!`);
    setTimeout(() => setExportNotification(null), 5000);
  };

  // Export to JSON backup
  const exportToJSON = () => {
    if (inventory.length === 0) {
      alert('Kho hàng hiện đang trống, chưa có dữ liệu để xuất file.');
      return;
    }

    const exportData = {
      app: 'ChemSafe AI',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalItems: inventory.length,
      items: inventory
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `chemsafe_backup_kho_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON or CSV file to restore / merge inventory
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const importedItems: InventoryItem[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.items)
              ? parsed.items
              : null;

          if (!importedItems || !Array.isArray(importedItems)) {
            throw new Error('Định dạng JSON không hợp lệ');
          }

          const validItems = importedItems.filter(item => item.name && item.formula);
          if (validItems.length === 0) {
            alert('Không tìm thấy dữ liệu hóa chất hợp lệ trong file JSON.');
            return;
          }

          if (confirm(`Tìm thấy ${validItems.length} hóa chất trong file sao lưu. Bạn có muốn thêm vào kho hiện tại không?`)) {
            const existingIds = new Set(inventory.map(i => i.id));
            const itemsToAdd = validItems.map(item => {
              const itemCats = getChemicalCategories(item);
              return {
                ...item,
                id: existingIds.has(item.id) ? `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}` : item.id,
                categories: itemCats,
                category: itemCats.join(', ')
              };
            });
            const newInventory = [...itemsToAdd, ...inventory];
            saveToStorage(newInventory);
            alert(`Đã nhập thành công ${itemsToAdd.length} hóa chất vào kho!`);
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length <= 1) {
            alert('File CSV không có dữ liệu.');
            return;
          }

          const parseCSVRow = (row: string) => {
            const cells: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < row.length; i++) {
              const ch = row[i];
              if (ch === '"') {
                if (inQuotes && row[i + 1] === '"') {
                  current += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (ch === ',' && !inQuotes) {
                cells.push(current);
                current = '';
              } else {
                current += ch;
              }
            }
            cells.push(current);
            return cells;
          };

          const importedItems: InventoryItem[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cells = parseCSVRow(lines[i]);
            if (cells.length >= 3 && cells[1] && cells[2]) {
              const rawDanger = cells[5]?.toLowerCase().trim();
              const dangerVal: DangerLevel = ['safe', 'caution', 'danger', 'extreme'].includes(rawDanger)
                ? (rawDanger as DangerLevel)
                : 'caution';

              const rawCat = (cells[6] || '').replace(/^"|"$/g, '').trim();
              const parsedCats = rawCat ? rawCat.split(/[;,/|]/).map(c => c.trim()).filter(Boolean) : [];
              const categories = parsedCats.length > 0
                ? parsedCats
                : detectChemicalCategories({ formula: cells[2], name: cells[1] });

              importedItems.push({
                id: cells[0] || `inv_${Date.now()}_${i}`,
                name: cells[1],
                formula: cells[2],
                location: cells[3] || 'Chưa xác định',
                quantity: cells[4] || '1',
                danger: dangerVal,
                categories,
                category: categories.join(', '),
                notes: cells[7] || '',
                hazardDetails: cells[8] || '',
                createdAt: cells[9] || new Date().toLocaleDateString('vi-VN')
              });
            }
          }

          if (importedItems.length === 0) {
            alert('Không trích xuất được dòng hóa chất hợp lệ từ file CSV.');
            return;
          }

          if (confirm(`Tìm thấy ${importedItems.length} hóa chất trong file CSV. Bạn có muốn thêm vào kho không?`)) {
            const newInventory = [...importedItems, ...inventory];
            saveToStorage(newInventory);
            alert(`Đã nhập thành công ${importedItems.length} hóa chất vào kho!`);
          }
        } else {
          alert('Vui lòng chọn file định dạng .json hoặc .csv');
        }
      } catch (err) {
        alert('Có lỗi khi đọc file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Hidden file input for import */}
      <input
        type="file"
        id="inventory-file-import"
        accept=".json,.csv"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Box className="w-6 h-6 text-emerald-400" />
            Kho hóa chất <span className="text-emerald-400">Cá nhân & Giám sát tủ</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý vị trí lưu trữ thực tế trong phòng thí nghiệm, sao lưu dữ liệu và cảnh báo khi để hóa chất kỵ nhau cùng ngăn tủ
          </p>
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Dashboard Toggle button */}
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            title={showDashboard ? 'Thu gọn biểu đồ thống kê' : 'Xem biểu đồ phân tích kho hàng'}
            className={`px-3 py-2 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 border ${
              showDashboard
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-xs'
                : 'bg-[#171d28] hover:bg-[#202738] text-slate-300 border-[#262f3d]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showDashboard ? 'Ẩn biểu đồ' : 'Biểu đồ kho'}</span>
          </button>

          {/* Lab Map 2D button */}
          {onOpenLabMap && (
            <button
              onClick={onOpenLabMap}
              title="Mở sơ đồ phòng thí nghiệm 2D để trực quan hóa vị trí các ngăn tủ và gán hóa chất"
              className="px-3 py-2 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 border bg-[#171d28] hover:bg-[#202738] text-emerald-300 border-[#262f3d]"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sơ đồ lab 2D</span>
            </button>
          )}

          {/* Export Report CSV button */}
          <button
            onClick={() => exportToCSV(inventory)}
            title="Xuất báo cáo danh mục kho hàng sang tệp tin CSV (bao gồm Tên hóa chất, Vị trí lưu trữ, Chi tiết cảnh báo)"
            className="px-3.5 py-2 text-xs font-mono font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Xuất báo cáo CSV</span>
          </button>

          {/* Export JSON button */}
          <button
            onClick={exportToJSON}
            title="Xuất file JSON sao lưu đầy đủ cấu trúc"
            className="px-3 py-2 text-xs font-mono font-medium text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#262f3d] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Xuất JSON</span>
          </button>

          {/* Import Backup button */}
          <button
            onClick={() => document.getElementById('inventory-file-import')?.click()}
            title="Nhập dữ liệu sao lưu từ file JSON hoặc CSV"
            className="px-3 py-2 text-xs font-mono font-medium text-slate-300 hover:text-slate-100 bg-[#12161f] hover:bg-[#1a212e] border border-[#242c3b] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Nhập file</span>
          </button>

          {/* Add Chemical button */}
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm hóa chất</span>
          </button>
        </div>
      </div>

      {/* Export notification toast */}
      {exportNotification && (
        <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportNotification}</span>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="text-emerald-400/70 hover:text-emerald-300 p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shelf Incompatibility Alerts Banner */}
      {shelfWarnings.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/50 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Phát hiện rủi ro lưu trữ: Hóa chất kỵ nhau được xếp chung ngăn tủ!</span>
          </div>
          <div className="space-y-1.5 pl-6">
            {shelfWarnings.map((w, idx) => (
              <div key={idx} className="text-xs text-slate-200 flex flex-wrap items-center gap-2">
                <span className="font-mono text-rose-300 font-bold">{w.c1}</span>
                <span className="text-slate-400">+</span>
                <span className="font-mono text-rose-300 font-bold">{w.c2}</span>
                <span className="text-slate-400">tại</span>
                <span className="font-semibold text-slate-200">[{w.loc}]</span>
                <span className="text-slate-400">→</span>
                <span className="text-rose-200 italic">{w.title}</span>
                <MixSourceLinks warning={w.warning} compact />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 pl-6">
            Khuyến cáo: Hãy tách riêng các hóa chất này sang các tủ hoặc khay phân lập khác nhau theo quy chuẩn an toàn.
          </p>
        </div>
      )}

      {/* Recharts Inventory Dashboard (Bar Chart + Pie Chart) */}
      {showDashboard && (
        <InventoryDashboard
          inventory={inventory}
          chemicals={chemicals}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory((prev) => (prev.toLowerCase() === cat.toLowerCase() ? 'all' : cat));
          }}
          selectedDanger={selectedDanger}
          onSelectDanger={(lvl) => {
            setSelectedDanger((prev) => (prev === lvl ? 'all' : lvl));
          }}
        />
      )}

      {/* Search and summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, công thức hoặc vị trí (Tủ A, Kệ 2, HCl)..."
            className="w-full bg-[#12161f] border border-[#1f2633] focus:border-emerald-400 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-200 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {searchQuery && filteredInventory.length > 0 && (
            <button
              onClick={() => exportToCSV(filteredInventory)}
              title="Xuất chỉ các kết quả đang tìm kiếm ra file CSV"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono underline underline-offset-4 flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất {filteredInventory.length} mục lọc ra CSV</span>
            </button>
          )}

          <div className="text-xs font-mono text-slate-400">
            Tổng số lượng: <strong className="text-emerald-400">{filteredInventory.length}</strong> hóa chất
          </div>
        </div>
      </div>

      {/* Category Filter Pills + Add Category Button */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 bg-[#12161f] border border-[#1f2633]'
          }`}
        >
          Tất cả nhóm ({inventory.length})
        </button>

        {availableCategories.map((cat) => {
          const countInCat = inventory.filter(item =>
            getChemicalCategories(item).some(c => c.toLowerCase() === cat.toLowerCase())
          ).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#12161f] border border-[#1f2633]'
              }`}
            >
              {cat} ({countInCat})
            </button>
          );
        })}

        {/* Button to add new category */}
        <button
          onClick={() => {
            setNewCategoryName('');
            setShowAddCategoryModal(true);
          }}
          title="Tạo nhóm phân loại mới cho kho"
          className="px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-mono text-emerald-400 hover:text-emerald-300 bg-[#171d28] hover:bg-[#202738] border border-[#2b3547] flex items-center gap-1 transition-colors"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>+ Thêm nhóm</span>
        </button>

        {/* Manage & Edit Categories button */}
        <button
          onClick={() => setShowCategoryManagerModal(true)}
          title="Quản lý và chỉnh sửa tên các nhóm phân loại"
          className="px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-mono text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-colors"
        >
          <Tags className="w-3.5 h-3.5 text-emerald-400" />
          <span>⚙️ Quản lý & Sửa nhóm</span>
        </button>

        {/* Hazard filter tag if active */}
        {selectedDanger !== 'all' && (
          <div className="flex items-center gap-1.5 ml-auto shrink-0 bg-rose-950/40 border border-rose-500/40 px-2.5 py-1 rounded-md text-xs font-mono text-rose-300">
            <span>Mức độ: <strong>{selectedDanger.toUpperCase()}</strong></span>
            <button
              onClick={() => setSelectedDanger('all')}
              className="text-rose-400 hover:text-rose-100 p-0.5 rounded"
              title="Bỏ lọc mức độ nguy hiểm"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Inventory Items Grid */}
      {filteredInventory.length === 0 ? (
        <div className="p-16 text-center rounded-xl bg-[#12161f] border border-[#1f2633] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#1a212e] flex items-center justify-center text-slate-400">
            <Box className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">Kho ảo của bạn đang trống</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Nhấn vào nút <strong>"+ Thêm hóa chất vào kho"</strong> để bắt đầu ghi chép vị trí, hạn dùng và quản lý an toàn kho thí nghiệm.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInventory.map((item) => {
            const dangerClasses: Record<DangerLevel, { badge: string; border: string }> = {
              safe: { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', border: 'hover:border-emerald-500/40' },
              caution: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30', border: 'hover:border-amber-500/40' },
              danger: { badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30', border: 'hover:border-rose-500/40' },
              extreme: { badge: 'text-slate-100 bg-slate-900 border-slate-700', border: 'hover:border-slate-500/40' }
            };

            const dc = dangerClasses[item.danger] || dangerClasses.danger;

            return (
              <div
                key={item.id}
                className={`bg-[#12161f] border border-[#1f2633] ${dc.border} rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all shadow-xs`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-2xl font-bold tracking-tight text-slate-100">
                      {item.formula}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${dc.badge}`}>
                      {item.danger}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-300 mb-2 truncate">
                    {item.name}
                  </h3>

                  {/* Location badge */}
                  <div
                    onClick={onOpenLabMap}
                    className={`flex items-center justify-between p-2 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-xs text-emerald-400 font-mono mb-3 transition-colors group ${
                      onOpenLabMap ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-[#111722]' : ''
                    }`}
                    title={onOpenLabMap ? 'Xem vị trí trên sơ đồ phòng lab 2D' : undefined}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    {onOpenLabMap && (
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 shrink-0 ml-1">
                        Sơ đồ ↗
                      </span>
                    )}
                  </div>

                  {/* Properties */}
                  <div className="space-y-1 text-[11px] text-slate-400 font-sans">
                    <div className="flex justify-between">
                      <span>Số lượng:</span>
                      <span className="font-mono text-slate-200">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between items-start pt-0.5">
                      <span className="shrink-0 text-slate-400">Phân loại:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {getChemicalCategories(item).map(cat => (
                          <span
                            key={cat}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                    {item.notes && item.notes !== '—' && (
                      <div className="flex justify-between pt-1 text-[10.5px]">
                        <span>Ghi chú:</span>
                        <span className="text-slate-300 truncate max-w-[180px]">{item.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Hazard details snippet */}
                  {item.hazardDetails && (
                    <div className="mt-3 p-2.5 rounded bg-black/30 border border-white/5 text-[10px] text-slate-400 whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto">
                      {item.hazardDetails}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="pt-3 border-t border-[#1a212e] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onPrintQR(item)}
                    className="flex-1 py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                    title="In nhãn QR dán lọ"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>In nhãn QR</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 bg-[#171d28] hover:bg-[#202736] border border-[#2b3547] text-slate-300 rounded text-xs transition-colors"
                    title="Sửa thông tin"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded text-xs transition-colors"
                    title="Xóa khỏi kho"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Inventory Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Box className="w-4 h-4 text-emerald-400" />
                <span>{editingId ? 'Sửa thông tin hóa chất trong kho' : 'Nhập hóa chất mới vào kho ảo'}</span>
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Công thức hóa học *</label>
                <input
                  type="text"
                  required
                  value={formFormula}
                  onChange={(e) => handleFormulaChange(e.target.value)}
                  placeholder="VD: HCl, H2SO4, NaOH, NaClO..."
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 font-mono outline-none"
                />
                <span className="text-[10px] text-slate-400 font-sans block">
                  * Nhập công thức để hệ thống tự nhận diện và nạp dữ liệu an toàn
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Tên hóa chất *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="VD: Axit Clohydric 37%"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Vị trí lưu trữ thực tế *</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="VD: Tủ A1 — Ngăn Axit, Kệ 2"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Số lượng / Thể tích hiện có</label>
                <input
                  type="text"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="VD: 500 mL hoặc 2 chai"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Mức độ nguy hiểm</label>
                <select
                  value={formDanger}
                  onChange={(e) => setFormDanger(e.target.value as DangerLevel)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                >
                  <option value="safe">🟢 An toàn</option>
                  <option value="caution">🟡 Thận trọng</option>
                  <option value="danger">🔴 Nguy hiểm</option>
                  <option value="extreme">⚫ Cực kỳ nguy hiểm</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400">
                    Nhóm phân loại (Chọn một hoặc nhiều nhóm) *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCategoryManagerModal(true)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1"
                    >
                      <Tags className="w-3 h-3 text-emerald-400" />
                      <span>Sửa nhóm</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategoryName('');
                        setShowAddCategoryModal(true);
                      }}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      + Nhóm mới
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-[#0c0f14] border border-[#2a3445]">
                  {availableCategories.map((cat) => {
                    const isSelected = formCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormCategories(formCategories.filter(c => c !== cat));
                          } else {
                            setFormCategories([...formCategories, cat]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                            : 'bg-[#161c28] text-slate-400 hover:text-slate-200 border border-[#242e40]'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] border ${
                          isSelected ? 'border-emerald-400 bg-emerald-400 text-slate-950 font-bold' : 'border-slate-600 bg-transparent'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Đã chọn: <span className="text-emerald-400">{formCategories.length > 0 ? formCategories.join(', ') : 'Chưa chọn nhóm (mặc định: Chưa phân loại)'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Ghi chú lưu trữ / Hạn dùng</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="VD: HSD 2028, tránh ẩm, nắp kín..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
              />
            </div>

            {/* Auto Analysis Live Card */}
            {autoAnalysis && (
              <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-mono text-[11px] font-bold">
                  <span>Tự động phân tích: {autoAnalysis.matchedChem?.name}</span>
                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Khớp CSDL
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <strong>Bảo quản:</strong> {autoAnalysis.matchedChem?.storage}
                </div>
                {autoAnalysis.incompatibilities.length > 0 && (
                  <div className="text-[11px] text-rose-300 pt-1 border-t border-white/5">
                    <strong className="text-rose-400">Kỵ hóa chất:</strong> Tuyệt đối không để chung ngăn hoặc trộn với:
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                      {autoAnalysis.incompatibilities.slice(0, 3).map((item, i) => (
                        <li key={i}>
                          <span className="text-rose-400 font-mono font-bold">Kỵ {item.otherFormula}:</span> {item.title}
                          <MixSourceLinks warning={item.warning} compact />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">
                Thông tin an toàn & Cảnh báo chi tiết (Tự động điền)
              </label>
              <textarea
                rows={3}
                value={formHazardDetails}
                onChange={(e) => setFormHazardDetails(e.target.value)}
                placeholder="Dữ liệu an toàn chi tiết..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded shadow-xs"
              >
                {editingId ? 'Cập nhật hóa chất' : 'Lưu vào kho ảo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Category in Inventory */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewCategory}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Thêm nhóm phân loại mới cho kho</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Tên nhóm phân loại *</label>
              <input
                type="text"
                required
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="VD: Thuốc thử hữu cơ, Chỉ thị màu, Peroxit..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded px-3 py-2 text-slate-200 outline-none"
              />
              <span className="text-[10px] text-slate-400">
                Nhóm mới sẽ xuất hiện trên thanh lọc và danh sách nhóm của kho hóa chất.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded shadow-xs"
              >
                Thêm nhóm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Manager & Editor Modal */}
      {showCategoryManagerModal && (
        <CategoryManagerModal
          isOpen={showCategoryManagerModal}
          onClose={() => setShowCategoryManagerModal(false)}
          chemicals={chemicals}
          inventory={inventory}
          onCategoriesUpdated={(updated) => {
            setAvailableCategories(updated);
          }}
        />
      )}
    </div>
  );
};
