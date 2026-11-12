import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { QrChemicalPage } from './components/QrChemicalPage.tsx';
import { parseQrParams } from './utils/qrLink.ts';

// Quét mã QR trên nhãn → URL có ?chem=... → hiển thị trang thông tin riêng (nền trắng)
const qrPayload = parseQrParams(window.location.search);
const appUrl = `${window.location.origin}${window.location.pathname}`;

createRoot(document.getElementById('root')!).render(
  qrPayload ? (
    <QrChemicalPage payload={qrPayload} appUrl={appUrl} />
  ) : (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  )
);
