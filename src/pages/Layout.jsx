
import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function Layout({ children, currentPageName }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        currentPage={currentPageName} 
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className={`min-h-screen transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-72'}`}>
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
