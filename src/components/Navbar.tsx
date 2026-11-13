import React from 'react';
import { ActiveTab } from '../types/chemical';
import { AlertTriangle, QrCode, Database, Box, Calculator, ShieldCheck, MapPin, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenQuickAdd
}) => {
  const { theme, toggleTheme } = useTheme();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'warning', label: 'Cảnh báo trộn', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'qr', label: 'Tạo nhãn QR', icon: <QrCode className="w-4 h-4" /> },
    { id: 'database', label: 'Cơ sở dữ liệu', icon: <Database className="w-4 h-4" /> },
    { id: 'inventory', label: 'Kho hóa chất', icon: <Box className="w-4 h-4" /> },
    { id: 'labmap', label: 'Sơ đồ phòng lab', icon: <MapPin className="w-4 h-4" /> },
    { id: 'calc', label: 'Pha chế & Nồng độ', icon: <Calculator className="w-4 h-4" /> },
    { id: 'advisor', label: 'Sơ cứu & Tra cứu', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1f2633] bg-[#0c0f14]/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between gap-4 md:gap-8">
      {/* Zone 1: Single text element wordmark */}
      <div 
        onClick={() => onSelectTab('warning')}
        className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-base transition-colors group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50">
          ⬡
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap">
            ChemSafe <span className="text-emerald-400 font-mono font-bold">AI</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Lab Safety System</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto py-0.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151a24] border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions & Theme Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          aria-label="Toggle dark/light theme"
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#171d28] border border-[#262f3d] transition-all flex items-center justify-center group"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-sky-500 group-hover:-rotate-12 transition-transform" />
          )}
        </button>

        <button
          onClick={onOpenQuickAdd}
          className="px-3.5 py-1.5 text-xs font-medium font-mono text-[#0a0c10] bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-md transition-all whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Nhập vào kho</span>
        </button>
      </div>
    </header>
  );
};

