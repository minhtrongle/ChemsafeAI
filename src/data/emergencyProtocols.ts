import type { EmergencyProtocol, SafetyKnowledge, IntlLink } from '../types/chemical';
import { normalizeText } from './chemicals';

export const DEFAULT_EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  {
    id: 'ep_1',
    title: 'Bỏng Axit mạnh (HCl, H₂SO₄, HNO₃)',
    severity: 'critical',
    steps: [
      'Ngay lập tức xối rửa dưới vòi nước chảy liên tục ít nhất 15-20 phút.',
      'Cởi bỏ ngay quần áo, găng tay hoặc giày bị dính axit trong khi đang xối nước.',
      'Tuyệt đối KHÔNG cố dùng bazơ mạnh để trung hòa (sẽ tỏa nhiệt bỏng kép rất nguy hiểm).',
      'Băng phủ bằng gạc vô trùng sạch và đưa tới cơ sở y tế gần nhất.'
    ],
    notes: 'Theo ICSC 0362 (H₂SO₄) và 0163 (HCl): rửa bằng nhiều nước ít nhất 15 phút, cởi quần áo dính hóa chất rồi rửa tiếp, đưa đi khám ngay. Bắn vào mắt: rửa nhiều phút, tháo kính áp tròng nếu dễ, đi khám ngay. Nuốt phải H₂SO₄: súc miệng, KHÔNG gây nôn.',
    keywords: ['axit', 'hcl', 'h2so4', 'hno3', 'bong axit', 'chay axit', 'axit dinh da'],
    pubchemRefs: [
      { name: 'H₂SO₄ (Sulfuric acid)', cid: 1118, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/1118#datasheet=LCSS' },
      { name: 'HCl (Hydrochloric acid)', cid: 313, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/313#datasheet=LCSS' },
      { name: 'HNO₃ (Nitric acid)', cid: 944, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/944#datasheet=LCSS' }
    ]
  },
  {
    id: 'ep_2',
    title: 'Bỏng Kiềm mạnh (NaOH, KOH)',
    severity: 'danger',
    steps: [
      'Xối nước sạch liên tục tối thiểu 20-30 phút (bỏng kiềm ngấm sâu vào mô hơn axit do xà phòng hóa).',
      'Nếu bắn vào mắt: Giữ vành mi mắt mở to, rửa liên tục tại trạm rửa mắt khẩn cấp.',
      'Rửa đến khi cảm giác trơn nhớt xà phòng trên da biến mất hoàn toàn.',
      'Khám nhãn khoa hoặc chuyên khoa bỏng khẩn cấp.'
    ],
    notes: 'Tuyệt đối không chà xát mạnh gây tróc mô hoại tử kiềm.',
    keywords: ['kiem', 'naoh', 'koh', 'xut', 'bong kiem', 'bazo', 'kiem ban mat'],
    pubchemRefs: [
      { name: 'NaOH (Sodium hydroxide)', cid: 14798, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/14798#datasheet=LCSS' },
      { name: 'KOH (Potassium hydroxide)', cid: 14797, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/14797#datasheet=LCSS' }
    ]
  },
  {
    id: 'ep_3',
    title: 'Phơi nhiễm Axit Flohidric (HF)',
    severity: 'critical',
    steps: [
      'CẤP CỨU ĐẶC BIỆT: Xối nước rửa ngay lập tức trong 5 phút.',
      'Thoa liên tục gel Calcium Gluconate 2.5% lên vùng da tiếp xúc để bất hoạt ion F⁻.',
      'Nếu không có gel: ngâm trong dung dịch Calcium Gluconate hoặc sữa tươi có canxi.',
      'Gọi cấp cứu 115 ngay lập tức; theo dõi nồng độ canxi máu để chống ngừng tim do giảm canxi cấp.'
    ],
    notes: 'HF có thể không gây đau tức thì nhưng ngấm sâu phá hủy xương và làm ngưng tim.',
    keywords: ['hf', 'axit flohidric', 'hydrofluoric', 'calcium gluconate', 'nhiem doc hf'],
    pubchemRefs: [
      { name: 'HF (Hydrofluoric acid)', cid: 14917, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/14917#datasheet=LCSS' }
    ]
  },
  {
    id: 'ep_4',
    title: 'Hít phải khí độc (Clo Cl₂, Amoniac NH₃, H₂S, CO)',
    severity: 'critical',
    steps: [
      'Nhanh chóng đưa nạn nhân ra nơi thoáng khí ngược chiều gió.',
      'Nới lỏng cổ áo, thắt lưng; cho thở oxy ẩm nếu có nhân viên y tế hỗ trợ.',
      'Nếu nạn nhân ngừng thở, tiến hành ép tim/hồi sức tim phổi CPR (tránh hà hơi thổi ngạt trực tiếp do hơi độc tồn đọng).',
      'Theo dõi triệu chứng phù phổi cấp muộn (thường xuất hiện sau 6-24 giờ).'
    ],
    notes: 'Người cứu nạn PHẢI đeo mặt nạ phòng độc có phin lọc phù hợp trước khi vào vùng khí độc.',
    keywords: ['khi doc', 'clo', 'cl2', 'nh3', 'amoniac', 'h2s', 'co', 'ngat khi', 'hit phai khi'],
    pubchemRefs: [
      { name: 'Cl₂ (Chlorine gas)', cid: 24526, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/24526#datasheet=LCSS' },
      { name: 'NH₃ (Ammonia)', cid: 222, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/222#datasheet=LCSS' }
    ]
  },
  {
    id: 'ep_5',
    title: 'Sự cố tràn đổ Dung môi hữu cơ & Nguy cơ bắt cháy',
    severity: 'danger',
    steps: [
      'Ngay lập tức tắt các nguồn phát nhiệt, nguồn đánh lửa, bếp điện trong phòng lab.',
      'Rắc cát, bột vermiculite hoặc tấm thấm hút dung môi chuyên dụng bao quanh vùng tràn.',
      'Bật quạt hút thông gió mức tối đa hoặc mở toàn bộ cửa sổ thoát khí.',
      'Dùng xẻng nhựa không phát tia lửa thu gom chất hấp phụ vào thùng chứa rác thải nguy hại.'
    ],
    notes: 'Không dùng giẻ khô chà xát mạnh vì tĩnh điện có thể làm bắt lửa hơi dung môi.',
    keywords: ['tran do', 'dung moi', 'acetone', 'ethanol', 'ether', 'chay dung moi', 'do dung moi', 'con', 'chay con', 'methanol'],
    pubchemRefs: [
      { name: 'Acetone', cid: 180, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/180#datasheet=LCSS' },
      { name: 'Ethanol', cid: 702, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/702#datasheet=LCSS' },
      { name: 'Diethyl ether', cid: 3283, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/3283#datasheet=LCSS' }
    ]
  },
  {
    id: 'ep_6',
    title: 'Bỏng Phenol (Axit Carbolic)',
    severity: 'danger',
    steps: [
      'Lau sạch nhanh chóng bằng dung dịch Polyethylene Glycol (PEG 300 hoặc PEG 400).',
      'Nếu không có PEG: xối rửa liên tục dưới vòi nước chảy ít nhất 15-20 phút.',
      'Cởi bỏ toàn bộ quần áo dính phenol.',
      'Khám cấp cứu ngay vì Phenol hấp thu nhanh qua da gây độc cho gan và thận.'
    ],
    notes: 'Phenol gây tê cục bộ nên nạn nhân có thể không cảm thấy đau dữ dội lúc đầu.',
    keywords: ['phenol', 'bong phenol', 'acid carbolic', 'peg'],
    pubchemRefs: [
      { name: 'Phenol (Carbolic acid)', cid: 996, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/996#datasheet=LCSS' }
    ]
  }
];

export const DEFAULT_SAFETY_KNOWLEDGE: SafetyKnowledge[] = [
  {
    id: 'sk_1',
    title: 'Quy tắc vàng khi pha loãng Axit Sulfuric H₂SO₄ đặc',
    category: 'Pha chế & An toàn',
    content: 'Luôn luôn rót axit từ từ dọc theo đũa thủy tinh vào cốc đựng sẵn nước (AXIT VÀO NƯỚC). TUYỆT ĐỐI KHÔNG làm ngược lại! Nước có tỷ trọng nhẹ hơn sẽ nổi lên trên, gặp H₂SO₄ đặc sinh nhiệt cực lớn làm nước sôi bùng và bắn axit ra xung quanh gây bỏng nặng.',
    keywords: ['pha loang axit', 'h2so4', 'quy tac rot axit', 'axit vao nuoc'],
    pubchemRefs: [
      { name: 'H₂SO₄ (Sulfuric acid)', cid: 1118, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/1118#datasheet=LCSS' }
    ]
  },
  {
    id: 'sk_2',
    title: 'Phòng ngừa sự cố Peroxide hữu cơ trong Ete (Diethyl Ether, THF)',
    category: 'Lưu trữ & Dung môi',
    content: 'Các ete (Diethyl Ether, Tetrahydrofuran, Dioxane) có xu hướng tự oxy hóa tạo Peroxide nhạy nổ khi tiếp xúc với không khí và ánh sáng. Quy tắc: Luôn ghi ngày mở nắp trên thân chai; kiểm tra định kỳ bằng que thử peroxide; không lưu kho quá 6-12 tháng sau khi mở nắp; KHÔNG BAO GIỜ chưng cất ete đến cạn khô.',
    keywords: ['ether', 'ete', 'peroxide', 'thf', 'no ete', 'chay no'],
    pubchemRefs: [
      { name: 'Diethyl ether', cid: 3283, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/3283#datasheet=LCSS' },
      { name: 'Tetrahydrofuran (THF)', cid: 8028, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/8028#datasheet=LCSS' }
    ]
  },
  {
    id: 'sk_3',
    title: '16 Mục tiêu chuẩn trong bản SDS (Safety Data Sheet)',
    category: 'Hồ sơ SDS / MSDS',
    content: '1. Nhận dạng hóa chất & Nhà cung cấp | 2. Nhận dạng mối nguy hại (GHS) | 3. Thành phần | 4. Sơ cứu khẩn cấp | 5. Biện pháp chữa cháy | 6. Biện pháp xử lý tràn đổ | 7. Thao tác & Lưu trữ | 8. Kiểm soát phơi nhiễm & PPE | 9. Đặc tính lý hóa | 10. Độ ổn định & Phản ứng | 11. Độc học | 12. Sinh thái | 13. Thải bỏ | 14. Vận chuyển | 15. Pháp lý | 16. Thông tin khác.',
    keywords: ['sds', 'msds', '16 muc sds', 'cau truc sds', 'tra cuu sds'],
    pubchemRefs: [
      { name: 'PubChem LCSS Guide', cid: 'LCSS', type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/docs/laboratory-chemical-safety-summary' }
    ]
  },
  {
    id: 'sk_4',
    title: 'Nguyên tắc dập cháy kim loại hoạt động (Na, K, Mg, Al)',
    category: 'Phao cứu hỏa & Chữa cháy',
    content: 'Tuyệt đối KHÔNG DÙNG NƯỚC, KHÔNG DÙNG BÌNH CHỮA CHÁY CO₂ VÀ BỌT FOAM để dập đám cháy kim loại kiềm hoặc kim loại bột. Kim loại nóng sẽ phân hủy nước/CO₂ sinh khí H₂ hoặc CO gây nổ dữ dội hơn. CHỈ SỬ DỤNG cát khô, bột graphite, bột muối NaCl khô hoặc bình chữa cháy bột Class D chuyên dụng.',
    keywords: ['chay kim loai', 'natri', 'kali', 'magie', 'chua chay lab', 'binh bot class d'],
    pubchemRefs: [
      { name: 'Sodium (Na metal)', cid: 5360545, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5360545#datasheet=LCSS' },
      { name: 'Potassium (K metal)', cid: 5462222, type: 'lcss', url: 'https://pubchem.ncbi.nlm.nih.gov/compound/5462222#datasheet=LCSS' }
    ]
  }
];

/**
 * Tài liệu quốc tế cho từng quy trình / kiến thức (tra theo id, nên cả bản đã lưu
 * trong localStorage từ phiên bản cũ vẫn hiển thị được đường dẫn).
 */
const icsc = (id: string, name: string): IntlLink => ({
  org: 'ILO/WHO ICSC',
  label: `Thẻ ICSC ${id} – ${name} (mục Sơ cứu)`,
  url: `https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${id}&p_version=2&p_lang=en`
});
const cameo = (id: string, name: string): IntlLink => ({
  org: 'NOAA CAMEO Chemicals',
  label: `${name} – Ứng phó & sơ cứu`,
  url: `https://cameochemicals.noaa.gov/chemical/${id}`
});

export const INTL_LINKS: Record<string, IntlLink[]> = {
  ep_1: [icsc('0362', 'Sulfuric acid'), icsc('0163', 'Hydrogen chloride'), icsc('0183', 'Nitric acid')],
  ep_2: [icsc('0360', 'Sodium hydroxide'), icsc('0357', 'Potassium hydroxide')],
  ep_3: [
    { org: 'CDC/ATSDR', label: 'Medical Management Guidelines for Hydrogen Fluoride', url: 'https://wwwn.cdc.gov/TSP/MMG/MMGDetails.aspx?mmgid=1142&toxid=250' },
    icsc('0283', 'Hydrogen fluoride')
  ],
  ep_4: [
    { org: 'CDC', label: 'Chlorine – Chemical Fact Sheet', url: 'https://www.cdc.gov/chemical-emergencies/chemical-fact-sheets/chlorine.html' },
    icsc('0126', 'Chlorine'), icsc('0414', 'Ammonia'), icsc('0165', 'Hydrogen sulfide'), icsc('0023', 'Carbon monoxide')
  ],
  ep_5: [icsc('0087', 'Acetone'), icsc('0044', 'Ethanol'), icsc('0355', 'Diethyl ether')],
  ep_6: [
    { org: 'CDC/ATSDR', label: 'Medical Management Guidelines for Phenol', url: 'https://wwwn.cdc.gov/TSP/MMG/MMGDetails.aspx?mmgid=144&toxid=27' },
    cameo('5114', 'Phenol'),
    icsc('0070', 'Phenol')
  ],
  sk_1: [icsc('0362', 'Sulfuric acid')],
  sk_2: [
    icsc('0355', 'Diethyl ether'),
    { org: 'Duke University OESO', label: 'Guidelines for Safe Use of Organic Peroxide-Forming Materials', url: 'https://www.safety.duke.edu/sites/default/files/GuidelinePeroxideFormers.pdf' }
  ],
  sk_3: [
    { org: 'OSHA', label: 'Hazard Communication Standard: Safety Data Sheets (OSHA Brief 3514)', url: 'https://www.osha.gov/Publications/OSHA3514.html' },
    { org: 'OSHA', label: '29 CFR 1910.1200 Appendix D – Nội dung bắt buộc của SDS', url: 'https://www.osha.gov/hazcom/appendix-d' }
  ],
  sk_4: [
    { org: 'OSHA', label: '29 CFR 1910.157 – Bình chữa cháy xách tay (yêu cầu bình Class D)', url: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.157' },
    icsc('0988', 'Aluminium powder')
  ],
};

for (const item of [...DEFAULT_EMERGENCY_PROTOCOLS, ...DEFAULT_SAFETY_KNOWLEDGE]) {
  item.intlLinks = INTL_LINKS[item.id];
}

/** Lấy tài liệu quốc tế: ưu tiên dữ liệu gắn sẵn, sau đó tra theo id */
export function getIntlLinks(item: { id: string; intlLinks?: IntlLink[] }): IntlLink[] {
  return item.intlLinks?.length ? item.intlLinks : (INTL_LINKS[item.id] || []);
}

const PROTOCOLS_STORAGE_KEY = 'chemsafe_emergency_protocols';
const KNOWLEDGE_STORAGE_KEY = 'chemsafe_safety_knowledge';

export function getAllEmergencyProtocols(): EmergencyProtocol[] {
  try {
    const raw = localStorage.getItem(PROTOCOLS_STORAGE_KEY);
    if (raw) {
      const parsed: EmergencyProtocol[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge default pubchemRefs if not defined
        return parsed.map(p => {
          // Bổ sung từ khóa mặc định mới (ví dụ "con") cho bản đã lưu từ phiên bản cũ
          const defKw = DEFAULT_EMERGENCY_PROTOCOLS.find(d => d.id === p.id);
          if (defKw) {
            p = { ...p, keywords: Array.from(new Set([...(p.keywords || []), ...(defKw.keywords || [])])) };
          }
          if (!p.pubchemRefs || p.pubchemRefs.length === 0) {
            const def = DEFAULT_EMERGENCY_PROTOCOLS.find(d => d.id === p.id);
            if (def && def.pubchemRefs) {
              return { ...p, pubchemRefs: def.pubchemRefs };
            }
          }
          return p;
        });
      }
    }
  } catch {}
  return [...DEFAULT_EMERGENCY_PROTOCOLS];
}

export function saveEmergencyProtocol(protocol: EmergencyProtocol): EmergencyProtocol[] {
  const current = getAllEmergencyProtocols();
  const index = current.findIndex(p => p.id === protocol.id);
  let updated: EmergencyProtocol[];
  if (index >= 0) {
    updated = current.map(p => p.id === protocol.id ? { ...protocol, custom: true } : p);
  } else {
    updated = [{ ...protocol, custom: true }, ...current];
  }
  localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteEmergencyProtocol(id: string): EmergencyProtocol[] {
  const current = getAllEmergencyProtocols();
  const updated = current.filter(p => p.id !== id);
  localStorage.setItem(PROTOCOLS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function resetEmergencyProtocolsToDefault(): EmergencyProtocol[] {
  localStorage.removeItem(PROTOCOLS_STORAGE_KEY);
  return [...DEFAULT_EMERGENCY_PROTOCOLS];
}

export function getAllSafetyKnowledge(): SafetyKnowledge[] {
  try {
    const raw = localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (raw) {
      const parsed: SafetyKnowledge[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(k => {
          if (!k.pubchemRefs || k.pubchemRefs.length === 0) {
            const def = DEFAULT_SAFETY_KNOWLEDGE.find(d => d.id === k.id);
            if (def && def.pubchemRefs) {
              return { ...k, pubchemRefs: def.pubchemRefs };
            }
          }
          return k;
        });
      }
    }
  } catch {}
  return [...DEFAULT_SAFETY_KNOWLEDGE];
}

export function saveSafetyKnowledge(item: SafetyKnowledge): SafetyKnowledge[] {
  const current = getAllSafetyKnowledge();
  const index = current.findIndex(k => k.id === item.id);
  let updated: SafetyKnowledge[];
  if (index >= 0) {
    updated = current.map(k => k.id === item.id ? { ...item, custom: true } : k);
  } else {
    updated = [{ ...item, custom: true }, ...current];
  }
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteSafetyKnowledge(id: string): SafetyKnowledge[] {
  const current = getAllSafetyKnowledge();
  const updated = current.filter(k => k.id !== id);
  localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
