import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUsersSubscriptions } from '@/hooks/useUsersSubscriptions';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search,
  Clock,
  Play,
  Settings,
  Activity,
  AlertTriangle,
  Trash2,
  FileText
} from 'lucide-react';

const INTERVAL_OPTIONS = [
  { value: 60000, label: '1 minuto' },
  { value: 300000, label: '5 minutos' },
  { value: 600000, label: '10 minutos' },
  { value: 1800000, label: '30 minutos' },
  { value: 3600000, label: '1 hora' }
];

export default function Sync() {
  const { data: usersData, isLoading: isLoadingUsers, refetch } = useUsersSubscriptions();
  const { plansEnabled } = useSystemConfig();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceStatus, setServiceStatus] = useState({
    enabled: false,
    interval: 300000,
    countdown: 0,
    lastSync: null,
    nextSync: null,
    isRunning: false,
    stats: { synced: 0, existing: 0 }
  });
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncedUsers, setSyncedUsers] = useState({});
  const [existingUsers, setExistingUsers] = useState({});
  const [errorUsers, setErrorUsers] = useState({});
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState('300000');
  const [totvsHealth, setTotvsHealth] = useState(null);

  const fetchServiceStatus = useCallback(async () => {
    try {
      const [statusRes, logsRes, usersRes, healthRes] = await Promise.all([
        fetch('/api/sync-service/status'),
        fetch('/api/sync-service/logs'),
        fetch('/api/sync-service/synced-users'),
        fetch('/api/totvs/health')
      ]);
      
      const status = await statusRes.json();
      const logs = await logsRes.json();
      const users = await usersRes.json();
      const health = await healthRes.json();
      
      setServiceStatus(status);
      setSyncLogs(logs.logs || []);
      setSyncedUsers(users.syncedUsers || {});
      setExistingUsers(users.existingUsers || {});
      setErrorUsers(users.errorUsers || {});
      setSelectedInterval(String(status.interval));
      setTotvsHealth(health);
    } catch (error) {
      console.error('Erro ao buscar status do serviço:', error);
    }
  }, []);

  useEffect(() => {
    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 1000);
    return () => clearInterval(interval);
  }, [fetchServiceStatus]);

  const handleToggleService = async (enabled) => {
    try {
      const res = await fetch('/api/sync-service/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, interval: parseInt(selectedInterval) })
      });
      
      if (res.ok) {
        toast.success(enabled ? 'Sincronização automática ativada' : 'Sincronização automática desativada');
        fetchServiceStatus();
      }
    } catch (error) {
      toast.error('Erro ao alterar configuração');
    }
  };

  const handleChangeInterval = async (value) => {
    setSelectedInterval(value);
    try {
      const res = await fetch('/api/sync-service/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: serviceStatus.enabled, interval: parseInt(value) })
      });
      
      if (res.ok) {
        toast.success('Intervalo atualizado');
        fetchServiceStatus();
      }
    } catch (error) {
      toast.error('Erro ao alterar intervalo');
    }
  };

  const handleRunNow = async () => {
    try {
      const res = await fetch('/api/sync-service/run-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Sincronização iniciada');
      } else {
        toast.warning(data.message || 'Sincronização já está em andamento');
      }
    } catch (error) {
      toast.error('Erro ao iniciar sincronização');
    }
  };

  const handleClearData = async () => {
    try {
      const res = await fetch('/api/sync-service/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        toast.success('Dados de sincronização limpos');
        fetchServiceStatus();
      }
    } catch (error) {
      toast.error('Erro ao limpar dados');
    }
  };

  const rawUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);
  
  const activeUsers = rawUsers
    .filter(user => plansEnabled ? user.subscription_status === 'ativa' : (user.user_cpf && user.user_cpf.replace(/\D/g, '').length > 0))
    .map(user => ({
      ...user,
      id: user.user_id,
      name: user.user_name,
      cpf: user.user_cpf,
      email: user.user_email,
      phone: user.user_phone,
      synced: !!syncedUsers[user.user_id],
      existing: !!existingUsers[user.user_id],
      hasError: !!errorUsers[user.user_id],
      errorMessage: errorUsers[user.user_id]?.error || null
    }));

  const pendingUsers = activeUsers.filter(u => !u.synced && !u.existing && !u.hasError);
  
  const filteredUsers = activeUsers.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.cpf?.includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: activeUsers.length,
    pendentes: pendingUsers.length,
    sincronizados: activeUsers.filter(u => u.synced).length,
    existentes: activeUsers.filter(u => u.existing).length,
    erros: activeUsers.filter(u => u.hasError).length
  };

  const formatCountdown = (ms) => {
    if (!ms || ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getStatusBadge = (user) => {
    if (user.synced) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sincronizado
        </span>
      );
    }
    if (user.existing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          Já Existe
        </span>
      );
    }
    if (user.hasError) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            Erro
          </span>
          {user.errorMessage && (
            <span className="text-xs text-red-500 pl-1">{user.errorMessage}</span>
          )}
        </div>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" />
        Pendente
      </span>
    );
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const displayLogs = [...syncLogs].reverse().slice(0, 100);

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {totvsHealth && totvsHealth.status !== 'ok' && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">API TOTVS indisponivel</p>
              <p className="text-amber-700 text-sm mt-0.5">{totvsHealth.message}</p>
              {totvsHealth.status === 'password_expired' && (
                <p className="text-amber-600 text-xs mt-2 bg-amber-100/50 rounded-lg px-3 py-1.5 inline-block">
                  A sincronizacao ficara pausada ate que a senha seja renovada no sistema TOTVS.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sincronização TOTVS</h1>
          <p className="text-slate-500 mt-1">Serviço automático em segundo plano</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunNow}
            disabled={serviceStatus.isRunning}
            className="bg-[#2e6299] hover:bg-[#245080] text-white rounded-xl h-11 px-5"
          >
            {serviceStatus.isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => refetch()}
            className="rounded-xl h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Lista
          </Button>

          <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-xl h-11">
                <Settings className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px]">
              <SheetHeader>
                <SheetTitle>Configurações de Sincronização</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Intervalo de Sincronização</h3>
                  <Select value={selectedInterval} onValueChange={handleChangeInterval}>
                    <SelectTrigger className="w-full h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Sincronização Automática</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {serviceStatus.enabled ? 'Serviço ativo em segundo plano' : 'Serviço desativado'}
                      </p>
                    </div>
                    <Switch
                      checked={serviceStatus.enabled}
                      onCheckedChange={handleToggleService}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-4">Limpar Dados</h3>
                  <Button
                    onClick={handleClearData}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Status de Sincronização
                  </Button>
                  <p className="text-xs text-slate-500 mt-2">
                    Isso permite sincronizar novamente todos os usuários
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <h3 className="font-bold text-slate-900 mb-3">Serviço em Background</h3>
                  <p className="text-sm text-slate-600">
                    A sincronização funciona automaticamente mesmo que você feche esta página ou faça logout. 
                    O cronômetro continua rodando no servidor.
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${serviceStatus.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="font-medium text-slate-700">
                {serviceStatus.enabled ? 'Serviço Ativo' : 'Serviço Inativo'}
              </span>
            </div>

            {serviceStatus.enabled && (
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Próxima sincronização em: </span>
                <span className="font-mono font-bold text-[#2e6299] text-lg">
                  {formatCountdown(serviceStatus.countdown)}
                </span>
              </div>
            )}

            {serviceStatus.lastSync && (
              <div className="text-sm text-slate-500">
                Última sincronização: {new Date(serviceStatus.lastSync).toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Sincronização Automática</span>
            <Switch
              checked={serviceStatus.enabled}
              onCheckedChange={handleToggleService}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {serviceStatus.isRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className="border-blue-200 bg-blue-50 text-blue-800 rounded-xl shadow-sm">
              <Activity className="h-5 w-5 animate-pulse" />
              <AlertDescription className="text-sm font-medium">
                Sincronização em andamento. Aguarde...
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{plansEnabled ? 'Ativos' : 'Usuários'}</p>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2e6299]">{stats.total}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendentes</p>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2e6299]">{stats.pendentes}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sincronizados</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2e6299]">{stats.sincronizados}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Já Existem</p>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2e6299]">{stats.existentes}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Com Erro</p>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#2e6299]">{stats.erros}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {serviceStatus.isRunning ? 'Sincronizando' : 'Status'}
            </p>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              {serviceStatus.isRunning ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : (
                <Activity className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>
          <p className="text-lg font-bold text-[#2e6299]">
            {serviceStatus.isRunning ? 'Em execução' : (serviceStatus.enabled ? 'Aguardando' : 'Parado')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Pesquisar por nome, CPF ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl border-slate-200 focus:border-[#2e6299] focus:ring-[#2e6299] bg-slate-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">CPF</th>
                {plansEnabled && <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Plano</th>}
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={plansEnabled ? 4 : 3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-[#2e6299] mx-auto mb-3 animate-spin" />
                    <p className="text-slate-500">Carregando usuários...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={plansEnabled ? 4 : 3} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {activeUsers.length === 0 
                        ? (plansEnabled ? 'Nenhum usuário com plano ativo' : 'Nenhum usuário com CPF cadastrado')
                        : 'Nenhum resultado encontrado'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-mono">{user.cpf}</td>
                    {plansEnabled && (
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {user.plan_name || 'Plano Ativo'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-900">Logs de Sincronização</h3>
            <span className="text-sm text-slate-500">(últimos 100)</span>
          </div>
          <span className="text-sm text-slate-500">{displayLogs.length} registros</span>
        </div>
        
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {displayLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p>Nenhum log disponível</p>
            </div>
          ) : (
            displayLogs.map((log) => (
              <div
                key={log.id}
                className={`px-4 py-3 flex items-start gap-3 ${
                  log.type === 'error' ? 'bg-red-50' :
                  log.type === 'warning' ? 'bg-amber-50' :
                  log.type === 'success' ? 'bg-emerald-50' : ''
                }`}
              >
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{log.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
