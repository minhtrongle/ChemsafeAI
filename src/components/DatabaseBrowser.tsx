import React, { useState, useMemo, useEffect } from 'react';
import { Chemical, DangerLevel, InventoryItem } from '../types/chemical';
import {
  normalizeText,
  compactFormula,
  getChemicalCategory,
  getChemicalCategories,
  detectChemicalCategories,
  saveCustomChemical,
  deleteCustomChemical,
  deleteChemical,
  deleteMultipleChemicals,
  restoreAllDeletedChemicals,
  getDeletedBaseChemicalKeys,
  updateChemical,
  resetChemicalToDefault,
  getAllCategories,
  saveNewCategory,
  isBaseChemical,
  bulkImportChemicals
} from '../data/chemicals';
import {
  Search,
  Plus,
  Trash2,
  ArrowUpRight,
  X,
  Edit3,
  RotateCcw,
  FolderPlus,
  Check,
  Sparkles,
  FileSpreadsheet,
  FileJson,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  Tags,
  BarChart3,
  CheckSquare,
  Square,
  CheckCheck,
  LayoutGrid,
  Table,
  ArrowUpDown,
  ChevronUp,
  Link as LinkIcon,
  Globe,
  ExternalLink,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { CategoryManagerModal } from './CategoryManagerModal';
import { DatabaseDashboard } from './DatabaseDashboard';
import { ExternalLinkModal } from './ExternalLinkModal';
import {
  lookupPubChem,
  fetchChemicalsFromUrl,
  getExternalChemicalLinks,
  PubChemLookupResult
} from '../utils/externalDataFetcher';
import { getIcscUrl, detectIcscId } from '../utils/icscHelper';
import { formatCurriculum, curriculumLevel } from '../data/chemicalRefs';

interface DatabaseBrowserProps {
  chemicals: Chemical[];
  onRefreshChemicals: () => void;
  onSelectForWarning: (chem: Chemical) => void;
  onSelectForQR: (chem: Chemical) => void;
}

export const DatabaseBrowser: React.FC<DatabaseBrowserProps> = ({
  chemicals,
  onRefreshChemicals,
  onSelectForWarning,
  onSelectForQR
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDanger, setSelectedDanger] = useState<string>('all');
  const [selectedChem, setSelectedChem] = useState<Chemical | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(true);

  // View Mode: 'grid' (thẻ dạng lưới) | 'table' (bảng danh sách chi tiết)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('chemsafe_db_view_mode');
      return saved === 'table' ? 'table' : 'grid';
    } catch {
      return 'grid';
    }
  });

  // Table Sort States
  const [sortField, setSortField] = useState<'formula' | 'name' | 'molar' | 'danger' | 'category'>('formula');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleToggleViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('chemsafe_db_view_mode', mode);
    } catch {
      // ignore
    }
  };

  const handleSort = (field: 'formula' | 'name' | 'molar' | 'danger' | 'category') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Bulk Selection & Deletion States
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [selectedFormulaKeys, setSelectedFormulaKeys] = useState<Set<string>>(new Set());
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
  const [deletedBaseKeysCount, setDeletedBaseKeysCount] = useState<number>(() => getDeletedBaseChemicalKeys().length);

  // Dynamic Categories
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [showCategoryManagerModal, setShowCategoryManagerModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  const inventoryFromStorage = useMemo<InventoryItem[]>(() => {
    try {
      const raw = localStorage.getItem('chemsafe_user_inventory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [showCategoryManagerModal]);

  useEffect(() => {
    setAvailableCategories(getAllCategories());

    const handleCatUpdate = () => {
      setAvailableCategories(getAllCategories());
      onRefreshChemicals();
    };

    window.addEventListener('chemsafe_categories_changed', handleCatUpdate);
    return () => window.removeEventListener('chemsafe_categories_changed', handleCatUpdate);
  }, [onRefreshChemicals]);

  // Import/Export States
  const [notification, setNotification] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [importPreviewData, setImportPreviewData] = useState<{
    fileName: string;
    fileType: 'csv' | 'json';
    items: Chemical[];
  } | null>(null);
  const [importOverwrite, setImportOverwrite] = useState<boolean>(false);

  useEffect(() => {
    if (!showExportMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#db-export-menu-container')) {
        setShowExportMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  // Modal Add New Chemical
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newFormula, setNewFormula] = useState('');
  const [newName, setNewName] = useState('');
  const [newDanger, setNewDanger] = useState<DangerLevel>('caution');
  const [newCategories, setNewCategories] = useState<string[]>(['Axit']);
  const [newMolar, setNewMolar] = useState('');
  const [newBoiling, setNewBoiling] = useState('');
  const [newPh, setNewPh] = useState('');
  const [newProperties, setNewProperties] = useState('');
  const [newMsds, setNewMsds] = useState('');
  const [newStorage, setNewStorage] = useState('');
  const [newSdsUrl, setNewSdsUrl] = useState('');
  const [newPubChemCid, setNewPubChemCid] = useState<string | number>('');
  const [newIcscId, setNewIcscId] = useState<string>('');

  // Modal Edit Chemical (For any chemical in database)
  const [editingChem, setEditingChem] = useState<Chemical | null>(null);
  const [editFormula, setEditFormula] = useState('');
  const [editName, setEditName] = useState('');
  const [editDanger, setEditDanger] = useState<DangerLevel>('caution');
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [editMolar, setEditMolar] = useState('');
  const [editBoiling, setEditBoiling] = useState('');
  const [editPh, setEditPh] = useState('');
  const [editProperties, setEditProperties] = useState('');
  const [editMsds, setEditMsds] = useState('');
  const [editStorage, setEditStorage] = useState('');
  const [editSdsUrl, setEditSdsUrl] = useState('');
  const [editPubChemCid, setEditPubChemCid] = useState<string | number>('');
  const [editIcscId, setEditIcscId] = useState<string>('');

  // External Data Linking Modal (URL & PubChem)
  const [showExternalLinkModal, setShowExternalLinkModal] = useState<boolean>(false);
  const [externalTab, setExternalTab] = useState<'url' | 'pubchem'>('url');
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>('');
  const [pubchemSearchInput, setPubchemSearchInput] = useState<string>('');
  const [isFetchingExternal, setIsFetchingExternal] = useState<boolean>(false);
  const [externalFetchError, setExternalFetchError] = useState<string | null>(null);
  const [pubchemResult, setPubchemResult] = useState<PubChemLookupResult | null>(null);

  const filteredChemicals = useMemo(() => {
    const q = normalizeText(searchQuery);
    const compactQ = compactFormula(searchQuery);

    const result = chemicals.filter(chem => {
      // Multi-category filter: matching if ANY assigned category matches selectedCategory
      if (selectedCategory !== 'all') {
        const cats = getChemicalCategories(chem);
        if (!cats.some(cat => cat.toLowerCase() === selectedCategory.toLowerCase())) {
          return false;
        }
      }

      // Danger filter
      if (selectedDanger !== 'all' && chem.danger !== selectedDanger) {
        return false;
      }

      if (!q) return true;

      const cats = getChemicalCategories(chem);
      const searchable = normalizeText([
        chem.formula,
        chem.name,
        chem.properties,
        chem.msds,
        cats.join(' '),
        chem.category || '',
        ...(chem.aliases || [])
      ].join(' '));

      const fCompact = compactFormula(chem.formula);

      return searchable.includes(q) || (compactQ && fCompact.includes(compactQ));
    });

    // Apply sorting
    return result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'formula') {
        comparison = a.formula.localeCompare(b.formula, 'vi', { numeric: true });
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'vi');
      } else if (sortField === 'molar') {
        const ma = typeof a.molarMass === 'number' && a.molarMass > 0 ? a.molarMass : parseFloat(String(a.molar || '').replace(',', '.')) || 0;
        const mb = typeof b.molarMass === 'number' && b.molarMass > 0 ? b.molarMass : parseFloat(String(b.molar || '').replace(',', '.')) || 0;
        comparison = ma - mb;
      } else if (sortField === 'danger') {
        const priority: Record<DangerLevel, number> = { extreme: 4, danger: 3, caution: 2, safe: 1 };
        comparison = (priority[a.danger] || 0) - (priority[b.danger] || 0);
      } else if (sortField === 'category') {
        const ca = getChemicalCategories(a).join(', ');
        const cb = getChemicalCategories(b).join(', ');
        comparison = ca.localeCompare(cb, 'vi');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [chemicals, searchQuery, selectedCategory, selectedDanger, sortField, sortOrder]);

  const handleOpenAddCategory = () => {
    setNewCategoryName('');
    setShowAddCategoryModal(true);
  };

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    const updated = saveNewCategory(trimmed);
    setAvailableCategories(updated);
    setSelectedCategory(trimmed);

    // Auto-select into active modal if open
    if (showAddModal) {
      setNewCategories(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }
    if (editingChem) {
      setEditCategories(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }

    setShowAddCategoryModal(false);
  };

  const handleSaveChemical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormula.trim() || !newName.trim()) {
      alert('Vui lòng nhập công thức và tên hóa chất!');
      return;
    }

    const mass = parseFloat(newMolar.replace(',', '.'));
    const validMass = Number.isFinite(mass) && mass > 0 ? mass : 0;

    const dangerLabels: Record<DangerLevel, string> = {
      safe: 'AN TOÀN',
      caution: 'THẬN TRỌNG',
      danger: 'NGUY HIỂM',
      extreme: 'CỰC KỲ NGUY HIỂM'
    };

    const finalCategories = newCategories.length > 0 ? newCategories : ['Khác'];

    const newChem: Chemical = {
      key: compactFormula(newFormula),
      formula: newFormula.trim(),
      name: newName.trim(),
      danger: newDanger,
      dangerLabel: dangerLabels[newDanger],
      categories: finalCategories,
      category: finalCategories.join(', '),
      molar: validMass ? `${validMass} g/mol` : 'Chưa xác định',
      molarMass: validMass,
      boiling: newBoiling.trim() || 'Chưa có dữ liệu',
      ph: newPh.trim() || 'Chưa có dữ liệu',
      color: newDanger === 'danger' || newDanger === 'extreme' ? '#ff4757' : newDanger === 'caution' ? '#ffa502' : '#2ed573',
      colorBg: 'rgba(255,255,255,0.05)',
      properties: newProperties.trim() || 'Chưa có mô tả tính chất.',
      msds: newMsds.trim() || 'Tham khảo SDS từ nhà cung cấp hóa chất.',
      storage: newStorage.trim() || 'Bảo quản nơi khô mát, đậy kín nắp.',
      sdsUrl: newSdsUrl.trim() || undefined,
      pubChemCid: newPubChemCid || undefined,
      icscId: newIcscId.trim() || undefined,
      custom: true
    };

    saveCustomChemical(newChem);
    onRefreshChemicals();
    setShowAddModal(false);

    // Reset form
    setNewFormula('');
    setNewName('');
    setNewCategories(['Axit']);
    setNewMolar('');
    setNewBoiling('');
    setNewPh('');
    setNewProperties('');
    setNewMsds('');
    setNewStorage('');
    setNewSdsUrl('');
    setNewPubChemCid('');
    setNewIcscId('');
  };

  // Open Edit Chemical Modal
  const handleOpenEdit = (chem: Chemical) => {
    setEditingChem(chem);
    setEditFormula(chem.formula);
    setEditName(chem.name);
    setEditDanger(chem.danger);
    setEditCategories(getChemicalCategories(chem));
    setEditMolar(chem.molarMass ? String(chem.molarMass) : chem.molar.replace(' g/mol', ''));
    setEditBoiling(chem.boiling || '');
    setEditPh(chem.ph || '');
    setEditProperties(chem.properties || '');
    setEditMsds(chem.msds || '');
    setEditStorage(chem.storage || '');
    setEditSdsUrl(chem.sdsUrl || '');
    setEditPubChemCid(chem.pubChemCid || '');
    setEditIcscId(chem.icscId || detectIcscId(chem.formula, chem.name) || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChem || !editFormula.trim() || !editName.trim()) {
      alert('Vui lòng điền đủ công thức và tên hóa chất!');
      return;
    }

    const mass = parseFloat(editMolar.replace(',', '.'));
    const validMass = Number.isFinite(mass) && mass > 0 ? mass : 0;

    const dangerLabels: Record<DangerLevel, string> = {
      safe: 'AN TOÀN',
      caution: 'THẬN TRỌNG',
      danger: 'NGUY HIỂM',
      extreme: 'CỰC KỲ NGUY HIỂM'
    };

    const finalCategories = editCategories.length > 0 ? editCategories : ['Khác'];

    const updated: Chemical = {
      ...editingChem,
      formula: editFormula.trim(),
      name: editName.trim(),
      danger: editDanger,
      dangerLabel: dangerLabels[editDanger],
      categories: finalCategories,
      category: finalCategories.join(', '),
      molar: validMass ? `${validMass} g/mol` : editMolar.trim() || 'Chưa xác định',
      molarMass: validMass,
      boiling: editBoiling.trim() || 'Chưa có dữ liệu',
      ph: editPh.trim() || 'Chưa có dữ liệu',
      properties: editProperties.trim() || 'Chưa có mô tả tính chất.',
      msds: editMsds.trim() || 'Tham khảo SDS từ nhà cung cấp hóa chất.',
      storage: editStorage.trim() || 'Bảo quản nơi khô mát, đậy kín nắp.',
      sdsUrl: editSdsUrl.trim() || undefined,
      pubChemCid: editPubChemCid || undefined,
      icscId: editIcscId.trim() || undefined
    };

    updateChemical(editingChem.formula, updated);
    onRefreshChemicals();

    // If detail modal is open for this chemical, sync it
    if (selectedChem && compactFormula(selectedChem.formula) === compactFormula(editingChem.formula)) {
      setSelectedChem(updated);
    }

    setEditingChem(null);
  };

  // Selection Handlers
  const handleToggleSelectChemical = (formula: string) => {
    const key = compactFormula(formula);
    setSelectedFormulaKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    setSelectedFormulaKeys(prev => {
      const next = new Set(prev);
      filteredChemicals.forEach(c => next.add(compactFormula(c.formula)));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedFormulaKeys(new Set());
  };

  const handleExecuteBulkDelete = () => {
    if (selectedFormulaKeys.size === 0) return;

    const formulasToDelete = Array.from(selectedFormulaKeys);
    deleteMultipleChemicals(formulasToDelete);
    onRefreshChemicals();
    setSelectedFormulaKeys(new Set());
    setShowDeleteConfirmModal(false);
    setIsBulkMode(false);
    setDeletedBaseKeysCount(getDeletedBaseChemicalKeys().length);

    if (selectedChem && selectedFormulaKeys.has(compactFormula(selectedChem.formula))) {
      setSelectedChem(null);
    }
  };

  const handleRestoreDefaults = () => {
    if (confirm('Khôi phục toàn bộ các hóa chất mặc định đã bị xóa trước đây?')) {
      restoreAllDeletedChemicals();
      onRefreshChemicals();
      setDeletedBaseKeysCount(0);
    }
  };

  const handleResetToDefault = (chem: Chemical) => {
    if (confirm(`Khôi phục hóa chất "${chem.formula}" về thông số gốc tiêu chuẩn ban đầu?`)) {
      resetChemicalToDefault(chem.formula);
      onRefreshChemicals();
      setSelectedChem(null);
      setDeletedBaseKeysCount(getDeletedBaseChemicalKeys().length);
    }
  };

  const handleDeleteChemical = (chem: Chemical) => {
    if (confirm(`Bạn có chắc muốn xóa hóa chất "${chem.formula} — ${chem.name}" khỏi cơ sở dữ liệu?`)) {
      deleteChemical(chem.formula);
      onRefreshChemicals();
      setDeletedBaseKeysCount(getDeletedBaseChemicalKeys().length);
      if (selectedChem?.formula === chem.formula) {
        setSelectedChem(null);
      }
    }
  };

  const handleDeleteCustom = (chem: Chemical) => {
    handleDeleteChemical(chem);
  };

  const getDangerBadgeClass = (danger: DangerLevel) => {
    switch (danger) {
      case 'extreme':
        return 'text-slate-100 bg-slate-900 border-slate-700';
      case 'danger':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'caution':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'safe':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  // Helper to escape CSV string
  const escapeCSVCell = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  // Export Chemical Database to CSV
  const exportDatabaseToCSV = (onlyFiltered = false) => {
    const listToExport = onlyFiltered ? filteredChemicals : chemicals;
    if (listToExport.length === 0) {
      alert('Không có dữ liệu hóa chất nào để xuất CSV.');
      return;
    }

    const headers = [
      'Công thức',
      'Tên hóa chất',
      'Mức độ nguy hiểm',
      'Nhãn cảnh báo',
      'Nhóm phân loại',
      'Khối lượng Mol (g/mol)',
      'Nhiệt độ sôi',
      'Độ pH',
      'Tính chất hóa học',
      'Hướng dẫn an toàn MSDS / Sơ cứu',
      'Quy cách lưu trữ & bảo quản',
      'Tên gọi khác / Biệt danh'
    ];

    const rows = listToExport.map(c => [
      escapeCSVCell(c.formula),
      escapeCSVCell(c.name),
      escapeCSVCell(c.danger),
      escapeCSVCell(c.dangerLabel),
      escapeCSVCell(c.categories && c.categories.length > 0 ? c.categories.join('; ') : (c.category || getChemicalCategory(c))),
      escapeCSVCell(c.molar),
      escapeCSVCell(c.boiling || ''),
      escapeCSVCell(c.ph || ''),
      escapeCSVCell(c.properties || ''),
      escapeCSVCell(c.msds || ''),
      escapeCSVCell(c.storage || ''),
      escapeCSVCell(c.aliases ? c.aliases.join('; ') : '')
    ]);

    // \uFEFF ensures UTF-8 BOM so Excel & Sheets display Vietnamese characters cleanly
    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `CSDL_Hoa_Chat_ChemSafe_${onlyFiltered ? 'loc_' : ''}${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setNotification(`Đã xuất thành công ${listToExport.length} hóa chất sang tệp tin CSV!`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Export Chemical Database to JSON
  const exportDatabaseToJSON = (onlyFiltered = false) => {
    const listToExport = onlyFiltered ? filteredChemicals : chemicals;
    if (listToExport.length === 0) {
      alert('Không có dữ liệu hóa chất nào để xuất JSON.');
      return;
    }

    const exportData = {
      app: 'ChemSafe AI',
      dataType: 'chemical_database',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalChemicals: listToExport.length,
      chemicals: listToExport
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `CSDL_Hoa_Chat_ChemSafe_${onlyFiltered ? 'loc_' : ''}${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowExportMenu(false);
    setNotification(`Đã xuất thành công ${listToExport.length} hóa chất sang tệp JSON sao lưu!`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Download Sample CSV Template
  const downloadCSVTemplate = () => {
    const headers = [
      'Công thức',
      'Tên hóa chất',
      'Mức độ nguy hiểm',
      'Nhãn cảnh báo',
      'Nhóm phân loại',
      'Khối lượng Mol (g/mol)',
      'Nhiệt độ sôi',
      'Độ pH',
      'Tính chất hóa học',
      'Hướng dẫn an toàn MSDS / Sơ cứu',
      'Quy cách lưu trữ & bảo quản',
      'Tên gọi khác / Biệt danh'
    ];

    const sampleRows = [
      [
        '"HCl"',
        '"Axit Clohydric 37%"',
        '"danger"',
        '"NGUY HIỂM"',
        '"Axit"',
        '"36.46 g/mol"',
        '"~48°C"',
        '"< 1"',
        '"Axit vô cơ mạnh, bốc khói trong không khí ẩm, ăn mòn mạnh kim loại."',
        '"Gây bỏng da, tổn thương mắt. Thao tác trong tủ hút, đeo kính và găng tay."',
        '"Tủ axit chuyên dụng, cách ly kiềm và chất oxy hóa."',
        '"hydrochloric acid; axit clohidric"'
      ],
      [
        '"NaOH"',
        '"Natri Hydroxide (Xút)"',
        '"danger"',
        '"NGUY HIỂM"',
        '"Bazơ / Kiềm"',
        '"40.00 g/mol"',
        '"1388°C"',
        '"> 13"',
        '"Kiềm mạnh, hút ẩm mạnh, tan tỏa nhiều nhiệt."',
        '"Gây bỏng kiềm sâu khó lành, đặc biệt nguy hiểm cho mắt."',
        '"Lọ nhựa kín, nơi khô ráo, tách biệt axit."',
        '"sodium hydroxide; xut an da"'
      ],
      [
        '"C2H5OH"',
        '"Ethanol 96%"',
        '"caution"',
        '"THẬN TRỌNG"',
        '"Dung môi / Hữu cơ"',
        '"46.07 g/mol"',
        '"78.3°C"',
        '"7.0"',
        '"Chất lỏng không màu, mùi thơm đặc trưng, dễ cháy."',
        '"Hơi dễ bắt cháy. Tránh xa nguồn nhiệt, tia lửa điện."',
        '"Tủ chống cháy chuyên dụng, thông gió tốt."',
        '"con; ruou etylic; ethyl alcohol"'
      ]
    ];

    const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...sampleRows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mau_Nhap_CSDL_Hoa_Chat_ChemSafe.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Import JSON or CSV file to add/update chemical database
  const handleDatabaseFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content || !content.trim()) {
          alert('Tệp tin rỗng hoặc không có dữ liệu.');
          return;
        }

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          const rawItems: any[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.chemicals)
            ? parsed.chemicals
            : Array.isArray(parsed.items)
            ? parsed.items
            : null;

          if (!rawItems || !Array.isArray(rawItems)) {
            throw new Error('Cấu trúc file JSON không đúng (cần mảng danh sách hóa chất).');
          }

          const validChemicals: Chemical[] = [];
          for (const item of rawItems) {
            if (item && item.formula && item.name) {
              const rawDanger = String(item.danger || 'caution').toLowerCase().trim();
              const dangerVal: DangerLevel = ['safe', 'caution', 'danger', 'extreme'].includes(rawDanger)
                ? (rawDanger as DangerLevel)
                : 'caution';

              const dangerLabels: Record<DangerLevel, string> = {
                safe: 'AN TOÀN',
                caution: 'THẬN TRỌNG',
                danger: 'NGUY HIỂM',
                extreme: 'CỰC KỲ NGUY HIỂM'
              };

              const mass = typeof item.molarMass === 'number'
                ? item.molarMass
                : parseFloat(String(item.molar || '').replace(',', '.'));
              const validMass = Number.isFinite(mass) && mass > 0 ? mass : 0;

              const rawCats = Array.isArray(item.categories)
                ? item.categories.map((c: any) => String(c).trim()).filter(Boolean)
                : item.category
                ? String(item.category).split(/[;,/|]/).map((c: any) => String(c).trim()).filter(Boolean)
                : [];
              const categories = rawCats.length > 0
                ? rawCats
                : detectChemicalCategories({ formula: String(item.formula), name: String(item.name) });

              validChemicals.push({
                key: item.key || compactFormula(item.formula),
                formula: String(item.formula).trim(),
                name: String(item.name).trim(),
                danger: dangerVal,
                dangerLabel: item.dangerLabel || dangerLabels[dangerVal],
                categories,
                category: categories.join(', '),
                molar: item.molar || (validMass ? `${validMass} g/mol` : 'Chưa xác định'),
                molarMass: validMass,
                boiling: item.boiling || 'Chưa có dữ liệu',
                ph: item.ph || 'Chưa có dữ liệu',
                color: dangerVal === 'danger' || dangerVal === 'extreme' ? '#ff4757' : dangerVal === 'caution' ? '#ffa502' : '#2ed573',
                colorBg: 'rgba(255,255,255,0.05)',
                properties: item.properties || 'Chưa có mô tả tính chất.',
                msds: item.msds || 'Tham khảo SDS từ nhà cung cấp hóa chất.',
                storage: item.storage || 'Bảo quản nơi thoáng mát, đậy kín nắp.',
                aliases: Array.isArray(item.aliases) ? item.aliases : []
              });
            }
          }

          if (validChemicals.length === 0) {
            alert('Không tìm thấy dữ liệu hóa chất hợp lệ trong file JSON (cần tối thiểu công thức và tên hóa chất).');
            return;
          }

          setImportPreviewData({
            fileName: file.name,
            fileType: 'json',
            items: validChemicals
          });
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length <= 1) {
            alert('File CSV không có dữ liệu (chỉ có tiêu đề hoặc rỗng).');
            return;
          }

          // Robust CSV line parser
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
                cells.push(current.trim());
                current = '';
              } else {
                current += ch;
              }
            }
            cells.push(current.trim());
            return cells;
          };

          const headerCells = parseCSVRow(lines[0]).map(h => normalizeText(h.replace(/^"|"$/g, '')));

          const findColIdx = (keywords: string[]) => {
            return headerCells.findIndex(h => keywords.some(k => h.includes(k)));
          };

          const formulaIdx = findColIdx(['cong thuc', 'formula', 'ma', 'ky hieu']);
          const nameIdx = findColIdx(['ten hoa chat', 'ten', 'name']);
          const dangerIdx = findColIdx(['muc do nguy hiem', 'muc do', 'danger', 'hazard']);
          const categoryIdx = findColIdx(['nhom phan loai', 'nhom', 'phan loai', 'category']);
          const molarIdx = findColIdx(['khoi luong mol', 'molar', 'molar mass', 'm']);
          const boilingIdx = findColIdx(['nhiet do soi', 'boiling', 'soi']);
          const phIdx = findColIdx(['do ph', 'ph']);
          const propIdx = findColIdx(['tinh chat', 'dac tinh', 'properties']);
          const msdsIdx = findColIdx(['msds', 'so cuu', 'an toan', 'huong dan']);
          const storageIdx = findColIdx(['luu tru', 'bao quan', 'storage', 'quy cach']);
          const aliasIdx = findColIdx(['biet danh', 'ten goi khac', 'ten khac', 'aliases']);

          const fIdx = formulaIdx >= 0 ? formulaIdx : 0;
          const nIdx = nameIdx >= 0 ? nameIdx : 1;
          const dIdx = dangerIdx >= 0 ? dangerIdx : 2;
          const cIdx = categoryIdx >= 0 ? categoryIdx : 4;
          const mIdx = molarIdx >= 0 ? molarIdx : 5;
          const bIdx = boilingIdx >= 0 ? boilingIdx : 6;
          const pIdx = phIdx >= 0 ? phIdx : 7;
          const prIdx = propIdx >= 0 ? propIdx : 8;
          const sdsIdx = msdsIdx >= 0 ? msdsIdx : 9;
          const stIdx = storageIdx >= 0 ? storageIdx : 10;
          const aIdx = aliasIdx >= 0 ? aliasIdx : 11;

          const validChemicals: Chemical[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cells = parseCSVRow(lines[i]);
            const formula = (cells[fIdx] || '').replace(/^"|"$/g, '').trim();
            const name = (cells[nIdx] || '').replace(/^"|"$/g, '').trim();

            if (formula && name) {
              const rawDanger = (cells[dIdx] || 'caution').replace(/^"|"$/g, '').toLowerCase().trim();
              let dangerVal: DangerLevel = 'caution';
              if (rawDanger.includes('extreme') || rawDanger.includes('cuc ky')) dangerVal = 'extreme';
              else if (rawDanger.includes('danger') || rawDanger.includes('nguy hiem')) dangerVal = 'danger';
              else if (rawDanger.includes('safe') || rawDanger.includes('an toan')) dangerVal = 'safe';
              else if (['safe', 'caution', 'danger', 'extreme'].includes(rawDanger)) dangerVal = rawDanger as DangerLevel;

              const dangerLabels: Record<DangerLevel, string> = {
                safe: 'AN TOÀN',
                caution: 'THẬN TRỌNG',
                danger: 'NGUY HIỂM',
                extreme: 'CỰC KỲ NGUY HIỂM'
              };

              const rawMolar = (cells[mIdx] || '').replace(/^"|"$/g, '').trim();
              const mass = parseFloat(rawMolar.replace(',', '.'));
              const validMass = Number.isFinite(mass) && mass > 0 ? mass : 0;

              const aliasesRaw = (cells[aIdx] || '').replace(/^"|"$/g, '').trim();
              const aliases = aliasesRaw ? aliasesRaw.split(/[;,]/).map(a => a.trim()).filter(Boolean) : [];

              const rawCat = (cells[cIdx] || '').replace(/^"|"$/g, '').trim();
              const parsedCats = rawCat ? rawCat.split(/[;,/|]/).map(c => c.trim()).filter(Boolean) : [];
              const categories = parsedCats.length > 0
                ? parsedCats
                : detectChemicalCategories({ formula, name });

              validChemicals.push({
                key: compactFormula(formula),
                formula,
                name,
                danger: dangerVal,
                dangerLabel: dangerLabels[dangerVal],
                categories,
                category: categories.join(', '),
                molar: validMass ? `${validMass} g/mol` : rawMolar || 'Chưa xác định',
                molarMass: validMass,
                boiling: (cells[bIdx] || 'Chưa có dữ liệu').replace(/^"|"$/g, '').trim() || 'Chưa có dữ liệu',
                ph: (cells[pIdx] || 'Chưa có dữ liệu').replace(/^"|"$/g, '').trim() || 'Chưa có dữ liệu',
                color: dangerVal === 'danger' || dangerVal === 'extreme' ? '#ff4757' : dangerVal === 'caution' ? '#ffa502' : '#2ed573',
                colorBg: 'rgba(255,255,255,0.05)',
                properties: (cells[prIdx] || 'Chưa có mô tả tính chất.').replace(/^"|"$/g, '').trim() || 'Chưa có mô tả tính chất.',
                msds: (cells[sdsIdx] || 'Tham khảo SDS từ nhà cung cấp hóa chất.').replace(/^"|"$/g, '').trim() || 'Tham khảo SDS từ nhà cung cấp hóa chất.',
                storage: (cells[stIdx] || 'Bảo quản nơi khô ráo, thoáng mát.').replace(/^"|"$/g, '').trim() || 'Bảo quản nơi khô ráo, thoáng mát.',
                aliases
              });
            }
          }

          if (validChemicals.length === 0) {
            alert('Không tìm thấy dòng hóa chất hợp lệ từ file CSV. Hãy kiểm tra các cột Công thức và Tên hóa chất.');
            return;
          }

          setImportPreviewData({
            fileName: file.name,
            fileType: 'csv',
            items: validChemicals
          });
        } else {
          alert('Vui lòng chọn tệp tin có định dạng .json hoặc .csv');
        }
      } catch (err) {
        alert('Có lỗi xảy ra khi đọc file: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreviewData || importPreviewData.items.length === 0) return;

    const result = bulkImportChemicals(importPreviewData.items, importOverwrite);
    onRefreshChemicals();
    setAvailableCategories(getAllCategories());

    const summaryMsg = `Đã nhập thành công ${importPreviewData.items.length} hóa chất vào cơ sở dữ liệu (${result.addedCount} mới, ${result.updatedCount} cập nhật)!`;
    setNotification(summaryMsg);
    setTimeout(() => setNotification(null), 5000);
    setImportPreviewData(null);
  };

  const handleExternalImport = (items: Chemical[], overwrite: boolean) => {
    const result = bulkImportChemicals(items, overwrite);
    onRefreshChemicals();
    setAvailableCategories(getAllCategories());
    const msg = `Đã nạp thành công ${items.length} hóa chất từ nguồn bên ngoài (${result.addedCount} mới, ${result.updatedCount} cập nhật)!`;
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenAddWithPrefill = (prefilled: Partial<Chemical>) => {
    if (prefilled.formula) setNewFormula(prefilled.formula);
    if (prefilled.name) setNewName(prefilled.name);
    if (prefilled.molar) setNewMolar(prefilled.molar);
    if (prefilled.sdsUrl) setNewSdsUrl(prefilled.sdsUrl);
    if (prefilled.pubChemCid) setNewPubChemCid(prefilled.pubChemCid);
    if (prefilled.icscId) {
      setNewIcscId(prefilled.icscId);
    } else if (prefilled.formula || prefilled.name) {
      const detected = detectIcscId(prefilled.formula, prefilled.name);
      if (detected) setNewIcscId(detected);
    }
    if (prefilled.categories && prefilled.categories.length > 0) setNewCategories(prefilled.categories);
    if (prefilled.properties) setNewProperties(prefilled.properties);
    if (prefilled.msds) setNewMsds(prefilled.msds);
    setShowAddModal(true);
  };

  const handleAutoFetchPubChemForAdd = async () => {
    const term = newFormula.trim() || newName.trim();
    if (!term) {
      alert('Vui lòng nhập công thức hoặc tên hóa chất để tra cứu từ PubChem!');
      return;
    }
    setIsFetchingExternal(true);
    try {
      const res = await lookupPubChem(term);
      if (!newFormula.trim()) setNewFormula(res.formula);
      if (!newName.trim() || newName.trim() === newFormula.trim()) setNewName(res.name);
      if (res.molarMass && !newMolar) setNewMolar(String(res.molarMass));
      if (res.cid) setNewPubChemCid(res.cid);
      if (res.safetySummary && !newMsds) setNewMsds(res.safetySummary);
      if (res.iupacName && !newProperties) setNewProperties(`Tên IUPAC: ${res.iupacName}. PubChem CID: ${res.cid}`);
      const detected = detectChemicalCategories({ formula: res.formula, name: res.name });
      if (detected.length > 0) setNewCategories(detected);
      
      // Auto-detect ILO ICSC card code if not already filled
      if (!newIcscId) {
        const icscCode = detectIcscId(res.formula, res.name);
        if (icscCode) setNewIcscId(icscCode);
      }

      setNotification(`Đã tự động điền thông số cho "${res.name}" từ PubChem NIH & ILO ICSC!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const handleAutoFetchPubChemForEdit = async () => {
    const term = editFormula.trim() || editName.trim();
    if (!term) {
      alert('Vui lòng nhập công thức hoặc tên hóa chất để tra cứu từ PubChem!');
      return;
    }
    setIsFetchingExternal(true);
    try {
      const res = await lookupPubChem(term);
      if (res.molarMass && !editMolar) setEditMolar(String(res.molarMass));
      if (res.cid) setEditPubChemCid(res.cid);
      if (res.safetySummary && !editMsds) setEditMsds(res.safetySummary);
      if (res.iupacName && !editProperties) setEditProperties(`Tên IUPAC: ${res.iupacName}. PubChem CID: ${res.cid}`);
      
      // Auto-detect ILO ICSC card code if not already filled
      if (!editIcscId) {
        const icscCode = detectIcscId(res.formula, res.name);
        if (icscCode) setEditIcscId(icscCode);
      }

      setNotification(`Đã cập nhật thông số từ PubChem cho "${res.name}"!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const handleAutoDetectIcscForAdd = () => {
    const termF = newFormula.trim();
    const termN = newName.trim();
    if (!termF && !termN) {
      alert('Vui lòng nhập công thức hoặc tên hóa chất trước khi tự động nhận diện mã ILO ICSC.');
      return;
    }
    const detected = detectIcscId(termF, termN);
    if (detected) {
      setNewIcscId(detected);
      setNotification(`Đã tự động nhận diện mã thẻ ILO ICSC: #${detected} cho "${termF || termN}"!`);
      setTimeout(() => setNotification(null), 4000);
    } else {
      alert(`Chưa tìm thấy mã thẻ ICSC tự động cho "${termF || termN}". Bạn có thể mở https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3 để xem danh sách và điền mã.`);
    }
  };

  const handleAutoDetectIcscForEdit = () => {
    const termF = editFormula.trim();
    const termN = editName.trim();
    if (!termF && !termN) {
      alert('Vui lòng nhập công thức hoặc tên hóa chất trước khi tự động nhận diện mã ILO ICSC.');
      return;
    }
    const detected = detectIcscId(termF, termN);
    if (detected) {
      setEditIcscId(detected);
      setNotification(`Đã tự động nhận diện mã thẻ ILO ICSC: #${detected} cho "${termF || termN}"!`);
      setTimeout(() => setNotification(null), 4000);
    } else {
      alert(`Chưa tìm thấy mã thẻ ICSC tự động cho "${termF || termN}". Bạn có thể mở https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3 để xem danh sách và điền mã.`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Hidden file input for database import */}
      <input
        type="file"
        id="database-file-import"
        accept=".json,.csv"
        onChange={handleDatabaseFileImport}
        className="hidden"
      />

      {/* Notification Toast Banner */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-emerald-300 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f2633] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Cơ sở dữ liệu <span className="text-emerald-400">Hóa chất & MSDS</span></span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tra cứu khối lượng mol, nhiệt độ sôi, pH, đặc tính an toàn, chỉnh sửa trực tiếp hoặc nhập/xuất sao lưu file CSV và JSON
          </p>
        </div>

        {/* Action Button Cluster (Export CSV, Export JSON, Import, Add) */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Export Dropdown / Buttons */}
          <div id="db-export-menu-container" className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Tùy chọn xuất CSDL hóa chất sang CSV hoặc JSON"
              className="px-3 py-2 text-xs font-mono font-medium text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#262f3d] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất CSDL</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-[#12161f] border border-[#262f3d] rounded-xl shadow-2xl py-1.5 z-40 animate-scaleUp">
                <button
                  onClick={() => exportDatabaseToCSV(false)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-emerald-300 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Xuất CSV (Toàn bộ)</div>
                    <div className="text-[10px] text-slate-400">Mở trên Excel & Google Sheets</div>
                  </div>
                </button>

                {filteredChemicals.length !== chemicals.length && (
                  <button
                    onClick={() => exportDatabaseToCSV(true)}
                    className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-emerald-300 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                    <div>
                      <div className="font-semibold">Xuất CSV (Đang lọc: {filteredChemicals.length})</div>
                      <div className="text-[10px] text-slate-400">Chỉ danh sách kết quả tìm kiếm</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => exportDatabaseToJSON(false)}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-[#1a212e] hover:text-emerald-300 flex items-center gap-2 border-t border-[#1f2633]"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold">Xuất JSON (Sao lưu)</div>
                    <div className="text-[10px] text-slate-400">Đầy đủ cấu trúc dữ liệu JSON</div>
                  </div>
                </button>

                <button
                  onClick={downloadCSVTemplate}
                  className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-[#1a212e] hover:text-slate-200 flex items-center gap-2 border-t border-[#1f2633]"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <div>Tải file mẫu CSV</div>
                    <div className="text-[10px] text-slate-400">Mẫu cột chuẩn để nhập liệu</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Dashboard Button */}
          <button
            onClick={() => setShowDashboard(!showDashboard)}
            title={showDashboard ? 'Thu gọn biểu đồ thống kê' : 'Xem biểu đồ phân tích CSDL'}
            className={`px-3 py-2 text-xs font-mono font-medium rounded-lg transition-colors flex items-center gap-1.5 border shadow-xs ${
              showDashboard
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-[#171d28] hover:bg-[#202738] text-slate-300 border-[#262f3d]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showDashboard ? 'Ẩn biểu đồ' : 'Biểu đồ CSDL'}</span>
          </button>

          {/* Import File Button */}
          <button
            onClick={() => document.getElementById('database-file-import')?.click()}
            title="Nhập dữ liệu hóa chất từ tệp tin CSV hoặc JSON"
            className="px-3 py-2 text-xs font-mono font-medium text-slate-200 bg-[#171d28] hover:bg-[#202738] border border-[#262f3d] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nhập file</span>
          </button>

          {/* External Link / PubChem Button */}
          <button
            onClick={() => setShowExternalLinkModal(true)}
            title="Nhập danh mục từ đường link URL trực tuyến (JSON/CSV/Sheets) hoặc tra cứu trực tiếp từ PubChem NIH"
            className="px-3 py-2 text-xs font-mono font-medium text-sky-300 bg-sky-950/30 hover:bg-sky-900/40 border border-sky-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Link ngoài / PubChem</span>
          </button>

          {/* Add New Chemical Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-mono font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm hóa chất mới</span>
          </button>
        </div>
      </div>

      {/* Interactive Charts & Statistics Dashboard */}
      {showDashboard && (
        <DatabaseDashboard
          chemicals={chemicals}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          selectedDanger={selectedDanger}
          onSelectDanger={(danger) => setSelectedDanger(danger)}
          totalAvailableCount={chemicals.length}
        />
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm theo công thức (HCl, NaOH...), tên hoặc nhóm phân loại (Axit, Bazơ, Khí...)..."
              className="w-full bg-[#12161f] border border-[#1f2633] focus:border-emerald-400 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDanger}
              onChange={(e) => setSelectedDanger(e.target.value)}
              className="bg-[#12161f] border border-[#1f2633] rounded-lg px-3 py-2.5 text-xs text-slate-300 outline-none"
            >
              <option value="all">Mọi mức độ nguy hiểm</option>
              <option value="danger">🔴 Nguy hiểm</option>
              <option value="caution">🟡 Thận trọng</option>
              <option value="safe">🟢 An toàn</option>
              <option value="extreme">⚫ Cực kỳ nguy hiểm</option>
            </select>

            {/* View Mode Toggle: Grid vs Table */}
            <div className="flex items-center bg-[#12161f] border border-[#1f2633] rounded-lg p-0.5 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => handleToggleViewMode('grid')}
                title="Hiển thị dạng thẻ lưới (Grid View)"
                className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a212e]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                title="Hiển thị dạng bảng chi tiết (Table View)"
                className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                  viewMode === 'table'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a212e]'
                }`}
              >
                <Table className="w-4 h-4" />
              </button>
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
            Tất cả nhóm ({chemicals.length})
          </button>

          {availableCategories.map((cat) => {
            const countInCat = chemicals.filter(chem =>
              getChemicalCategories(chem).some(c => c.toLowerCase() === cat.toLowerCase())
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

          {/* Add Category button */}
          <button
            onClick={handleOpenAddCategory}
            title="Thêm nhóm phân loại hóa chất mới"
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

          {/* Toggle Multi-Select / Bulk Delete Mode Button */}
          <button
            onClick={() => {
              if (isBulkMode) {
                setIsBulkMode(false);
                setSelectedFormulaKeys(new Set());
              } else {
                setIsBulkMode(true);
              }
            }}
            title="Bật/tắt chế độ chọn nhiều hóa chất để xóa hàng loạt"
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap font-mono font-medium transition-all flex items-center gap-1.5 border shadow-xs ${
              isBulkMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-[#171d28] hover:bg-[#202738] text-slate-300 border-[#2b3547]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
            <span>{isBulkMode ? 'Tắt chọn nhiều' : 'Chọn nhiều để xóa'}</span>
          </button>

          {/* Restore Deleted Base Chemicals button if any */}
          {deletedBaseKeysCount > 0 && (
            <button
              onClick={handleRestoreDefaults}
              title="Khôi phục lại các chất mặc định hệ thống đã xóa"
              className="px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-mono text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" />
              <span>Khôi phục ({deletedBaseKeysCount} chất gốc)</span>
            </button>
          )}

          <span className="text-xs font-mono text-slate-400 ml-auto whitespace-nowrap pl-2">
            Hiển thị: {filteredChemicals.length} hóa chất
          </span>
        </div>
      </div>

      {/* Floating or Sticky Bulk Action Bar when Bulk Mode is Active */}
      {isBulkMode && (
        <div className="bg-[#161c28] border-2 border-rose-500/50 rounded-xl p-3.5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>CHẾ ĐỘ CHỌN HÀNG LOẠT:</span>
            </div>

            <div className="text-xs font-mono text-slate-200">
              Đã chọn: <strong className="text-rose-400 text-sm">{selectedFormulaKeys.size}</strong> / {filteredChemicals.length} chất hiển thị
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSelectAllVisible}
                className="px-2.5 py-1 rounded bg-[#10141d] hover:bg-[#1f2637] border border-[#263143] text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                title="Chọn tất cả hóa chất đang hiển thị trên trang"
              >
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                <span>Chọn tất cả ({filteredChemicals.length})</span>
              </button>

              {selectedFormulaKeys.size > 0 && (
                <button
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded bg-[#10141d] hover:bg-[#1f2637] border border-[#263143] text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => {
                setIsBulkMode(false);
                setSelectedFormulaKeys(new Set());
              }}
              className="px-3 py-1.5 rounded-lg border border-[#2a3445] text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-[#1a212e] transition-colors"
            >
              Hủy
            </button>

            <button
              disabled={selectedFormulaKeys.size === 0}
              onClick={() => setShowDeleteConfirmModal(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-md ${
                selectedFormulaKeys.size > 0
                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-98'
                  : 'bg-rose-950/40 text-rose-500/50 border border-rose-900/40 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedFormulaKeys.size > 0 ? `${selectedFormulaKeys.size} chất đã chọn` : 'chất đã chọn'}</span>
            </button>
          </div>
        </div>
      )}

      {/* List / Table of Chemicals */}
      {filteredChemicals.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#12161f] border border-[#1f2633] space-y-2">
          <p className="text-sm text-slate-300">Không tìm thấy hóa chất nào khớp với tìm kiếm "{searchQuery}"</p>
          <p className="text-xs text-slate-400">Bạn có thể tự thêm hóa chất này vào cơ sở dữ liệu bằng nút "+ Thêm hóa chất mới" ở trên.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Hiển thị dạng bảng chuyên nghiệp) */
        <div className="bg-[#12161f] border border-[#1f2633] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0c0f14] border-b border-[#1f2633] text-slate-400 font-mono text-[11px] uppercase tracking-wider select-none">
                  {/* Select All Checkbox header in bulk mode */}
                  {isBulkMode && (
                    <th className="py-3 px-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = filteredChemicals.every(c => selectedFormulaKeys.has(compactFormula(c.formula)));
                          if (allSelected) {
                            handleDeselectAll();
                          } else {
                            handleSelectAllVisible();
                          }
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-colors mx-auto ${
                          filteredChemicals.length > 0 && filteredChemicals.every(c => selectedFormulaKeys.has(compactFormula(c.formula)))
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#12161f] border border-[#2a3445] text-transparent hover:border-rose-400'
                        }`}
                        title="Chọn hoặc bỏ chọn tất cả các dòng đang hiển thị"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>
                    </th>
                  )}

                  <th
                    onClick={() => handleSort('formula')}
                    className="py-3 px-4 font-semibold text-slate-200 cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Công thức</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'formula' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 font-semibold text-slate-200 cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tên hóa chất</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'name' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('danger')}
                    className="py-3 px-4 font-semibold text-slate-200 cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Mức độ nguy hại</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'danger' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('category')}
                    className="py-3 px-4 font-semibold text-slate-200 cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nhóm phân loại</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'category' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('molar')}
                    className="py-3 px-4 font-semibold text-slate-200 cursor-pointer hover:text-emerald-400 transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Khối lượng mol</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'molar' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                  </th>

                  <th className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                    Điểm sôi
                  </th>

                  <th className="py-3 px-4 font-semibold text-slate-200 whitespace-nowrap">
                    Độ pH
                  </th>

                  <th className="py-3 px-4 font-semibold text-slate-200 text-right whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1f2633]/60">
                {filteredChemicals.map((chem) => {
                  const isCustom = chem.custom;
                  const isEdited = chem.isEdited;
                  const chemCategories = getChemicalCategories(chem);
                  const chemKey = compactFormula(chem.formula);
                  const isSelected = selectedFormulaKeys.has(chemKey);

                  return (
                    <tr
                      key={chem.key + chem.formula}
                      onClick={() => {
                        if (isBulkMode) {
                          handleToggleSelectChemical(chem.formula);
                        } else {
                          setSelectedChem(chem);
                        }
                      }}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-rose-950/25 hover:bg-rose-950/35'
                          : 'hover:bg-[#171d28]/70'
                      }`}
                    >
                      {/* Bulk Checkbox column */}
                      {isBulkMode && (
                        <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelectChemical(chem.formula)}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-colors mx-auto ${
                              isSelected
                                ? 'bg-rose-500 text-white'
                                : 'bg-[#0c0f14] border border-[#2b3547] text-transparent hover:border-rose-400'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </td>
                      )}

                      {/* Formula */}
                      <td className="py-3 px-4 font-mono font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{chem.formula}</span>
                          {isEdited && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                              Đã sửa
                            </span>
                          )}
                          {isCustom && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Tự thêm
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 text-slate-200 font-medium max-w-[200px] truncate" title={chem.name}>
                        {chem.name}
                      </td>

                      {/* Danger badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${getDangerBadgeClass(chem.danger)}`}>
                          {chem.dangerLabel}
                        </span>
                      </td>

                      {/* Categories (multiple badges) */}
                      <td className="py-3 px-4 max-w-[240px]">
                        <div className="flex flex-wrap gap-1">
                          {chemCategories.map((cat) => (
                            <span
                              key={cat}
                              className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Molar Mass */}
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {chem.molar}
                      </td>

                      {/* Boiling */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {chem.boiling}
                      </td>

                      {/* pH */}
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {chem.ph}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {chem.sdsUrl && (
                            <a
                              href={chem.sdsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-mono flex items-center gap-1 transition-colors"
                              title="Mở tài liệu SDS/MSDS ngoài (PDF/Link)"
                            >
                              <FileText className="w-3 h-3" />
                              <span>SDS</span>
                            </a>
                          )}

                          {chem.pubChemCid && (
                            <a
                              href={`https://pubchem.ncbi.nlm.nih.gov/compound/${chem.pubChemCid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[10px] font-mono flex items-center gap-1 transition-colors"
                              title="Xem trang PubChem NIH"
                            >
                              <Globe className="w-3 h-3" />
                              <span>PubChem</span>
                            </a>
                          )}

                          {chem.cameoId && (
                            <a
                              href={`https://cameochemicals.noaa.gov/chemical/${chem.cameoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-1.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono flex items-center gap-1 transition-colors"
                              title="Xem phản ứng/tương kỵ trên CAMEO Chemicals (NOAA)"
                            >
                              <Globe className="w-3 h-3" />
                              <span>CAMEO</span>
                            </a>
                          )}

                          {/* ILO ICSC button */}
                          {(() => {
                            const icsc = getIcscUrl(chem);
                            return (
                              <a
                                href={icsc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-1.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[10px] font-mono flex items-center gap-1 transition-colors"
                                title={icsc.isDirect ? `Mở Thẻ An Toàn Quốc Tế ILO ICSC #${icsc.cardId} chính thức (ILO/WHO)` : 'Tra cứu trên danh mục thẻ an toàn hóa chất ILO ICSC'}
                              >
                                <ShieldAlert className="w-3 h-3 text-blue-400" />
                                <span>{icsc.cardId ? `ICSC #${icsc.cardId}` : 'ILO'}</span>
                              </a>
                            );
                          })()}

                          <button
                            onClick={() => setSelectedChem(chem)}
                            className="px-2 py-1 rounded bg-[#10141d] hover:bg-[#1f2637] text-[11px] font-mono text-emerald-400 hover:text-emerald-300 border border-[#242e40] transition-colors"
                            title="Xem chi tiết SDS & Bảo quản"
                          >
                            Chi tiết
                          </button>

                          <button
                            onClick={() => handleOpenEdit(chem)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-[#1a212e] transition-colors"
                            title="Chỉnh sửa hóa chất"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteChemical(chem)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Xóa hóa chất này khỏi CSDL"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer info */}
          <div className="py-2.5 px-4 bg-[#0c0f14] border-t border-[#1f2633] flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Hiển thị {filteredChemicals.length} dòng hóa chất</span>
            <span>Sắp xếp theo: {sortField === 'formula' ? 'Công thức' : sortField === 'name' ? 'Tên' : sortField === 'molar' ? 'Khối lượng mol' : sortField === 'danger' ? 'Mức độ nguy hiểm' : 'Nhóm'} ({sortOrder === 'asc' ? 'Tăng dần ↑' : 'Giảm dần ↓'})</span>
          </div>
        </div>
      ) : (
        /* GRID VIEW (Thẻ dạng lưới ban đầu) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredChemicals.map((chem) => {
            const isCustom = chem.custom;
            const isEdited = chem.isEdited;
            const chemCategories = getChemicalCategories(chem);
            const chemKey = compactFormula(chem.formula);
            const isSelected = selectedFormulaKeys.has(chemKey);

            return (
              <div
                key={chem.key + chem.formula}
                onClick={() => {
                  if (isBulkMode) {
                    handleToggleSelectChemical(chem.formula);
                  } else {
                    setSelectedChem(chem);
                  }
                }}
                className={`bg-[#12161f] border rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between group shadow-xs relative ${
                  isSelected
                    ? 'border-rose-500 bg-rose-950/15 ring-2 ring-rose-500/40 shadow-rose-950/20'
                    : 'border-[#1f2633] hover:border-emerald-500/50 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      {/* Selection Checkbox */}
                      {isBulkMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectChemical(chem.formula);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-rose-500 text-white'
                              : 'bg-[#0c0f14] border border-[#2b3547] text-transparent hover:border-rose-400'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      )}

                      <span className={`font-mono text-xl font-bold tracking-tight transition-colors ${
                        isSelected
                          ? 'text-rose-300'
                          : 'text-slate-100 group-hover:text-emerald-400'
                      }`}>
                        {chem.formula}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider shrink-0 ${getDangerBadgeClass(chem.danger)}`}>
                      {chem.dangerLabel}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-300 truncate mb-1.5">
                    {chem.name}
                  </h3>

                  {/* Multiple Category Chips */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {chemCategories.map(cat => (
                      <span
                        key={cat}
                        className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-[11px] font-sans border-t border-[#1a212e] pt-2 text-slate-400">
                    <div className="flex justify-between">
                      <span>Khối lượng mol:</span>
                      <span className="font-mono text-slate-300">{chem.molar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Điểm sôi:</span>
                      <span className="font-mono text-slate-300">{chem.boiling}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>pH dung dịch:</span>
                      <span className="font-mono text-slate-300">{chem.ph}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1a212e] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isEdited && (
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">
                        Đã sửa
                      </span>
                    )}
                    {isCustom && (
                      <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Tự thêm
                      </span>
                    )}
                    {chem.sdsUrl && (
                      <a
                        href={chem.sdsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 flex items-center gap-0.5 transition-colors"
                        title="Mở tài liệu SDS/MSDS ngoài (PDF / Web)"
                      >
                        <FileText className="w-2.5 h-2.5" />
                        <span>SDS</span>
                      </a>
                    )}
                    {chem.pubChemCid && (
                      <a
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${chem.pubChemCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 flex items-center gap-0.5 transition-colors"
                        title="Xem thông số trên PubChem NIH"
                      >
                        <Globe className="w-2.5 h-2.5" />
                        <span>NIH</span>
                      </a>
                    )}
                    {chem.cameoId && (
                      <a
                        href={`https://cameochemicals.noaa.gov/chemical/${chem.cameoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 flex items-center gap-0.5 transition-colors"
                        title="Xem phản ứng/tương kỵ trên CAMEO Chemicals (NOAA)"
                      >
                        <Globe className="w-2.5 h-2.5" />
                        <span>CAMEO</span>
                      </a>
                    )}
                    {(() => {
                      const icsc = getIcscUrl(chem);
                      return (
                        <a
                          href={icsc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 flex items-center gap-0.5 transition-colors"
                          title={icsc.isDirect ? `Mở Thẻ An Toàn ILO ICSC #${icsc.cardId} chính thức (Liên Hợp Quốc / WHO)` : 'Tra cứu kho thẻ an toàn hóa chất ILO ICSC'}
                        >
                          <ShieldAlert className="w-2.5 h-2.5 text-blue-400" />
                          <span>{icsc.cardId ? `ICSC #${icsc.cardId}` : 'ILO'}</span>
                        </a>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Single Delete Button right on card */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChemical(chem);
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10 transition-colors"
                      title="Xóa hóa chất này khỏi cơ sở dữ liệu"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Xóa</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(chem);
                      }}
                      className="text-xs font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#1a212e] transition-colors"
                      title="Chỉnh sửa thông số trực tiếp trong cơ sở dữ liệu"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>

                    <span className="text-emerald-400 group-hover:underline flex items-center gap-0.5 font-mono">
                      <span>MSDS</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedChem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#1f2633] pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-slate-100">{selectedChem.formula}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border uppercase tracking-wider ${getDangerBadgeClass(selectedChem.danger)}`}>
                    {selectedChem.dangerLabel}
                  </span>
                  {selectedChem.isEdited && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Đã chỉnh sửa
                    </span>
                  )}
                  {selectedChem.custom && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Hóa chất tự tạo
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-300 mt-1">
                  <span>{selectedChem.name}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Các nhóm phân loại:</span>
                  {getChemicalCategories(selectedChem).map(cat => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded text-[10.5px] font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedChem(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Khối lượng phân tử:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedChem.molar}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Điểm sôi:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedChem.boiling}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Độ pH:</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedChem.ph}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-lg bg-[#161c28] border border-[#242e40] space-y-1">
                <span className="font-mono text-[11px] uppercase text-emerald-400 font-semibold block">
                  Đặc tính hóa - lý:
                </span>
                <p className="text-slate-300">{selectedChem.properties}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#161c28] border border-[#242e40] space-y-1">
                <span className="font-mono text-[11px] uppercase text-rose-400 font-semibold block">
                  Cảnh báo an toàn (MSDS & Rủi ro):
                </span>
                <p className="text-slate-300">{selectedChem.msds}</p>
              </div>

              <div className="p-3 rounded-lg bg-[#161c28] border border-[#242e40] space-y-1">
                <span className="font-mono text-[11px] uppercase text-amber-400 font-semibold block">
                  Quy định lưu trữ & Bảo quản:
                </span>
                <p className="text-slate-300">{selectedChem.storage}</p>
              </div>

              {/* Chương trình học (theo bộ dữ liệu phân loại 39 chất) */}
              {selectedChem.curriculum && (
                <div className="p-3 rounded-lg bg-[#0c0f14] border border-[#1f2633] text-xs flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase text-emerald-400 font-bold">🎓 Chương trình học:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10.5px]">
                    {curriculumLevel(selectedChem.curriculum)}
                  </span>
                  <span className="text-slate-300">{formatCurriculum(selectedChem.curriculum)}</span>
                </div>
              )}

              {/* External Safety & Research Links */}
              {(() => {
                const ext = getExternalChemicalLinks(selectedChem);
                const icsc = getIcscUrl(selectedChem);
                return (
                  <div className="p-3.5 rounded-lg bg-[#0c0f14] border border-[#1f2633] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase text-sky-400 font-bold flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Liên kết tra cứu thông số an toàn & lý hóa trực tuyến:</span>
                      </span>
                      {selectedChem.pubChemCid && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          PubChem CID: {selectedChem.pubChemCid}
                        </span>
                      )}
                    </div>

                    {/* Official ILO / WHO ICSC Card Highlight Banner */}
                    <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                          <ShieldAlert className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-300 uppercase">
                              Thẻ An Toàn Hóa Chất Quốc Tế ILO / WHO (ICSC)
                            </span>
                            {icsc.cardId && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-500/40">
                                Mã ICSC: #{icsc.cardId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            Phiếu an toàn chính thức của Tổ chức Lao động Quốc tế (ILO) & WHO: Nhận diện nhanh các nguy cơ cháy nổ, triệu chứng phơi nhiễm cấp tính và phác đồ sơ cứu khẩn cấp.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <a
                          href={icsc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                          title="Mở trực tiếp Thẻ an toàn ICSC trên chemicalsafety.ilo.org"
                        >
                          <span>{icsc.isDirect ? `Xem Thẻ #${icsc.cardId} gốc` : 'Tra cứu ILO ICSC'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href="https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#141a26] hover:bg-[#1f2637] text-slate-300 border border-[#2a3445] text-[11px] font-mono flex items-center gap-1 transition-colors"
                          title="Mở toàn bộ danh mục thẻ an toàn hóa chất trên trang web chính thức của ILO"
                        >
                          <span>Kho thẻ ILO</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <a
                        href={ext.pubchemUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-2 rounded-lg bg-[#141a26] hover:bg-[#1c2436] text-sky-300 border border-sky-500/30 flex items-center justify-between group transition-colors shadow-xs"
                        title="Xem cấu trúc 2D/3D, độc tính, GHS trên PubChem NIH Hoa Kỳ"
                      >
                        <span className="truncate">🔬 PubChem NIH</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>

                      <a
                        href={ext.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-2 rounded-lg bg-[#141a26] hover:bg-[#1c2436] text-slate-300 border border-[#2a3445] flex items-center justify-between group transition-colors shadow-xs"
                        title="Xem trang bách khoa toàn thư Wikipedia"
                      >
                        <span className="truncate">🌐 Wikipedia</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>

                      <a
                        href={ext.sigmaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-2 rounded-lg bg-[#141a26] hover:bg-[#1c2436] text-amber-300 border border-amber-500/30 flex items-center justify-between group transition-colors shadow-xs"
                        title="Tra cứu tiêu chuẩn hóa chất Sigma-Aldrich / Merck"
                      >
                        <span className="truncate">🧪 Sigma-Aldrich</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>

                      <a
                        href={ext.chemSpiderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-2 rounded-lg bg-[#141a26] hover:bg-[#1c2436] text-teal-300 border border-teal-500/30 flex items-center justify-between group transition-colors shadow-xs"
                        title="Tra cứu cấu trúc và cơ sở dữ liệu ChemSpider"
                      >
                        <span className="truncate">🕸️ ChemSpider</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70 group-hover:opacity-100" />
                      </a>
                    </div>

                    {/* Direct SDS / MSDS Document Link */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#1a212e]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-mono text-[11px]">Tài liệu an toàn SDS:</span>
                        {selectedChem.sdsUrl ? (
                          <a
                            href={selectedChem.sdsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Mở tài liệu SDS/MSDS gốc (PDF/Web)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">
                            Chưa có URL SDS trực tiếp (Bấm "Chỉnh sửa" để dán đường link SDS)
                          </span>
                        )}
                      </div>

                      <a
                        href={ext.sdsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        <span>Tìm tài liệu SDS trên Google</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-[#1f2633] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedChem);
                  }}
                  className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa hóa chất</span>
                </button>

                <button
                  onClick={() => {
                    onSelectForWarning(selectedChem);
                    setSelectedChem(null);
                  }}
                  className="px-3 py-1.5 bg-[#1a212e] hover:bg-[#222b3b] text-slate-200 text-xs font-mono rounded-lg transition-colors"
                >
                  Kiểm tra tương kỵ
                </button>

                <button
                  onClick={() => {
                    onSelectForQR(selectedChem);
                    setSelectedChem(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-lg transition-colors"
                >
                  Tạo nhãn dán QR
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedChem.isEdited && (
                  <button
                    onClick={() => handleResetToDefault(selectedChem)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 border border-amber-500/30"
                    title="Khôi phục lại thông số tiêu chuẩn ban đầu của hóa chất này"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục gốc</span>
                  </button>
                )}

                <button
                  onClick={() => handleDeleteChemical(selectedChem)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 border border-rose-500/30"
                  title="Xóa hóa chất này khỏi cơ sở dữ liệu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa khỏi dữ liệu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Chemical (Direct editing of any chemical in DB) */}
      {editingChem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <div>
                <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <span>Chỉnh sửa thông số hóa chất: {editingChem.formula}</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dữ liệu sửa đổi sẽ được lưu trữ trực tiếp vào cơ sở dữ liệu và tự động cập nhật toàn ứng dụng
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingChem(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400">Công thức hóa học *</label>
                  <button
                    type="button"
                    onClick={handleAutoFetchPubChemForEdit}
                    disabled={isFetchingExternal}
                    className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    title="Tự động đồng bộ và nạp lại thông số từ PubChem NIH"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Nạp từ PubChem</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editFormula}
                  onChange={(e) => setEditFormula(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Tên hóa chất *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Mức độ nguy hiểm</label>
                <select
                  value={editDanger}
                  onChange={(e) => setEditDanger(e.target.value as DangerLevel)}
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
                      onClick={handleOpenAddCategory}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      + Tạo nhóm mới
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-[#0c0f14] border border-[#2a3445]">
                  {availableCategories.map((cat) => {
                    const isSelected = editCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditCategories(editCategories.filter(c => c !== cat));
                          } else {
                            setEditCategories([...editCategories, cat]);
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
                  Đã chọn: <span className="text-emerald-400">{editCategories.length > 0 ? editCategories.join(', ') : 'Chưa chọn nhóm (mặc định: Khác)'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Khối lượng mol (g/mol)</label>
                <input
                  type="text"
                  value={editMolar}
                  onChange={(e) => setEditMolar(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Điểm sôi</label>
                <input
                  type="text"
                  value={editBoiling}
                  onChange={(e) => setEditBoiling(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-mono text-slate-400">Độ pH (dung dịch)</label>
                <input
                  type="text"
                  value={editPh}
                  onChange={(e) => setEditPh(e.target.value)}
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Mô tả đặc tính lý hóa</label>
              <textarea
                rows={2}
                value={editProperties}
                onChange={(e) => setEditProperties(e.target.value)}
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Cảnh báo an toàn (MSDS & PPE)</label>
              <textarea
                rows={2}
                value={editMsds}
                onChange={(e) => setEditMsds(e.target.value)}
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Quy tắc bảo quản & Lưu trữ</label>
              <textarea
                rows={2}
                value={editStorage}
                onChange={(e) => setEditStorage(e.target.value)}
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 border-t border-[#1f2633]/60">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Đường dẫn tài liệu SDS ngoài (PDF / Web)</span>
                </label>
                <input
                  type="url"
                  value={editSdsUrl}
                  onChange={(e) => setEditSdsUrl(e.target.value)}
                  placeholder="https://...sds_document.pdf"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mã định danh PubChem CID</span>
                </label>
                <input
                  type="text"
                  value={editPubChemCid}
                  onChange={(e) => setEditPubChemCid(e.target.value)}
                  placeholder="VD: 702 (Ethanol), 2244 (Aspirin)"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                />
              </div>

              {/* ILO ICSC Field in Edit Modal */}
              <div className="space-y-1.5 md:col-span-2 p-3 rounded-lg bg-blue-950/20 border border-blue-500/25">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-mono text-blue-300 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mã thẻ an toàn ILO ICSC (Ví dụ: 0183, 0362, 0044)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoDetectIcscForEdit}
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                      title="Tự động tìm mã thẻ ICSC dựa theo công thức và tên hóa chất"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Tự động nhận diện ICSC</span>
                    </button>
                    <a
                      href="https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      title="Mở danh mục tra cứu tất cả các thẻ an toàn ICSC trên trang web ILO"
                    >
                      <span>Tra danh mục ILO</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={editIcscId}
                    onChange={(e) => setEditIcscId(e.target.value)}
                    placeholder="VD: 0362 (H2SO4), 0183 (HNO3), 0161 (HCl), 0044 (Ethanol)..."
                    className="flex-1 bg-[#0c0f14] border border-[#2a3445] focus:border-blue-500 rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                  />
                  {editIcscId.trim() && (
                    <a
                      href={`https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${editIcscId.trim().padStart(4, '0')}&p_version=2&p_lang=en`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-mono flex items-center gap-1 transition-colors shrink-0"
                    >
                      <span>Mở thẻ #{editIcscId.trim()}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setEditingChem(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded shadow-xs"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Chemical */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveChemical}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
                + Thêm hóa chất mới vào cơ sở dữ liệu
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400">Công thức hóa học *</label>
                  <button
                    type="button"
                    onClick={handleAutoFetchPubChemForAdd}
                    disabled={isFetchingExternal}
                    className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    title="Tự động tra cứu và điền thông số từ PubChem NIH"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Nạp từ PubChem</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newFormula}
                  onChange={(e) => setNewFormula(e.target.value)}
                  placeholder="VD: HNO3, C2H5OH"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Tên hóa chất *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Axit Nitric"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Mức độ nguy hiểm</label>
                <select
                  value={newDanger}
                  onChange={(e) => setNewDanger(e.target.value as DangerLevel)}
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
                      onClick={handleOpenAddCategory}
                      className="text-[10px] text-emerald-400 hover:underline font-mono"
                    >
                      + Tạo nhóm mới
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-[#0c0f14] border border-[#2a3445]">
                  {availableCategories.map((cat) => {
                    const isSelected = newCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewCategories(newCategories.filter(c => c !== cat));
                          } else {
                            setNewCategories([...newCategories, cat]);
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
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">
                    Đã chọn: <span className="text-emerald-400">{newCategories.length > 0 ? newCategories.join(', ') : 'Chưa chọn'}</span>
                  </span>
                  {newFormula && (
                    <button
                      type="button"
                      onClick={() => {
                        const detected = detectChemicalCategories({ formula: newFormula, name: newName });
                        setNewCategories(detected);
                      }}
                      className="text-emerald-400 hover:underline text-[10px]"
                    >
                      ⚡ Tự động nhận diện từ công thức
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Khối lượng mol (g/mol)</label>
                <input
                  type="text"
                  value={newMolar}
                  onChange={(e) => setNewMolar(e.target.value)}
                  placeholder="VD: 63.01"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Điểm sôi</label>
                <input
                  type="text"
                  value={newBoiling}
                  onChange={(e) => setNewBoiling(e.target.value)}
                  placeholder="VD: 83°C"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-mono text-slate-400">Độ pH (dung dịch)</label>
                <input
                  type="text"
                  value={newPh}
                  onChange={(e) => setNewPh(e.target.value)}
                  placeholder="VD: < 1 (dd 1M)"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Mô tả tính chất lý hóa</label>
              <textarea
                rows={2}
                value={newProperties}
                onChange={(e) => setNewProperties(e.target.value)}
                placeholder="Trạng thái, màu, mùi, phản ứng đặc trưng..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Thông tin an toàn (MSDS, PPE)</label>
              <textarea
                rows={2}
                value={newMsds}
                onChange={(e) => setNewMsds(e.target.value)}
                placeholder="Mức độ ăn mòn, độc tính, dụng cụ bảo hộ cần thiết..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="text-[11px] font-mono text-slate-400">Quy tắc lưu trữ & Bảo quản</label>
              <textarea
                rows={2}
                value={newStorage}
                onChange={(e) => setNewStorage(e.target.value)}
                placeholder="Loại chai lọ, nhiệt độ, các nhóm chất cần tránh xa..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 border-t border-[#1f2633]/60">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                  <span>Đường dẫn tài liệu SDS ngoài (PDF / Web)</span>
                </label>
                <input
                  type="url"
                  value={newSdsUrl}
                  onChange={(e) => setNewSdsUrl(e.target.value)}
                  placeholder="https://...sds_document.pdf"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mã định danh PubChem CID</span>
                </label>
                <input
                  type="text"
                  value={newPubChemCid}
                  onChange={(e) => setNewPubChemCid(e.target.value)}
                  placeholder="VD: 702 (Ethanol), 2244 (Aspirin)"
                  className="w-full bg-[#0c0f14] border border-[#2a3445] rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                />
              </div>

              {/* ILO ICSC Field in Add Modal */}
              <div className="space-y-1.5 md:col-span-2 p-3 rounded-lg bg-blue-950/20 border border-blue-500/25">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[11px] font-mono text-blue-300 font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mã thẻ an toàn ILO ICSC (Ví dụ: 0183, 0362, 0044)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoDetectIcscForAdd}
                      className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                      title="Tự động tìm mã thẻ ICSC dựa theo công thức và tên hóa chất"
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Tự động nhận diện ICSC</span>
                    </button>
                    <a
                      href="https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      title="Mở danh mục tra cứu tất cả các thẻ an toàn ICSC trên trang web ILO"
                    >
                      <span>Tra danh mục ILO</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newIcscId}
                    onChange={(e) => setNewIcscId(e.target.value)}
                    placeholder="VD: 0362 (H2SO4), 0183 (HNO3), 0161 (HCl), 0044 (Ethanol)..."
                    className="flex-1 bg-[#0c0f14] border border-[#2a3445] focus:border-blue-500 rounded px-3 py-2 text-slate-200 font-mono outline-none text-xs"
                  />
                  {newIcscId.trim() && (
                    <a
                      href={`https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${newIcscId.trim().padStart(4, '0')}&p_version=2&p_lang=en`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-2 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-mono flex items-center gap-1 transition-colors shrink-0"
                    >
                      <span>Mở thẻ #{newIcscId.trim()}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-mono font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded shadow-xs"
              >
                Lưu hóa chất
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewCategory}
            className="bg-[#12161f] border border-[#2b3547] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>Thêm nhóm phân loại mới</span>
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
                Nhóm mới sẽ xuất hiện trên thanh lọc và danh mục phân loại toàn bộ ứng dụng.
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

      {/* Modal: Xác nhận nhập dữ liệu CSDL Hóa chất */}
      {importPreviewData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-[#2b3547] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f2633] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-slate-100 flex items-center gap-2">
                    <span>Xác nhận nhập dữ liệu CSDL Hóa chất</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#1a2332] text-emerald-300 border border-emerald-500/30">
                      .{importPreviewData.fileType.toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tệp: <strong className="text-slate-200">{importPreviewData.fileName}</strong> • Tìm thấy{' '}
                    <strong className="text-emerald-400">{importPreviewData.items.length}</strong> hóa chất hợp lệ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportPreviewData(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview of first 5 chemicals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Xem trước danh sách ({Math.min(5, importPreviewData.items.length)} / {importPreviewData.items.length}):</span>
                <span className="text-[11px] text-emerald-400 font-normal">
                  Sẵn sàng nhập vào CSDL
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-[#1f2633] bg-[#0c0f14] divide-y divide-[#171d27]">
                {importPreviewData.items.slice(0, 5).map((chem, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-emerald-400 w-16">
                        {chem.formula}
                      </span>
                      <div>
                        <div className="text-slate-200 font-medium">{chem.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Nhóm: {chem.category || 'Khác'} • Mol: {chem.molar || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getDangerBadgeClass(chem.danger)}`}>
                      {chem.dangerLabel || chem.danger.toUpperCase()}
                    </span>
                  </div>
                ))}

                {importPreviewData.items.length > 5 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 font-mono bg-[#0f131a]">
                    ... và {importPreviewData.items.length - 5} hóa chất khác tiếp theo.
                  </div>
                )}
              </div>
            </div>

            {/* Import Mode Options */}
            <div className="p-3.5 rounded-xl bg-[#0c0f14] border border-[#1f2633] space-y-2 text-xs">
              <div className="font-mono font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Chế độ nhập dữ liệu:
              </div>
              <div className="space-y-2 text-slate-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!importOverwrite}
                    onChange={() => setImportOverwrite(false)}
                    className="mt-0.5 text-emerald-400 focus:ring-emerald-400"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">Gộp & Cập nhật (Khuyên dùng)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Thêm mới các hóa chất chưa có và cập nhật thông tin cho các chất trùng công thức. Giữ nguyên các chất khác trong CSDL.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importOverwrite}
                    onChange={() => setImportOverwrite(true)}
                    className="mt-0.5 text-rose-400 focus:ring-rose-400"
                  />
                  <div>
                    <span className="font-semibold text-rose-300">Ghi đè danh mục cá nhân</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Xóa toàn bộ các chất tùy chỉnh cũ đã thêm trước đó và chỉ giữ lại các chất trong file nhập này.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setImportPreviewData(null)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-4 py-2 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận nhập vào CSDL ({importPreviewData.items.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager & Editor Modal */}
      {showCategoryManagerModal && (
        <CategoryManagerModal
          isOpen={showCategoryManagerModal}
          onClose={() => setShowCategoryManagerModal(false)}
          chemicals={chemicals}
          inventory={inventoryFromStorage}
          onCategoriesUpdated={(updated) => {
            setAvailableCategories(updated);
            onRefreshChemicals();
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-rose-500/50 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-[#1f2633] pb-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Xác nhận xóa {selectedFormulaKeys.size} hóa chất?
                </h3>
                <p className="text-xs text-rose-400">
                  Thao tác này sẽ loại bỏ các hóa chất bị lỗi hoặc không mong muốn khỏi cơ sở dữ liệu
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-300">
                Bạn đang chọn xóa <strong className="text-rose-400 font-mono">{selectedFormulaKeys.size}</strong> hóa chất sau:
              </p>

              {/* Preview List of selected chemicals to delete */}
              <div className="max-h-48 overflow-y-auto rounded-lg bg-[#0c0f14] border border-[#1f2633] p-2 space-y-1 divide-y divide-[#1a212e]">
                {chemicals
                  .filter((c) => selectedFormulaKeys.has(compactFormula(c.formula)))
                  .map((c) => (
                    <div key={c.formula} className="pt-1 first:pt-0 flex items-center justify-between text-[11px] font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-200">{c.formula}</span>
                        <span className="text-slate-400 truncate">— {c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {c.custom ? 'Tự tạo' : c.isEdited ? 'Đã sửa' : 'Mặc định'}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Các hóa chất mặc định nếu xóa nhầm vẫn có thể được khôi phục bất cứ lúc nào bằng nút <strong>"Khôi phục chất gốc"</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#1a212e] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-98 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Đồng ý xóa ({selectedFormulaKeys.size} chất)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Link & PubChem Modal */}
      {showExternalLinkModal && (
        <ExternalLinkModal
          isOpen={showExternalLinkModal}
          onClose={() => setShowExternalLinkModal(false)}
          onImportChemicals={handleExternalImport}
          onOpenAddWithPrefill={handleOpenAddWithPrefill}
        />
      )}
    </div>
  );
};
