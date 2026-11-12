/**
 * Mã tra cứu quốc tế + chương trình học cho 39 chất gốc.
 *
 * - pubChemCid: mã hợp chất trên PubChem (NIH) — nguồn thông tin cơ bản.
 * - icscId: số thẻ An toàn Hóa chất Quốc tế ILO/WHO (ICSC) — nguồn thông tin an toàn.
 *           NaCl KHÔNG có thẻ ICSC nên để trống (giao diện hiển thị "Không có thẻ ICSC").
 * - cameoId: mã datasheet CAMEO Chemicals (NOAA) — nguồn thông tin tương kỵ.
 * - curriculum: lớp học trong chương trình GDPT 2018 (theo bộ dữ liệu
 *   "ChemSafe AI – Phân loại 39 chất theo lớp và đối chiếu 5 chất trình bày").
 *
 * Tất cả mã đã được đối chiếu thủ công trên trang PubChem / ICSC / CAMEO (11/2026).
 */
export interface Curriculum {
  /** Các lớp ở THCS (cấp 2) có nhắc tới chất, ví dụ [8, 9] */
  thcs: number[];
  /** Các lớp ở THPT (cấp 3) có nhắc tới chất, ví dụ [10, 12] */
  thpt: number[];
  /** Ghi chú về dạng/thẻ cụ thể (ví dụ thẻ ICSC dành cho dạng bột) */
  note?: string;
}

export interface ChemicalRef {
  pubChemCid: number;
  icscId?: string;
  cameoId?: string;
  curriculum: Curriculum;
  icscNote?: string;
}

const g = (thcs: number[], thpt: number[]): Curriculum => ({ thcs, thpt });

export const CHEMICAL_REFS: Record<string, ChemicalRef> = {
  hcl:           { pubChemCid: 313,      icscId: '0163', cameoId: '3598',  curriculum: g([8], [10]) },
  h2so4:         { pubChemCid: 1118,     icscId: '0362', cameoId: '5193',  curriculum: g([8], [11]) },
  hno3:          { pubChemCid: 944,      icscId: '0183', cameoId: '19337', curriculum: g([], [11]) },
  naoh:          { pubChemCid: 14798,    icscId: '0360', cameoId: '9073',  curriculum: g([8], [11, 12]) },
  koh:           { pubChemCid: 14797,    icscId: '0357', cameoId: '9013',  curriculum: g([8], [12]) },
  nh3:           { pubChemCid: 222,      icscId: '0414', cameoId: '4860',  curriculum: g([], [11]), icscNote: 'Thẻ 0414 là NH₃ khan; dung dịch amoniac 10–35% xem thẻ ICSC 0215.' },
  h2o2:          { pubChemCid: 784,      icscId: '0164', cameoId: '5023',  curriculum: g([8], [10]), icscNote: 'Thẻ 0164 áp dụng cho dung dịch đặc (>60%).' },
  nacl:          { pubChemCid: 5234,                                       curriculum: g([6, 8], [12]), icscNote: 'NaCl không có thẻ ICSC.' },
  methanol:      { pubChemCid: 887,      icscId: '0057', cameoId: '3874',  curriculum: g([], [11]) },
  ethanol:       { pubChemCid: 702,      icscId: '0044', cameoId: '667',   curriculum: g([9], [11]) },
  acetone:       { pubChemCid: 180,      icscId: '0087', cameoId: '8',     curriculum: g([], [11]) },
  cl2:           { pubChemCid: 24526,    icscId: '0126', cameoId: '2862',  curriculum: g([], [10]) },
  hf:            { pubChemCid: 14917,    icscId: '0283', cameoId: '5022',  curriculum: g([], [10]), icscNote: 'Thẻ 0283 là HF khan; dung dịch 70% xem thẻ ICSC 1777.' },
  kmno4:         { pubChemCid: 516875,   icscId: '0672', cameoId: '4324',  curriculum: g([6], [10, 12]) },
  naclo:         { pubChemCid: 23665760, icscId: '0482', cameoId: '4503',  curriculum: g([], [10]), icscNote: 'Thẻ 0482 cho dung dịch <10% clo hoạt tính; >10% xem thẻ ICSC 1119.' },
  ch3cooh:       { pubChemCid: 176,      icscId: '0363',                   curriculum: g([9], [11]) },
  h3po4:         { pubChemCid: 1004,     icscId: '1008',                   curriculum: g([], []) },
  h2c2o4:        { pubChemCid: 971,      icscId: '0529',                   curriculum: g([], []) },
  caoh2:         { pubChemCid: 6093208,  icscId: '0408',                   curriculum: g([8], [12]) },
  cuso4:         { pubChemCid: 24462,    icscId: '0751',                   curriculum: g([8, 9], [12]), icscNote: 'Thẻ 0751 là CuSO₄ khan; dạng ngậm 5 nước xem thẻ ICSC 1416.' },
  k2cr2o7:       { pubChemCid: 24502,    icscId: '1371',                   curriculum: g([], [12]) },
  agno3:         { pubChemCid: 24470,    icscId: '1116', cameoId: '4443',  curriculum: g([9], [12]) },
  c6h6:          { pubChemCid: 241,      icscId: '0015',                   curriculum: g([], [11]) },
  ccl4:          { pubChemCid: 5943,     icscId: '0024',                   curriculum: g([], [11]) },
  chcl3:         { pubChemCid: 6212,     icscId: '0027',                   curriculum: g([], [11]) },
  c6h5oh:        { pubChemCid: 996,      icscId: '0070',                   curriculum: g([], [11]) },
  h2s:           { pubChemCid: 402,      icscId: '0165', cameoId: '3625',  curriculum: g([], [11]) },
  so2:           { pubChemCid: 1119,     icscId: '0074',                   curriculum: g([8], [11]) },
  co:            { pubChemCid: 281,      icscId: '0023',                   curriculum: g([6, 8], [12]) },
  h2:            { pubChemCid: 783,      icscId: '0001', cameoId: '8729',  curriculum: g([8], []) },
  o2:            { pubChemCid: 977,      icscId: '0138', cameoId: '8967',  curriculum: g([6], []) },
  hclo4:         { pubChemCid: 24247,    icscId: '1006', cameoId: '1292',  curriculum: g([], []), icscNote: 'Thẻ 1006 cho dung dịch 72%.' },
  na2s:          { pubChemCid: 14804,    icscId: '1047', cameoId: '9084',  curriculum: g([], []) },
  nano2:         { pubChemCid: 23668193, icscId: '1120', cameoId: '4511',  curriculum: g([], []) },
  nh4no3:        { pubChemCid: 22985,    icscId: '0216', cameoId: '98',    curriculum: g([8], [11]) },
  al:            { pubChemCid: 5359268,  icscId: '0988', cameoId: '14008', curriculum: g([9], [12]), icscNote: 'Thẻ 0988 và CAMEO 14008 dành cho bột nhôm.' },
  zn:            { pubChemCid: 23994,    icscId: '1205', cameoId: '4814',  curriculum: g([8, 9], [12]), icscNote: 'Thẻ 1205 và CAMEO 4814 dành cho bột kẽm.' },
  diethyl_ether: { pubChemCid: 3283,     icscId: '0355',                   curriculum: g([], []) },
  dcm:           { pubChemCid: 6344,     icscId: '0058',                   curriculum: g([], []) },
};

export const pubChemUrl = (cid: number | string) => `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`;
export const icscUrl = (id: string) =>
  `https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${id}&p_version=2&p_lang=en`;
export const cameoUrl = (id: string) => `https://cameochemicals.noaa.gov/chemical/${id}`;

/** Chuỗi hiển thị chương trình học, ví dụ "THCS: lớp 8 · THPT: lớp 10" */
export function formatCurriculum(c?: Curriculum): string {
  if (!c) return 'Chưa phân loại';
  const parts: string[] = [];
  if (c.thcs.length) parts.push(`THCS: lớp ${c.thcs.join(', ')}`);
  if (c.thpt.length) parts.push(`THPT: lớp ${c.thpt.join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Ngoài chương trình phổ thông (chỉ dùng ở phòng thí nghiệm nâng cao)';
}

/** Cấp học: "Cấp 2", "Cấp 3", "Cấp 2 & 3" hoặc "Ngoài chương trình" */
export function curriculumLevel(c?: Curriculum): string {
  if (!c) return 'Chưa phân loại';
  if (c.thcs.length && c.thpt.length) return 'Cấp 2 & 3';
  if (c.thcs.length) return 'Cấp 2';
  if (c.thpt.length) return 'Cấp 3';
  return 'Ngoài chương trình';
}
