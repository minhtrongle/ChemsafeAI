/**
 * Đường dẫn trong mã QR trên nhãn chai hóa chất.
 *
 * Quét mã → mở trang riêng của ứng dụng: <địa chỉ web>?chem=<khóa>&loc=...&ct=...
 * - Chất có trong bộ dữ liệu gốc: chỉ cần khóa `chem`, trang tự lấy thông tin, mã PubChem/ICSC.
 * - Chất tự thêm (chỉ có trong trình duyệt của người tạo nhãn): gửi kèm tên, công thức,
 *   mức nguy hiểm, ghi chú để điện thoại quét vẫn hiển thị được.
 */
import type { DangerLevel } from '../types/chemical';

export interface QrPayload {
  chem?: string;        // khóa chất trong BASE_CHEMICALS
  name?: string;
  formula?: string;
  danger?: DangerLevel;
  notes?: string;
  location?: string;
  contact?: string;
  date?: string;
}

const KEYS: [keyof QrPayload, string][] = [
  ['chem', 'chem'], ['name', 'n'], ['formula', 'f'], ['danger', 'd'],
  ['notes', 'nt'], ['location', 'loc'], ['contact', 'ct'], ['date', 'dt'],
];

const DANGERS: DangerLevel[] = ['safe', 'caution', 'danger', 'extreme'];

/** Bỏ query/hash khỏi địa chỉ gốc, giữ đường dẫn (vd. GitHub Pages /chemsafe-ai/) */
export function cleanBaseUrl(base: string): string {
  const b = (base || '').trim().split('#')[0].split('?')[0];
  return b || '/';
}

export function buildQrUrl(base: string, payload: QrPayload): string {
  const params = new URLSearchParams();
  for (const [field, param] of KEYS) {
    const v = payload[field];
    if (v && String(v).trim()) params.set(param, String(v).trim());
  }
  return `${cleanBaseUrl(base)}?${params.toString()}`;
}

/** Đọc tham số QR từ location.search; trả về null nếu không phải liên kết QR */
export function parseQrParams(search: string): QrPayload | null {
  const params = new URLSearchParams(search);
  if (!params.has('chem') && !params.has('f')) return null;
  const out: QrPayload = {};
  for (const [field, param] of KEYS) {
    const v = params.get(param);
    if (v) (out as Record<string, string>)[field] = v.slice(0, 300);
  }
  if (out.danger && !DANGERS.includes(out.danger)) delete out.danger;
  return out;
}
