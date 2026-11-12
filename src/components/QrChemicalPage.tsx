import React, { useEffect, useMemo } from 'react';
import type { Chemical, DangerLevel } from '../types/chemical';
import { BASE_CHEMICALS, getAllChemicals, getChemicalCategory, compactFormula } from '../data/chemicals';
import { formatCurriculum, curriculumLevel, pubChemUrl, icscUrl, cameoUrl } from '../data/chemicalRefs';
import { findIncompatibilitiesFor, MIX_WARNINGS } from '../data/mixWarnings';
import type { QrPayload } from '../utils/qrLink';

/**
 * Trang riêng mở ra khi quét mã QR trên nhãn chai hóa chất.
 * Nền trắng, dễ đọc trên điện thoại, gồm: thông tin cơ bản, thông tin an toàn,
 * chương trình học, liên kết PubChem (nguồn thông tin) và ICSC (nguồn an toàn).
 */

const DANGER_STYLE: Record<DangerLevel, { label: string; bg: string; border: string }> = {
  safe: { label: 'AN TOÀN', bg: '#059669', border: '#059669' },
  caution: { label: 'THẬN TRỌNG', bg: '#d97706', border: '#d97706' },
  danger: { label: 'NGUY HIỂM', bg: '#e11d48', border: '#e11d48' },
  extreme: { label: 'CỰC KỲ NGUY HIỂM', bg: '#0f172a', border: '#0f172a' },
};

function findChemical(payload: QrPayload): Chemical | null {
  const pool = (() => {
    try { return getAllChemicals(); } catch { return BASE_CHEMICALS; }
  })();
  if (payload.chem) {
    // Ưu tiên dữ liệu gốc đã kiểm chứng (có trên mọi điện thoại)
    const base = BASE_CHEMICALS.find(c => c.key === payload.chem);
    if (base) return base;
    const local = pool.find(c => c.key === payload.chem);
    if (local) return local;
  }
  if (payload.formula) {
    const cf = compactFormula(payload.formula);
    return BASE_CHEMICALS.find(c => compactFormula(c.formula) === cf)
      || pool.find(c => compactFormula(c.formula) === cf)
      || null;
  }
  return null;
}

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) =>
  value ? (
    <div style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ width: 120, flexShrink: 0, color: '#64748b', fontSize: 13 }}>{label}</div>
      <div style={{ flex: 1, color: '#0f172a', fontSize: 14, lineHeight: 1.5 }}>{value}</div>
    </div>
  ) : null;

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginTop: 14, boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}>
    <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span aria-hidden>{icon}</span>{title}
    </h2>
    {children}
  </section>
);

const SourceLink: React.FC<{ href: string; title: string; sub: string; color: string }> = ({ href, title, sub, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    style={{ display: 'block', textDecoration: 'none', border: `1px solid ${color}55`, background: `${color}0f`, borderRadius: 10, padding: '10px 12px', marginTop: 8 }}
  >
    <div style={{ color, fontWeight: 700, fontSize: 14 }}>{title} ↗</div>
    <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{sub}</div>
  </a>
);

export const QrChemicalPage: React.FC<{ payload: QrPayload; appUrl: string }> = ({ payload, appUrl }) => {
  const chem = useMemo(() => findChemical(payload), [payload]);

  // Trang QR luôn nền trắng, bất kể giao diện sáng/tối của ứng dụng
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    document.title = `${chem?.formula || payload.formula || 'Hóa chất'} — ChemSafe AI`;
    return () => { document.body.style.backgroundColor = prev; };
  }, [chem, payload.formula]);

  const name = chem?.name || payload.name || 'Hóa chất chưa xác định';
  const formula = chem?.formula || payload.formula || '???';
  const danger: DangerLevel = chem?.danger || payload.danger || 'caution';
  const style = DANGER_STYLE[danger];

  const incompatibles = useMemo(() => {
    if (!chem) return [];
    const keys = BASE_CHEMICALS.map(c => c.key);
    return findIncompatibilitiesFor(chem.key, keys).map(({ otherKey, warning }) => ({
      other: BASE_CHEMICALS.find(c => c.key === otherKey),
      warning,
    }));
  }, [chem]);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 14px 40px' }}>
        {/* Thẻ tiêu đề */}
        <header style={{ border: `3px solid ${style.border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ background: style.bg, color: '#ffffff', padding: '18px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{formula}</div>
            <div style={{ fontSize: 16, marginTop: 4, opacity: 0.95 }}>{name}</div>
            <div style={{ display: 'inline-block', marginTop: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.28)', fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
              {chem?.dangerLabel || style.label}
            </div>
          </div>
          {(payload.location || payload.contact) && (
            <div style={{ background: '#f8fafc', padding: '10px 16px', fontSize: 13 }}>
              {payload.location && <div>📍 <b>Vị trí lưu trữ:</b> {payload.location}</div>}
              {payload.contact && <div style={{ marginTop: 4 }}>☎️ <b>Liên hệ khẩn cấp:</b> {payload.contact}</div>}
              {payload.date && <div style={{ marginTop: 4, color: '#64748b' }}>Ngày dán nhãn: {payload.date}</div>}
            </div>
          )}
        </header>

        {/* 1. Thông tin cơ bản */}
        <Section title="Thông tin cơ bản" icon="🧪">
          <Row label="Tên gọi" value={name} />
          <Row label="Công thức" value={<span style={{ fontFamily: "'Space Mono', monospace" }}>{formula}</span>} />
          {chem?.aliases?.length ? <Row label="Tên khác" value={chem.aliases.join(', ')} /> : null}
          <Row label="Khối lượng mol" value={chem?.molar} />
          <Row label="Nhiệt độ sôi" value={chem?.boiling} />
          <Row label="pH" value={chem?.ph} />
          <Row label="Nhóm" value={chem ? getChemicalCategory(chem) : undefined} />
          <Row label="Tính chất" value={chem?.properties} />
        </Section>

        {/* 2. Thông tin an toàn */}
        <Section title="Thông tin an toàn" icon="⚠️">
          <Row label="Mức nguy hiểm" value={<b style={{ color: style.bg }}>{chem?.dangerLabel || style.label}</b>} />
          <Row label="Cảnh báo" value={chem?.msds || payload.notes} />
          <Row label="Bảo hộ (PPE)" value={chem?.ppe} />
          <Row label="Sơ cứu" value={chem?.firstAid} />
          <Row label="Lưu trữ" value={chem?.storage} />
          {incompatibles.length > 0 && (
            <div style={{ paddingTop: 10 }}>
              <div style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>Tuyệt đối không để gần / không trộn với (bấm để xem cặp trên CAMEO Chemicals):</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {incompatibles.map(({ other, warning }, i) => {
                  const chipStyle: React.CSSProperties = { fontSize: 12, padding: '3px 8px', borderRadius: 6, border: `1px solid ${warning.level === 'danger' ? '#fda4af' : '#fcd34d'}`, background: warning.level === 'danger' ? '#fff1f2' : '#fffbeb', color: '#0f172a', textDecoration: 'none' };
                  const label = <>{other?.formula || '?'} {warning.verified === false ? '(chưa xác nhận)' : ''}</>;
                  return warning.cameoPair ? (
                    <a key={i} href={warning.cameoPair.url} target="_blank" rel="noopener noreferrer" title={`${warning.title} — xem cặp này trên CAMEO Chemicals`} style={chipStyle}>
                      {label} ↗
                    </a>
                  ) : (
                    <span key={i} title={warning.title} style={chipStyle}>{label}</span>
                  );
                })}
              </div>
            </div>
          )}
          {!chem && (
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 10 }}>
              Chất này không có trong bộ dữ liệu gốc của ChemSafe AI. Thông tin trên lấy từ nhãn; hãy đối chiếu SDS của nhà sản xuất.
            </p>
          )}
        </Section>

        {/* 3. Chương trình học */}
        <Section title="Thuộc chương trình học" icon="🎓">
          {chem?.curriculum ? (
            <>
              <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontWeight: 700, fontSize: 13 }}>
                {curriculumLevel(chem.curriculum)}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 14 }}>{formatCurriculum(chem.curriculum)}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>Theo Chương trình GDPT 2018 môn KHTN (THCS) và Hóa học (THPT).</p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>Chưa có thông tin phân loại theo lớp cho chất này.</p>
          )}
        </Section>

        {/* 4. Nguồn tra cứu quốc tế */}
        <Section title="Nguồn thông tin xác thực" icon="🔗">
          {chem?.pubChemCid ? (
            <SourceLink
              href={pubChemUrl(chem.pubChemCid)}
              title={`PubChem – CID ${chem.pubChemCid}`}
              sub="Nguồn thông tin cơ bản (NIH, Hoa Kỳ): danh pháp, cấu trúc, tính chất, GHS."
              color="#0369a1"
            />
          ) : (
            <SourceLink
              href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(formula)}`}
              title="Tìm trên PubChem"
              sub="Chưa có mã CID xác định – tìm theo công thức trên PubChem."
              color="#0369a1"
            />
          )}
          {chem?.icscId ? (
            <SourceLink
              href={icscUrl(chem.icscId)}
              title={`Thẻ ICSC ${chem.icscId}`}
              sub={`Thẻ An toàn Hóa chất Quốc tế (ILO/WHO): nguy cơ, phòng ngừa, sơ cứu, xử lý tràn đổ.${chem.icscNote ? ' ' + chem.icscNote : ''}`}
              color="#b91c1c"
            />
          ) : (
            <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: '#f1f5f9', fontSize: 13, color: '#475569' }}>
              <b>Không có thẻ ICSC</b> cho chất này{chem?.icscNote ? ` – ${chem.icscNote}` : ''}. Tham khảo mục an toàn (LCSS/GHS) trên PubChem.
            </div>
          )}
          {chem?.cameoId && (
            <SourceLink
              href={cameoUrl(chem.cameoId)}
              title={`CAMEO Chemicals #${chem.cameoId}`}
              sub="NOAA: phản ứng nguy hiểm và tương kỵ hóa học."
              color="#7c3aed"
            />
          )}
        </Section>

        <p style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>
          Thông tin tham khảo phục vụ giáo dục, không thay thế SDS của nhà sản xuất.<br />
          Dữ liệu tương kỵ: {Object.keys(MIX_WARNINGS).length} cặp, đối chiếu CAMEO Chemicals / ICSC.
        </p>
      </div>
    </div>
  );
};
