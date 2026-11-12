import cameoData from './cameoIncompatibilities.json' with { type: 'json' };
import { toMixKey } from './mixKey';

/**
 * Bảng tương kỵ theo từng cặp từ CAMEO Chemicals (NOAA) – công cụ Reactivity.
 * Nguồn: tuong_ky_hoa_chat_CAMEO.xlsx (đã chuyển thành cameoIncompatibilities.json).
 * Lưu ý: CAMEO dự đoán theo cặp NHÓM phản ứng và nghiêng về trường hợp xấu nhất,
 * nên chỉ dùng để dẫn người dùng tới trang CAMEO của cặp, không tự sinh cảnh báo mới.
 */
export type CameoConclusion = 'Tương kỵ' | 'Thận trọng' | 'Tương thích';

export interface CameoPair {
  chemicalA: string;
  chemicalB: string;
  nameA: string;
  nameB: string;
  conclusion: CameoConclusion;
  hazardsVi: string[];
  possibleGasesVi: string[];
  /** Trang tài liệu phản ứng của đúng cặp này trên CAMEO Chemicals */
  url: string;
}

const pairId = (a: string, b: string): string => {
  const x = toMixKey(a);
  const y = toMixKey(b);
  return x < y ? `${x}|${y}` : `${y}|${x}`;
};

const INDEX = new Map<string, CameoPair>();
for (const r of cameoData.records) {
  INDEX.set(pairId(r.chemicalA, r.chemicalB), {
    chemicalA: r.chemicalA,
    chemicalB: r.chemicalB,
    nameA: r.nameA,
    nameB: r.nameB,
    conclusion: r.cameoConclusion as CameoConclusion,
    hazardsVi: r.hazardsVi,
    possibleGasesVi: r.possibleGasesVi,
    url: r.cameoUrl,
  });
}

export const CAMEO_PAIR_COUNT = INDEX.size;

/** Toàn bộ cặp theo thứ tự trong file CAMEO (dùng cho trang "Danh sách tương kỵ") */
export const ALL_CAMEO_PAIRS: CameoPair[] = [...INDEX.values()];

/** Tra cặp theo công thức, khóa hoặc tên; A+B = B+A. Trả về null nếu CAMEO không có cặp này. */
export function getCameoPair(a: string, b: string): CameoPair | null {
  if (!a || !b || toMixKey(a) === toMixKey(b)) return null;
  return INDEX.get(pairId(a, b)) ?? null;
}
