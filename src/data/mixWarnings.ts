import type { MixWarning } from '../types/chemical';
import { toMixKey } from './mixKey';
import { getCameoPair } from './cameoPairs';

export const MIX_WARNINGS: Record<string, MixWarning> = {
  "hcl|naoh": {
    level: "danger",
    title: "Phản ứng trung hòa tỏa nhiệt dữ dội",
    reaction: "HCl + NaOH → NaCl + H₂O  (ΔH = -57.3 kJ/mol)",
    desc: "Phản ứng axit mạnh và bazơ mạnh tỏa nhiệt đột ngột. Ở nồng độ đặc có thể sôi bùng cục bộ làm bắn dung dịch kiềm và axit ăn mòn gây bỏng nặng.",
    tags: ["Tỏa nhiệt mạnh", "Bỏng ăn mòn", "Bắn dung dịch"]
  },
  "hcl|koh": {
    level: "danger",
    title: "Phản ứng trung hòa tỏa nhiệt dữ dội",
    reaction: "HCl + KOH → KCl + H₂O",
    desc: "Tương tự HCl + NaOH, nhiệt lượng giải phóng nhanh. Phải làm lạnh và bổ sung chậm.",
    tags: ["Tỏa nhiệt", "Ăn mòn", "Bắn hóa chất"]
  },
  "h2so4|naoh": {
    level: "danger",
    title: "Phản ứng trung hòa tỏa nhiệt mạnh, tăng nhiệt độ và áp suất",
    reaction: "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    desc: "H₂SO₄ đặc trộn với NaOH trong bình kín làm tăng nhiệt độ và áp suất (CAMEO Chemicals). Dung dịch có thể sôi và bắn ra, gây bỏng sâu và tổn thương mắt.",
    tags: ["Nhiệt cực cao", "Bắn axit", "Bỏng nặng"]
  },
  "h2so4|koh": {
    level: "danger",
    title: "Tỏa nhiệt dữ dội kèm nguy cơ nổ bình",
    reaction: "H₂SO₄ + 2KOH → K₂SO₄ + 2H₂O",
    desc: "Phản ứng tỏa nhiệt khủng khiếp có thể làm nứt vỡ bình thủy tinh nếu không được giải nhiệt liên tục bằng bể đá.",
    tags: ["Tỏa nhiệt cực độ", "Vỡ bình thí nghiệm"]
  },
  "naclo|hcl": {
    level: "danger",
    title: "SINH KHÍ CLO ĐỘC HẠI CHẾT NGƯỜI",
    reaction: "NaClO + 2HCl → Cl₂↑ + NaCl + H₂O",
    desc: "Phản ứng giải phóng ngay lập tức khí Clo (Cl₂) màu vàng lục cực độc. Khí này phá hủy niêm mạc phổi, gây co thắt phế quản và phù phổi cấp nguy hiểm tính mạng.",
    tags: ["Khí Cl₂ độc", "Nguy cơ tử vong", "Tuyệt đối không trộn"]
  },
  "naclo|h2so4": {
    level: "danger",
    title: "Phân hủy mãnh liệt giải phóng khí Clo",
    reaction: "NaClO + NaCl + H₂SO₄ → Na₂SO₄ + Cl₂↑ + H₂O  (nước Javel chứa sẵn NaCl)",
    desc: "Axit sulfuric đặc kích hoạt phân hủy hypochlorite, giải phóng lượng lớn khí clo độc và nhiệt lượng cao.",
    tags: ["Khí Clo", "Tỏa nhiệt", "Ăn mòn"]
  },
  "naclo|nh3": {
    level: "danger",
    title: "TẠO KHÍ MONOCHLORAMINE & DICHLORAMINE CỰC ĐỘC",
    reaction: "NH₃ + NaClO → NH₂Cl + NaOH (và NHCl₂, NCl₃)",
    desc: "Pha trộn nước Javel với dung dịch amoniac sinh ra các dẫn xuất cloramin và nitrogen trichloride (chất nổ nhạy). Hơi cloramin gây bỏng đường thở và tổn thương phổi nghiêm trọng.",
    tags: ["Chloramine độc", "Tổn thương phổi", "Nguy cơ nổ"]
  },
  "na2s|hcl": {
    level: "danger",
    title: "GIẢI PHÓNG KHÍ HYDRO SUNFUA (H₂S) CỰC ĐỘC",
    reaction: "Na₂S + 2HCl → 2NaCl + H₂S↑",
    desc: "Sulfide gặp axit lập tức giải phóng khí H₂S (mùi trứng thối ở nồng độ thấp). Ở nồng độ cao khí làm tê liệt khứu giác ngay lập tức và gây ngừng thở chỉ sau vài hơi hít.",
    tags: ["Khí H₂S", "Cực độc", "Nguy cơ ngạt mô"]
  },
  "na2s|h2so4": {
    level: "danger",
    title: "Giải phóng khí H₂S độc và tỏa nhiệt",
    reaction: "Na₂S + H₂SO₄ → Na₂SO₄ + H₂S↑",
    desc: "Khí H₂S độc hại thoát ra kèm nhiệt độ tăng cao của axit sulfuric đặc.",
    tags: ["Khí H₂S", "Tỏa nhiệt"]
  },
  "nano2|hcl": {
    level: "danger",
    title: "TẠO KHÍ OXIT NITƠ (NO, NO₂) NÂU ĐỎ ĐỘC HẠI",
    reaction: "2NaNO₂ + 2HCl → 2NaCl + NO↑ + NO₂↑ + H₂O",
    desc: "Axit hóa muối nitrite tạo khí NO₂ màu nâu đỏ. Khí này hòa tan trong dịch phổi tạo HNO₃ phá hủy phế nang, thường gây phù phổi muộn sau 6-24 giờ.",
    tags: ["Khí NO₂ độc", "Phù phổi muộn", "Cần tủ hút"]
  },
  "h2o2|acetone": {
    level: "danger",
    title: "NGUY CƠ TỔNG HỢP CHẤT NỔ TATP CỰC KỲ NGUY HIỂM",
    reaction: "3(CH₃)₂CO + 3H₂O₂ (xt acid) → TATP (Triacetone triperoxide)",
    desc: "Tạo thành TATP - chất nổ sơ cấp tự do peroxide cực kỳ nhạy nổ với ma sát, nhiệt và va đập. TUYỆT ĐỐI KHÔNG TRỘN HOẶC LƯU CHUNG.",
    tags: ["Chất nổ TATP", "Cấm tuyệt đối", "Cực kỳ nguy hiểm"]
  },
  "hno3|ethanol": {
    level: "danger",
    title: "NGUY CƠ CHÁY NỔ MÃNH LIỆT",
    reaction: "HNO₃ + C₂H₅OH → Các sản phẩm oxy hóa + NOx + Nguy cơ nổ",
    desc: "Axit nitric là chất oxy hóa mạnh gặp rượu dễ cháy gây phản ứng tự gia nhiệt bốc cháy và phát nổ bình chứa kín.",
    tags: ["Cháy nổ", "Oxy hóa mạnh", "Khí NOx"]
  },
  "hno3|methanol": {
    level: "danger",
    title: "Oxy hóa dữ dội - Nguy cơ nổ bình",
    reaction: "HNO₃ + CH₃OH → Phản ứng oxy hóa mãnh liệt",
    desc: "Tương tự ethanol nhưng tốc độ phản ứng với methanol còn nhanh hơn, sinh lượng lớn khí oxit nitơ độc hại.",
    tags: ["Nổ tức thì", "Khí độc", "Cấm trộn"]
  },
  "hno3|acetone": {
    level: "danger",
    title: "Phản ứng tỏa nhiệt bốc cháy không kiểm soát",
    reaction: "HNO₃ + CH₃COCH₃ → Phản ứng oxy hóa phá vỡ mạch cacbon",
    desc: "Dung môi acetone tiếp xúc HNO₃ đặc có thể tự sôi trào và bốc cháy dữ dội trong vài giây.",
    tags: ["Tự bốc cháy", "Trào axit"]
  },
  "h2so4|ethanol": {
    level: "danger",
    title: "Tỏa nhiệt mạnh và than hóa chất hữu cơ",
    reaction: "C₂H₅OH + H₂SO₄ đặc → C (than đen) + SO₂↑ + H₂O",
    desc: "Tính háo nước của H₂SO₄ tách nước mãnh liệt từ cồn, tỏa nhiệt làm sôi bùng và giải phóng khí SO₂ ngột ngạt.",
    tags: ["Than hóa", "Khí SO₂", "Bắn axit"]
  },
  "h2so4|methanol": {
    level: "danger",
    title: "Phản ứng tỏa nhiệt và bay hơi methanol độc",
    reaction: "H₂SO₄ + CH₃OH → Tỏa nhiệt mạnh làm sôi methanol",
    desc: "Hơi methanol độc hại bốc hơi nhanh chóng lan tỏa trong phòng thí nghiệm kèm rủi ro bắt lửa.",
    tags: ["Hơi độc methanol", "Dễ cháy"]
  },
  "h2so4|h2o2": {
    level: "danger",
    title: "DUNG DỊCH PIRANHA — OXY HÓA CỰC KỲ DỮ DỘI",
    reaction: "H₂SO₄ + H₂O₂ → H₂SO₅ (Caros acid) + H₂O",
    desc: "Tạo dung dịch Piranha có khả năng ăn mòn nổ tung mọi hợp chất hữu cơ. Bắn dính vào da sẽ phá hủy mô tức khắc. Chỉ được thao tác theo SOP chuyên biệt cao cấp.",
    tags: ["Dung dịch Piranha", "Ăn mòn cùng cực", "Nguy hiểm chết người"]
  },
  "kmno4|h2o2": {
    level: "danger",
    title: "Phản ứng phân hủy giải phóng Oxy sôi trào",
    reaction: "2KMnO₄ + 3H₂O₂ → 2MnO₂ + 2KOH + 3O₂↑ + 2H₂O",
    desc: "Giải phóng khí oxy cực nhanh kèm nhiệt độ cao, có thể gây nổ bình nếu đậy kín.",
    tags: ["Giải phóng khí O₂", "Tăng áp suất nổ"]
  },
  "hcl|kmno4": {
    level: "danger",
    title: "Điều chế khí Clo (Cl₂) độc hại",
    reaction: "2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O",
    desc: "Tạo một lượng rất lớn khí Clo độc hại. Chỉ được thực hiện trong tủ hút với hệ thống dẫn khí chuẩn mực.",
    tags: ["Sinh khí Clo", "Cần tủ hút"]
  },
  "cl2|nh3": {
    level: "danger",
    title: "Tạo khói amoni clorua và cloramin nổ",
    reaction: "3Cl₂ + 8NH₃ → N₂ + 6NH₄Cl  (hoặc tạo NCl₃ nhạy nổ)",
    desc: "Nếu dư Clo so với amoniac, sẽ tạo Nitrogen Trichloride (NCl₃) - chất lỏng màu vàng cực kỳ nhạy nổ khi tiếp xúc ánh sáng hoặc rung động nhẹ.",
    tags: ["NCl₃ chất nổ", "Khói kích ứng"]
  },
  "hcl|nh3": {
    level: "caution",
    title: "Tạo khói trắng Amoni Clorua dày đặc",
    reaction: "HCl (khí/hơi) + NH₃ (khí/hơi) → NH₄Cl (khói trắng)",
    desc: "Khói trắng muối amoni li ti lơ lửng gây cay mắt, ho dữ dội và kích ứng đường hô hấp. Phải làm việc trong tủ hút.",
    tags: ["Khói trắng", "Kích ứng đường thở"]
  },
  "hclo4|ethanol": {
    level: "danger",
    title: "NGUY CƠ PHÁT NỔ TỨC THÌ",
    reaction: "HClO₄ + C₂H₅OH → Ethyl perchlorate (chất nổ)",
    desc: "Tạo ester perchlorate cực kỳ không ổn định, nổ tung ngay cả khi chạm nhẹ.",
    tags: ["Nổ tức thì", "Cấm tuyệt đối"]
  },
  "hclo4|acetone": {
    level: "danger",
    title: "Nổ dữ dội khi tiếp xúc dung môi hữu cơ",
    reaction: "HClO₄ + Acetone → Phản ứng oxy hóa nổ",
    desc: "Axit perchloric đặc tiếp xúc xeton gây phát nổ mãnh liệt.",
    tags: ["Cháy nổ cực đại"]
  },
  "h2|o2": {
    level: "danger",
    title: "HỖN HỢP NỔ (KHÍ NỔ 2:1)",
    reaction: "2H₂ + O₂ → 2H₂O  (Nổ cực mạnh khi có tia lửa)",
    desc: "Tỷ lệ thể tích 2:1 là hỗn hợp nổ mạnh nhất, vận tốc sóng nổ đạt hơn 2800 m/s. Tránh xa mọi nguồn phát lửa và tĩnh điện.",
    tags: ["Hỗn hợp nổ", "Sóng xung kích"]
  },
  "h2s|cl2": {
    level: "danger",
    title: "Hai khí độc phản ứng sinh lưu huỳnh và axit",
    reaction: "H₂S + Cl₂ → 2HCl + S↓",
    desc: "Phản ứng tỏa nhiệt giữa hai khí độc hại, sinh ra khói axit HCl ăn mòn.",
    tags: ["Khí độc kép", "Khói axit HCl"]
  },
  "hcl|al": {
    level: "danger",
    title: "Sinh khí Hydro (H₂) dễ cháy nổ",
    reaction: "2Al + 6HCl → 2AlCl₃ + 3H₂↑",
    desc: "Kim loại nhôm phản ứng mãnh liệt giải phóng khí hydro dễ gây nổ nếu tích tụ trong bình kín.",
    tags: ["Khí Hydro dễ nổ", "Tăng áp suất"]
  },
  "naoh|al": {
    level: "danger",
    title: "Kiềm ăn mòn nhôm sinh khí Hydro (H₂)",
    reaction: "2Al + 2NaOH + 2H₂O → 2NaAlO₂ + 3H₂↑",
    desc: "Phản ứng tỏa nhiệt mạnh giải phóng lượng lớn khí H₂. Tuyệt đối không dùng dụng cụ chứa bằng nhôm để đựng xút.",
    tags: ["Hỏng bình nhôm", "Khí Hydro"]
  },
  "hcl|zn": {
    level: "danger",
    title: "Giải phóng khí Hydro dễ bắt cháy",
    reaction: "Zn + 2HCl → ZnCl₂ + H₂↑",
    desc: "Phản ứng sinh khí hydro liên tục, cần thông gió tốt và tránh tia lửa.",
    tags: ["Khí H₂"]
  },
  "hf|naoh": {
    level: "danger",
    title: "Tỏa nhiệt mạnh và nguy cơ bắn dung dịch Fluoride độc",
    reaction: "HF + NaOH → NaF + H₂O",
    desc: "Dung dịch bắn ra vẫn chứa ion F⁻ cực độc có khả năng hủy hoại mô và làm giảm canxi máu cấp tính.",
    tags: ["Độc tính HF", "Tỏa nhiệt", "Bỏng sâu"]
  },
  "k2cr2o7|h2so4": {
    level: "danger",
    title: "HỖN HỢP SULFOCHROMIC — CR(VI) OXY HÓA CỰC ĐỘC",
    reaction: "K₂Cr₂O₇ + H₂SO₄ → H₂Cr₂O₇ + K₂SO₄ (Dung dịch rửa kính cũ)",
    desc: "Tính oxy hóa cực mạnh và chứa Cr(VI) gây ung thư. Ăn mòn nặng và ô nhiễm môi trường thủy sinh vĩnh viễn.",
    tags: ["Cr(VI) ung thư", "Oxy hóa cực mạnh"]
  },
  "kmno4|ethanol": {
    level: "danger",
    title: "Chất oxy hóa mạnh tiếp xúc cồn dễ cháy",
    reaction: "KMnO₄ + C₂H₅OH → Tỏa nhiệt có thể tự bắt lửa",
    desc: "Dung dịch KMnO₄ đã axit hóa gặp ethanol có thể gây nổ (CAMEO Chemicals); tinh thể KMnO₄ khô tiếp xúc cồn có thể bốc cháy.",
    tags: ["Tự bốc cháy", "Oxy hóa"]
  },
  "diethyl_ether|h2o2": {
    level: "danger",
    title: "Hình thành Peroxide hữu cơ cực kỳ nhạy nổ",
    reaction: "Ether + H₂O₂ → Ete peroxit (R-O-O-R)",
    desc: "Peroxide ete kết tinh ở miệng nắp chai có thể phát nổ chỉ khi vặn mở nắp chai thủy tinh.",
    tags: ["Peroxide nhạy nổ", "Nổ khi vặn nắp"]
  },
  "kmno4|h2so4": {
    level: "danger",
    title: "Tạo Mn₂O₇ – chất oxi hóa cực mạnh, dễ nổ (với H₂SO₄ ĐẶC)",
    reaction: "2KMnO₄ + H₂SO₄ (đặc) → K₂SO₄ + Mn₂O₇ + H₂O",
    desc: "KMnO₄ rắn gặp H₂SO₄ đặc tạo Mn₂O₇ dạng dầu, có thể nổ khi gặp nhiệt hoặc chất hữu cơ. Lưu ý: dung dịch KMnO₄ trong H₂SO₄ LOÃNG dùng để chuẩn độ là thao tác bình thường.",
    tags: ["Chất oxi hóa cực mạnh", "Nguy cơ nổ", "Chỉ với axit đặc"]
  },
  "agno3|nh3": {
    level: "caution",
    title: "Dung dịch bạc–amoniac để lâu tạo hợp chất bạc dễ nổ",
    reaction: "AgNO₃ + 2NH₃ → [Ag(NH₃)₂]NO₃  (để lâu → bạc nitrua dễ nổ)",
    desc: "Thuốc thử tráng bạc (Tollens) chỉ được pha ngay trước khi dùng. Dung dịch để qua đêm hoặc bị khô có thể tạo kết tủa đen nhạy nổ. Dùng xong phải hủy ngay bằng axit loãng.",
    tags: ["Pha xong dùng ngay", "Không lưu trữ", "Kết tủa nhạy nổ"]
  },
  "nh4no3|zn": {
    level: "danger",
    title: "Bột kẽm + amoni nitrat: tự bốc cháy khi gặp vài giọt nước",
    reaction: "Zn + NH₄NO₃ → ZnO + N₂↑ + 2H₂O",
    desc: "Hỗn hợp bột kẽm và NH₄NO₃ phản ứng mãnh liệt, tỏa nhiệt và bốc cháy chỉ với một giọt nước. Không cất chung, không để bột kim loại gần muối nitrat.",
    tags: ["Tự bốc cháy", "Tỏa nhiệt mạnh", "Không cất chung"]
  }
};

// toMixKey (đưa mọi cách viết về cùng một khóa) nằm trong mixKey.ts; xuất lại ở đây để mã cũ vẫn import được.
export { toMixKey };

export function getMixKey(key1: string, key2: string): string | null {
  const k1 = toMixKey(key1);
  const k2 = toMixKey(key2);
  const a = `${k1}|${k2}`;
  const b = `${k2}|${k1}`;

  if (MIX_WARNINGS[a]) return a;
  if (MIX_WARNINGS[b]) return b;
  return null;
}

export function checkIncompatibility(key1: string, key2: string): MixWarning | null {
  const key = getMixKey(key1, key2);
  return key ? MIX_WARNINGS[key] : null;
}

export function findIncompatibilitiesFor(targetKey: string, allKeys: string[]): { otherKey: string; warning: MixWarning }[] {
  const compactTarget = toMixKey(targetKey);
  const results: { otherKey: string; warning: MixWarning }[] = [];

  for (const other of allKeys) {
    if (toMixKey(other) === compactTarget) continue;
    const warning = checkIncompatibility(targetKey, other);
    if (warning) {
      results.push({ otherKey: other, warning });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// NGUỒN XÁC NHẬN TƯƠNG KỴ (đối chiếu thủ công 11/2026)
// c = datasheet CAMEO Chemicals (NOAA), i = thẻ ICSC (ILO/WHO).
// verified: false → chưa tìm được nguồn nêu đích danh cặp này; giao diện gắn nhãn "Chưa xác nhận".
// ---------------------------------------------------------------------------
type Ref = ['c' | 'i', string, string];
const CAMEO = (id: string, name: string): Ref => ['c', id, name];
const ICSC = (id: string, name: string): Ref => ['i', id, name];

const C_HCL = CAMEO('3598', 'Hydrochloric acid');
const C_H2SO4 = CAMEO('5193', 'Sulfuric acid');
const C_HNO3 = CAMEO('19337', 'Nitric acid');
const C_NAOH = CAMEO('9073', 'Sodium hydroxide solution');
const C_KOH = CAMEO('9013', 'Potassium hydroxide solution');
const C_NH3 = CAMEO('4860', 'Ammonia, anhydrous');
const C_H2O2 = CAMEO('5023', 'Hydrogen peroxide');
const C_NACLO = CAMEO('4503', 'Sodium hypochlorite');
const C_NA2S = CAMEO('9084', 'Sodium sulfide');
const C_NANO2 = CAMEO('4511', 'Sodium nitrite');
const C_KMNO4 = CAMEO('4324', 'Potassium permanganate');
const C_ETOH = CAMEO('667', 'Ethanol');
const C_MEOH = CAMEO('3874', 'Methanol');
const C_ACETONE = CAMEO('8', 'Acetone');
const C_CL2 = CAMEO('2862', 'Chlorine');
const C_HCLO4 = CAMEO('1292', 'Perchloric acid 50–72%');
const C_H2 = CAMEO('8729', 'Hydrogen');
const C_O2 = CAMEO('8967', 'Oxygen');
const C_H2S = CAMEO('3625', 'Hydrogen sulfide');
const C_AL = CAMEO('14008', 'Aluminum powder');
const C_ZN = CAMEO('4814', 'Zinc dust');
const C_HF = CAMEO('5022', 'Hydrogen fluoride');
const C_AGNO3 = CAMEO('4443', 'Silver nitrate');
const C_NH4NO3 = CAMEO('98', 'Ammonium nitrate');

export const MIX_SOURCES: Record<string, { verified: boolean; evidence: string; refs: Ref[] }> = {
  'hcl|naoh': { verified: true, evidence: 'CAMEO (HCl): phản ứng mãnh liệt với natri hydroxit.', refs: [C_HCL, C_NAOH] },
  'hcl|koh': { verified: true, evidence: 'CAMEO (KOH): phản ứng tỏa nhiệt với mọi axit.', refs: [C_KOH, C_HCL] },
  'h2so4|naoh': { verified: true, evidence: 'CAMEO (H₂SO₄): trộn với NaOH trong bình kín làm tăng nhiệt độ và áp suất.', refs: [C_H2SO4, C_NAOH] },
  'h2so4|koh': { verified: true, evidence: 'CAMEO (KOH): phản ứng tỏa nhiệt với mọi axit.', refs: [C_KOH, C_H2SO4] },
  'naclo|hcl': { verified: true, evidence: 'CAMEO (NaClO): tiếp xúc với axit sinh khói clo rất độc.', refs: [C_NACLO, C_HCL] },
  'naclo|h2so4': { verified: true, evidence: 'CAMEO (NaClO): phản ứng với axit sulfuric sinh nhiệt và khí clo.', refs: [C_NACLO, C_H2SO4] },
  'naclo|nh3': { verified: true, evidence: 'CAMEO (NH₃, NaClO): trộn hypochlorite với amoniac tạo hơi NCl₃ độc, dễ nổ.', refs: [C_NH3, C_NACLO] },
  'na2s|hcl': { verified: true, evidence: 'CAMEO (Na₂S): tiếp xúc axit giải phóng khí H₂S rất độc, dễ cháy.', refs: [C_NA2S, C_HCL] },
  'na2s|h2so4': { verified: true, evidence: 'CAMEO (Na₂S): tiếp xúc axit giải phóng khí H₂S rất độc, dễ cháy.', refs: [C_NA2S, C_H2SO4] },
  'nano2|hcl': { verified: true, evidence: 'CAMEO (NaNO₂): phản ứng với axit tạo khí NO₂ độc.', refs: [C_NANO2, C_HCL] },
  'h2o2|acetone': { verified: true, evidence: 'CAMEO (H₂O₂): dung dịch >30% có thể kích nổ khi trộn với axeton, etanol.', refs: [C_H2O2, C_ACETONE] },
  'hno3|ethanol': { verified: true, evidence: 'CAMEO (HNO₃): bốc cháy khi tiếp xúc với ancol.', refs: [C_HNO3, C_ETOH] },
  'hno3|methanol': { verified: true, evidence: 'CAMEO (HNO₃): bốc cháy khi tiếp xúc với ancol.', refs: [C_HNO3, C_MEOH] },
  'hno3|acetone': { verified: true, evidence: 'ICSC 0087 (axeton): tiếp xúc chất oxi hóa mạnh như axit nitric tạo peroxit dễ nổ.', refs: [ICSC('0087', 'Acetone'), C_HNO3, C_ACETONE] },
  'h2so4|ethanol': { verified: false, evidence: 'Chưa tìm thấy nguồn CAMEO/ICSC nêu đích danh cặp H₂SO₄ + etanol (chỉ có cảnh báo khi có thêm H₂O₂ đặc hoặc chất oxi hóa). Xem các datasheet để tự đối chiếu.', refs: [C_H2SO4, C_ETOH] },
  'h2so4|methanol': { verified: true, evidence: 'ICSC 0057 (metanol): phản ứng mãnh liệt với axit và chất oxi hóa mạnh.', refs: [ICSC('0057', 'Methanol'), C_H2SO4, C_MEOH] },
  'h2so4|h2o2': { verified: false, evidence: 'Chưa tìm thấy nguồn CAMEO/ICSC nêu đích danh cặp H₂SO₄ + H₂O₂ (CAMEO chỉ nêu hỗn hợp có thêm ancol). Xem các datasheet để tự đối chiếu.', refs: [C_H2O2, C_H2SO4] },
  'kmno4|h2o2': { verified: true, evidence: 'CAMEO (KMnO₄): nguy hiểm khi tiếp xúc H₂O₂ đặc.', refs: [C_KMNO4, C_H2O2] },
  'hcl|kmno4': { verified: true, evidence: 'ICSC 0163 (HCl): phản ứng mãnh liệt với chất oxi hóa mạnh, sinh khí clo độc; KMnO₄ là chất oxi hóa mạnh (ICSC 0672). CAMEO không nêu đích danh cặp này.', refs: [ICSC('0163', 'Hydrogen chloride'), C_KMNO4, C_HCL] },
  'kmno4|ethanol': { verified: true, evidence: 'CAMEO (KMnO₄): dung dịch có axit trộn với etanol có thể gây nổ.', refs: [C_KMNO4, C_ETOH] },
  'kmno4|h2so4': { verified: true, evidence: 'CAMEO (H₂SO₄): trộn với KMnO₄ tinh thể tạo Mn₂O₇, nổ ở ~70 °C.', refs: [C_H2SO4, C_KMNO4] },
  'cl2|nh3': { verified: true, evidence: 'CAMEO (Cl₂, NH₃): clo dư trộn với amoniac khi ấm có thể nổ/bốc cháy.', refs: [C_CL2, C_NH3] },
  'hcl|nh3': { verified: true, evidence: 'CAMEO (NH₃): phản ứng tỏa nhiệt với mọi axit; CAMEO (HCl): phản ứng mãnh liệt với amoni hydroxit.', refs: [C_NH3, C_HCL] },
  'hclo4|ethanol': { verified: true, evidence: 'CAMEO (HClO₄): có thể phản ứng mãnh liệt/cháy với chất dễ oxi hóa, kể cả ancol.', refs: [C_HCLO4, C_ETOH] },
  'hclo4|acetone': { verified: true, evidence: 'ICSC 1006 (HClO₄): phản ứng mãnh liệt với chất hữu cơ, chất cháy được; CAMEO nêu chung "chất dễ oxi hóa".', refs: [ICSC('1006', 'Perchloric acid'), C_HCLO4, C_ACETONE] },
  'h2|o2': { verified: true, evidence: 'CAMEO (H₂): tạo hỗn hợp nổ với không khí (4–75%); CAMEO (O₂): oxi với nhiên liệu dễ nổ.', refs: [C_H2, C_O2] },
  'h2s|cl2': { verified: true, evidence: 'ICSC 0165 / CAMEO (H₂S): không tương thích với chất oxi hóa mạnh; Cl₂ là chất oxi hóa mạnh (ICSC 0126).', refs: [ICSC('0165', 'Hydrogen sulfide'), C_H2S, C_CL2] },
  'hcl|al': { verified: true, evidence: 'CAMEO (HCl): phản ứng với kim loại như nhôm giải phóng H₂ dễ cháy.', refs: [C_HCL, C_AL] },
  'naoh|al': { verified: true, evidence: 'CAMEO (NaOH): ăn mòn nhôm, sinh khí H₂.', refs: [C_NAOH, C_AL] },
  'hcl|zn': { verified: true, evidence: 'CAMEO (bột Zn): tiếp xúc axit tạo H₂, nhiệt đủ làm bốc cháy H₂.', refs: [C_ZN, C_HCL] },
  'hf|naoh': { verified: true, evidence: 'CAMEO (HF): phản ứng tỏa nhiệt với bazơ (hydroxit vô cơ); ICSC 0283 nêu phản ứng mãnh liệt với bazơ.', refs: [C_HF, C_NAOH] },
  'k2cr2o7|h2so4': { verified: false, evidence: 'Chưa tìm thấy nguồn nêu đích danh K₂Cr₂O₇ + H₂SO₄ (CAMEO chỉ nêu hỗn hợp cromic này nguy hiểm khi có chất hữu cơ/ancol). Thẻ ICSC 1371: chất oxi hóa mạnh.', refs: [ICSC('1371', 'Potassium dichromate'), C_H2SO4] },
  'diethyl_ether|h2o2': { verified: true, evidence: 'ICSC 0355 (ete): phản ứng mãnh liệt với chất oxi hóa mạnh, tạo peroxit dễ nổ.', refs: [ICSC('0355', 'Diethyl ether'), C_H2O2] },
  'agno3|nh3': { verified: true, evidence: 'CAMEO (NH₃, AgNO₃): tạo bạc nitrua dễ nổ.', refs: [C_NH3, C_AGNO3] },
  'nh4no3|zn': { verified: true, evidence: 'CAMEO (bột Zn): trộn với NH₄NO₃ và chút nước phản ứng mãnh liệt.', refs: [C_ZN, C_NH4NO3] },
};

for (const [key, src] of Object.entries(MIX_SOURCES)) {
  const w = MIX_WARNINGS[key];
  if (!w) continue;
  w.verified = src.verified;
  w.evidence = src.evidence;
  w.sources = src.refs.map(([kind, id, name]) => kind === 'c'
    ? { label: `CAMEO Chemicals: ${name}`, url: `https://cameochemicals.noaa.gov/chemical/${id}` }
    : { label: `ICSC ${id}: ${name}`, url: `https://chemicalsafety.ilo.org/dyn/icsc/showcard.display?p_card_id=${id}&p_version=2&p_lang=en` });
}

// ---------------------------------------------------------------------------
// LIÊN KẾT CAMEO CỦA ĐÚNG CẶP (từ tuong_ky_hoa_chat_CAMEO.xlsx → cameoIncompatibilities.json)
// Mỗi cảnh báo có thêm nguồn đầu tiên trỏ thẳng tới trang "Reactivity – documentation" của cặp
// trên CAMEO Chemicals, để người dùng tự đối chiếu phản ứng chính xác.
// ---------------------------------------------------------------------------
for (const [key, w] of Object.entries(MIX_WARNINGS)) {
  const [a, b] = key.split('|');
  const pair = getCameoPair(a, b);
  if (!pair) continue;
  w.cameoPair = {
    url: pair.url,
    conclusion: pair.conclusion,
    hazardsVi: pair.hazardsVi,
    possibleGasesVi: pair.possibleGasesVi,
  };
  w.sources = [
    { label: `CAMEO Reactivity: ${pair.chemicalA} + ${pair.chemicalB}`, url: pair.url },
    ...(w.sources || []),
  ];
}

/** Liên kết CAMEO chung để tự tra cặp bất kỳ (công cụ "Predict Reactivity") */
export const CAMEO_REACTIVITY_URL = 'https://cameochemicals.noaa.gov/reactivity';
