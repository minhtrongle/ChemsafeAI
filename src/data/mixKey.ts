import { compactFormula } from './chemicals';

// Bảng luật dùng khóa theo tên (ethanol, acetone...) cho chất hữu cơ, còn kho và sơ đồ tủ
// lưu công thức (C₂H₅OH...). Hàm toMixKey đưa mọi cách viết về cùng một khóa trước khi tra,
// để mọi luật đều hoạt động ở cả trang Kiểm tra tương kỵ, Kho và Bố trí tủ.
const KEY_ALIASES: Record<string, string> = {
  c2h5oh: 'ethanol',
  ch3oh: 'methanol',
  ch3coch3: 'acetone',
  c4h10o: 'diethyl_ether',
  diethylether: 'diethyl_ether',
  ch2cl2: 'dcm',
};

export function toMixKey(value: string): string {
  const c = compactFormula(value);
  return KEY_ALIASES[c] || c;
}
