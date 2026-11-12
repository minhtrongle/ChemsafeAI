import type { Chemical, DangerLevel } from '../types/chemical';
import { CHEMICAL_REFS } from './chemicalRefs';

const SUBSCRIPT_DIGITS: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9"
};

export function normalizeText(value: string): string {
  return String(value || "")
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, ch => SUBSCRIPT_DIGITS[ch] || ch)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * So khớp theo TỪ nguyên vẹn thay vì "chứa chuỗi con".
 * Ví dụ: "cồn" không còn khớp nhầm với "gluconate", "CO2" không còn khớp với "co".
 */
export function toWords(value: string): string[] {
  return normalizeText(value).split(/[^a-z0-9]+/).filter(Boolean);
}

export function matchesPhrase(query: string, phrase: string): boolean {
  const p = toWords(phrase);
  if (p.length === 0) return false;
  return ` ${toWords(query).join(' ')} `.includes(` ${p.join(' ')} `);
}

export function compactFormula(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

export const BASE_CHEMICALS: Chemical[] = [
  {
    key: "hcl",
    formula: "HCl",
    name: "Axit Clohydric",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "36.46 g/mol",
    molarMass: 36.46,
    boiling: "-85°C (khí HCl); ~48°C (dd 37%); 108,6°C (dd đẳng phí ~20%)",
    ph: "< 1 (dd 1M)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit vô cơ mạnh, bốc khói trong không khí ẩm, ăn mòn mạnh kim loại và mô sống.",
    msds: "Gây bỏng da, tổn thương giác mạc nghiêm trọng. Hít phải hơi gây phù phổi. PPE: Kính kín chống hóa chất, găng cao su/nitrile, áo blouse.",
    storage: "Bình thủy tinh hoặc nhựa HDPE kín, để nơi thoáng khí, cách ly tuyệt đối khỏi kiềm, chất oxy hóa và kim loại hoạt động.",
    aliases: ["hydrochloric acid", "axit clohidric"]
  },
  {
    key: "h2so4",
    formula: "H₂SO₄",
    name: "Axit Sulfuric",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "98.08 g/mol",
    molarMass: 98.08,
    boiling: "337°C",
    ph: "< 1 (dd đặc)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit mạnh nhất thông dụng, chất háo nước cực mạnh, tỏa nhiệt dữ dội khi pha loãng với nước.",
    msds: "Ăn mòn và gây bỏng hóa - nhiệt kết hợp. BẮT BUỘC rót axit vào nước từ từ dọc theo đũa thủy tinh (TUYỆT ĐỐI KHÔNG làm ngược lại). PPE đầy đủ.",
    storage: "Tủ hóa chất ăn mòn chuyên dụng, khay hứng chống tràn, cách xa dung môi hữu cơ, chất khử và bazơ.",
    aliases: ["sulfuric acid", "axit sunfuric"]
  },
  {
    key: "hno3",
    formula: "HNO₃",
    name: "Axit Nitric",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "63.01 g/mol",
    molarMass: 63.01,
    boiling: "83°C",
    ph: "< 1",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit mạnh và chất oxy hóa cực mạnh. Phản ứng với kim loại/chất khử sinh khí NO₂ độc màu nâu đỏ.",
    msds: "Gây bỏng hóa học màu vàng đặc trưng trên da (phản ứng xanthoproteic). Khí NO₂ gây viêm và phù phổi cấp. Thao tác 100% trong tủ hút.",
    storage: "Bình sẫm màu, để riêng rẽ, tuyệt đối không lưu chung với dung môi hữu cơ, rượu hoặc chất khử.",
    aliases: ["nitric acid"]
  },
  {
    key: "naoh",
    formula: "NaOH",
    name: "Natri Hydroxide (Xút ăn da)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "40.00 g/mol",
    molarMass: 40.00,
    boiling: "1388°C",
    ph: "> 13 (dd 1M)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Kiềm mạnh, hút ẩm mạnh từ không khí, tan trong nước tỏa nhiệt lớn.",
    msds: "Gây bỏng kiềm sâu khó lành do xà phòng hóa lipid mô. Đặc biệt nguy hiểm cho mắt, nguy cơ mù lòa nếu dính mắt. Rửa nước liên tục 20 phút.",
    storage: "Lọ nhựa kín (tránh nắp thủy tinh nhám vì dễ bị dính chặt do Na₂SiO₃), nơi khô ráo, tách biệt axit mạnh và kim loại như nhôm, kẽm (ICSC 0360).",
    aliases: ["sodium hydroxide", "xut", "soda"]
  },
  {
    key: "koh",
    formula: "KOH",
    name: "Kali Hydroxide",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "56.11 g/mol",
    molarMass: 56.11,
    boiling: "1327°C",
    ph: "> 13",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Kiềm mạnh, tính tan và hút ẩm cao hơn NaOH. Tỏa nhiệt mạnh khi hòa tan.",
    msds: "Ăn mòn mạnh mô sống và thủy tinh ở nhiệt độ cao. PPE bắt buộc: kính bảo hộ chống hóa chất, găng tay chống kiềm.",
    storage: "Bình kín chống ẩm, để nơi khô ráo, tách khỏi axit và các hợp chất chứa amoni.",
    aliases: ["potassium hydroxide"]
  },
  {
    key: "nh3",
    formula: "NH₃",
    name: "Amoniac (Khí / Dung dịch)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "17.03 g/mol",
    molarMass: 17.03,
    boiling: "-33°C (khí)",
    ph: "11.6 (dd 1M)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Khí không màu mùi hắc đặc trưng, tan rất nhiều trong nước tạo dung dịch kiềm yếu NH₄OH.",
    msds: "Hơi gây kích ứng mạnh kết mạc mắt và niêm mạc hô hấp. Nồng độ cao gây co thắt phế quản và ngạt. Thao tác trong tủ hút.",
    storage: "Bình chịu áp hoặc chai chứa dung dịch có nắp kín, nơi mát mẻ, cách ly chất oxy hóa mạnh và axit.",
    aliases: ["ammonia", "ammoniac"]
  },
  {
    key: "h2o2",
    formula: "H₂O₂",
    name: "Hydro Peroxit (Oxy già)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "34.01 g/mol",
    molarMass: 34.01,
    boiling: "150°C",
    ph: "4.5 (3%)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Chất oxy hóa mạnh, dễ bị phân hủy giải phóng khí O₂ khi gặp nhiệt, ánh sáng hoặc xúc tác ion kim loại nặng.",
    msds: "Dung dịch đậm đặc (>30%) gây bỏng trắng da, nguy cơ nổ bình chứa nếu nắp kín bị tăng áp do O₂ sinh ra.",
    storage: "Bình tối màu có nắp thông áp nhẹ, bảo quản nơi mát (<15°C nếu có thể), tránh xa chất hữu cơ và kim loại.",
    aliases: ["hydrogen peroxide", "oxy gia"]
  },
  {
    key: "nacl",
    formula: "NaCl",
    name: "Natri Clorua (Muối ăn)",
    danger: "safe",
    dangerLabel: "AN TOÀN",
    molar: "58.44 g/mol",
    molarMass: 58.44,
    boiling: "1413°C",
    ph: "7.0 (trung tính)",
    color: "#2ed573",
    colorBg: "rgba(46,213,115,0.1)",
    properties: "Muối vô cơ trung tính, tinh thể màu trắng, tan tốt trong nước, ổn định nhiệt cao.",
    msds: "Không độc ở điều kiện thông thường phòng thí nghiệm. Bụi mịn có thể kích ứng nhẹ niêm mạc mắt.",
    storage: "Hộp kín, bảo quản nơi khô ráo, tránh ẩm vón cục.",
    aliases: ["sodium chloride", "muoi an"]
  },
  {
    key: "methanol",
    formula: "CH₃OH",
    name: "Methanol (Cồn công nghiệp)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "32.04 g/mol",
    molarMass: 32.04,
    boiling: "64.7°C",
    ph: "Trung tính",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Dung môi hữu cơ trong suốt, bay hơi nhanh, bắt lửa dễ dàng, ngọn lửa cháy gần như không màu.",
    msds: "CỰC KỲ ĐỘC. Hấp thu qua da, tiêu hóa hoặc hô hấp bị chuyển hóa thành acid formic gây toan máu, phá hủy dây thần kinh thị giác (mù lòa) và tử vong.",
    storage: "Tủ dung môi chống cháy nổ, dán nhãn đầu lâu xương chéo rõ ràng, có khóa kiểm soát.",
    aliases: ["methyl alcohol"]
  },
  {
    key: "ethanol",
    formula: "C₂H₅OH",
    name: "Ethanol (Cồn tinh khiết)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "46.07 g/mol",
    molarMass: 46.07,
    boiling: "78.4°C",
    ph: "Trung tính",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Chất lỏng không màu, mùi thơm đặc trưng, tan vô hạn trong nước, dễ bay hơi và dễ cháy.",
    msds: "Rất dễ cháy: điểm chớp cháy 12°C, hơi trộn với không khí tạo hỗn hợp nổ (ICSC 0044). Phản ứng mãnh liệt với chất oxy hóa mạnh như HNO₃, AgNO₃. Hơi nồng độ cao gây ho, đau đầu, buồn ngủ.",
    storage: "Tủ chứa chất lỏng dễ cháy, tránh mọi nguồn nhiệt, tia lửa điện, tĩnh điện.",
    aliases: ["ethyl alcohol", "con"]
  },
  {
    key: "acetone",
    formula: "CH₃COCH₃",
    name: "Acetone",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "58.08 g/mol",
    molarMass: 58.08,
    boiling: "56°C",
    ph: "Trung tính",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Dung môi hữu cơ phân cực cực kỳ dễ bay hơi (điểm chớp cháy -20°C).",
    msds: "Hơi nặng hơn không khí và dễ tích tụ mặt sàn gây cháy nổ. Hít nhiều gây nhức đầu, buồn nôn.",
    storage: "Khu vực thông gió tốt, tủ hóa chất dễ cháy, nắp vặn thật chặt.",
    aliases: ["propan-2-one", "dimetyl xeton"]
  },
  {
    key: "cl2",
    formula: "Cl₂",
    name: "Khí Clo",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "70.90 g/mol",
    molarMass: 70.90,
    boiling: "-34°C (khí)",
    ph: "< 1 (khi tan trong nước)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Khí màu vàng lục, nặng hơn không khí 2.5 lần, mùi hắc gắt ngạt thở, oxy hóa mãnh liệt.",
    msds: "Cực độc đối với đường hô hấp. Tạo HCl và HOCl khi gặp ẩm niêm mạc phổi gây hủy hoại phế nang. Thao tác nghiêm ngặt có cảm biến khí.",
    storage: "Bình thép chuyên dụng có van kiểm soát, phòng trang bị hệ thống hấp thụ khí clo khẩn cấp.",
    aliases: ["chlorine", "clo"]
  },
  {
    key: "hf",
    formula: "HF",
    name: "Axit Flohidric",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "20.01 g/mol",
    molarMass: 20.01,
    boiling: "19.5°C",
    ph: "< 1",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit vô cơ hòa tan thủy tinh (SiO₂ + 4HF -> SiF₄ + 2H₂O), độc tính độc nhất vô nhị.",
    msds: "Thấm sâu qua da mà không gây đau ngay, sau đó liên kết với Ca²⁺ và Mg²⁺ trong xương và máu gây hủy xương, co giật và ngừng tim. BẮT BUỘC có gel Calcium Gluconate.",
    storage: "Chỉ bảo quản trong bình nhựa polyethylene/Teflon, TUYỆT ĐỐI KHÔNG dùng bình thủy tinh.",
    aliases: ["hydrofluoric acid", "axit flohidric"]
  },
  {
    key: "kmno4",
    formula: "KMnO₄",
    name: "Kali Pemanganat (Thuốc tím)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "158.03 g/mol",
    molarMass: 158.03,
    boiling: "Phân hủy ở 240°C (ICSC 0672)",
    ph: "Trung tính (dd)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Tinh thể màu tím đen ánh kim, chất oxy hóa rất mạnh trong cả môi trường axit, kiềm và trung tính.",
    msds: "Chất oxy hóa mạnh, có thể làm cháy dữ dội hơn. Gây bỏng nặng da và tổn thương mắt; có hại nếu nuốt; nghi ngờ gây hại khả năng sinh sản; rất độc với sinh vật thủy sinh (ICSC 0672). Nguy cơ cháy nổ khi tiếp xúc chất hữu cơ, bột kim loại, glycerin.",
    storage: "Lọ kín, tách biệt chất dễ cháy, chất khử, bột kim loại và axit đậm đặc; không để gần cống thoát nước.",
    aliases: ["potassium permanganate", "thuoc tim"]
  },
  {
    key: "naclo",
    formula: "NaClO",
    name: "Natri Hypochlorite (Nước Javel)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "74.44 g/mol",
    molarMass: 74.44,
    boiling: "Phân hủy",
    ph: "11 - 13",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Dung dịch kiềm có tính oxy hóa và tẩy trắng mạnh, mùi clo nhẹ.",
    msds: "TUYỆT ĐỐI KHÔNG TRỘN VỚI AXIT (sinh khí Clo Cl₂ chết người) HOẶC AMONIAC (sinh chloramine độc).",
    storage: "Bình nhựa sẫm màu, để nơi thoáng mát, tránh ánh sáng mặt trời.",
    aliases: ["sodium hypochlorite", "javel", "nuoc javen"]
  },
  {
    key: "ch3cooh",
    formula: "CH₃COOH",
    name: "Axit Acetic (Axit Axetic băng)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "60.05 g/mol",
    molarMass: 60.05,
    boiling: "118°C",
    ph: "2.4 (đặc)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Axit hữu cơ, dạng băng đông đặc ở 16.6°C, mùi chua hắc nồng nặc.",
    msds: "Dạng nguyên chất gây bỏng da, hơi kích thích mạnh màng niêm mạc mắt và mũi.",
    storage: "Bình thủy tinh, nơi thoáng khí, giữ nhiệt độ trên 18°C để tránh đóng băng.",
    aliases: ["acetic acid", "giam"]
  },
  {
    key: "h3po4",
    formula: "H₃PO₄",
    name: "Axit Phosphoric",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "98.00 g/mol",
    molarMass: 98.00,
    boiling: "213°C",
    ph: "1.5 (đặc)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Axit ba nấc có độ mạnh trung bình, dạng lỏng sánh như siro, không bay hơi.",
    msds: "Ăn mòn vừa phải, gây kích ứng mắt và da khi tiếp xúc.",
    storage: "Bình thủy tinh chịu hóa chất hoặc nhựa HDPE, nơi khô ráo.",
    aliases: ["phosphoric acid"]
  },
  {
    key: "h2c2o4",
    formula: "H₂C₂O₄",
    name: "Axit Oxalic",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "90.03 g/mol",
    molarMass: 90.03,
    boiling: "Phân hủy 101°C",
    ph: "1.3 (0.1M)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit hữu cơ mạnh dạng tinh thể không màu, tính khử.",
    msds: "ĐỘC. Nuốt phải gây kết tủa canxi oxalate làm suy thận cấp và toan máu.",
    storage: "Hộp kín dán nhãn độc, để tủ riêng cách ly bazơ và chất oxy hóa mạnh.",
    aliases: ["oxalic acid"]
  },
  {
    key: "caoh2",
    formula: "Ca(OH)₂",
    name: "Canxi Hydroxide (Vôi tôi)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "74.09 g/mol",
    molarMass: 74.09,
    boiling: "Phân hủy 580°C",
    ph: "12.4 (dd bão hòa)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Bột mịn màu trắng, ít tan trong nước tạo nước vôi trong, hấp thụ CO₂ từ khí quyển.",
    msds: "Bụi gây bỏng mắt và tổn thương giác mạc nghiêm trọng do tính kiềm.",
    storage: "Bao hoặc hộp kín khí để tránh tác dụng với CO₂ tạo CaCO₃ mất hoạt tính.",
    aliases: ["calcium hydroxide", "voi toi"]
  },
  {
    key: "cuso4",
    formula: "CuSO₄",
    name: "Đồng(II) Sulfate",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "159.61 g/mol",
    molarMass: 159.61,
    boiling: "Phân hủy 650°C",
    ph: "4.0 (0.1M)",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Dạng khan màu trắng, dạng pentahydrate CuSO₄·5H₂O tinh thể màu xanh lam tuyệt đẹp.",
    msds: "Độc nếu nuốt phải, gây kích ứng mắt, cực kỳ độc hại đối với sinh vật thủy sinh.",
    storage: "Hộp kín, nơi khô ráo, không đổ trực tiếp ra cống rãnh môi trường.",
    aliases: ["copper sulfate", "dong sunfat"]
  },
  {
    key: "k2cr2o7",
    formula: "K₂Cr₂O₇",
    name: "Kali Dichromate",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "294.19 g/mol",
    molarMass: 294.19,
    boiling: "Phân hủy 500°C",
    ph: "2.0 (0.1M)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Tinh thể màu đỏ cam, hợp chất Cr(VI) có tính oxy hóa mãnh liệt.",
    msds: "CỰC ĐỘC, GÂY UNG THƯ, ĐỘT BIẾN GEN VÀ DỊ TẬT THAI NHI. Gây loét da sâu khó lành.",
    storage: "Tủ an toàn hóa chất độc hại đặc biệt, khóa cẩn thận, dán nhãn nguy cơ ung thư.",
    aliases: ["potassium dichromate"]
  },
  {
    key: "agno3",
    formula: "AgNO₃",
    name: "Bạc Nitrate",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "169.87 g/mol",
    molarMass: 169.87,
    boiling: "440°C",
    ph: "4.5",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Tinh thể trong suốt không màu, nhạy cảm với ánh sáng (bị khử thành Ag kim loại màu đen).",
    msds: "Gây ố đen vĩnh viễn trên da và mô, ăn mòn mắt. Tránh tiếp xúc trực tiếp.",
    storage: "Bình thủy tinh nâu sẫm màu, bọc giấy bạc, bảo quản trong tủ tối.",
    aliases: ["silver nitrate"]
  },
  {
    key: "c6h6",
    formula: "C₆H₆",
    name: "Benzene",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "78.11 g/mol",
    molarMass: 78.11,
    boiling: "80.1°C",
    ph: "Không áp dụng",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Dung môi hydrocarbon thơm không màu, mùi thơm ngọt đặc trưng, dễ cháy.",
    msds: "CHẤT GÂY UNG THƯ NHÓM 1 (đặc biệt là bệnh bạch cầu, ung thư máu tủy xương). Hạn chế tối đa sử dụng.",
    storage: "Tủ dung môi có hệ thống hút khí chuyên dụng, hạn chế lưu kho số lượng lớn.",
    aliases: ["benzen"]
  },
  {
    key: "ccl4",
    formula: "CCl₄",
    name: "Carbon Tetrachloride",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "153.81 g/mol",
    molarMass: 153.81,
    boiling: "76.7°C",
    ph: "Không áp dụng",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Dung môi nặng không cháy, phá hủy tầng ozon.",
    msds: "Cực kỳ độc cho gan và thận, nghi ngờ gây ung thư. Đã bị hạn chế theo Nghị định thư Montreal.",
    storage: "Bình tối màu, tủ hóa chất độc.",
    aliases: ["tetrachloromethane"]
  },
  {
    key: "chcl3",
    formula: "CHCl₃",
    name: "Chloroform",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "119.38 g/mol",
    molarMass: 119.38,
    boiling: "61.2°C",
    ph: "Không áp dụng",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Chất lỏng không màu, mùi ngọt, có tính gây mê và bay hơi mạnh.",
    msds: "Độc cho gan, nghi ngờ gây ung thư. Tiếp xúc ánh sáng và không khí có thể tạo phosgene (COCl₂) cực độc.",
    storage: "Bình tối màu đầy kín cổ, ổn định bằng 1% ethanol.",
    aliases: ["trichloromethane"]
  },
  {
    key: "c6h5oh",
    formula: "C₆H₅OH",
    name: "Phenol (Axit Carbolic)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "94.11 g/mol",
    molarMass: 94.11,
    boiling: "181.8°C",
    ph: "1.6 (dd)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Tinh thể trắng ngả hồng, mùi hắc sắc ngọt, tính sát trùng và ăn mòn mô cao.",
    msds: "GÂY BỎNG HOẠI TỬ SÂU. Có tác dụng gây tê cục bộ nên người bị dính có thể không nhận biết được mức độ nghiêm trọng ngay.",
    storage: "Bình thủy tinh sẫm màu, tránh nhiệt độ cao.",
    aliases: ["carbolic acid"]
  },
  {
    key: "h2s",
    formula: "H₂S",
    name: "Hydrogen Sulfide (Khí hydro sunfua)",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "34.08 g/mol",
    molarMass: 34.08,
    boiling: "-60°C",
    ph: "Axit yếu",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Khí không màu, mùi trứng thối ở nồng độ cực thấp nhưng làm liệt khứu giác ở nồng độ cao.",
    msds: "CỰC ĐỘC - Ngang ngửa Hydrogen Cyanide. Nồng độ >500 ppm gây mất ý thức tức thì và tử vong.",
    storage: "Bình khí nén chuyên dụng hoặc điều chế lượng rất nhỏ trong tủ hút kiểm định.",
    aliases: ["hydro sulfide"]
  },
  {
    key: "so2",
    formula: "SO₂",
    name: "Sulfur Dioxide (Khí lưu huỳnh đioxit)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "64.07 g/mol",
    molarMass: 64.07,
    boiling: "-10°C",
    ph: "Axit trong nước",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Khí không màu mùi hắc ngột ngạt khó chịu, nặng hơn không khí.",
    msds: "Kích ứng mạnh màng nhầy mắt và đường thở, gây co thắt thanh quản và phù phổi.",
    storage: "Bình chịu áp, khu vực thông gió cơ học mạnh.",
    aliases: ["luu huynh dioxit"]
  },
  {
    key: "co",
    formula: "CO",
    name: "Carbon Monoxide (Khí CO)",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "28.01 g/mol",
    molarMass: 28.01,
    boiling: "-191.5°C",
    ph: "Không áp dụng",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Khí không màu, không mùi, không vị, hoàn toàn không thể nhận biết bằng giác quan.",
    msds: "Ái lực với Hemoglobin gấp 200 lần Oxy, gây ngạt mô tế bào dẫn đến tử vong thầm lặng. BẮT BUỘC máy dò CO.",
    storage: "Bình khí chuẩn, phòng có máy đo khí tự động báo động.",
    aliases: ["cacbon monoxit"]
  },
  {
    key: "h2",
    formula: "H₂",
    name: "Hydrogen (Khí Hydro)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "2.016 g/mol",
    molarMass: 2.016,
    boiling: "-253°C",
    ph: "Không áp dụng",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Khí nhẹ nhất, khuếch tán nhanh, giới hạn nổ trong không khí rất rộng (4% - 75%).",
    msds: "Nguy cơ cháy nổ cực cao chỉ với tia lửa nhỏ hoặc tĩnh điện.",
    storage: "Bình khí xích cố định thẳng đứng, van chống cháy ngược, nối đất chống tĩnh điện.",
    aliases: ["hydro"]
  },
  {
    key: "o2",
    formula: "O₂",
    name: "Oxygen (Khí Oxy)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "32.00 g/mol",
    molarMass: 32.00,
    boiling: "-183°C",
    ph: "Không áp dụng",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Khí duy trì sự sống và hỗ trợ sự cháy mãnh liệt.",
    msds: "Tuyệt đối không để dầu mỡ dính vào van hoặc đồng hồ oxy vì sẽ tự bốc cháy nổ dữ dội.",
    storage: "Khu vực riêng biệt, cách xa ít nhất 6m khỏi khí dễ cháy (H₂, axetilen).",
    aliases: ["oxy"]
  },
  {
    key: "hclo4",
    formula: "HClO₄",
    name: "Axit Perchloric",
    danger: "extreme",
    dangerLabel: "CỰC KỲ NGUY HIỂM",
    molar: "100.46 g/mol",
    molarMass: 100.46,
    boiling: "203°C",
    ph: "< 1",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Axit mạnh nhất trong các axit vô cơ đơn chức, chất oxy hóa cực mạnh ở nhiệt độ cao.",
    msds: "Tiếp xúc chất hữu cơ (rượu, giấy, gỗ) gây nổ tự phát dữ dội. Chỉ dùng trong tủ hút chuyên dụng có hệ thống rửa nước ống dẫn.",
    storage: "Tủ riêng, tránh chất hữu cơ, kiểm tra định kỳ tinh thể perchlorate nhạy nổ.",
    aliases: ["perchloric acid"]
  },
  {
    key: "na2s",
    formula: "Na₂S",
    name: "Natri Sulfide",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "78.04 g/mol",
    molarMass: 78.04,
    boiling: "1180°C",
    ph: "> 12",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Chất rắn hút ẩm, dung dịch có tính kiềm rất mạnh và có mùi trứng thối thoang thoảng.",
    msds: "GẶP AXIT SẼ GIẢI PHÓNG TỨC THÌ KHÍ H₂S CỰC ĐỘC. Ăn mòn da nghiêm trọng.",
    storage: "Hộp kín, để nơi khô mát, cách ly tuyệt đối khỏi mọi loại axit.",
    aliases: ["sodium sulfide"]
  },
  {
    key: "nano2",
    formula: "NaNO₂",
    name: "Natri Nitrite",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "69.00 g/mol",
    molarMass: 69.00,
    boiling: "Phân hủy 320°C",
    ph: "8.5",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Tinh thể màu trắng ngả vàng nhẹ, chất oxy hóa và chất khử tùy điều kiện.",
    msds: "Độc nếu nuốt phải, biến đổi hemoglobin thành methemoglobin làm mất khả năng vận chuyển oxy. Axit hóa sinh khí oxit nitơ độc.",
    storage: "Hộp kín tránh ẩm, tránh axit và các muối amoni.",
    aliases: ["sodium nitrite"]
  },
  {
    key: "nh4no3",
    formula: "NH₄NO₃",
    name: "Amoni Nitrate",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "80.04 g/mol",
    molarMass: 80.04,
    boiling: "Phân hủy 210°C",
    ph: "5.0 (0.1M)",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Muối hút ẩm mạnh, chất oxy hóa mạnh, tiềm ẩn nguy cơ nổ khi bị nhiễm tạp chất hoặc nung nóng trong không gian kín.",
    msds: "Tự phân hủy nổ ở nhiệt độ cao hoặc khi nhiễm chất hữu cơ, bột kim loại (vụ nổ Beirut 2020).",
    storage: "Kiểm soát nghiêm ngặt, tránh xa nguồn nhiệt, chất cháy và dầu mỡ.",
    aliases: ["ammonium nitrate"]
  },
  {
    key: "al",
    formula: "Al",
    name: "Nhôm (Kim loại / Bột)",
    danger: "caution",
    dangerLabel: "THẬN TRỌNG",
    molar: "26.98 g/mol",
    molarMass: 26.98,
    boiling: "2519°C",
    ph: "Không áp dụng",
    color: "#ffa502",
    colorBg: "rgba(255,165,2,0.1)",
    properties: "Kim loại màu trắng bạc, phản ứng với cả axit mạnh và kiềm mạnh giải phóng khí H₂ dễ cháy.",
    msds: "Dạng bột mịn có nguy cơ nổ bụi cực mạnh trong không khí. Phản ứng nhiệt nhôm tỏa nhiệt trên 2500°C.",
    storage: "Nơi khô ráo, tránh nước, tránh axit và bazơ.",
    aliases: ["aluminum", "nhom"]
  },
  {
    key: "zn",
    formula: "Zn",
    name: "Kẽm (Kim loại / Hạt / Bột)",
    danger: "safe",
    dangerLabel: "AN TOÀN",
    molar: "65.38 g/mol",
    molarMass: 65.38,
    boiling: "907°C",
    ph: "Không áp dụng",
    color: "#2ed573",
    colorBg: "rgba(46,213,115,0.1)",
    properties: "Kim loại màu xám xanh, phản ứng với dung dịch axit sinh khí hydro.",
    msds: "Dạng hạt ít nguy hiểm; dạng bụi mịn có thể cháy khi tiếp xúc nhiệt độ cao.",
    storage: "Hộp kín, bảo quản khô ráo, tránh xa axit mạnh.",
    aliases: ["zinc", "kem"]
  },
  {
    key: "diethyl_ether",
    formula: "C₄H₁₀O",
    name: "Diethyl Ether (Ete)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "74.12 g/mol",
    molarMass: 74.12,
    boiling: "34.6°C",
    ph: "Trung tính",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Dung môi cực kỳ dễ bay hơi và dễ cháy (điểm chớp cháy -45°C), hơi nặng hơn không khí và bò sát mặt sàn.",
    msds: "HÌNH THÀNH PEROXIDE TỰ NHIÊN DƯỚI TÁC DỤNG CỦA KHÔNG KHÍ VÀ ÁNH SÁNG, gây nổ dữ dội khi chưng cất khô.",
    storage: "Bình kim loại hoặc thủy tinh tối màu, ghi rõ ngày mở nắp, kiểm tra peroxide định kỳ.",
    aliases: ["ether", "diethyl ether", "ete"]
  },
  {
    key: "dcm",
    formula: "CH₂Cl₂",
    name: "Dichloromethane (DCM)",
    danger: "danger",
    dangerLabel: "NGUY HIỂM",
    molar: "84.93 g/mol",
    molarMass: 84.93,
    boiling: "39.6°C",
    ph: "Trung tính",
    color: "#ff4757",
    colorBg: "rgba(255,71,87,0.1)",
    properties: "Dung môi clo hóa bay hơi nhanh, không dễ cháy nhưng độc hại cao.",
    msds: "Chuyển hóa thành Carbon Monoxide trong cơ thể khi hít phải. Nghi ngờ gây ung thư. Hỏng găng tay cao su thông thường rất nhanh.",
    storage: "Bình kín ở nơi thoáng mát, thao tác 100% trong tủ hút.",
    aliases: ["methylene chloride", "dcm"]
  }
];

// Gắn mã PubChem / ICSC / CAMEO và chương trình học đã kiểm chứng cho 39 chất gốc
for (const chem of BASE_CHEMICALS) {
  const ref = CHEMICAL_REFS[chem.key];
  if (!ref) continue;
  chem.pubChemCid = ref.pubChemCid;
  chem.icscId = ref.icscId;
  chem.cameoId = ref.cameoId;
  chem.curriculum = ref.curriculum;
  chem.icscNote = ref.icscNote;
}

export const DEFAULT_CATEGORIES = [
  "Axit",
  "Bazơ / Kiềm",
  "Oxy hóa / Nitrate",
  "Dung môi / Hữu cơ",
  "Khí",
  "Muối vô cơ",
  "Kim loại / Đơn chất",
  "Chất độc hại / Nguy hiểm cao"
];

const CATEGORIES_STORAGE_KEY = "chemsafe_user_categories";

export function getAllCategories(): string[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...DEFAULT_CATEGORIES];
}

export function isDefaultCategory(categoryName: string): boolean {
  return DEFAULT_CATEGORIES.some(c => c.toLowerCase() === categoryName.trim().toLowerCase());
}

export function saveNewCategory(categoryName: string): string[] {
  const trimmed = categoryName.trim();
  if (!trimmed) return getAllCategories();
  const current = getAllCategories();
  if (!current.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...current, trimmed];
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    try {
      window.dispatchEvent(new CustomEvent('chemsafe_categories_changed', {
        detail: { newCategory: trimmed, categories: updated }
      }));
    } catch {}
    return updated;
  }
  return current;
}

/**
 * Chỉnh sửa / Đổi tên một nhóm phân loại và cập nhật đồng bộ trong CSDL và Kho
 */
export function updateCategory(oldName: string, newName: string): string[] {
  const trimmedNew = newName.trim();
  const trimmedOld = oldName.trim();
  if (!trimmedNew || !trimmedOld) return getAllCategories();
  if (trimmedNew.toLowerCase() === trimmedOld.toLowerCase() && trimmedNew === trimmedOld) {
    return getAllCategories();
  }

  const current = getAllCategories();
  const oldIdx = current.findIndex(c => c.toLowerCase() === trimmedOld.toLowerCase());
  if (oldIdx === -1) return current;

  // Thay thế tên nhóm trong danh sách
  const updated = [...current];
  updated[oldIdx] = trimmedNew;
  const uniqueCategories = Array.from(new Set(updated));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(uniqueCategories));

  // 1. Cập nhật trong CSDL hóa chất tùy chỉnh (localStorage)
  try {
    const rawCustom = localStorage.getItem(CUSTOM_CHEM_KEY);
    if (rawCustom) {
      const customChems: Chemical[] = JSON.parse(rawCustom);
      let changed = false;
      const updatedChems = customChems.map(c => {
        let chemChanged = false;
        let cats = getChemicalCategories(c);
        if (cats.some(cat => cat.toLowerCase() === trimmedOld.toLowerCase())) {
          cats = cats.map(cat => (cat.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : cat));
          chemChanged = true;
          changed = true;
        }
        if (chemChanged) {
          const uniqueCats = Array.from(new Set(cats));
          return {
            ...c,
            categories: uniqueCats,
            category: uniqueCats.join(', ')
          };
        }
        return c;
      });
      if (changed) {
        localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(updatedChems));
      }
    }
  } catch {}

  // 2. Cập nhật trong Kho hóa chất (localStorage)
  try {
    const rawInv = localStorage.getItem("chemsafe_user_inventory");
    if (rawInv) {
      const invItems: any[] = JSON.parse(rawInv);
      let invChanged = false;
      const updatedInv = invItems.map(item => {
        let itemChanged = false;
        let cats = getChemicalCategories(item);
        if (cats.some(cat => cat.toLowerCase() === trimmedOld.toLowerCase())) {
          cats = cats.map(cat => (cat.toLowerCase() === trimmedOld.toLowerCase() ? trimmedNew : cat));
          itemChanged = true;
          invChanged = true;
        }
        if (itemChanged) {
          const uniqueCats = Array.from(new Set(cats));
          return {
            ...item,
            categories: uniqueCats,
            category: uniqueCats.join(', ')
          };
        }
        return item;
      });
      if (invChanged) {
        localStorage.setItem("chemsafe_user_inventory", JSON.stringify(updatedInv));
      }
    }
  } catch {}

  // 3. Bắn event đồng bộ UI tức thì
  try {
    window.dispatchEvent(new CustomEvent('chemsafe_categories_changed', {
      detail: { oldName: trimmedOld, newName: trimmedNew, categories: uniqueCategories }
    }));
  } catch {}

  return uniqueCategories;
}

export function deleteCategory(categoryName: string): string[] {
  return deleteMultipleCategories([categoryName]);
}

export function deleteMultipleCategories(categoryNames: string[]): string[] {
  const namesToRemoveSet = new Set(
    categoryNames.map(c => c.trim().toLowerCase()).filter(Boolean)
  );
  if (namesToRemoveSet.size === 0) return getAllCategories();

  const current = getAllCategories();
  const updated = current.filter(c => !namesToRemoveSet.has(c.toLowerCase()));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));

  // 1. Xóa các nhóm này khỏi các hóa chất tùy chỉnh
  try {
    const rawCustom = localStorage.getItem(CUSTOM_CHEM_KEY);
    if (rawCustom) {
      const customChems: Chemical[] = JSON.parse(rawCustom);
      let changed = false;
      const updatedChems = customChems.map(c => {
        let cats = getChemicalCategories(c);
        const hasDeleted = cats.some(cat => namesToRemoveSet.has(cat.toLowerCase()));
        if (hasDeleted) {
          cats = cats.filter(cat => !namesToRemoveSet.has(cat.toLowerCase()));
          if (cats.length === 0) cats = ["Khác"];
          changed = true;
          return {
            ...c,
            categories: cats,
            category: cats.join(', ')
          };
        }
        return c;
      });
      if (changed) {
        localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(updatedChems));
      }
    }
  } catch {}

  // 2. Xóa các nhóm này khỏi kho hóa chất
  try {
    const rawInv = localStorage.getItem("chemsafe_user_inventory");
    if (rawInv) {
      const invItems: any[] = JSON.parse(rawInv);
      let invChanged = false;
      const updatedInv = invItems.map(item => {
        let cats = getChemicalCategories(item);
        const hasDeleted = cats.some(cat => namesToRemoveSet.has(cat.toLowerCase()));
        if (hasDeleted) {
          cats = cats.filter(cat => !namesToRemoveSet.has(cat.toLowerCase()));
          if (cats.length === 0) cats = ["Khác"];
          invChanged = true;
          return {
            ...item,
            categories: cats,
            category: cats.join(', ')
          };
        }
        return item;
      });
      if (invChanged) {
        localStorage.setItem("chemsafe_user_inventory", JSON.stringify(updatedInv));
      }
    }
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('chemsafe_categories_changed', {
      detail: { deletedNames: Array.from(namesToRemoveSet), categories: updated }
    }));
  } catch {}

  return updated;
}

export function resetCategoriesToDefault(): string[] {
  const updated = [...DEFAULT_CATEGORIES];
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
  try {
    window.dispatchEvent(new CustomEvent('chemsafe_categories_changed', {
      detail: { categories: updated }
    }));
  } catch {}
  return updated;
}

/**
 * Tự động phát hiện nhiều nhóm phân loại hóa học dựa vào công thức, tính chất và MSDS
 */
export function detectChemicalCategories(chem: {
  formula?: string;
  name?: string;
  properties?: string;
  msds?: string;
}): string[] {
  const text = normalizeText(`${chem.formula || ''} ${chem.name || ''} ${chem.properties || ''} ${chem.msds || ''}`);
  const formula = compactFormula(chem.formula || '');
  const matched: string[] = [];

  // 1. Khí
  if (text.includes("khi ") || text.includes("gas") || ["cl2", "nh3", "h2s", "so2", "co", "co2", "o2", "h2", "n2"].includes(formula)) {
    matched.push("Khí");
  }

  // 2. Axit
  if (text.includes("axit") || text.includes("acid") || ["hcl", "h2so4", "hno3", "hf", "hbr", "hi", "hclo4", "ch3cooh", "h3po4", "h2c2o4", "hcooh"].includes(formula)) {
    matched.push("Axit");
  }

  // 3. Bazơ / Kiềm
  if (text.includes("kiem") || text.includes("hydroxide") || text.includes("amoniac") || ["naoh", "koh", "caoh2", "lioh", "baoh2", "nh3", "nh4oh"].includes(formula)) {
    matched.push("Bazơ / Kiềm");
  }

  // 4. Oxy hóa / Nitrate
  if (
    text.includes("oxy hoa") ||
    text.includes("hypochlorite") ||
    text.includes("nitrate") ||
    text.includes("nitrite") ||
    text.includes("perchloric") ||
    text.includes("peroxit") ||
    text.includes("peroxide") ||
    ["h2o2", "kmno4", "k2cr2o7", "naclo", "hno3", "agno3", "nano2", "nh4no3"].includes(formula)
  ) {
    matched.push("Oxy hóa / Nitrate");
  }

  // 5. Dung môi / Hữu cơ
  if (
    text.includes("dung moi") ||
    text.includes("de chay") ||
    text.includes("solvent") ||
    text.includes("alcohol") ||
    text.includes("ether") ||
    text.includes("huu co") ||
    ["methanol", "ethanol", "acetone", "c6h6", "chcl3", "ccl4", "c6h5oh", "dcm", "diethyl_ether", "c2h5oh", "ch3oh", "ch3cooh"].includes(formula)
  ) {
    matched.push("Dung môi / Hữu cơ");
  }

  // 6. Kim loại / Đơn chất
  if (text.includes("kim loai") || text.includes("don chat") || ["mg", "zn", "al", "fe", "cu", "p", "s", "c", "na", "k", "ca"].includes(formula)) {
    matched.push("Kim loại / Đơn chất");
  }

  // 7. Muối vô cơ
  if (
    text.includes("muoi") ||
    text.includes("chloride") ||
    text.includes("sulfate") ||
    text.includes("carbonate") ||
    ["nacl", "cuso4", "agno3", "na2s", "nano2", "nh4no3", "caco3", "feso4"].includes(formula)
  ) {
    matched.push("Muối vô cơ");
  }

  // 8. Chất độc hại / Nguy hiểm cao
  if (
    text.includes("cuc ky doc") ||
    text.includes("nguy hiem cao") ||
    text.includes("cyanide") ||
    text.includes("ung thu") ||
    ["hcn", "kcn", "nacn", "hg", "pb", "as", "ccl4", "dcm"].includes(formula)
  ) {
    matched.push("Chất độc hại / Nguy hiểm cao");
  }

  if (matched.length === 0) {
    matched.push("Khác");
  }

  return Array.from(new Set(matched));
}

/**
 * Lấy danh sách TẤT CẢ các nhóm phân loại mà một chất thuộc về (hỗ trợ nhiều nhóm)
 */
export function getChemicalCategories(chem: {
  categories?: string[];
  category?: string;
  formula?: string;
  name?: string;
  properties?: string;
  msds?: string;
} | null | undefined): string[] {
  if (!chem) return ["Khác"];

  const set = new Set<string>();

  // 1. Đọc từ mảng categories
  if (Array.isArray(chem.categories) && chem.categories.length > 0) {
    chem.categories.forEach(c => {
      if (typeof c === 'string' && c.trim()) {
        c.split(/[,;/|]/).forEach(sub => {
          const t = sub.trim();
          if (t) set.add(t);
        });
      }
    });
  }

  // 2. Đọc từ chuỗi category (hỗ trợ phân tách dấu phẩy hoặc chấm phẩy)
  if (chem.category && typeof chem.category === 'string' && chem.category.trim()) {
    chem.category.split(/[,;/|]/).forEach(sub => {
      const t = sub.trim();
      if (t) set.add(t);
    });
  }

  // Nếu có nhóm chỉ định rõ ràng thì trả về
  if (set.size > 0) {
    return Array.from(set);
  }

  // Nếu chưa có, tự động nhận diện thông minh
  return detectChemicalCategories(chem);
}

/**
 * Lấy chuỗi đại diện nhóm phân loại (tương thích ngược)
 */
export function getChemicalCategory(chem: {
  categories?: string[];
  category?: string;
  formula?: string;
  name?: string;
  properties?: string;
  msds?: string;
}): string {
  const cats = getChemicalCategories(chem);
  return cats.join(', ') || 'Khác';
}

const CUSTOM_CHEM_KEY = "chemsafe_custom_chemicals";

export function getCustomChemicals(): Chemical[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CHEM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBaseChemical(formula: string): boolean {
  const target = compactFormula(formula);
  return BASE_CHEMICALS.some(b => compactFormula(b.formula) === target);
}

export function saveCustomChemical(chem: Chemical): void {
  const current = getCustomChemicals();
  const filtered = current.filter(c => compactFormula(c.formula) !== compactFormula(chem.formula));
  const categories = getChemicalCategories(chem);
  const normalized: Chemical = {
    ...chem,
    categories,
    category: categories.join(', ')
  };
  filtered.push(normalized);
  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(filtered));

  categories.forEach(cat => {
    if (cat && cat !== 'Khác') saveNewCategory(cat);
  });
}

export function updateChemical(originalFormula: string, updatedChem: Chemical): void {
  const originalKey = compactFormula(originalFormula);
  const current = getCustomChemicals();
  const filtered = current.filter(
    c => compactFormula(c.formula) !== originalKey && compactFormula(c.formula) !== compactFormula(updatedChem.formula)
  );
  
  const wasBase = isBaseChemical(originalFormula);
  const categories = getChemicalCategories(updatedChem);
  filtered.push({
    ...updatedChem,
    categories,
    category: categories.join(', '),
    isEdited: wasBase,
    custom: !wasBase
  });

  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(filtered));

  categories.forEach(cat => {
    if (cat && cat !== 'Khác') saveNewCategory(cat);
  });
}

const DELETED_BASE_KEY = "chemsafe_deleted_base_chemicals";

export function getDeletedBaseChemicalKeys(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_BASE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedBaseChemicalKeys(keys: string[]): void {
  try {
    localStorage.setItem(DELETED_BASE_KEY, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

export function deleteChemical(formula: string): void {
  const targetKey = compactFormula(formula);
  // 1. If it's a custom chemical or edited chemical, remove from custom list
  const currentCustoms = getCustomChemicals().filter(c => compactFormula(c.formula) !== targetKey);
  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(currentCustoms));

  // 2. If it's a base chemical, add to deleted base chemicals so it won't appear
  if (isBaseChemical(formula)) {
    const deleted = getDeletedBaseChemicalKeys();
    if (!deleted.includes(targetKey)) {
      deleted.push(targetKey);
      saveDeletedBaseChemicalKeys(deleted);
    }
  }
}

/**
 * Bulk delete chemicals by formulas or keys
 */
export function deleteMultipleChemicals(formulas: string[]): { deletedCustomCount: number; deletedBaseCount: number } {
  const targetKeys = new Set(formulas.map(f => compactFormula(f)));
  
  // 1. Remove from custom
  const currentCustoms = getCustomChemicals();
  const keptCustoms = currentCustoms.filter(c => !targetKeys.has(compactFormula(c.formula)));
  const deletedCustomCount = currentCustoms.length - keptCustoms.length;
  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(keptCustoms));

  // 2. Add to deleted base list if matched
  const deletedBases = new Set(getDeletedBaseChemicalKeys());
  let deletedBaseCount = 0;
  targetKeys.forEach(key => {
    if (BASE_CHEMICALS.some(b => compactFormula(b.formula) === key)) {
      if (!deletedBases.has(key)) {
        deletedBases.add(key);
        deletedBaseCount++;
      }
    }
  });
  saveDeletedBaseChemicalKeys(Array.from(deletedBases));

  return { deletedCustomCount, deletedBaseCount };
}

/**
 * Restore all deleted default chemicals
 */
export function restoreAllDeletedChemicals(): void {
  localStorage.removeItem(DELETED_BASE_KEY);
}

export function resetChemicalToDefault(formula: string): void {
  const targetKey = compactFormula(formula);
  const current = getCustomChemicals().filter(c => compactFormula(c.formula) !== targetKey);
  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(current));

  // Also remove from deleted base keys if present
  const deleted = getDeletedBaseChemicalKeys().filter(k => k !== targetKey);
  saveDeletedBaseChemicalKeys(deleted);
}

export function deleteCustomChemical(formula: string): void {
  deleteChemical(formula);
}

export function getAllChemicals(): Chemical[] {
  const customs = getCustomChemicals();
  const deletedBaseKeys = new Set(getDeletedBaseChemicalKeys());
  const customMap = new Map<string, Chemical>();
  customs.forEach(c => {
    const cats = getChemicalCategories(c);
    customMap.set(compactFormula(c.formula), {
      ...c,
      categories: cats,
      category: cats.join(', ')
    });
  });

  const merged = BASE_CHEMICALS
    .filter(c => !deletedBaseKeys.has(compactFormula(c.formula)))
    .map(c => {
      const cf = compactFormula(c.formula);
      if (customMap.has(cf)) {
        const custom = customMap.get(cf)!;
        customMap.delete(cf);
        // Bản đã sửa vẫn nhận mã tra cứu + chương trình học chuẩn nếu người dùng để trống
        return {
          ...custom,
          pubChemCid: custom.pubChemCid || c.pubChemCid,
          icscId: custom.icscId || c.icscId,
          cameoId: custom.cameoId || c.cameoId,
          curriculum: c.curriculum,
          icscNote: c.icscNote,
          isEdited: true
        };
      }
      const cats = getChemicalCategories(c);
      return {
        ...c,
        categories: cats,
        category: cats.join(', ')
      };
    });

  const remainingCustoms = Array.from(customMap.values()).map(c => ({
    ...c,
    custom: true
  }));

  return [...merged, ...remainingCustoms];
}

export function bulkImportChemicals(
  incomingList: Chemical[],
  overwriteAll = false
): { addedCount: number; updatedCount: number } {
  const current = overwriteAll ? [] : getCustomChemicals();
  const currentMap = new Map<string, Chemical>();
  current.forEach(c => currentMap.set(compactFormula(c.formula), c));

  let addedCount = 0;
  let updatedCount = 0;

  incomingList.forEach(incoming => {
    if (!incoming.formula || !incoming.name) return;
    const cf = compactFormula(incoming.formula);
    const wasBase = isBaseChemical(incoming.formula);
    const exists = currentMap.has(cf);

    if (exists) {
      updatedCount++;
    } else {
      addedCount++;
    }

    const categories = getChemicalCategories(incoming);

    currentMap.set(cf, {
      ...incoming,
      key: incoming.key || cf,
      categories,
      category: categories.join(', '),
      isEdited: wasBase,
      custom: !wasBase
    });

    // Tự động đăng ký tất cả các nhóm phân loại mới vào kho nhóm
    categories.forEach(cat => {
      if (cat && cat.trim() && cat.trim() !== 'Khác') {
        saveNewCategory(cat.trim());
      }
    });
  });

  const updatedCustoms = Array.from(currentMap.values());
  localStorage.setItem(CUSTOM_CHEM_KEY, JSON.stringify(updatedCustoms));

  return { addedCount, updatedCount };
}
