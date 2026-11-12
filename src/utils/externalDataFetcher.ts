import { Chemical, DangerLevel } from '../types/chemical';
import { detectChemicalCategories, compactFormula } from '../data/chemicals';

export interface PubChemLookupResult {
  cid: number;
  formula: string;
  name: string;
  iupacName?: string;
  molarMass?: number;
  molarStr?: string;
  safetySummary?: string;
  ghsHazardCodes?: string[];
  pubchemUrl: string;
  wikipediaUrl: string;
  sigmaUrl: string;
  chemSpiderUrl: string;
}

/**
 * Tra cứu thông tin hóa chất trực tiếp từ PubChem REST API (National Library of Medicine / NIH)
 */
export async function lookupPubChem(query: string): Promise<PubChemLookupResult> {
  const cleanQ = query.trim();
  if (!cleanQ) {
    throw new Error('Vui lòng nhập tên hoặc công thức hóa chất cần tra cứu.');
  }

  // 1. Tìm kiếm CID qua Name hoặc Formula
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cleanQ)}/cids/JSON`;
  let cid: number | null = null;

  try {
    const res = await fetch(searchUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.IdentifierList?.CID?.length > 0) {
        cid = data.IdentifierList.CID[0];
      }
    }
  } catch (err) {
    console.warn('PubChem by name failed, trying formula lookup...', err);
  }

  // Nếu không tìm thấy bằng name, thử tìm bằng formula
  if (!cid) {
    try {
      const formulaUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/fastformula/${encodeURIComponent(cleanQ)}/cids/JSON`;
      const res = await fetch(formulaUrl);
      if (res.ok) {
        const data = await res.json();
        if (data?.IdentifierList?.CID?.length > 0) {
          cid = data.IdentifierList.CID[0];
        }
      }
    } catch (err) {
      console.warn('PubChem by fastformula failed...', err);
    }
  }

  if (!cid) {
    throw new Error(`Không tìm thấy hợp chất phù hợp cho "${cleanQ}" trên cơ sở dữ liệu PubChem NIH.`);
  }

  // 2. Lấy thông số tính chất (MolecularFormula, MolecularWeight, IUPACName, Title)
  const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,Title/JSON`;
  let formula = cleanQ;
  let name = cleanQ;
  let iupacName = '';
  let molarMass: number | undefined;

  try {
    const propRes = await fetch(propUrl);
    if (propRes.ok) {
      const propData = await propRes.json();
      const props = propData?.PropertyTable?.Properties?.[0];
      if (props) {
        if (props.MolecularFormula) formula = props.MolecularFormula;
        if (props.Title) name = props.Title;
        if (props.IUPACName) iupacName = props.IUPACName;
        if (props.MolecularWeight) {
          molarMass = parseFloat(String(props.MolecularWeight));
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy properties từ PubChem:', err);
  }

  // 3. Lấy thông tin an toàn tóm tắt GHS / Hazard nếu có
  let safetySummary = '';
  const ghsCodes: string[] = [];
  try {
    const descUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`;
    const descRes = await fetch(descUrl);
    if (descRes.ok) {
      const descData = await descRes.json();
      const descList = descData?.InformationList?.Information || [];
      const firstDesc = descList.find((d: any) => d.Description && d.Description.length > 20);
      if (firstDesc) {
        safetySummary = firstDesc.Description;
      }
    }
  } catch {
    // ignore
  }

  const encodedTerm = encodeURIComponent(formula || name);

  return {
    cid,
    formula,
    name: name || iupacName || cleanQ,
    iupacName,
    molarMass,
    molarStr: molarMass ? `${molarMass} g/mol` : undefined,
    safetySummary,
    ghsHazardCodes: ghsCodes,
    pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
    wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(name || formula)}`,
    sigmaUrl: `https://www.sigmaaldrich.com/VN/en/search/${encodedTerm}?focus=products&page=1&perpage=30&sort=relevance&term=${encodedTerm}&type=product`,
    chemSpiderUrl: `https://www.chemspider.com/Search.aspx?q=${encodedTerm}`
  };
}

/**
 * Tải và phân tích dữ liệu hóa chất từ đường dẫn URL (JSON, CSV hoặc Google Sheets công khai)
 */
export async function fetchChemicalsFromUrl(inputUrl: string): Promise<{ items: Chemical[]; rawText: string; format: 'json' | 'csv' }> {
  let targetUrl = inputUrl.trim();
  if (!targetUrl) {
    throw new Error('Vui lòng nhập đường link URL hợp lệ.');
  }

  // Hỗ trợ tự động chuyển đổi link Google Sheets sang CSV Export
  if (targetUrl.includes('docs.google.com/spreadsheets')) {
    const sheetIdMatch = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch && sheetIdMatch[1]) {
      const sheetId = sheetIdMatch[1];
      const gidMatch = targetUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      targetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(targetUrl);
  } catch {
    // Nếu bị CORS chặn trực tiếp, thử qua proxy CORS công khai (allorigins)
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    res = await fetch(corsProxyUrl);
  }

  if (!res.ok) {
    throw new Error(`Không thể kết nối đến URL (${res.status} ${res.statusText}). Vui lòng kiểm tra quyền công khai.`);
  }

  const rawText = await res.text();
  const trimmed = rawText.trim();

  // Kiểm tra JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : parsed.chemicals || parsed.items || [];
      const validItems: Chemical[] = [];

      list.forEach((item: any, i: number) => {
        if (!item || (!item.formula && !item.name)) return;
        const formula = String(item.formula || item.Formula || item.congThuc || '').trim();
        const name = String(item.name || item.Name || item.ten || '').trim();
        if (!formula && !name) return;

        const rawDanger = String(item.danger || item.Danger || 'caution').toLowerCase().trim();
        const danger: DangerLevel = ['safe', 'caution', 'danger', 'extreme'].includes(rawDanger)
          ? (rawDanger as DangerLevel)
          : 'caution';

        const dangerLabelMap: Record<DangerLevel, string> = {
          safe: 'AN TOÀN',
          caution: 'THẬN TRỌNG',
          danger: 'NGUY HIỂM',
          extreme: 'CỰC KỲ NGUY HIỂM'
        };

        const cats = Array.isArray(item.categories)
          ? item.categories
          : item.category
          ? [String(item.category)]
          : detectChemicalCategories({ formula, name });

        validItems.push({
          key: item.key || compactFormula(formula) || `ext_${Date.now()}_${i}`,
          formula: formula || name,
          name: name || formula,
          danger,
          dangerLabel: item.dangerLabel || dangerLabelMap[danger],
          molar: item.molar || (item.molarMass ? `${item.molarMass} g/mol` : 'Chưa xác định'),
          molarMass: typeof item.molarMass === 'number' ? item.molarMass : parseFloat(String(item.molar || '').replace(',', '.')) || 0,
          boiling: item.boiling || item.boilingPoint || 'Chưa có dữ liệu',
          ph: item.ph || 'Chưa có dữ liệu',
          color: item.color || '#3b82f6',
          colorBg: item.colorBg || 'rgba(59,130,246,0.1)',
          properties: item.properties || 'Nhập từ liên kết trực tuyến ngoài.',
          msds: item.msds || 'Tham khảo tài liệu an toàn từ nguồn bên ngoài.',
          storage: item.storage || 'Bảo quản nơi khô ráo, thoáng mát.',
          categories: cats,
          category: cats.join(', '),
          sdsUrl: item.sdsUrl || item.sds_url || item.msdsUrl || undefined,
          pubChemCid: item.pubChemCid || item.pubchem_cid || item.cid || undefined,
          custom: true
        });
      });

      if (validItems.length === 0) {
        throw new Error('Dữ liệu JSON không chứa danh sách hóa chất hợp lệ (thiếu trường formula hoặc name).');
      }

      return { items: validItems, rawText, format: 'json' };
    } catch (jsonErr) {
      if ((jsonErr as Error).message.includes('không chứa danh sách')) throw jsonErr;
      // Không phải JSON, thử parse CSV tiếp tục
    }
  }

  // Parse CSV
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('File CSV không đủ dữ liệu (yêu cầu ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu).');
  }

  const validItems: Chemical[] = [];
  const headerLine = lines[0];
  const delimiter = headerLine.includes('\t') ? '\t' : headerLine.includes(';') ? ';' : ',';

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Simple regex splitter respecting quotes
    const cells: string[] = [];
    let insideQuote = false;
    let currentCell = '';

    for (let charIdx = 0; charIdx < row.length; charIdx++) {
      const c = row[charIdx];
      if (c === '"') {
        insideQuote = !insideQuote;
      } else if (c === delimiter && !insideQuote) {
        cells.push(currentCell.trim().replace(/^"|"$/g, ''));
        currentCell = '';
      } else {
        currentCell += c;
      }
    }
    cells.push(currentCell.trim().replace(/^"|"$/g, ''));

    if (cells.length >= 2) {
      const formula = cells[0]?.trim();
      const name = cells[1]?.trim();
      if (!formula && !name) continue;

      const rawDanger = (cells[2] || '').toLowerCase().trim();
      const danger: DangerLevel = ['safe', 'caution', 'danger', 'extreme'].includes(rawDanger)
        ? (rawDanger as DangerLevel)
        : 'caution';

      const dangerLabels: Record<DangerLevel, string> = {
        safe: 'AN TOÀN',
        caution: 'THẬN TRỌNG',
        danger: 'NGUY HIỂM',
        extreme: 'CỰC KỲ NGUY HIỂM'
      };

      const catsRaw = cells[3] ? cells[3].split(/[;,|/]/).map(c => c.trim()).filter(Boolean) : [];
      const cats = catsRaw.length > 0 ? catsRaw : detectChemicalCategories({ formula, name });

      const molarStr = cells[4] || 'Chưa xác định';
      const molarMass = parseFloat(molarStr.replace(',', '.')) || 0;
      const sdsUrl = cells[9] && cells[9].startsWith('http') ? cells[9].trim() : undefined;

      validItems.push({
        key: compactFormula(formula) || `csv_${Date.now()}_${i}`,
        formula: formula || name,
        name: name || formula,
        danger,
        dangerLabel: dangerLabels[danger],
        categories: cats,
        category: cats.join(', '),
        molar: molarStr.includes('g/mol') ? molarStr : molarMass > 0 ? `${molarMass} g/mol` : molarStr,
        molarMass,
        boiling: cells[5] || 'Chưa có dữ liệu',
        ph: cells[6] || 'Chưa có dữ liệu',
        properties: cells[7] || 'Nhập từ liên kết CSV ngoài.',
        msds: cells[8] || 'Tham khảo tài liệu an toàn từ nhà sản xuất.',
        storage: 'Bảo quản nơi khô ráo, đậy kín nắp.',
        color: '#3b82f6',
        colorBg: 'rgba(59,130,246,0.1)',
        sdsUrl,
        custom: true
      });
    }
  }

  if (validItems.length === 0) {
    throw new Error('Không phân tích được dòng hóa chất hợp lệ từ tệp CSV/Sheets. Vui lòng kiểm tra định dạng cột.');
  }

  return { items: validItems, rawText, format: 'csv' };
}

/**
 * Sinh các URL tra cứu trang web bên ngoài cho một hóa chất
 */
export function getExternalChemicalLinks(chem: Chemical): {
  pubchemUrl: string;
  wikipediaUrl: string;
  sigmaUrl: string;
  chemSpiderUrl: string;
  sdsSearchUrl: string;
} {
  const formula = chem.formula || '';
  const name = chem.name || '';
  const term = encodeURIComponent(formula || name);
  const nameTerm = encodeURIComponent(name || formula);

  const pubchemUrl = chem.pubChemCid
    ? `https://pubchem.ncbi.nlm.nih.gov/compound/${chem.pubChemCid}`
    : `https://pubchem.ncbi.nlm.nih.gov/#query=${term}`;

  const wikipediaUrl = `https://vi.wikipedia.org/w/index.php?search=${nameTerm}`;
  const sigmaUrl = `https://www.sigmaaldrich.com/VN/en/search/${term}?focus=products&page=1&perpage=30&sort=relevance&term=${term}&type=product`;
  const chemSpiderUrl = `https://www.chemspider.com/Search.aspx?q=${term}`;
  const sdsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${formula} ${name} SDS filetype:pdf`)}`;

  return {
    pubchemUrl,
    wikipediaUrl,
    sigmaUrl,
    chemSpiderUrl,
    sdsSearchUrl
  };
}
