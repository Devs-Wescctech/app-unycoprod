import React, { useState, useEffect } from 'react';
import { Bell, Settings, LogOut, ChevronDown, X, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, logout, roles } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('unyco_read_notifications') || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const [syncRes, healthRes] = await Promise.all([
          fetch('/api/sync-service/status'),
          fetch('/api/totvs/health')
        ]);
        const data = await syncRes.json();
        const health = await healthRes.json();
        setSyncStatus(data);
        
        const newNotifications = [];

        if (health.status !== 'ok') {
          newNotifications.push({
            id: 'totvs-health',
            message: health.message || 'API TOTVS com problemas',
            time: 'TOTVS',
            unread: !readNotifications['totvs-health'],
            type: 'error'
          });
        }
        
        if (data.lastSync) {
          const lastSyncDate = new Date(data.lastSync);
          const now = new Date();
          const diffMinutes = Math.floor((now - lastSyncDate) / 60000);
          
          if (diffMinutes < 60) {
            const uniqueId = `sync-time-${data.lastSync}`;
            newNotifications.push({
              id: uniqueId,
              message: `Última sincronização: ${diffMinutes} min atrás`,
              time: `${diffMinutes} min`,
              unread: !readNotifications[uniqueId],
              type: 'info'
            });
          }
        }
        
        if (data.stats) {
          if (data.stats.synced > 0) {
            const uniqueId = `sync-count-${data.stats.synced}`;
            newNotifications.push({
              id: uniqueId,
              message: `${data.stats.synced} usuários sincronizados`,
              time: 'Total',
              unread: !readNotifications[uniqueId],
              type: 'success'
            });
          }
          if (data.stats.existing > 0) {
            const uniqueId = `existing-count-${data.stats.existing}`;
            newNotifications.push({
              id: uniqueId,
              message: `${data.stats.existing} usuários já existiam no TOTVS`,
              time: 'Total',
              unread: !readNotifications[uniqueId],
              type: 'warning'
            });
          }
        }
        
        if (data.enabled) {
          newNotifications.push({
            id: 'sync-active',
            message: 'Sincronização automática ativa',
            time: 'Serviço',
            unread: !readNotifications['sync-active'],
            type: 'info'
          });
        }
        
        setNotifications(newNotifications);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      }
    };

    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [readNotifications]);

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
  };

  const dismissNotification = (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notificação removida');
  };

  const clearAllNotifications = (e) => {
    e.stopPropagation();
    const allRead = {};
    notifications.forEach(n => { allRead[n.id] = true; });
    const newReadState = { ...readNotifications, ...allRead };
    setReadNotifications(newReadState);
    localStorage.setItem('unyco_read_notifications', JSON.stringify(newReadState));
    setNotifications([]);
    toast.success('Todas as notificações foram limpas');
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    const allRead = {};
    notifications.forEach(n => { allRead[n.id] = true; });
    const newReadState = { ...readNotifications, ...allRead };
    setReadNotifications(newReadState);
    localStorage.setItem('unyco_read_notifications', JSON.stringify(newReadState));
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('Notificações marcadas como lidas');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const roleName = roles[user?.role]?.name || user?.role;
  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

  return (
    <header className={`h-16 px-8 flex items-center justify-end gap-4 sticky top-0 z-40 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-lg shadow-md border-b border-slate-200/50' 
        : 'bg-white border-b border-slate-200'
    }`}>
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <motion.div
            animate={{ 
              rotate: unreadCount > 0 ? [0, -15, 15, -10, 10, 0] : 0,
            }}
            transition={{ 
              duration: 0.5,
              repeat: unreadCount > 0 ? Infinity : 0,
              repeatDelay: 3,
              ease: "easeInOut"
            }}
          >
            <Bell className="w-5 h-5 text-slate-600" />
          </motion.div>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold text-white shadow-lg"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowNotifications(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-40"
              >
                <div className="p-4 bg-gradient-to-r from-[#2e6299] to-[#3a73b0] border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">Notificações</h3>
                      {notifications.length > 0 && (
                        <p className="text-xs text-white/70 mt-0.5">{notifications.length} notificações</p>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Marcar todas como lidas"
                          >
                            <Check className="w-4 h-4 text-white" />
                          </button>
                        )}
                        <button
                          onClick={clearAllNotifications}
                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                          title="Limpar todas"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500">Nenhuma notificação</p>
                      <p className="text-xs text-slate-400 mt-1">Você está em dia!</p>
                    </div>
                  ) : (
                    notifications.map((notif, index) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-all group ${
                          notif.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 ${getTypeIcon(notif.type)} rounded-full mt-1.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${notif.unread ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                          </div>
                          <button
                            onClick={(e) => dismissNotification(notif.id, e)}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-slate-200 rounded-lg transition-all flex-shrink-0"
                            title="Remover notificação"
                          >
                            <X className="w-4 h-4 text-slate-400" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      onClick={clearAllNotifications}
                      className="w-full text-center text-sm text-slate-600 hover:text-[#2e6299] transition-colors font-medium"
                    >
                      Limpar todas as notificações
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none">
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {userInitials}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{roleName}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2" align="end">
          <div className="px-3 py-3 mb-2 rounded-lg bg-gradient-to-br from-[#2e6299]/5 to-[#2e6299]/10">
            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-600 mt-1">{user?.email}</p>
            <p className="text-xs text-[#2e6299] font-medium mt-1.5">{roleName}</p>
          </div>
          <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
          <DropdownMenuItem className="cursor-pointer px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-[#2e6299] transition-all flex items-center gap-3">
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm">Configurações</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="cursor-pointer px-3 py-2.5 rounded-lg hover:bg-red-50 transition-all flex items-center gap-3 text-slate-700 hover:text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span className="font-medium text-sm">Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
