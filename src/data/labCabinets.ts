import type { LabCabinet } from '../types/chemical';

export const LAB_CABINETS_STORAGE_KEY = 'chemsafe_lab_cabinets_v1';

export const DEFAULT_LAB_CABINETS: LabCabinet[] = [
  {
    id: 'cab_a',
    code: 'Tủ A',
    name: 'Tủ Axit Chuyên Dụng (Chống Ăn Mòn)',
    zone: 'Khu Tây Bắc — Dưới Tủ Hút 1',
    type: 'acid',
    color: '#f97316', // Orange
    iconName: 'FlaskConical',
    notes: 'Vật liệu Polypropylene chống ăn mòn. Đậy kín nắp, cấm xếp chung với Bazơ và Xyanua.',
    gridPos: { x: 30, y: 50, w: 165, h: 110 },
    drawers: [
      {
        id: 'drw_a1',
        code: 'A1',
        name: 'Ngăn A1 — Axit Vô Cơ Mạnh (HCl, H₂SO₄, HNO₃)',
        description: 'Chuyên chứa axit đậm đặc bốc khói, khay lót chống tràn axit.',
        maxCapacity: 12
      },
      {
        id: 'drw_a2',
        code: 'A2',
        name: 'Ngăn A2 — Axit Hữu Cơ & Axit Yếu (CH₃COOH, Citric)',
        description: 'Cách ly với chất oxy hóa mạnh.',
        maxCapacity: 16
      }
    ]
  },
  {
    id: 'cab_b',
    code: 'Tủ B',
    name: 'Tủ Kiềm & Bazơ (Alkali Storage)',
    zone: 'Khu Tây Nam — Cạnh Bồn Rửa Khẩn Cấp',
    type: 'base',
    color: '#06b6d4', // Cyan
    iconName: 'Boxes',
    notes: 'Kệ thép sơn tĩnh điện kháng kiềm. Tuyệt đối cách ly với Tủ Axit A.',
    gridPos: { x: 30, y: 190, w: 165, h: 110 },
    drawers: [
      {
        id: 'drw_b1',
        code: 'B1',
        name: 'Ngăn B1 — Kiềm Rắn & Hút Ẩm (NaOH, KOH, Ca(OH)₂)',
        description: 'Vảy rắn, hạt xút, bảo quản chống ẩm.',
        maxCapacity: 12
      },
      {
        id: 'drw_b2',
        code: 'B2',
        name: 'Ngăn B2 — Dung Dịch Bazơ & Amoniac (NH₄OH)',
        description: 'Dung dịch kiềm lỏng, nước vôi, amoniac đậm đặc.',
        maxCapacity: 14
      }
    ]
  },
  {
    id: 'cab_f',
    code: 'Tủ F',
    name: 'Tủ Chống Cháy Dung Môi (OSHA / NFPA-30)',
    zone: 'Khu Đông Bắc — Khu Thoát Khí Riêng',
    type: 'flammable',
    color: '#ef4444', // Red
    iconName: 'Flame',
    notes: 'Tủ thép 2 lớp cách nhiệt, tiếp địa chống tĩnh điện, khóa tự động khi quá nhiệt.',
    gridPos: { x: 550, y: 50, w: 175, h: 110 },
    drawers: [
      {
        id: 'drw_f1',
        code: 'F1',
        name: 'Ngăn F1 — Dung Môi Rất Dễ Cháy (Ether, Acetone, Hexane)',
        description: 'Điểm chớp cháy < 23°C. Tránh xa mọi nguồn phát tia lửa điện.',
        maxCapacity: 10
      },
      {
        id: 'drw_f2',
        code: 'F2',
        name: 'Ngăn F2 — Cồn & Dung Môi Hữu Cơ (Ethanol, Methanol, EtOAc)',
        description: 'Cồn kỹ thuật và dung môi chạy sắc ký tinh khiết.',
        maxCapacity: 14
      },
      {
        id: 'drw_f3',
        code: 'F3',
        name: 'Ngăn F3 — Dung Môi Thơm & Halogen (Toluen, Xylen, Chloroform)',
        description: 'Dung môi thơm, hydrocarbon clo hóa.',
        maxCapacity: 10
      }
    ]
  },
  {
    id: 'cab_o',
    code: 'Tủ O',
    name: 'Tủ Chất Oxy Hóa Mạnh (Oxidizers)',
    zone: 'Khu Đông Nam — Tách Biệt Dung Môi F',
    type: 'oxidizer',
    color: '#a855f7', // Purple
    iconName: 'Sparkles',
    notes: 'Kệ gốm sứ/chống oxy hóa. Không để gần bất kỳ chất khử hoặc hợp chất hữu cơ nào.',
    gridPos: { x: 550, y: 190, w: 175, h: 110 },
    drawers: [
      {
        id: 'drw_o1',
        code: 'O1',
        name: 'Ngăn O1 — Peroxide & Permanganate (H₂O₂, KMnO₄, KClO₃)',
        description: 'Chất oxy hóa cấp độ 1, nguy cơ cháy nổ tiếp xúc hữu cơ.',
        maxCapacity: 10
      },
      {
        id: 'drw_o2',
        code: 'O2',
        name: 'Ngăn O2 — Nitrate & Muối Oxy Hóa (AgNO₃, NaNO₃, Ba(NO₃)₂)',
        description: 'Muối phân hủy sinh khí oxy khi gia nhiệt.',
        maxCapacity: 12
      }
    ]
  },
  {
    id: 'cab_g',
    code: 'Kệ G',
    name: 'Kệ Hóa Chất Chung & Muối Vô Cơ',
    zone: 'Khu Trung Tâm — Dãy Bàn Thí Nghiệm',
    type: 'general',
    color: '#10b981', // Emerald
    iconName: 'Layers',
    notes: 'Kệ thông gió tự nhiên, chứa các hóa chất bền vững ít độc hại và chất chỉ thị.',
    gridPos: { x: 285, y: 220, w: 190, h: 120 },
    drawers: [
      {
        id: 'drw_g1',
        code: 'G1',
        name: 'Ngăn G1 — Muối Vô Cơ Trung Tính (NaCl, Na₂SO₄, CaCl₂)',
        description: 'Muối phân tích tinh khiết thông dụng.',
        maxCapacity: 20
      },
      {
        id: 'drw_g2',
        code: 'G2',
        name: 'Ngăn G2 — Thuốc Thử Chỉ Thị & Đệm (Phenolphthalein, Đệm pH)',
        description: 'Chất chỉ thị pH, thuốc thử màu phân tích định tính.',
        maxCapacity: 16
      }
    ]
  },
  {
    id: 'cab_c',
    code: 'Tủ Lạnh C',
    name: 'Tủ Mát Bảo Quản (Cold Storage 4°C / -20°C)',
    zone: 'Góc Phía Nam — Gần Cửa Ra Vào',
    type: 'cold',
    color: '#38bdf8', // Light blue
    iconName: 'Snowflake',
    notes: 'Tủ lạnh phòng thí nghiệm chống cháy nổ không phát tia lửa bên trong (Explosion-proof).',
    gridPos: { x: 30, y: 330, w: 165, h: 110 },
    drawers: [
      {
        id: 'drw_c1',
        code: 'C1',
        name: 'Ngăn C1 — Mẫu Sinh Học & Enzyme (4°C)',
        description: 'Dung dịch nhạy nhiệt độ phòng.',
        maxCapacity: 15
      },
      {
        id: 'drw_c2',
        code: 'C2',
        name: 'Ngăn C2 — Hợp Chất Dễ Bay Hơi & Chuẩn Sắc Ký (-20°C)',
        description: 'Bảo quản âm sâu ngăn đông.',
        maxCapacity: 10
      }
    ]
  },
  {
    id: 'cab_h',
    code: 'Tủ Hút H',
    name: 'Tủ Hút Khí Độc & Thao Tác Nóng (Fume Hood)',
    zone: 'Vách Phía Bắc — Hệ Thống Hút Khí Trực Tiếp',
    type: 'fume_hood',
    color: '#eab308', // Amber/Yellow
    iconName: 'ShieldAlert',
    notes: 'Tốc độ hút gió 0.5 m/s, màng lọc than hoạt tính. Chỉ lưu tạm thời hóa chất độc cấp tính.',
    gridPos: { x: 285, y: 30, w: 190, h: 90 },
    drawers: [
      {
        id: 'drw_h1',
        code: 'H1',
        name: 'Ngăn H1 — Hóa Chất Bốc Khói Cực Độc (HF, Bromine, Thionyl)',
        description: 'Lưu tạm thời hóa chất đang dùng trong chu trình phản ứng.',
        maxCapacity: 8
      }
    ]
  }
];

export function getStoredLabCabinets(): LabCabinet[] {
  try {
    const raw = localStorage.getItem(LAB_CABINETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure every cabinet has valid gridPos
        return parsed.map((cab: LabCabinet, idx: number) => {
          const defaultPos = DEFAULT_LAB_CABINETS.find((d) => d.id === cab.id)?.gridPos;
          const fallbackPos = defaultPos || {
            x: 50 + (idx % 3) * 220,
            y: 50 + Math.floor(idx / 3) * 140,
            w: 165,
            h: 110
          };
          return {
            ...cab,
            gridPos: cab.gridPos && typeof cab.gridPos.x === 'number' ? cab.gridPos : fallbackPos
          };
        });
      }
    }
  } catch (err) {
    console.error('Error reading lab cabinets from localStorage', err);
  }
  return DEFAULT_LAB_CABINETS;
}

export function saveStoredLabCabinets(cabinets: LabCabinet[]): void {
  try {
    localStorage.setItem(LAB_CABINETS_STORAGE_KEY, JSON.stringify(cabinets));
  } catch (err) {
    console.error('Error saving lab cabinets to localStorage', err);
  }
}

export function resetLabCabinets(): LabCabinet[] {
  try {
    localStorage.setItem(LAB_CABINETS_STORAGE_KEY, JSON.stringify(DEFAULT_LAB_CABINETS));
  } catch (err) {
    console.error('Error resetting lab cabinets', err);
  }
  return DEFAULT_LAB_CABINETS;
}

/**
 * Normalizes or extracts cabinet and drawer assignment from an InventoryItem location string
 * E.g. "Tủ A1 — Ngăn Axit", "Tủ B2 — Ngăn Bazơ", "Tủ F3 — Dung môi dễ cháy", "Tủ A / Ngăn A1"
 */
export function resolveItemLocation(
  locationStr: string,
  cabinets: LabCabinet[]
): { cabinet: LabCabinet | null; drawer: { id: string; code: string; name: string } | null; isExact: boolean } {
  if (!locationStr || typeof locationStr !== 'string') {
    return { cabinet: null, drawer: null, isExact: false };
  }

  const locUpper = locationStr.toUpperCase();

  // Try finding an exact drawer code match like "A1", "A2", "B1", "F3", "G1", etc.
  for (const cab of cabinets) {
    for (const drw of cab.drawers) {
      const codeUpper = drw.code.toUpperCase();
      // Thoát ký tự đặc biệt để mã ngăn do người dùng đặt (VD "A+") không làm hỏng regex
      const code = codeUpper.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match "A1", "NGĂN A1", "TỦ A1", "A1 —"... nhưng KHÔNG khớp "A12" (đã bỏ phép includes dự phòng)
      const regex = new RegExp(`(^|[^A-Z0-9])${code}(?![0-9A-Z])`, 'i');
      if (regex.test(locUpper)) {
        return { cabinet: cab, drawer: drw, isExact: true };
      }
    }
  }

  // Fallback: match by cabinet code (e.g. "TỦ A", "TỦ B", "TỦ F")
  for (const cab of cabinets) {
    const cabUpper = cab.code.toUpperCase();
    if (locUpper.includes(cabUpper) || locUpper.includes(cab.name.toUpperCase())) {
      // "Tủ A — ngăn 2" → tìm ngăn có mã kết thúc bằng số 2 (A2)
      const drawerNo = locUpper.match(/NGĂN\s*(\d+)/);
      if (drawerNo) {
        const byNumber = cab.drawers.find(d => d.code.toUpperCase().replace(/^[^0-9]+/, '') === drawerNo[1]);
        if (byNumber) return { cabinet: cab, drawer: byNumber, isExact: true };
      }
      return { cabinet: cab, drawer: cab.drawers[0] || null, isExact: false };
    }
  }

  // Fallback by cabinet type keywords
  if (locUpper.includes('AXIT') || locUpper.includes('ACID')) {
    const cabA = cabinets.find(c => c.type === 'acid') || null;
    return { cabinet: cabA, drawer: cabA?.drawers[0] || null, isExact: false };
  }
  if (locUpper.includes('BAZƠ') || locUpper.includes('KIỀM') || locUpper.includes('BASE')) {
    const cabB = cabinets.find(c => c.type === 'base') || null;
    return { cabinet: cabB, drawer: cabB?.drawers[0] || null, isExact: false };
  }
  if (locUpper.includes('CHÁY') || locUpper.includes('DUNG MÔI') || locUpper.includes('FLAMMABLE')) {
    const cabF = cabinets.find(c => c.type === 'flammable') || null;
    return { cabinet: cabF, drawer: cabF?.drawers[0] || null, isExact: false };
  }
  if (locUpper.includes('LẠNH') || locUpper.includes('MÁT') || locUpper.includes('COLD')) {
    const cabC = cabinets.find(c => c.type === 'cold') || null;
    return { cabinet: cabC, drawer: cabC?.drawers[0] || null, isExact: false };
  }

  return { cabinet: null, drawer: null, isExact: false };
}
