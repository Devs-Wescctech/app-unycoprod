import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, User, Mail, Phone, MapPin, Calendar, Award, CheckCircle2, Clock, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateUser, useUpdateUser, useCreateSubscription, useUpdateSubscription } from '@/hooks/useUsersSubscriptions';
import { usePlans } from '@/hooks/usePlans';
import { useToast } from '@/components/ui/use-toast';
import { translateError } from '@/lib/errorMessages';
import { getUser } from '@/services/apiClient';
import { useSystemConfig } from '@/hooks/useSystemConfig';

function formatDateForInput(dateString) {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.substring(0, 10);
  }
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return '';
}

export default function DrawerCadastro({ isOpen, onClose, onSuccess, mode, cadastro }) {
  const { toast } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const { data: planos = [] } = usePlans();
  const { plansEnabled } = useSystemConfig();
  
  const [formData, setFormData] = React.useState({
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    telefone: '',
    nascimento: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    planoId: '',
    statusPlano: 'Pendente'
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [isSearchingCep, setIsSearchingCep] = React.useState(false);
  const [isLoadingUser, setIsLoadingUser] = React.useState(false);

  const searchCep = async (cep) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast({ title: 'CEP inválido', description: 'Digite um CEP com 8 dígitos', variant: 'destructive' });
      return;
    }

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({ title: 'CEP não encontrado', description: 'Verifique o CEP digitado', variant: 'destructive' });
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado
      }));
      
      toast({ title: 'Endereço encontrado', description: `${data.logradouro}, ${data.bairro}` });
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({ title: 'Erro', description: 'Não foi possível buscar o CEP', variant: 'destructive' });
    } finally {
      setIsSearchingCep(false);
    }
  };

  React.useEffect(() => {
    const loadUserData = async () => {
      if (cadastro && (mode === 'view' || mode === 'edit') && cadastro.id) {
        setIsLoadingUser(true);
        try {
          const userData = await getUser(cadastro.id);
          if (userData) {
            const nameParts = (userData.name || '').split(' ');
            const nome = nameParts[0] || '';
            const sobrenome = nameParts.slice(1).join(' ') || '';
            
            setFormData({
              nome,
              sobrenome,
              email: userData.email || '',
              cpf: userData.cpf || '',
              telefone: userData.phone || '',
              nascimento: formatDateForInput(userData.birth_date),
              cep: userData.cep || '',
              endereco: userData.address || '',
              numero: userData.numero || '',
              bairro: userData.bairro || '',
              cidade: userData.cidade || '',
              estado: userData.estado || '',
              planoId: cadastro.planoId?.toString() || '',
              statusPlano: cadastro.statusPlano || 'Pendente'
            });
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
          setFormData({
            nome: cadastro.nome || '',
            sobrenome: cadastro.sobrenome || '',
            email: cadastro.email || '',
            cpf: cadastro.cpf || '',
            telefone: cadastro.telefone || '',
            nascimento: formatDateForInput(cadastro.nascimento),
            cep: cadastro.cep || '',
            endereco: cadastro.endereco || '',
            numero: cadastro.numero || '',
            bairro: cadastro.bairro || '',
            cidade: cadastro.cidade || '',
            estado: cadastro.estado || '',
            planoId: cadastro.planoId?.toString() || '',
            statusPlano: cadastro.statusPlano || 'Pendente'
          });
        } finally {
          setIsLoadingUser(false);
        }
      } else if (mode === 'new') {
        setFormData({
          nome: '',
          sobrenome: '',
          email: '',
          cpf: '',
          telefone: '',
          nascimento: '',
          cep: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          planoId: '',
          statusPlano: 'Pendente'
        });
      }
    };
    
    if (isOpen) {
      loadUserData();
    }
  }, [cadastro, mode, isOpen]);

  const handleSave = async () => {
    const camposObrigatorios = [
      { campo: 'nome', label: 'Nome' },
      { campo: 'sobrenome', label: 'Sobrenome' },
      { campo: 'cpf', label: 'CPF' },
      { campo: 'email', label: 'E-mail' },
      { campo: 'telefone', label: 'Telefone' },
      { campo: 'nascimento', label: 'Data de Nascimento' },
      { campo: 'cep', label: 'CEP' },
      { campo: 'endereco', label: 'Endereço' },
      { campo: 'numero', label: 'Número' },
      { campo: 'bairro', label: 'Bairro' },
      { campo: 'cidade', label: 'Cidade' },
      { campo: 'estado', label: 'Estado' }
    ];
    
    const camposFaltando = camposObrigatorios.filter(c => !formData[c.campo] || formData[c.campo].trim() === '');
    
    if (camposFaltando.length > 0) {
      const labels = camposFaltando.map(c => c.label).join(', ');
      toast({ title: 'Campos obrigatórios', description: `Preencha: ${labels}`, variant: 'destructive' });
      return;
    }

    setIsSaving(true);

    try {
      const fullName = `${formData.nome} ${formData.sobrenome}`.trim();
      
      const userPayload = {
        name: fullName,
        cpf: formData.cpf.replace(/\D/g, ''),
        phone: formData.telefone,
        email: formData.email,
        cep: formData.cep,
        birth_date: formData.nascimento,
        address: formData.endereco,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado
      };

      if (mode === 'edit' && cadastro?.id) {
        await updateUser.mutateAsync({
          id: cadastro.id,
          ...userPayload
        });
        
        if (cadastro.subscriptionId) {
          await updateSubscription.mutateAsync({
            subscription_id: cadastro.subscriptionId,
            plan_id: formData.planoId && formData.planoId !== 'none' ? parseInt(formData.planoId) : null,
            status: formData.statusPlano === 'Ativo' ? 'ativa' : 'pendente'
          });
        }
        
        toast({ title: 'Sucesso', description: 'Cadastro atualizado com sucesso!' });
      } else {
        const userResult = await createUser.mutateAsync(userPayload);
        
        if (userResult.user_id && formData.planoId && formData.planoId !== 'none') {
          await createSubscription.mutateAsync({
            user_id: userResult.user_id,
            plan_id: parseInt(formData.planoId) || null,
            status: formData.statusPlano === 'Ativo' ? 'ativa' : 'pendente'
          });
        }
        
        toast({ title: 'Sucesso', description: 'Cadastro criado com sucesso!' });
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const errorMessage = translateError(err);
      toast({ 
        title: 'Erro ao salvar', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    if (mode === 'new') return 'Novo Cadastro';
    if (mode === 'edit') return 'Editar Cadastro';
    return 'Detalhes do Cadastro';
  };

  const isViewMode = mode === 'view';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-slate-50 p-0">
        <SheetHeader className="bg-gradient-to-r from-[#2e6299] to-[#3a73b0] px-8 py-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold text-white">{getTitle()}</SheetTitle>
              <SheetDescription className="text-white/80 text-base">
                {mode === 'new' && 'Preencha os dados do novo cadastro'}
                {mode === 'edit' && 'Edite as informacoes do cadastro'}
                {mode === 'view' && 'Visualize as informacoes completas'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 py-6 space-y-6"
        >
          {plansEnabled && (mode === 'view' || mode === 'edit') && cadastro && (
            <div className="bg-gradient-to-br from-[#2e6299] to-[#3a73b0] rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-white/90 uppercase tracking-wider">Plano Contratado</span>
                </div>
                {formData.statusPlano === 'Ativo' ? (
                  <div className="px-4 py-2 bg-emerald-500/20 rounded-full flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span className="text-xs font-bold text-emerald-300 uppercase">Ativo</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-amber-500/20 rounded-full flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-bold text-amber-300 uppercase">Pendente</span>
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-white">{cadastro.plano || 'Nenhum plano'}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-[#2e6299] uppercase tracking-wide mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5" />
              Dados Pessoais
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    disabled={isViewMode}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Sobrenome *</Label>
                  <Input
                    value={formData.sobrenome}
                    onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                    disabled={isViewMode}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">CPF *</Label>
                <Input
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  disabled={isViewMode}
                  className="mt-1.5"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">Data de Nascimento *</Label>
                {isViewMode ? (
                  <Input
                    value={formData.nascimento ? new Date(formData.nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                    disabled
                    className="mt-1.5"
                  />
                ) : (
                  <Input
                    type="date"
                    value={formData.nascimento}
                    onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })}
                    className="mt-1.5"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-[#2e6299] uppercase tracking-wide mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Phone className="w-5 h-5" />
              Contato
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">E-mail *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isViewMode}
                  className="mt-1.5"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  disabled={isViewMode}
                  className="mt-1.5"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-[#2e6299] uppercase tracking-wide mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5" />
              Endereco
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">CEP *</Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      disabled={isViewMode}
                      placeholder="00000-000"
                      onBlur={() => {
                        if (formData.cep && formData.cep.replace(/\D/g, '').length === 8 && !isViewMode) {
                          searchCep(formData.cep);
                        }
                      }}
                    />
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => searchCep(formData.cep)}
                        disabled={isSearchingCep}
                        className="shrink-0"
                      >
                        {isSearchingCep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Numero *</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    disabled={isViewMode}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Endereco *</Label>
                <Input
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  disabled={isViewMode}
                  className="mt-1.5"
                  placeholder="Rua, Avenida..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Bairro *</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    disabled={isViewMode}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Cidade *</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    disabled={isViewMode}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700">Estado *</Label>
                <Input
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  disabled={isViewMode}
                  className="mt-1.5"
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {plansEnabled && (mode === 'new' || mode === 'edit') && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-base font-bold text-[#2e6299] uppercase tracking-wide mb-6 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Award className="w-5 h-5" />
                Plano
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Plano Contratado</Label>
                  <Select value={formData.planoId} onValueChange={(value) => setFormData({ ...formData, planoId: value })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem plano</SelectItem>
                      {planos.filter(p => p && p.id).map(plano => (
                        <SelectItem key={plano.id} value={String(plano.id)}>
                          {plano.nome} - R$ {(plano.preco || 0).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Status</Label>
                  <Select value={formData.statusPlano} onValueChange={(value) => setFormData({ ...formData, statusPlano: value })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 -mx-8 -mb-6 flex gap-3 shadow-lg">
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-[#2e6299] to-[#3a73b0] hover:from-[#2e6299]/90 hover:to-[#3a73b0]/90 text-white h-12 rounded-xl shadow-lg"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Cadastro
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className={`${isViewMode ? 'flex-1' : 'flex-1'} border-slate-300 h-12 rounded-xl hover:bg-slate-50`}
            >
              {isViewMode ? 'Fechar' : 'Cancelar'}
            </Button>
          </div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
