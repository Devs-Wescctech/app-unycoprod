import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Eye, Edit, Trash2, UserPlus, CheckCircle2, Clock, Award, Grid3x3, List, Users, Loader2, AlertCircle, Download, FileSpreadsheet, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ActionMenu from '@/components/ui/ActionMenu';
import DrawerCadastro from '@/components/cadastros/DrawerCadastro';
import PageHeader from '@/components/ui/PageHeader';
import { useUsersSubscriptions, useUpdateSubscription, useDeleteUser } from '@/hooks/useUsersSubscriptions';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 8;

export default function Cadastros() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('new');
  const [selectedCadastro, setSelectedCadastro] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { toast } = useToast();

  const { data: apiData, isLoading, error, refetch } = useUsersSubscriptions();
  const updateSubscription = useUpdateSubscription();
  const deleteUser = useDeleteUser();
  const { plansEnabled } = useSystemConfig();

  const cadastros = useMemo(() => {
    if (!apiData || !Array.isArray(apiData)) return [];
    
    const mapped = apiData.map(item => ({
      id: item.user_id,
      nome: item.user_name?.split(' ')[0] || '',
      sobrenome: item.user_name?.split(' ').slice(1).join(' ') || '',
      email: item.user_email || '',
      cpf: item.user_cpf || '',
      telefone: item.user_phone || '',
      nascimento: item.user_birth_date || '',
      endereco: item.user_address || '',
      numero: item.user_numero || '',
      bairro: item.user_bairro || '',
      cidade: item.user_cidade || '',
      estado: item.user_estado || '',
      enderecoCompleto: [item.user_address, item.user_numero, item.user_bairro, item.user_cidade, item.user_estado].filter(Boolean).join(', '),
      cep: item.user_cep || '',
      plano: item.plan_name || 'Sem plano',
      planoId: item.plan_id,
      statusPlano: item.subscription_status === 'ativa' ? 'Ativo' : 'Pendente',
      subscriptionId: item.subscription_id,
      subscriptionStatus: item.subscription_status,
      criadoEm: item.subscription_created_at || item.user_created_at || ''
    }));
    
    return mapped.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  }, [apiData]);

  const filteredCadastros = useMemo(() => {
    if (!searchTerm) return cadastros;
    const search = searchTerm.toLowerCase();
    return cadastros.filter(c => 
      c.nome.toLowerCase().includes(search) ||
      c.sobrenome.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.cpf.includes(search)
    );
  }, [cadastros, searchTerm]);

  const totalPages = Math.ceil(filteredCadastros.length / ITEMS_PER_PAGE);
  const paginatedCadastros = filteredCadastros.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const menuItems = [
    { icon: Eye, label: 'Ver detalhes', action: 'view' },
    { icon: Edit, label: 'Editar', action: 'edit' },
    { separator: true },
    { icon: Trash2, label: 'Excluir', action: 'delete', danger: true }
  ];

  const syncUserToTOTVS = async (cadastro) => {
    try {
      const checkResponse = await fetch('/api/totvs/check-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cadastro.cpf })
      });
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        return { success: true, skipped: true };
      }

      const user = {
        cpf: cadastro.cpf,
        name: `${cadastro.nome} ${cadastro.sobrenome}`.trim(),
        email: cadastro.email,
        phone: cadastro.telefone,
        address: cadastro.endereco,
        numero: cadastro.numero,
        bairro: cadastro.bairro,
        cidade: cadastro.cidade,
        estado: cadastro.estado,
        cep: cadastro.cep,
        birth_date: cadastro.nascimento
      };

      const syncResponse = await fetch('/api/totvs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      const syncData = await syncResponse.json();
      
      return { success: syncData.success, error: syncData.error };
    } catch (error) {
      console.error('Erro ao sincronizar com TOTVS:', error);
      return { success: false, error: error.message };
    }
  };

  const handleAtivarPlano = async (cadastro) => {
    if (!cadastro.subscriptionId) {
      toast({ title: 'Erro', description: 'Usuario sem assinatura', variant: 'destructive' });
      return;
    }
    try {
      await updateSubscription.mutateAsync({
        subscription_id: cadastro.subscriptionId,
        status: 'ativa'
      });
      toast({ title: 'Sucesso', description: 'Plano ativado com sucesso' });

      const syncResult = await syncUserToTOTVS(cadastro);
      if (syncResult.success) {
        if (syncResult.skipped) {
          toast({ title: 'Info', description: 'Cliente já existe no TOTVS' });
        } else {
          toast({ title: 'Sincronizado', description: 'Cliente enviado para TOTVS com sucesso' });
        }
      } else {
        toast({ title: 'Aviso', description: `Falha ao sincronizar com TOTVS: ${syncResult.error}`, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handlePendenciarPlano = async (cadastro) => {
    if (!cadastro.subscriptionId) {
      toast({ title: 'Erro', description: 'Usuario sem assinatura', variant: 'destructive' });
      return;
    }
    try {
      await updateSubscription.mutateAsync({
        subscription_id: cadastro.subscriptionId,
        status: 'pendente'
      });
      toast({ title: 'Sucesso', description: 'Plano pendenciado com sucesso' });
    } catch (err) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const handleMenuAction = (action, cadastroId) => {
    const cadastro = cadastros.find(c => c.id === cadastroId);
    
    if (action === 'view') {
      setSelectedCadastro(cadastro);
      setDrawerMode('view');
      setDrawerOpen(true);
    } else if (action === 'edit') {
      setSelectedCadastro(cadastro);
      setDrawerMode('edit');
      setDrawerOpen(true);
    } else if (action === 'delete') {
      if (!cadastro) return;
      setDeleteConfirm(cadastro);
    }
  };

  const handleNovoCadastro = () => {
    setSelectedCadastro(null);
    setDrawerMode('new');
    setDrawerOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteUser.mutate(deleteConfirm.id, {
      onSuccess: () => {
        toast({ title: 'Cadastro excluido', description: `${deleteConfirm.nome} foi removido com sucesso.` });
        setDeleteConfirm(null);
        refetch();
      },
      onError: (err) => {
        toast({ title: 'Erro ao excluir', description: err.message || 'Nao foi possivel excluir o cadastro.', variant: 'destructive' });
        setDeleteConfirm(null);
      }
    });
  };

  const handleDrawerSuccess = () => {
    refetch();
    setDrawerOpen(false);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredCadastros.map(c => ({
      'Nome': c.nome,
      'Sobrenome': c.sobrenome,
      'E-mail': c.email,
      'CPF': c.cpf,
      'Telefone': c.telefone,
      'Endereco': c.endereco,
      'CEP': c.cep,
      ...(plansEnabled ? { 'Plano': c.plano, 'Status': c.statusPlano } : {}),
      'Data Cadastro': c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cadastros');
    
    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 },
      { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `cadastros_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Sucesso', description: 'Arquivo Excel exportado com sucesso' });
  };

  const handleExportCSV = () => {
    const headers = ['Nome', 'Sobrenome', 'E-mail', 'CPF', 'Telefone', 'Endereco', 'CEP', ...(plansEnabled ? ['Plano', 'Status'] : []), 'Data Cadastro'];
    const rows = filteredCadastros.map(c => [
      c.nome,
      c.sobrenome,
      c.email,
      c.cpf,
      c.telefone,
      c.endereco,
      c.cep,
      ...(plansEnabled ? [c.plano, c.statusPlano] : []),
      c.criadoEm ? new Date(c.criadoEm).toLocaleDateString('pt-BR') : ''
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cadastros_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: 'Sucesso', description: 'Arquivo CSV exportado com sucesso' });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Cadastros" 
          description="Gerencie os cadastros dos clientes"
          icon={Users}
        />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700">Erro ao carregar dados</h3>
          <p className="text-red-600 mt-2">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4 bg-red-600 hover:bg-red-700">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader 
            title="Cadastros" 
            description="Gerencie os cadastros dos clientes"
            icon={Users}
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white text-[#2e6299] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white text-[#2e6299] shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button 
            onClick={handleExportCSV}
            variant="outline"
            className="border-[#2e6299] text-[#2e6299] hover:bg-[#2e6299]/10 transition-all duration-300 rounded-lg px-4"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button 
            onClick={handleExportExcel}
            variant="outline"
            className="border-[#2e6299] text-[#2e6299] hover:bg-[#2e6299]/10 transition-all duration-300 rounded-lg px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button 
            onClick={handleNovoCadastro}
            className="bg-[#2e6299] hover:bg-[#2e6299]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg px-6"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-5 shadow-sm border border-blue-100/50">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Nome, e-mail ou CPF"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 border-slate-200 bg-white"
            />
          </div>
          <Button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="bg-[#2e6299] hover:bg-[#2e6299]/90 text-white px-8 rounded-lg"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Loader2 className="w-12 h-12 text-[#2e6299] mx-auto animate-spin" />
          <p className="text-slate-500 mt-4">Carregando cadastros...</p>
        </div>
      ) : filteredCadastros.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-4">Nenhum cadastro encontrado</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedCadastros.map((cadastro, index) => (
            <motion.div
              key={cadastro.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 shadow-sm border border-blue-100/50 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2e6299]/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-[#2e6299]">
                      {cadastro.nome.charAt(0)}{cadastro.sobrenome.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{cadastro.nome} {cadastro.sobrenome}</h3>
                    <p className="text-xs text-slate-500">ID: {cadastro.id}</p>
                  </div>
                </div>
                <ActionMenu 
                  items={menuItems} 
                  onItemClick={(action) => handleMenuAction(action, cadastro.id)} 
                />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-900 font-medium truncate">{cadastro.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">CPF:</span>
                  <span className="text-slate-900 font-medium">{cadastro.cpf}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Telefone:</span>
                  <span className="text-slate-900 font-medium">{cadastro.telefone}</span>
                </div>
              </div>

              {plansEnabled && (
              <>
              <div className="bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-xl p-4 mb-4 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-white" />
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Plano Contratado</span>
                </div>
                <p className="text-lg font-bold text-white mb-1">{cadastro.plano}</p>
                <div className="flex items-center gap-2">
                  {cadastro.statusPlano === 'Ativo' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-300" />
                  )}
                  <span className={`text-sm font-semibold ${
                    cadastro.statusPlano === 'Ativo' ? 'text-emerald-300' : 'text-amber-300'
                  }`}>
                    {cadastro.statusPlano}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {cadastro.statusPlano === 'Pendente' ? (
                  <Button
                    onClick={() => handleAtivarPlano(cadastro)}
                    disabled={updateSubscription.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9 text-sm"
                  >
                    {updateSubscription.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Ativar Plano
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePendenciarPlano(cadastro)}
                    disabled={updateSubscription.isPending}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-9 text-sm"
                  >
                    {updateSubscription.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-1" />
                        Pendenciar
                      </>
                    )}
                  </Button>
                )}
              </div>
              </>
              )}

              <div className="mt-4 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                  Cadastrado em {cadastro.criadoEm}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-sm border border-blue-100/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">CPF</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Telefone</th>
                  {plansEnabled && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Plano</th>}
                  {plansEnabled && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>}
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedCadastros.map((cadastro, index) => (
                  <motion.tr
                    key={cadastro.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{cadastro.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#2e6299]/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#2e6299]">
                            {cadastro.nome.charAt(0)}{cadastro.sobrenome.charAt(0)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-slate-900">{cadastro.nome} {cadastro.sobrenome}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cadastro.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cadastro.cpf}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cadastro.telefone}</td>
                    {plansEnabled && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#2e6299]" />
                        <span className="text-sm font-medium text-slate-900">{cadastro.plano}</span>
                      </div>
                    </td>
                    )}
                    {plansEnabled && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {cadastro.statusPlano === 'Ativo' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Ativo</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">Pendente</span>
                          </>
                        )}
                      </div>
                    </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {plansEnabled && cadastro.statusPlano === 'Pendente' ? (
                          <Button
                            onClick={() => handleAtivarPlano(cadastro)}
                            disabled={updateSubscription.isPending}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Ativar
                          </Button>
                        ) : plansEnabled ? (
                          <Button
                            onClick={() => handlePendenciarPlano(cadastro)}
                            disabled={updateSubscription.isPending}
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-8 px-3 text-xs"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            Pendenciar
                          </Button>
                        ) : null}
                        <ActionMenu 
                          items={menuItems} 
                          onItemClick={(action) => handleMenuAction(action, cadastro.id)} 
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-600">
            Pagina {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Proximo
          </Button>
        </div>
      )}

      <DrawerCadastro
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
        mode={drawerMode}
        cadastro={selectedCadastro}
      />

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusao</h3>
                <p className="text-slate-500 mb-1">Tem certeza que deseja excluir o cadastro de:</p>
                <p className="text-lg font-semibold text-slate-800 mb-4">
                  {deleteConfirm.nome} {deleteConfirm.sobrenome}
                </p>
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2 mb-6">
                  Esta acao nao pode ser desfeita. Todos os dados serao removidos permanentemente.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setDeleteConfirm(null)}
                    variant="outline"
                    className="flex-1 h-11 rounded-xl border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmDelete}
                    disabled={deleteUser.isPending}
                    className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteUser.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Excluir
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
