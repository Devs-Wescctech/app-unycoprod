import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Power, PowerOff, Grid3x3, List, Award, CheckCircle2, DollarSign, Package, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { usePlans, useCreatePlan, useUpdatePlan } from '@/hooks/usePlans';
import { useToast } from '@/components/ui/use-toast';
import { translateError } from '@/lib/errorMessages';

const ITEMS_PER_PAGE = 8;

export default function Planos() {
  const [selectedTab, setSelectedTab] = useState('cadastrados');
  const [editingPlano, setEditingPlano] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const { data: planos = [], isLoading, error, refetch } = usePlans();

  const filteredPlanos = useMemo(() => {
    if (!searchTerm) return planos;
    const search = searchTerm.toLowerCase();
    return planos.filter(p => 
      p.nome?.toLowerCase().includes(search) ||
      p.descricao?.toLowerCase().includes(search)
    );
  }, [planos, searchTerm]);

  const totalPages = Math.ceil(filteredPlanos.length / ITEMS_PER_PAGE);
  const paginatedPlanos = filteredPlanos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const createPlanMutation = useCreatePlan();
  const updatePlanMutation = useUpdatePlan();

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    preco: '',
    cobranca: 'Mensal',
    descricao: '',
    beneficios: '',
    ativo: true
  });

  const handleEdit = (plano) => {
    setEditingPlano(plano);
    setFormData({
      nome: plano.nome,
      slug: plano.slug || (plano.nome || '').toLowerCase().replace(/\s+/g, '-'),
      preco: String(plano.preco || 0),
      cobranca: plano.cobranca,
      descricao: plano.descricao,
      beneficios: plano.beneficios,
      ativo: plano.ativo
    });
    setSelectedTab('novo');
  };

  const handleSave = async () => {
    if (!formData.nome) {
      toast({ title: 'Erro', description: 'Nome do plano e obrigatorio', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        name: formData.nome,
        slug: formData.slug || formData.nome.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(formData.preco) || 0,
        billing_period: formData.cobranca,
        description: formData.descricao,
        perks: formData.beneficios,
        active: formData.ativo ? 1 : 0
      };

      if (editingPlano) {
        await updatePlanMutation.mutateAsync({
          id: editingPlano.id,
          ...payload
        });
        toast({ title: 'Sucesso', description: 'Plano atualizado com sucesso!' });
      } else {
        await createPlanMutation.mutateAsync(payload);
        toast({ title: 'Sucesso', description: 'Plano criado com sucesso!' });
      }

      setSelectedTab('cadastrados');
      setEditingPlano(null);
      setFormData({
        nome: '',
        slug: '',
        preco: '',
        cobranca: 'Mensal',
        descricao: '',
        beneficios: '',
        ativo: true
      });
    } catch (err) {
      const errorMessage = translateError(err);
      toast({ title: 'Erro ao salvar', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleAtivar = async (plano) => {
    try {
      await updatePlanMutation.mutateAsync({
        id: plano.id,
        active: 1
      });
      toast({ title: 'Sucesso', description: 'Plano ativado!' });
    } catch (err) {
      const errorMessage = translateError(err);
      toast({ title: 'Erro ao ativar', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleDesativar = async (plano) => {
    try {
      await updatePlanMutation.mutateAsync({
        id: plano.id,
        active: 0
      });
      toast({ title: 'Sucesso', description: 'Plano desativado!' });
    } catch (err) {
      const errorMessage = translateError(err);
      toast({ title: 'Erro ao desativar', description: errorMessage, variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Gerenciamento de Planos" 
          description="Configure os planos de hospedagem"
          icon={Package}
        />
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700">Erro ao carregar planos</h3>
          <p className="text-red-600 mt-2">{translateError(error)}</p>
          <Button onClick={() => refetch()} className="mt-4 bg-red-600 hover:bg-red-700">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gerenciamento de Planos" 
        description="Configure os planos de hospedagem"
        icon={Package}
      />

      <div className="inline-flex p-1 bg-slate-100 rounded-xl shadow-inner">
        <button
          onClick={() => setSelectedTab('cadastrados')}
          className={`relative px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selectedTab === 'cadastrados'
              ? 'text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {selectedTab === 'cadastrados' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-lg shadow-lg"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">Cadastros</span>
        </button>
        <button
          onClick={() => {
            setSelectedTab('novo');
            setEditingPlano(null);
            setFormData({
              nome: '',
              slug: '',
              preco: '',
              cobranca: 'Mensal',
              descricao: '',
              beneficios: '',
              ativo: true
            });
          }}
          className={`relative px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
            selectedTab === 'novo'
              ? 'text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {selectedTab === 'novo' && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-lg shadow-lg"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">Planos</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedTab === 'cadastrados' ? (
          <motion.div
            key="cadastrados"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-4 shadow-sm border border-blue-100/50 flex gap-3">
              <Input
                placeholder="Buscar plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-slate-200 bg-white"
              />
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                variant="outline"
                className="border-slate-300"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
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
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
                <Loader2 className="w-12 h-12 text-[#2e6299] mx-auto animate-spin" />
                <p className="text-slate-500 mt-4">Carregando planos...</p>
              </div>
            ) : filteredPlanos.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-slate-500 mt-4">Nenhum plano encontrado</p>
                <Button onClick={() => setSelectedTab('novo')} className="mt-4 bg-[#2e6299]">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro plano
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedPlanos.map((plano, index) => (
                  <motion.div
                    key={plano.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl p-6 shadow-sm border border-blue-100/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#2e6299]/10 flex items-center justify-center">
                          <Award className="w-6 h-6 text-[#2e6299]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{plano.nome}</h3>
                          <p className="text-xs text-slate-500">ID: {plano.id}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-lg ${
                        plano.ativo 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {plano.ativo ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-xl p-4 mb-4 shadow-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-white" />
                        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Valor</span>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">R$ {(plano.preco || 0).toFixed(2)}</p>
                      <p className="text-sm text-white/80">{plano.cobranca}</p>
                    </div>

                    <p className="text-sm text-slate-600 mb-4">{plano.descricao || 'Sem descricao'}</p>

                    {plano.beneficios && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Beneficios</p>
                        <div className="space-y-1">
                          {plano.beneficios.split('\n').slice(0, 3).map((beneficio, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{beneficio}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(plano)}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[#2e6299] hover:bg-blue-50 border-slate-200 rounded-lg h-9"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      {plano.ativo ? (
                        <Button
                          onClick={() => handleDesativar(plano)}
                          disabled={updatePlanMutation.isPending}
                          size="sm"
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-9"
                        >
                          {updatePlanMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <PowerOff className="w-3 h-3 mr-1" />
                              Desativar
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleAtivar(plano)}
                          disabled={updatePlanMutation.isPending}
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-9"
                        >
                          {updatePlanMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Power className="w-3 h-3 mr-1" />
                              Ativar
                            </>
                          )}
                        </Button>
                      )}
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Preco</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cobranca</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedPlanos.map((plano, index) => (
                        <motion.tr
                          key={plano.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-slate-900 font-medium">{plano.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#2e6299]/10 flex items-center justify-center">
                                <Award className="w-4 h-4 text-[#2e6299]" />
                              </div>
                              <span className="text-sm font-medium text-slate-900">{plano.nome}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-[#2e6299]" />
                              <span className="text-sm font-semibold text-slate-900">R$ {(plano.preco || 0).toFixed(2)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{plano.cobranca}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {plano.ativo ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm font-semibold text-emerald-700">Ativo</span>
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm font-semibold text-slate-600">Inativo</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => handleEdit(plano)}
                                size="sm"
                                variant="outline"
                                className="text-[#2e6299] hover:bg-blue-50 border-slate-200 h-8 px-3 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              {plano.ativo ? (
                                <Button
                                  onClick={() => handleDesativar(plano)}
                                  disabled={updatePlanMutation.isPending}
                                  size="sm"
                                  className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3 text-xs"
                                >
                                  <PowerOff className="w-3 h-3 mr-1" />
                                  Desativar
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleAtivar(plano)}
                                  disabled={updatePlanMutation.isPending}
                                  size="sm"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs"
                                >
                                  <Power className="w-3 h-3 mr-1" />
                                  Ativar
                                </Button>
                              )}
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
          </motion.div>
        ) : (
          <motion.div
            key="novo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                {editingPlano ? 'Editar Plano' : 'Novo / Editar Plano'}
              </h2>
              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Nome do plano *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Slug (identificador)</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="mt-1.5"
                    placeholder="ex: plano-basico"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Preco (R$)</Label>
                    <Input
                      type="number"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Cobranca</Label>
                    <Select value={formData.cobranca} onValueChange={(value) => setFormData({ ...formData, cobranca: value })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Descricao</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Resumo do plano"
                    className="mt-1.5 h-20"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700">Beneficios (um por linha)</Label>
                  <Textarea
                    value={formData.beneficios}
                    onChange={(e) => setFormData({ ...formData, beneficios: e.target.value })}
                    placeholder="Ex:&#10;Tarifa especial em +2.200 hoteis&#10;Parcelamento em ate 12x sem juros&#10;Atendimento prioritario"
                    className="mt-1.5 h-32"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="w-4 h-4 text-[#2e6299] rounded border-slate-300 focus:ring-[#2e6299]"
                  />
                  <Label htmlFor="ativo" className="text-sm font-medium text-slate-700">Ativo</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    className="flex-1 bg-[#2e6299] hover:bg-[#2e6299]/90"
                  >
                    {(createPlanMutation.isPending || updatePlanMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTab('cadastrados')}
                    className="flex-1 border-slate-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Preview do Plano</h2>
              <div className="bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">{formData.nome || 'Nome do Plano'}</h3>
                <p className="text-white/80 text-sm mb-6">{formData.descricao || 'Descricao do plano'}</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold">R$ {formData.preco || '0,00'}</span>
                  <span className="text-white/80 ml-2">/ {formData.cobranca}</span>
                </div>
                <div className="space-y-3">
                  {formData.beneficios ? formData.beneficios.split('\n').map((beneficio, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span className="text-sm">{beneficio}</span>
                    </div>
                  )) : (
                    <p className="text-white/60 text-sm">Nenhum beneficio adicionado</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
