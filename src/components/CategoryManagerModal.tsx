import React, { useState, useMemo, useEffect } from 'react';
import { Chemical, InventoryItem } from '../types/chemical';
import {
  getAllCategories,
  saveNewCategory,
  updateCategory,
  deleteCategory,
  deleteMultipleCategories,
  resetCategoriesToDefault,
  isDefaultCategory,
  getChemicalCategories
} from '../data/chemicals';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Check,
  RotateCcw,
  Tags,
  AlertTriangle,
  Search,
  FolderPlus,
  Database,
  Box,
  CheckSquare,
  Square,
  CheckCheck
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  chemicals: Chemical[];
  inventory: InventoryItem[];
  onCategoriesUpdated?: (newCategories: string[]) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  chemicals,
  inventory,
  onCategoriesUpdated
}) => {
  const [categories, setCategories] = useState<string[]>(() => getAllCategories());
  const [newCatInput, setNewCatInput] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingNewName, setEditingNewName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Bulk Selection & Deletion for Categories
  const [isBulkCatMode, setIsBulkCatMode] = useState<boolean>(false);
  const [selectedCatNames, setSelectedCatNames] = useState<Set<string>>(new Set());
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCategories(getAllCategories());
      setEditingCategory(null);
      setEditingNewName('');
      setConfirmDeleteCat(null);
      setSearchQuery('');
      setIsBulkCatMode(false);
      setSelectedCatNames(new Set());
      setShowBulkConfirmModal(false);
    }
  }, [isOpen]);

  // Compute category usage in database and inventory
  const usageStats = useMemo(() => {
    const dbCounts: Record<string, number> = {};
    const invCounts: Record<string, number> = {};

    chemicals.forEach((chem) => {
      const cats = getChemicalCategories(chem);
      cats.forEach((cat) => {
        const key = cat.toLowerCase();
        dbCounts[key] = (dbCounts[key] || 0) + 1;
      });
    });

    inventory.forEach((item) => {
      const cats = getChemicalCategories(item);
      cats.forEach((cat) => {
        const key = cat.toLowerCase();
        invCounts[key] = (invCounts[key] || 0) + 1;
      });
    });

    return { dbCounts, invCounts };
  }, [chemicals, inventory]);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showNotification(`Nhóm "${trimmed}" đã tồn tại trong danh mục!`, 'error');
      return;
    }

    const updated = saveNewCategory(trimmed);
    setCategories(updated);
    setNewCatInput('');
    showNotification(`Đã thêm nhóm phân loại mới "${trimmed}"!`, 'success');
    onCategoriesUpdated?.(updated);
  };

  const handleStartEdit = (cat: string) => {
    setEditingCategory(cat);
    setEditingNewName(cat);
    setConfirmDeleteCat(null);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmedNew = editingNewName.trim();
    if (!trimmedNew) {
      showNotification('Tên nhóm không được để trống!', 'error');
      return;
    }

    if (trimmedNew.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }

    if (categories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
      showNotification(`Nhóm "${trimmedNew}" đã tồn tại! Vui lòng chọn tên khác.`, 'error');
      return;
    }

    const updated = updateCategory(oldName, trimmedNew);
    setCategories(updated);
    setEditingCategory(null);
    showNotification(
      `Đã đổi tên nhóm từ "${oldName}" thành "${trimmedNew}". Toàn bộ CSDL và Kho đã được cập nhật!`,
      'success'
    );
    onCategoriesUpdated?.(updated);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditingNewName('');
  };

  const handleDelete = (cat: string) => {
    const updated = deleteCategory(cat);
    setCategories(updated);
    setConfirmDeleteCat(null);
    showNotification(`Đã xóa nhóm phân loại "${cat}".`, 'info');
    onCategoriesUpdated?.(updated);
  };

  // Category Selection Handlers
  const handleToggleSelectCat = (catName: string) => {
    setSelectedCatNames(prev => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const handleSelectAllVisibleCats = () => {
    setSelectedCatNames(prev => {
      const next = new Set(prev);
      filteredCategories.forEach(c => next.add(c));
      return next;
    });
  };

  const handleDeselectAllCats = () => {
    setSelectedCatNames(new Set());
  };

  const handleExecuteBulkDeleteCats = () => {
    if (selectedCatNames.size === 0) return;

    const namesToDelete = Array.from(selectedCatNames);
    const updated = deleteMultipleCategories(namesToDelete);
    setCategories(updated);
    setSelectedCatNames(new Set());
    setIsBulkCatMode(false);
    setShowBulkConfirmModal(false);
    showNotification(`Đã xóa thành công ${namesToDelete.length} nhóm phân loại!`, 'success');
    onCategoriesUpdated?.(updated);
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Bạn có chắc chắn muốn khôi phục danh mục về 8 nhóm phân loại tiêu chuẩn mặc định không?'
      )
    ) {
      const updated = resetCategoriesToDefault();
      setCategories(updated);
      setSelectedCatNames(new Set());
      setIsBulkCatMode(false);
      showNotification('Đã khôi phục nhóm phân loại về mặc định ban đầu.', 'success');
      onCategoriesUpdated?.(updated);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#12161f] border border-[#2b3547] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-[#1f2633] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Quản lý & Chỉnh sửa nhóm phân loại</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {categories.length} nhóm
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chỉnh sửa tên, thêm mới hoặc xóa các nhóm phân loại đồng bộ cho CSDL và Kho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1a212e] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs font-mono flex items-center justify-between border-b ${
              statusMessage.type === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                : statusMessage.type === 'info'
                ? 'bg-blue-950/40 text-blue-300 border-blue-500/30'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Add New Category Bar */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <div className="relative flex-1">
              <FolderPlus className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                placeholder="Nhập tên nhóm phân loại mới cần thêm (VD: Peroxit, Chất bay hơi)..."
                className="w-full bg-[#0c0f14] border border-[#2a3445] focus:border-emerald-400 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!newCatInput.trim()}
              className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm nhóm</span>
            </button>
          </form>

          {/* Search Category Filter & Bulk Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhóm..."
                className="w-full bg-[#0c0f14] border border-[#1f2633] focus:border-emerald-500/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Bulk Select Mode button */}
              <button
                type="button"
                onClick={() => {
                  if (isBulkCatMode) {
                    setIsBulkCatMode(false);
                    setSelectedCatNames(new Set());
                  } else {
                    setIsBulkCatMode(true);
                  }
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 border shadow-xs ${
                  isBulkCatMode
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-[#151c27] hover:bg-[#1b2332] text-slate-300 border-[#263143]'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                <span>{isBulkCatMode ? 'Tắt chọn nhiều' : 'Chọn nhiều để xóa'}</span>
              </button>

              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                {filteredCategories.length} / {categories.length} nhóm
              </span>
            </div>
          </div>

          {/* Bulk Action Bar for Categories */}
          {isBulkCatMode && (
            <div className="bg-[#161c28] border-2 border-rose-500/50 rounded-xl p-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-rose-300">
                  Đã chọn: <strong className="text-white text-sm">{selectedCatNames.size}</strong> / {filteredCategories.length} nhóm
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllVisibleCats}
                    className="px-2 py-0.5 rounded bg-[#0d121a] hover:bg-[#1c2435] border border-[#2b3547] text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span>Chọn tất cả</span>
                  </button>

                  {selectedCatNames.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectAllCats}
                      className="px-2 py-0.5 rounded bg-[#0d121a] hover:bg-[#1c2435] border border-[#2b3547] text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Bỏ chọn
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkCatMode(false);
                    setSelectedCatNames(new Set());
                  }}
                  className="px-2.5 py-1 text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={selectedCatNames.size === 0}
                  onClick={() => setShowBulkConfirmModal(true)}
                  className={`px-3.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                    selectedCatNames.size > 0
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-98'
                      : 'bg-rose-950/40 text-rose-500/50 border border-rose-900/40 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa {selectedCatNames.size > 0 ? `${selectedCatNames.size} nhóm` : 'nhóm đã chọn'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
            {filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono bg-[#0c0f14] rounded-xl border border-[#1f2633]">
                Không tìm thấy nhóm phân loại nào khớp với từ khóa tìm kiếm.
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isEditing = editingCategory === cat;
                const isDefault = isDefaultCategory(cat);
                const dbCount = usageStats.dbCounts[cat.toLowerCase()] || 0;
                const invCount = usageStats.invCounts[cat.toLowerCase()] || 0;
                const isConfirmingDelete = confirmDeleteCat === cat;
                const isSelected = selectedCatNames.has(cat);

                return (
                  <div
                    key={cat}
                    onClick={() => {
                      if (isBulkCatMode && !isEditing && !isConfirmingDelete) {
                        handleToggleSelectCat(cat);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      isEditing
                        ? 'bg-[#151c29] border-emerald-500/60 shadow-lg'
                        : isSelected
                        ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/40 shadow-xs cursor-pointer'
                        : isBulkCatMode
                        ? 'bg-[#0e1219] hover:bg-[#131924] border-[#1f2633] cursor-pointer'
                        : 'bg-[#0e1219] hover:bg-[#131924] border-[#1f2633]'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Edit Form */
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingNewName}
                            onChange={(e) => setEditingNewName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit(cat);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="flex-1 bg-[#090c10] border border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-medium outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat)}
                            title="Lưu tên mới"
                            className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lưu</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            title="Hủy chỉnh sửa"
                            className="px-2.5 py-1.5 bg-[#1f2633] hover:bg-[#2b3547] text-slate-300 text-xs rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10.5px] text-emerald-400/90 font-mono flex items-center gap-1">
                          <span>⚡ Nhấn Enter để lưu. Tên nhóm sẽ được cập nhật đồng loạt trong CSDL ({dbCount} chất) và Kho ({invCount} mẫu).</span>
                        </p>
                      </div>
                    ) : isConfirmingDelete ? (
                      /* Confirm Delete Warning */
                      <div className="flex items-center justify-between gap-3 bg-rose-950/30 p-2 rounded-lg border border-rose-500/40 animate-fadeIn">
                        <div className="flex items-center gap-2 text-rose-300 text-xs">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>
                            Xóa nhóm <strong>"{cat}"</strong>? ({dbCount} chất CSDL, {invCount} mẫu kho sẽ được chuyển sang "Khác")
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleDelete(cat)}
                            className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold rounded transition-colors"
                          >
                            Xác nhận xóa
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCat(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition-colors"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Row */
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Bulk Checkbox */}
                          {isBulkCatMode ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectCat(cat);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                                isSelected
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-[#0c0f14] border border-[#2b3547] text-transparent hover:border-rose-400'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          )}

                          <span className={`text-xs font-semibold truncate font-mono transition-colors ${
                            isSelected ? 'text-rose-300' : 'text-slate-100'
                          }`}>
                            {cat}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                              isDefault
                                ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            }`}
                          >
                            {isDefault ? 'Mặc định' : 'Tùy chỉnh'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Stats badges */}
                          <div className="hidden sm:flex items-center gap-2 text-[10.5px] font-mono text-slate-400">
                            <span
                              title="Số lượng hóa chất trong CSDL thuộc nhóm này"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#151c27] border border-[#20293a]"
                            >
                              <Database className="w-3 h-3 text-slate-400" />
                              <span>{dbCount} CSDL</span>
                            </span>
                            <span
                              title="Số lượng hóa chất trong Kho thuộc nhóm này"
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#151c27] border border-[#20293a]"
                            >
                              <Box className="w-3 h-3 text-emerald-400" />
                              <span>{invCount} Kho</span>
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(cat)}
                              title="Chỉnh sửa / Đổi tên nhóm phân loại này"
                              className="px-2.5 py-1 text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCat(cat)}
                              title="Xóa nhóm phân loại này"
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1f2633] bg-[#0c0f14] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục nhóm mặc định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1b2230] hover:bg-[#252f42] text-slate-200 text-xs font-mono font-medium rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Bulk Delete Category Confirmation Modal */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#12161f] border border-rose-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-[#1f2633] pb-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Xác nhận xóa {selectedCatNames.size} nhóm phân loại?
                </h3>
                <p className="text-xs text-rose-400">
                  Thao tác này sẽ loại bỏ hoàn toàn các nhóm được chọn khỏi danh mục phân loại
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Các nhóm phân loại sau sẽ bị xóa:
              </p>

              <div className="max-h-40 overflow-y-auto rounded-lg bg-[#0c0f14] border border-[#1f2633] p-2.5 space-y-1.5 divide-y divide-[#1a212e]">
                {Array.from(selectedCatNames).map((catName) => {
                  const dbCount = usageStats.dbCounts[catName.toLowerCase()] || 0;
                  const invCount = usageStats.invCounts[catName.toLowerCase()] || 0;
                  return (
                    <div key={catName} className="pt-1.5 first:pt-0 flex items-center justify-between text-[11.5px] font-mono">
                      <span className="font-bold text-slate-200 truncate">{catName}</span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {dbCount} CSDL · {invCount} Kho
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Các hóa chất trong CSDL và Kho đang thuộc về những nhóm bị xóa sẽ tự động được gán về nhóm <strong>"Khác"</strong> nếu không còn nhóm phân loại nào khác.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1f2633]">
              <button
                type="button"
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-slate-200 rounded-lg hover:bg-[#1a212e] transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDeleteCats}
                className="px-4 py-2 text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-98 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-rose-950/50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Đồng ý xóa ({selectedCatNames.size} nhóm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
