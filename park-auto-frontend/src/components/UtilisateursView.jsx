import React, { useState, useEffect } from 'react';
import { Users, Plus, RotateCw, Search, UserPlus, X, Edit, Trash2, Shield, Check, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

const roleColors = {
  'ADMIN': 'bg-amber-50 text-amber-700 border-amber-200',
  'GESTIONNAIRE_CENTRAL': 'bg-blue-50 text-blue-700 border-blue-200',
  'GESTIONNAIRE_LOCAL': 'bg-sky-50 text-sky-700 border-sky-200',
  'RESPONSABLE_FINANCIER': 'bg-violet-50 text-violet-700 border-violet-200',
  'RESPONSABLE_SERVICE': 'bg-violet-50 text-violet-700 border-violet-200',
  'CONDUCTEUR': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CONSULTATION': 'bg-slate-50 text-slate-600 border-slate-200',
};

const inputCls = "w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-white text-[#0A1E3F] focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/15 outline-none transition-all placeholder:text-slate-400";
const labelCls = "block text-xs font-bold text-[#0A1E3F] mb-1.5";

export default function UtilisateursView() {
  const emptyForm = {
    matricule: '', nom: '', prenom: '', email: '',
    telephone: '', direction: 'Direction du Budget', service: 'Service Logistique',
    region: 'Rabat-Salé-Kénitra', role: 'GESTIONNAIRE_LOCAL', statut: 'ACTIVE'
  };
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    user: null,
    loading: false
  });

  const [formData, setFormData] = useState(emptyForm);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/utilisateurs?size=50');
      if (res && res.data) setUsers(res.data.content || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res && res.data) setRoles(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        matricule: formData.matricule,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        direction: formData.direction || 'Direction du Budget',
        service: formData.service || 'Service Logistique',
        region: formData.region || 'Rabat-Salé-Kénitra',
        role: formData.role || 'GESTIONNAIRE_LOCAL'
      };
      await api.post('/auth/register', payload);
      toast.success('Compte utilisateur créé avec succès !');
      setIsModalOpen(false);
      setFormData(emptyForm);
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la création du compte';
      toast.error(errorMsg);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = {
        matricule: formData.matricule,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        direction: formData.direction,
        service: formData.service,
        region: formData.region,
        statut: formData.statut
      };
      await api.put(`/utilisateurs/${editingUser.id}`, payload);

      // Also update role if changed
      if (formData.role) {
        await api.put(`/utilisateurs/${editingUser.id}/roles`, { role: formData.role });
      }

      toast.success('Informations utilisateur enregistrées !');
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleDeactivateUser = (userToDeactivate) => {
    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    // Protection 1: Cannot deactivate oneself
    if (currentUser && (currentUser.id === userToDeactivate.id || currentUser.email === userToDeactivate.email)) {
      toast.error("Action impossible : Vous ne pouvez pas désactiver votre propre compte d'administrateur.");
      return;
    }

    // Protection 2: Must keep at least one active ADMIN in system
    const targetRoleName = userToDeactivate.role ? (typeof userToDeactivate.role === 'object' ? userToDeactivate.role.nom : userToDeactivate.role) : (userToDeactivate.roles?.[0]?.nom || userToDeactivate.roles?.[0]);
    if (targetRoleName === 'ADMIN' && userToDeactivate.statut === 'ACTIVE') {
      const activeAdmins = users.filter(u => {
        const rName = u.role ? (typeof u.role === 'object' ? u.role.nom : u.role) : (u.roles?.[0]?.nom || u.roles?.[0]);
        return rName === 'ADMIN' && u.statut === 'ACTIVE';
      });
      if (activeAdmins.length <= 1) {
        toast.error("Action impossible : Il doit toujours rester au moins un Administrateur actif dans le système.");
        return;
      }
    }

    setDeactivateModal({
      isOpen: true,
      user: userToDeactivate,
      loading: false
    });
  };

  const confirmDeactivateUser = async () => {
    if (!deactivateModal.user) return;
    const userToDeactivate = deactivateModal.user;
    try {
      setDeactivateModal(prev => ({ ...prev, loading: true }));
      await api.delete(`/utilisateurs/${userToDeactivate.id}`);
      toast.success(`Compte agent ${userToDeactivate.prenom} ${userToDeactivate.nom} désactivé avec succès !`);
      setDeactivateModal({ isOpen: false, user: null, loading: false });
      fetchUsers();
    } catch (err) {
      toast.error('Erreur lors de la désactivation du compte');
      setDeactivateModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredUsers = users.filter(u => 
    !search || u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (u) => {
    let roleName = 'CONSULTATION';
    if (u.role) {
      roleName = typeof u.role === 'object' ? (u.role.nom || u.role.name) : u.role;
    } else if (u.roles && u.roles.length > 0) {
      const r = u.roles[0];
      roleName = typeof r === 'object' ? (r.nom || r.name) : r;
    }
    return (
      <span className={`${roleColors[roleName] || roleColors['CONSULTATION']} border px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide`}>
        {roleName}
      </span>
    );
  };

  const generateNextUserMatricule = (existingUsers = []) => {
    let maxNum = 0;
    existingUsers.forEach(u => {
      if (u.matricule) {
        const matches = u.matricule.match(/\d+/g);
        if (matches) {
          const num = parseInt(matches[matches.length - 1], 10);
          if (num > maxNum && num < 10000) maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `MEF-${String(nextNum).padStart(3, '0')}`;
  };

  const directionOptions = [
    { value: 'Direction du Budget', label: 'Direction du Budget (DB)' },
    { value: 'Direction Générale des Impôts', label: 'Direction Générale des Impôts (DGI)' },
    { value: 'Administration des Douanes et Impôts Indirects', label: 'Administration des Douanes et Impôts Indirects (ADII)' },
    { value: 'Trésorerie Générale du Royaume', label: 'Trésorerie Générale du Royaume (TGR)' },
    { value: 'Direction des Entreprises Publiques et de la Privatisation', label: 'Direction des Entreprises Publiques et de la Privatisation (DEPP)' },
    { value: 'Direction du Trésor et des Finances Extérieures', label: 'Direction du Trésor et des Finances Extérieures (DTFE)' },
    { value: 'Direction des Affaires Domestiques et Générales', label: 'Direction des Affaires Domestiques et Générales (DAG)' },
    { value: 'Inspection Générale des Finances', label: 'Inspection Générale des Finances (IGF)' },
    { value: 'Direction des Études et des Prévisions Financières', label: 'Direction des Études et des Prévisions Financières (DEPF)' },
  ];

  const roleOptions = [
    'ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL',
    'RESPONSABLE_FINANCIER', 'RESPONSABLE_SERVICE', 'CONDUCTEUR', 'CONSULTATION'
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <Users className="w-6 h-6 text-[#C59B27]" />
            Gestion des Utilisateurs & Habilitations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conformité Cahier des Charges MEF — Sécurité, Contrôle des Accès & Rôles Agent
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchUsers}
            className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => { 
              const autoMatricule = generateNextUserMatricule(users);
              setFormData({ ...emptyForm, matricule: autoMatricule }); 
              setIsModalOpen(true); 
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nouveau Compte
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-[360px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, matricule..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 focus:border-[#C59B27] transition-all"
          />
        </div>
        <span className="text-[11px] font-bold text-slate-400">{filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Agents MEF</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredUsers.length} agent{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F4F6FB] flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-outfit font-bold text-lg text-[#0A1E3F] mb-1">{loading ? 'Chargement...' : 'Aucun utilisateur trouvé'}</h3>
            <p className="text-sm text-slate-400">{!loading && 'Créez un nouveau compte pour commencer.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Matricule</th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Direction MEF</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="font-mono text-xs font-black text-[#0A1E3F]">{u.matricule}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-extrabold text-[#0A1E3F]">{u.prenom?.[0]}{u.nom?.[0]}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">{u.prenom} {u.nom}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 font-medium">{u.email}</span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700 block max-w-[200px] truncate">{u.direction || 'Direction du Budget'}</span>
                    </td>
                    <td>{getRoleBadge(u)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.statut === 'ACTIVE' ? 'bg-[#0D7A5F] shadow-[0_0_6px_rgba(13,122,95,0.5)]' : 'bg-red-500'}`} />
                        <span className={u.statut === 'ACTIVE' ? 'text-[#0D7A5F]' : 'text-red-600'}>
                          {u.statut === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            const roleVal = u.role ? (typeof u.role === 'object' ? u.role.nom : u.role) : (u.roles?.[0]?.nom || u.roles?.[0] || 'GESTIONNAIRE_LOCAL');
                            setFormData({
                              matricule: u.matricule,
                              nom: u.nom,
                              prenom: u.prenom,
                              email: u.email,
                              telephone: u.telephone || '',
                              direction: u.direction || 'Direction du Budget',
                              service: u.service || 'Service Logistique',
                              region: u.region || 'Rabat-Salé-Kénitra',
                              role: roleVal,
                              statut: u.statut || 'ACTIVE'
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                          title="Modifier les informations & le statut"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivateUser(u)}
                          className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                          title="Désactiver / Bloquer le compte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-outfit font-extrabold text-lg text-[#0A1E3F]">Créer un Compte Agent MEF</h2>
                  <p className="text-[10px] text-[#C59B27] font-bold">Enregistrement et attribution des habilitations</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {/* Modal body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Matricule *</label>
                  <input type="text" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} placeholder="MEF-2026-099" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} placeholder="El Mansouri" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Prénom *</label>
                  <input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} placeholder="Khadija" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Email Professionnel *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="k.mansouri@mef.gov.ma" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Rôle Système *</label>
                  <select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className={`${inputCls} cursor-pointer`}>
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Direction MEF *</label>
                  <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className={`${inputCls} cursor-pointer`}>
                    {directionOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Téléphone</label>
                <input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} placeholder="+212 6XX XX XX XX" className={inputCls} />
              </div>
              
              {/* Premium Institutional Warning Alert */}
              <div className="bg-[#0A1E3F] border border-[#C59B27]/40 rounded-xl p-3.5 text-xs text-white flex items-start gap-3 shadow-lg">
                <Shield className="w-4 h-4 text-[#D7B14A] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-[#D7B14A] font-extrabold block">Sécurité & Habilitation Ministère MEF :</strong>
                  <span className="text-slate-300 text-[11px] leading-relaxed">
                    Un mot de passe temporaire unique et sécurisé est généré automatiquement par le système et immédiatement envoyé par email à l'agent. L'agent sera <u>forcé de le modifier</u> dès sa première connexion.
                  </span>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer">Annuler</button>
                <button type="submit" className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer">
                  <Check className="w-4 h-4" />
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1E3F]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530]">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-outfit font-extrabold text-lg text-[#0A1E3F]">Modifier l'Agent #{editingUser?.id}</h2>
                  <p className="text-[10px] text-[#C59B27] font-bold">{editingUser?.prenom} {editingUser?.nom} — {editingUser?.matricule}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {/* Modal body */}
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Matricule *</label>
                  <input type="text" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Nom *</label>
                  <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Prénom *</label>
                  <input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Rôle Système *</label>
                  <select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className={`${inputCls} cursor-pointer`}>
                    {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Direction MEF *</label>
                  <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className={`${inputCls} cursor-pointer`}>
                    {directionOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Téléphone</label>
                <input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className={inputCls} />
              </div>

              {/* Account Status Toggle */}
              <div>
                <label className={labelCls}>Statut du Compte Agent *</label>
                <div 
                  onClick={() => setFormData({ ...formData, statut: formData.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  className="flex items-center justify-between p-3.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl cursor-pointer hover:border-[#C59B27] transition-all select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${formData.statut === 'ACTIVE' ? 'bg-[#0D7A5F] shadow-[0_0_8px_rgba(13,122,95,0.6)] animate-pulse' : 'bg-red-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-[#0A1E3F] block">
                        {formData.statut === 'ACTIVE' ? 'Compte Agent Actif' : 'Compte Agent Désactivé'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formData.statut === 'ACTIVE' ? 'Accès et fonctionnalités système autorisés' : 'Accès bloqué en base de données (Conforme Cahier des Charges)'}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 flex items-center flex-shrink-0 ${
                    formData.statut === 'ACTIVE' ? 'bg-[#0D7A5F]' : 'bg-slate-300'
                  }`}>
                    <div className={`w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.statut === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="border border-[#E2E8F0] text-[#0A1E3F] font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-[#F4F6FB] transition-all cursor-pointer">Annuler</button>
                <button type="submit" className="gold-gradient-bg text-[#071530] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer">
                  <Check className="w-4 h-4" />
                  Enregistrer les Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Premium Confirm Modal */}
      <ConfirmModal
        isOpen={deactivateModal.isOpen}
        title="Désactivation du Compte Agent"
        message={`Voulez-vous vraiment désactiver le compte de ${deactivateModal.user?.prenom} ${deactivateModal.user?.nom} ?`}
        badgeText="Accès bloqué en BDD conforme au Cahier des Charges MEF"
        confirmText="Désactiver le compte"
        cancelText="Annuler"
        variant="danger"
        loading={deactivateModal.loading}
        onConfirm={confirmDeactivateUser}
        onClose={() => setDeactivateModal({ isOpen: false, user: null, loading: false })}
      />
    </div>
  );
}
