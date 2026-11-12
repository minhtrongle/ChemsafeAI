export type DangerLevel = 'safe' | 'caution' | 'danger' | 'extreme';

export interface Chemical {
  key: string;
  formula: string;
  name: string;
  danger: DangerLevel;
  dangerLabel: string;
  molar: string;
  molarMass: number;
  boiling: string;
  ph: string;
  color: string;
  colorBg: string;
  properties: string;
  msds: string;
  storage: string;
  aliases?: string[];
  ppe?: string;
  firstAid?: string;
  custom?: boolean;
  isEdited?: boolean;
  category?: string;
  categories?: string[];
  sdsUrl?: string;
  pubChemCid?: number | string;
  icscId?: string;
  cameoId?: string; // Mã datasheet trên CAMEO Chemicals (NOAA), ví dụ 3598
  icscUrl?: string;
  externalLinks?: { label: string; url: string }[];
  /** Lớp học trong chương trình GDPT 2018 (xem src/data/chemicalRefs.ts) */
  curriculum?: { thcs: number[]; thpt: number[]; note?: string };
  /** Ghi chú về phạm vi thẻ ICSC (dạng khan / dung dịch / bột...) */
  icscNote?: string;
}

export interface MixSource {
  /** Tên nguồn hiển thị, ví dụ "CAMEO: Sulfuric acid" */
  label: string;
  url: string;
}

export interface MixWarning {
  level: 'caution' | 'danger';
  title: string;
  reaction: string;
  desc: string;
  tags: string[];
  /** Nguồn quốc tế xác nhận cặp tương kỵ (ưu tiên CAMEO Chemicals, sau đó ICSC) */
  sources?: MixSource[];
  /** false = chưa tìm được nguồn quốc tế nêu đích danh cặp này */
  verified?: boolean;
  /** Tóm tắt bằng chứng từ nguồn (diễn giải, không trích nguyên văn) */
  evidence?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  formula: string;
  location: string;
  quantity: string;
  danger: DangerLevel;
  category?: string;
  categories?: string[];
  notes: string;
  hazardDetails: string;
  createdAt: string;
  updatedAt?: string;
}

export type ActiveTab = 'warning' | 'qr' | 'database' | 'inventory' | 'labmap' | 'calc' | 'advisor';

export type CabinetType = 'acid' | 'base' | 'flammable' | 'oxidizer' | 'general' | 'cold' | 'fume_hood' | 'toxic';

export interface LabDrawer {
  id: string;
  code: string; // e.g. "A1", "A2"
  name: string; // e.g. "Ngăn Axit Vô Cơ Mạnh"
  description?: string;
  maxCapacity?: number;
}

export interface LabCabinet {
  id: string;
  code: string; // e.g. "CAB_A"
  name: string; // e.g. "Tủ Axit Chống Ăn Mòn"
  zone: string; // e.g. "Góc Tây Bắc — Gần Tủ Hút"
  type: CabinetType;
  color: string;
  iconName: string;
  gridPos?: { x: number; y: number; w: number; h: number };
  drawers: LabDrawer[];
  notes?: string;
}

export interface PubChemRef {
  name: string;
  cid: number | string;
  url?: string;
  type?: 'lcss' | 'compound' | 'ghs';
}

export interface EmergencyProtocol {
  id: string;
  title: string;
  severity: 'danger' | 'caution' | 'critical' | 'standard';
  steps: string[];
  notes?: string;
  keywords?: string[];
  custom?: boolean;
  pubchemRefs?: PubChemRef[];
  /** Tài liệu quốc tế (ICSC, CAMEO, CDC/ATSDR, OSHA...) có nội dung về sự cố này */
  intlLinks?: IntlLink[];
}

export interface IntlLink {
  /** Tổ chức phát hành, ví dụ "ILO/WHO ICSC", "CDC/ATSDR", "OSHA" */
  org: string;
  label: string;
  url: string;
}

export interface SafetyKnowledge {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  custom?: boolean;
  pubchemRefs?: PubChemRef[];
  intlLinks?: IntlLink[];
}
