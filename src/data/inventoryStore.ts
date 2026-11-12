import type { InventoryItem } from '../types/chemical';

export const INVENTORY_STORAGE_KEY = 'chemsafe_user_inventory';

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv_1',
    name: 'Axit Clohydric 37%',
    formula: 'HCl',
    location: 'Tủ A — Ngăn A1: Axit Vô Cơ Mạnh (HCl, H₂SO₄, HNO₃)',
    quantity: '2 chai (1000 mL)',
    danger: 'danger',
    category: 'Axit',
    notes: 'HSD: 12/2027. Đậy kín nắp, bốc khói trong không khí.',
    hazardDetails: '[Ăn mòn & Hô hấp]: Gây bỏng da/mắt nặng. Bắt buộc dùng tủ hút.\n[Cảnh báo]: Kỵ Natri Hypochlorite (Javel), kiềm mạnh NaOH và Sulfide.',
    createdAt: new Date().toLocaleDateString('vi-VN')
  },
  {
    id: 'inv_2',
    name: 'Natri Hydroxide (Xút vảy)',
    formula: 'NaOH',
    location: 'Tủ B — Ngăn B1: Kiềm Rắn & Hút Ẩm (NaOH, KOH, Ca(OH)₂)',
    quantity: '1 kg',
    danger: 'danger',
    category: 'Bazơ / Kiềm',
    notes: 'Hút ẩm mạnh. Tránh dính mắt.',
    hazardDetails: '[Ăn mòn kiềm]: Bỏng kiềm sâu, nguy cơ mù lòa nếu bắn mắt.\n[Cảnh báo]: Tỏa nhiệt cực mạnh khi hòa tan hoặc trộn với axit vô cơ mạnh.',
    createdAt: new Date().toLocaleDateString('vi-VN')
  },
  {
    id: 'inv_3',
    name: 'Cồn Ethanol 96°',
    formula: 'C₂H₅OH',
    location: 'Tủ F — Ngăn F2: Cồn & Dung Môi Hữu Cơ (Ethanol, Methanol, EtOAc)',
    quantity: '5000 mL',
    danger: 'caution',
    category: 'Dung môi / Hữu cơ',
    notes: 'Dùng pha chế và sát khuẩn lab.',
    hazardDetails: '[Dễ cháy]: Điểm chớp cháy thấp. Cách xa tia lửa điện và chất oxy hóa mạnh như HNO3, KMnO4.',
    createdAt: new Date().toLocaleDateString('vi-VN')
  },
  {
    id: 'inv_4',
    name: 'Hydrogen Peroxide 30% (Oxy già đậm đặc)',
    formula: 'H₂O₂',
    location: 'Tủ O — Ngăn O1: Peroxide & Permanganate (H₂O₂, KMnO₄, KClO₃)',
    quantity: '1 chai (500 mL)',
    danger: 'danger',
    category: 'Chất oxy hóa',
    notes: 'Chất oxy hóa mạnh, tự phân hủy sinh khí O2 nếu lẫn tạp chất kim loại.',
    hazardDetails: '[Oxy hóa & Bỏng]: Gây bỏng trắng da, kỵ hoàn toàn chất khử hữu cơ và kim loại chuyển tiếp.',
    createdAt: new Date().toLocaleDateString('vi-VN')
  },
  {
    id: 'inv_5',
    name: 'Natri Clorua Tinh Khiết (Muối ăn lab)',
    formula: 'NaCl',
    location: 'Kệ G — Ngăn G1: Muối Vô Cơ Trung Tính (NaCl, Na₂SO₄, CaCl₂)',
    quantity: '2 hộp (500g)',
    danger: 'safe',
    category: 'Muối vô cơ',
    notes: 'Dùng pha dung dịch đẳng trương NaCl 0.9% và thí nghiệm sinh hóa.',
    hazardDetails: '[An toàn]: Hóa chất thông thường, không độc hại cấp tính.',
    createdAt: new Date().toLocaleDateString('vi-VN')
  }
];

export function getStoredInventory(): InventoryItem[] {
  try {
    const saved = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading inventory from storage', err);
  }
  // If no saved inventory, write initial items and return
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(INITIAL_INVENTORY_ITEMS));
  } catch {}
  return INITIAL_INVENTORY_ITEMS;
}

export function saveStoredInventory(items: InventoryItem[]): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Error saving inventory to storage', err);
  }
}
