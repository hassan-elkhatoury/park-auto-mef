import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, RotateCw, Search, UserPlus, X, Edit, Trash2, Shield, Check, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';

const roleBadgeStyles = {
  'ADMIN': 'bg-amber-100 text-amber-900 border-amber-300',
  'GESTIONNAIRE_CENTRAL': 'bg-blue-100 text-blue-900 border-blue-300',
  'GESTIONNAIRE_LOCAL': 'bg-sky-100 text-sky-900 border-sky-300',
  'RESPONSABLE_FINANCIER': 'bg-violet-100 text-violet-900 border-violet-300',
  'RESPONSABLE_SERVICE': 'bg-purple-100 text-purple-900 border-purple-300',
  'CONDUCTEUR': 'bg-emerald-100 text-emerald-900 border-emerald-300',
  'CONSULTATION': 'bg-slate-100 text-slate-700 border-slate-300',
};

const inputCls = "w-full p-2.5 bg-[#F4F6FB] border border-[#E2E8F0] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#C59B27]";
const labelCls = "block text-xs font-bold text-[#0A1E3F] mb-1.5";

const readCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function UtilisateursView() {
  const currentUser = readCurrentUser();
  const roleName = typeof currentUser?.role === 'string' ? currentUser.role : (currentUser?.role?.nom || currentUser?.role?.name || 'CONSULTATION');
  const isAdmin = roleName === 'ADMIN';

  const emptyForm = {
    matricule: '', nom: '', prenom: '', email: '',
    telephone: '', direction: 'Direction du Budget', service: 'Service Logistique',
    region: 'Rabat-Salé-Kénitra', role: 'GESTIONNAIRE_LOCAL', statut: 'ACTIVE'
  };
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');

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

  const getUserRoleName = (u) => {
    if (u.role) {
      return typeof u.role === 'object' ? (u.role.nom || u.role.name) : u.role;
    } else if (u.roles && u.roles.length > 0) {
      const r = u.roles[0];
      return typeof r === 'object' ? (r.nom || r.name) : r;
    }
    return 'CONSULTATION';
  };

  const handleDeactivateUser = (userToDeactivate) => {
    const currentUserStr = localStorage.getItem('user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    if (currentUser && (currentUser.id === userToDeactivate.id || currentUser.email === userToDeactivate.email)) {
      toast.error("Action impossible : Vous ne pouvez pas désactiver votre propre compte d'administrateur.");
      return;
    }

    const targetRoleName = getUserRoleName(userToDeactivate);
    if (targetRoleName === 'ADMIN' && userToDeactivate.statut === 'ACTIVE') {
      const activeAdmins = users.filter(u => {
        return getUserRoleName(u) === 'ADMIN' && u.statut === 'ACTIVE';
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || 
      u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.matricule?.toLowerCase().includes(search.toLowerCase());
    
    const uRole = getUserRoleName(u);
    const matchesRole = !roleFilter || uRole === roleFilter;
    const matchesStatut = !statutFilter || u.statut === statutFilter;

    return matchesSearch && matchesRole && matchesStatut;
  });

  const getRoleBadge = (u) => {
    const roleName = getUserRoleName(u);
    return (
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase whitespace-nowrap border ${roleBadgeStyles[roleName] || roleBadgeStyles['CONSULTATION']}`}>
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

  const countAdmins = users.filter(u => ['ADMIN', 'GESTIONNAIRE_CENTRAL'].includes(getUserRoleName(u))).length;
  const countGestionnaires = users.filter(u => ['GESTIONNAIRE_LOCAL', 'RESPONSABLE_SERVICE', 'RESPONSABLE_FINANCIER'].includes(getUserRoleName(u))).length;
  const countActifs = users.filter(u => u.statut === 'ACTIVE').length;

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
            Administration des comptes, gestion des profils et contrôle des habilitations agents
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchUsers}
            className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          {isAdmin && (
          <button
            onClick={() => { 
              const autoMatricule = generateNextUserMatricule(users);
              setFormData({ ...emptyForm, matricule: autoMatricule }); 
              setIsModalOpen(true); 
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Compte</span>
          </button>
          )}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Comptes</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A1E3F] mt-3">{users.length} <span className="text-xs font-normal text-slate-500">Utilisateurs</span></div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Parc Automatique MEF</div>
        </motion.div>

        <motion.div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Administrateurs</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A1E3F] mt-3">{countAdmins} <span className="text-xs font-normal text-slate-500">Admin & Central</span></div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Habilitations système complètes</div>
        </motion.div>

        <motion.div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Gestionnaires</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A1E3F] mt-3">{countGestionnaires} <span className="text-xs font-normal text-slate-500">Gestionnaires</span></div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Services & Régions MEF</div>
        </motion.div>

        <motion.div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Comptes Actifs</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0A1E3F] mt-3">{countActifs} <span className="text-xs font-normal text-slate-500">Actifs</span></div>
          <div className="mt-2 text-xs text-emerald-600 font-bold">Accès réseau MEF autorisés</div>
        </motion.div>
      </div>

      {/* Toolbar Search + Filters */}
      <motion.div
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, email, matricule..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="">Tous les rôles</option>
            {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actif</option>
            <option value="INACTIVE">Désactivé</option>
          </select>
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Agents MEF</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredUsers.length} agent{filteredUsers.length !== 1 ? 's' : ''} affiché{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="!py-16 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-500">{loading ? 'Chargement des utilisateurs...' : 'Aucun utilisateur trouvé'}</p>
                    {!loading && <p className="text-[11px] text-slate-400 mt-1">Modifiez vos filtres ou cliquez sur « Nouveau Compte ».</p>}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="font-mono text-xs font-black text-[#C59B27] bg-[#C59B27]/10 px-2.5 py-1 rounded-lg border border-[#C59B27]/20 whitespace-nowrap inline-block">
                        {u.matricule}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#0A1E3F] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 block leading-tight">{u.prenom} {u.nom}</span>
                          <span className="text-[10px] text-slate-400 block">{u.telephone || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 font-medium">{u.email}</span>
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded-md bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[11px] font-extrabold text-[#0A1E3F] whitespace-nowrap">
                        {u.direction || 'Direction du Budget'}
                      </span>
                    </td>
                    <td>{getRoleBadge(u)}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase whitespace-nowrap border ${
                        u.statut === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {u.statut === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && (
                        <>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            const roleVal = getUserRoleName(u);
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
                        </>
                        )}
                        {!isAdmin && (
                          <span className="text-[10px] font-bold text-slate-400 italic">Lecture seule</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header Banner */}
            <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">Créer un Compte Agent MEF</h3>
                  <p className="text-[11px] text-slate-300 font-normal">Enregistrement et attribution des habilitations</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreateUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
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
                    <select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className={`${inputCls} cursor-pointer font-medium`}>
                      {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Direction MEF *</label>
                    <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className={`${inputCls} cursor-pointer font-medium`}>
                      {directionOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} placeholder="+212 6XX XX XX XX" className={inputCls} />
                </div>
                
                {/* Security Warning */}
                <div className="bg-[#0A1E3F] border border-[#C59B27]/40 rounded-xl p-3.5 text-xs text-white flex items-start gap-3 shadow-sm">
                  <Shield className="w-4 h-4 text-[#D7B14A] flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-[#D7B14A] font-extrabold block">Sécurité & Habilitation Ministère MEF :</strong>
                    <span className="text-slate-300 text-[11px] leading-relaxed">
                      Un mot de passe temporaire unique et sécurisé est généré automatiquement par le système et immédiatement envoyé par email à l'agent. L'agent sera <u>forcé de le modifier</u> dès sa première connexion.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">Annuler</button>
                <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />
                  <span>Créer le Compte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-[580px] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header Banner */}
            <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">Modifier l'Agent #{editingUser?.id}</h3>
                  <p className="text-[11px] text-slate-300 font-normal">{editingUser?.prenom} {editingUser?.nom} — {editingUser?.matricule}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
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
                    <select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className={`${inputCls} cursor-pointer font-medium`}>
                      {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Direction MEF *</label>
                    <select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className={`${inputCls} cursor-pointer font-medium`}>
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
                    className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-[#C59B27] transition-all select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${formData.statut === 'ACTIVE' ? 'bg-[#0D7A5F] shadow-[0_0_8px_rgba(13,122,95,0.6)] animate-pulse' : 'bg-red-500'}`} />
                      <div>
                        <span className="text-xs font-bold text-[#0A1E3F] block">
                          {formData.statut === 'ACTIVE' ? 'Compte Agent Actif' : 'Compte Agent Désactivé'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formData.statut === 'ACTIVE' ? 'Accès et fonctionnalités système autorisés' : 'Accès bloqué en base de données'}
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
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer">Annuler</button>
                <button type="submit" className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer">
                  <Check className="w-4 h-4" />
                  <span>Enregistrer les Modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Deactivate Modal */}
      <ConfirmModal
        isOpen={deactivateModal.isOpen}
        title="Désactivation du Compte Agent"
        message={`Voulez-vous vraiment désactiver le compte de ${deactivateModal.user?.prenom} ${deactivateModal.user?.nom} ?`}
        badgeText="Désactivation sécurisée enregistrée dans le journal d'audit"
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
