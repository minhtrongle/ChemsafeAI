import type { Chemical, EmergencyProtocol, SafetyKnowledge } from '../types/chemical';
import { compactFormula, matchesPhrase } from '../data/chemicals';

/**
 * Tìm kiếm an toàn theo 3 tầng ưu tiên (tầng 4 – PubChem – nằm trong SafetyAdvisor vì cần mạng).
 * Mọi phép so khớp đều theo TỪ nguyên vẹn (matchesPhrase), không theo "chứa chuỗi con".
 */
export function findProtocol(text: string, protocols: EmergencyProtocol[]): EmergencyProtocol | undefined {
  return protocols.find(p =>
    matchesPhrase(text, p.title) || (p.keywords || []).some(k => matchesPhrase(text, k))
  );
}

export function findKnowledge(text: string, knowledge: SafetyKnowledge[]): SafetyKnowledge | undefined {
  return knowledge.find(k =>
    matchesPhrase(text, k.title) || (k.keywords || []).some(kw => matchesPhrase(text, kw))
  );
}

export function findChemical(text: string, chemicals: Chemical[]): Chemical | undefined {
  return chemicals.find(c => {
    const nameMain = c.name.replace(/\(.*?\)/g, ' ');
    const candidates = [c.key, compactFormula(c.formula), c.name, nameMain, ...(c.aliases || [])];
    return candidates.some(cand => matchesPhrase(text, cand));
  });
}
