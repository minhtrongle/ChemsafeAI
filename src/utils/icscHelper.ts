import type { Chemical } from '../types/chemical';
import { compactFormula, normalizeText, matchesPhrase } from '../data/chemicals';

/**
 * Bản đồ ánh xạ mã số thẻ an toàn hóa chất quốc tế ILO / WHO ICSC (International Chemical Safety Cards)
 * Tra cứu theo công thức rút gọn hoặc tên hóa chất chuẩn
 */
export const ICSC_CANONICAL_MAP: Record<string, string> = {
  // Axit vô cơ & Hữu cơ
  'H2SO4': '0362',     // Sulfuric acid
  'HNO3': '0183',      // Nitric acid
  'HCL': '0163',       // Hydrogen chloride (ICSC 0161 là Hexachlorophene, không phải HCl)
  'HF': '0283',        // Hydrogen fluoride (khan); dung dịch 70% là 1777
  'H3PO4': '1008',     // Phosphoric acid
  'HCLO4': '1006',     // Perchloric acid
  'CH3COOH': '0363',   // Acetic acid
  'HCOOH': '0485',     // Formic acid
  'H2C2O4': '0529',    // Oxalic acid
  'C6H8O7': '0704',    // Citric acid

  // Bazơ & Kiềm
  'NAOH': '0360',      // Sodium hydroxide
  'KOH': '0357',       // Potassium hydroxide
  'NH3': '0414',       // Ammonia (gas)
  'NH4OH': '0215',     // Ammonium hydroxide (dung dịch 10–35%)
  'CA(OH)2': '0408',   // Calcium hydroxide
  'BA(OH)2': '0613',   // Barium hydroxide

  // Dung môi hữu cơ & Hợp chất hữu cơ
  'C2H5OH': '0044',    // Ethanol
  'CH3OH': '0057',     // Methanol
  'CH3COCH3': '0087',  // Acetone
  '(CH3)2CO': '0087',  // Acetone
  'C6H6': '0015',      // Benzene
  'C7H8': '0078',      // Toluene
  'CHCL3': '0027',     // Chloroform
  'CCL4': '0024',      // Carbon tetrachloride
  'CH2CL2': '0058',    // Dichloromethane
  'CH3COOC2H5': '0367',// Ethyl acetate
  'C4H8O2': '0367',    // Ethyl acetate
  'C2H5OC2H5': '0355', // Diethyl ether
  '(C2H5)2O': '0355',  // Diethyl ether
  'C4H10O': '0355',    // Diethyl ether
  'C6H14': '0279',     // n-Hexane
  'HCHO': '0275',      // Formaldehyde
  'C6H5OH': '0070',    // Phenol

  // Muối vô cơ & Chất oxy hóa mạnh
  'KMNO4': '0672',     // Potassium permanganate
  'K2CR2O7': '1371',   // Potassium dichromate
  'K2CRO4': '1370',    // Potassium chromate
  'CUSO4': '0751',     // Copper(II) sulfate
  'AGNO3': '1116',     // Silver nitrate
  'BACL2': '0614',     // Barium chloride
  'FECL3': '1499',     // Iron(III) chloride
  'H2O2': '0164',      // Hydrogen peroxide
  'NACLO': '0482',     // Sodium hypochlorite
  'NACN': '1118',      // Sodium cyanide
  'KCN': '0671',       // Potassium cyanide
  'NANO2': '1120',     // Sodium nitrite
  'NANO3': '0185',     // Sodium nitrate
  'KNO3': '0184',      // Potassium nitrate
  'NH4NO3': '0216',    // Ammonium nitrate
  // NaCl: không có thẻ ICSC
  'CACO3': '1192',     // Calcium carbonate
  'NA2CO3': '1135',    // Sodium carbonate
  'NAHCO3': '1044',    // Sodium hydrogen carbonate

  // Đơn chất & Kim loại hoạt động
  'NA': '0717',        // Sodium (metal)
  'K': '0716',         // Potassium (metal)
  'MG': '0289',        // Magnesium (powder)
  'AL': '0988',        // Aluminium powder
  'ZN': '1205',        // Zinc powder
  'P': '0628',         // Phosphorus (white/red)
  'S': '1166',         // Sulfur
  'CL2': '0126',       // Chlorine
  'H2': '0001',        // Hydrogen
  'O2': '0138',        // Oxygen
  'H2S': '0165',       // Hydrogen sulfide
  'SO2': '0074',       // Sulfur dioxide
  'CO': '0023',        // Carbon monoxide
  'NA2S': '1047',      // Sodium sulfide (anhydrous)
  'BR2': '0107',       // Bromine
  'I2': '0167'         // Iodine
};

/**
 * Tự động tìm mã thẻ ICSC dựa trên công thức hoặc tên hóa chất
 */
export function detectIcscId(formula?: string, name?: string): string | undefined {
  if (formula) {
    const cf = compactFormula(formula).toUpperCase();
    if (ICSC_CANONICAL_MAP[cf]) {
      return ICSC_CANONICAL_MAP[cf];
    }
  }

  if (name) {
    const norm = normalizeText(name).toLowerCase();
    // So khớp nguyên từ (tránh lỗi "s" khớp mọi tên có chữ s → thẻ lưu huỳnh)
    for (const [key, id] of Object.entries(ICSC_CANONICAL_MAP)) {
      if (key.length >= 3 && matchesPhrase(norm, key)) {
        return id;
      }
    }
    // Check Vietnamese & English names
    if (norm.includes('sunfuric') || norm.includes('sulfuric')) return '0362';
    if (norm.includes('nitric')) return '0183';
    if (norm.includes('clohidric') || norm.includes('hydrochloric')) return '0163';
    if (norm.includes('natri hidroxit') || norm.includes('sodium hydroxide')) return '0360';
    if (norm.includes('kali hidroxit') || norm.includes('potassium hydroxide')) return '0357';
    if (norm.includes('etanol') || norm.includes('ethanol') || matchesPhrase(norm, 'con')) return '0044';
    if (norm.includes('metanol') || norm.includes('methanol')) return '0057';
    if (norm.includes('axeton') || norm.includes('acetone')) return '0087';
    if (norm.includes('benzen') || norm.includes('benzene')) return '0015';
    if (norm.includes('amoniac') || norm.includes('ammonia')) return '0414';
    if (norm.includes('thuoc tim') || norm.includes('permanganate')) return '0672';
    if (norm.includes('oxi gia') || norm.includes('hydrogen peroxide')) return '0164';
  }

  return undefined;
}

/**
 * Trả về thông tin đường dẫn trực tiếp đến trang web ILO ICSC của hóa chất
 */
export function getIcscUrl(chem: Chemical | { formula: string; name: string; icscId?: string; icscUrl?: string }): {
  url: string;
  cardId?: string;
  isDirect: boolean;
  label: string;
} {
  // 1. Ưu tiên URL tùy chỉnh nếu người dùng đã nhập
  if (chem.icscUrl && chem.icscUrl.trim().startsWith('http')) {
    return {
      url: chem.icscUrl.trim(),
      cardId: chem.icscId,
      isDirect: true,
      label: chem.icscId ? `ICSC #${chem.icscId}` : 'Thẻ ILO ICSC'
    };
  }

  // 2. Kiểm tra mã thẻ icscId có sẵn hoặc tự động phát hiện
  const cardId = chem.icscId || detectIcscId(chem.formula, chem.name);

  if (cardId) {
    const cleanId = String(cardId).padStart(4, '0');
    return {
      url: `https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${cleanId}&p_version=2&p_lang=en`,
      cardId: cleanId,
      isDirect: true,
      label: `ICSC #${cleanId}`
    };
  }

  // 3. Fallback: Điều hướng đến trang danh mục tìm kiếm của ILO ICSC
  const searchName = encodeURIComponent(chem.name || chem.formula);
  return {
    url: `https://chemicalsafety.ilo.org/dyn/icsc/showcard.listCards3`,
    isDirect: false,
    label: 'Tra cứu ILO ICSC'
  };
}
