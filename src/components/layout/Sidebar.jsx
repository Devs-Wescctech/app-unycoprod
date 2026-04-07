import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { 
  LayoutDashboard, 
  RefreshCw, 
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  CreditCard,
  Shield,
  Wallet,
  BarChart3,
  MessageCircle,
  AlertTriangle,
  Globe,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuSections = [
  {
    title: 'CRM',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard', permission: 'dashboard' },
      { name: 'Cadastros', icon: Users, page: 'Cadastros', permission: 'cadastros' },
      { name: 'Planos', icon: CreditCard, page: 'Planos', permission: 'planos' },
    ]
  },
  {
    title: 'FINANCEIRO',
    items: [
      { name: 'Reservas & Receita', icon: BarChart3, page: 'DashboardReservas', permission: 'pagamentos' },
      { name: 'Pagamentos', icon: Wallet, page: 'Pagamentos', permission: 'pagamentos' },
    ]
  },
  {
    title: 'TOTVS',
    items: [
      { name: 'Sincronização', icon: RefreshCw, page: 'Sync', permission: 'sync' },
      { name: 'Pesquisa TOTVS', icon: Search, page: 'SearchTotvs', permission: 'search_totvs' },
    ]
  },
  {
    title: 'AUTOMAÇÃO',
    items: [
      { name: 'WhatsApp', icon: MessageCircle, page: 'WhatsAppFlows', permission: 'whatsapp' },
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { name: 'Usuários', icon: Shield, page: 'Usuarios', permission: 'usuarios' },
      { name: 'Central de APIs', icon: Globe, page: 'CentralAPIs', permission: 'admin' },
      { name: 'Configurações', icon: Settings, page: 'Configuracoes', permission: 'admin' },
    ]
  }
];

export default function Sidebar({ currentPage, isCollapsed, setIsCollapsed }) {
  const { hasPermission } = useAuth();
  const { plansEnabled } = useSystemConfig();
  const [totvsStatus, setTotvsStatus] = useState(null);

  useEffect(() => {
    const check = () => {
      fetch('/api/totvs/health').then(r => r.json()).then(setTotvsStatus).catch(() => {});
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (!hasPermission(item.permission)) return false;
      if (item.page === 'Planos' && !plansEnabled) return false;
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-[#2e6299] flex flex-col z-50 transition-all duration-300 shadow-lg ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
      <div className="px-6 py-6 border-b border-white/10">
        {!isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68feb8f95830b2b2b9c148e2/70558c4a2_Designsemnome2.png"
              alt="UNYCO CRM"
              className="h-12 object-contain"
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 5, 0, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Users className="w-5 h-5 text-white/80" />
                </motion.div>
                <span className="text-xl font-bold text-white/95 tracking-wide uppercase" style={{
                  textShadow: '0 2px 10px rgba(255,255,255,0.15)'
                }}>
                  CRM
                </span>
              </div>
              <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68feb8f95830b2b2b9c148e2/70558c4a2_Designsemnome2.png"
              alt="UNYCO CRM"
              className="h-8 object-contain"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {filteredSections.map((section, sectionIdx) => (
          <div key={section.title} className={sectionIdx > 0 ? 'mt-6' : ''}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 mb-3"
              >
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
                  {section.title}
                </h3>
              </motion.div>
            )}

            {isCollapsed && sectionIdx > 0 && (
              <div className="my-4 mx-auto w-8 h-px bg-white/20" />
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = currentPage === item.page;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className="block"
                  >
                    <motion.div
                      whileHover={{ x: isCollapsed ? 0 : 2 }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group
                        ${isActive 
                          ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium text-sm whitespace-nowrap"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {isActive && !isCollapsed && (
                        <div className="w-1.5 h-6 bg-white rounded-full ml-auto" />
                      )}

                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                          {item.name}
                          <span className="block text-xs text-white/60 mt-0.5">{section.title}</span>
                        </div>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="space-y-3">
            {totvsStatus && totvsStatus.status !== 'ok' && (
              <Link to={createPageUrl('Sync')} className="block">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-400/20 hover:bg-amber-500/20 transition-colors">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-medium text-amber-300 truncate">TOTVS offline</span>
                </div>
              </Link>
            )}
            <div className="text-center">
              <p className="text-xs font-medium text-white/60">UNYCO CRM v1.1.0</p>
              <p className="text-xs text-white/40 mt-0.5">&copy; 2026</p>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white/80 hover:text-white flex items-center justify-center gap-2 text-sm font-medium"
            >
              <PanelLeftClose className="w-4 h-4" />
              Minimizar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {totvsStatus && totvsStatus.status !== 'ok' && (
              <Link to={createPageUrl('Sync')} className="block">
                <div className="flex items-center justify-center p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/20 transition-colors group relative">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-amber-300 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl font-medium">
                    TOTVS offline
                  </div>
                </div>
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 text-white flex items-center justify-center"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
