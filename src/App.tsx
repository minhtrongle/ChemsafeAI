import React, { useState, useEffect } from 'react';
import { ActiveTab, Chemical, InventoryItem } from './types/chemical';
import { getAllChemicals } from './data/chemicals';
import { Navbar } from './components/Navbar';
import { WarningChecker } from './components/WarningChecker';
import { IncompatibilityList } from './components/IncompatibilityList';
import { LabelGenerator } from './components/LabelGenerator';
import { DatabaseBrowser } from './components/DatabaseBrowser';
import { InventoryManager } from './components/InventoryManager';
import { LabMap } from './components/LabMap';
import { SolutionCalculator } from './components/SolutionCalculator';
import { SafetyAdvisor } from './components/SafetyAdvisor';
import { getStoredInventory, saveStoredInventory } from './data/inventoryStore';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('warning');
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(() => getStoredInventory());
  const [selectedChemForQR, setSelectedChemForQR] = useState<Chemical | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [advisorInitialQuery, setAdvisorInitialQuery] = useState<string>('');

  const handleUpdateInventory = (newInv: InventoryItem[]) => {
    setInventory(newInv);
    saveStoredInventory(newInv);
  };

  const refreshChemicals = () => {
    setChemicals(getAllChemicals());
  };

  useEffect(() => {
    refreshChemicals();
  }, []);

  const handleSelectForWarning = (chem: Chemical) => {
    setActiveTab('warning');
  };

  const handleSelectForQR = (chem: Chemical) => {
    setSelectedChemForQR(chem);
    setActiveTab('qr');
  };

  const handlePrintQRFromInventory = (item: InventoryItem) => {
    // Convert inventory item to chemical format for label generator
    const mappedChem: Chemical = {
      key: item.formula.toLowerCase(),
      formula: item.formula,
      name: item.name,
      danger: item.danger,
      dangerLabel: item.danger.toUpperCase(),
      molar: 'Theo nhãn kho',
      molarMass: 0,
      boiling: 'N/A',
      ph: 'N/A',
      color: '#ff4757',
      colorBg: '',
      properties: item.notes,
      msds: item.hazardDetails,
      storage: item.location
    };
    setSelectedChemForQR(mappedChem);
    setActiveTab('qr');
  };

  const handleConsultAdvisor = (query: string) => {
    setAdvisorInitialQuery(query);
    setActiveTab('advisor');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#e8ecf2] flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar with Contract */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenQuickAdd={() => {
            setActiveTab('inventory');
            setIsQuickAddOpen(true);
          }}
        />
      </div>

      {/* Main Content Stage */}
      <main className="flex-1 w-full pb-12">
        {activeTab === 'warning' && (
          <WarningChecker
            chemicals={chemicals}
            onConsultAdvisor={handleConsultAdvisor}
            onNavigateToQR={handleSelectForQR}
          />
        )}

        {activeTab === 'pairs' && <IncompatibilityList />}

        {activeTab === 'qr' && (
          <LabelGenerator
            initialChemical={selectedChemForQR}
            chemicals={chemicals}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseBrowser
            chemicals={chemicals}
            onRefreshChemicals={refreshChemicals}
            onSelectForWarning={handleSelectForWarning}
            onSelectForQR={handleSelectForQR}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            chemicals={chemicals}
            inventoryProp={inventory}
            onUpdateInventory={handleUpdateInventory}
            onOpenLabMap={() => setActiveTab('labmap')}
            onPrintQR={handlePrintQRFromInventory}
            isOpenAddModal={isQuickAddOpen}
            onCloseAddModal={() => setIsQuickAddOpen(false)}
          />
        )}

        {activeTab === 'labmap' && (
          <LabMap
            inventory={inventory}
            chemicals={chemicals}
            onUpdateInventory={handleUpdateInventory}
            onPrintQR={handlePrintQRFromInventory}
            onOpenQuickAdd={() => {
              setActiveTab('inventory');
              setIsQuickAddOpen(true);
            }}
          />
        )}

        {activeTab === 'calc' && (
          <SolutionCalculator chemicals={chemicals} />
        )}

        {activeTab === 'advisor' && (
          <SafetyAdvisor
            chemicals={chemicals}
            initialQuery={advisorInitialQuery}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-[#1a212e] py-6 px-6 text-center text-xs text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>ChemSafe AI · Hệ thống dữ liệu an toàn phòng thí nghiệm</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Công cụ tham khảo — không thay thế SDS chính thức của nhà cung cấp và sự hướng dẫn của giáo viên
        </div>
      </footer>
    </div>
  );
}
