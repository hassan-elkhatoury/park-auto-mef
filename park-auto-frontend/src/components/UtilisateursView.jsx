import React, { useState, useEffect } from 'react';
import { Users, Plus, RotateCw, Search, UserPlus, X, Edit, Trash2, Shield, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const roleColors = {
  'ADMIN': 'bg-amber-50 text-amber-700 border-amber-200',
  'GESTIONNAIRE_CENTRAL': 'bg-blue-50 text-blue-700 border-blue-200',
  'GESTIONNAIRE_LOCAL': 'bg-sky-50 text-sky-700 border-sky-200',
  'RESPONSABLE_FINANCIER': 'bg-violet-50 text-violet-700 border-violet-200',
  'RESPONSABLE_SERVICE': 'bg-violet-50 text-violet-700 border-violet-200',
  'CONDUCTEUR': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'CONSULTATION': 'bg-gray-50 text-gray-600 border-gray-200',
};

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

  const handleDeactivateUser = async (userToDeactivate) => {
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

    if (!window.confirm(`Voulez-vous vraiment désactiver le compte de ${userToDeactivate.prenom} ${userToDeactivate.nom} ? (Accès bloqué en BDD conforme au Cahier des Charges)`)) return;

    try {
      await api.delete(`/utilisateurs/${userToDeactivate.id}`);
      toast.success(`Compte agent ${userToDeactivate.nom} désactivé avec succès !`);
      fetchUsers();
    } catch (err) {
      toast.error('Erreur lors de la désactivation du compte');
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
      <span className={`${roleColors[roleName] || roleColors['CONSULTATION']} border px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide`}>
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

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-description text-gray-500 mt-1">Conformité Cahier des Charges MEF — Sécurité, Contrôle des Accès & Rôles Agent</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 shadow-xs cursor-pointer">
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
            <button onClick={() => { 
              const autoMatricule = generateNextUserMatricule(users);
              setFormData({ ...emptyForm, matricule: autoMatricule }); 
              setIsModalOpen(true); 
            }} className="h-9 px-4 gold-gradient-bg text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-90 shadow-sm cursor-pointer">
              <UserPlus className="w-3.5 h-3.5" /> Nouveau Compte
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, matricule..."
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#C5A059]" />
          </div>
          <span className="text-[13px] text-gray-500 font-medium">{filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table with CRUD Actions */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-600">{loading ? 'Chargement...' : 'Aucun utilisateur trouvé'}</p>
              <p className="text-description text-gray-400 mt-1">{!loading && 'Créez un nouveau compte pour commencer.'}</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1B] text-[#E5C17C] uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Matricule</th>
                  <th className="p-3.5">Utilisateur</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Direction MEF</th>
                  <th className="p-3.5">Rôles Attribués</th>
                  <th className="p-3.5">Statut Compte</th>
                  <th className="p-3.5 text-center">Actions CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80">
                    <td className="p-3.5 font-mono text-[13px] font-bold text-gray-800">{u.matricule}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-gray-100 text-gray-700 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0 border border-gray-200">
                          {u.prenom?.[0]}{u.nom?.[0]}
                        </div>
                        <span className="font-bold text-gray-900">{u.prenom} {u.nom}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-gray-600 font-medium">{u.email}</td>
                    <td className="p-3.5 text-gray-600">{u.direction || 'Direction du Budget'}</td>
                    <td className="p-3.5">
                      {getRoleBadge(u)}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.statut === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                        <span className={u.statut === 'ACTIVE' ? 'text-emerald-700' : 'text-red-600'}>
                          {u.statut === 'ACTIVE' ? 'Actif' : 'Désactivé'}
                        </span>
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
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
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                          title="Modifier les informations & le statut"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeactivateUser(u)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
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
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-5 bg-[#070D1B] text-white">
              <div>
                <h3 className="text-[16px] font-bold font-['Outfit']">Créer un Compte Agent MEF</h3>
                <p className="text-[11px] text-[#E5C17C]">Enregistrement et attribution des habilitations</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Matricule *</label><input type="text" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} placeholder="MEF-2026-099" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Nom *</label><input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} placeholder="El Mansouri" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Prénom *</label><input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} placeholder="Khadija" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Email Professionnel *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="k.mansouri@mef.gov.ma" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Rôle Système *</label><select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs cursor-pointer outline-none font-medium focus:border-[#C5A059]">
                  <option value="ADMIN">ADMIN</option>
                  <option value="GESTIONNAIRE_CENTRAL">GESTIONNAIRE_CENTRAL</option>
                  <option value="GESTIONNAIRE_LOCAL">GESTIONNAIRE_LOCAL</option>
                  <option value="RESPONSABLE_FINANCIER">RESPONSABLE_FINANCIER</option>
                  <option value="RESPONSABLE_SERVICE">RESPONSABLE_SERVICE</option>
                  <option value="CONDUCTEUR">CONDUCTEUR</option>
                  <option value="CONSULTATION">CONSULTATION</option>
                </select></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Direction MEF *</label><select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs cursor-pointer outline-none font-medium focus:border-[#C5A059]">
                  <option value="Direction du Budget">Direction du Budget (DB)</option>
                  <option value="Direction Générale des Impôts">Direction Générale des Impôts (DGI)</option>
                  <option value="Administration des Douanes et Impôts Indirects">Administration des Douanes et Impôts Indirects (ADII)</option>
                  <option value="Trésorerie Générale du Royaume">Trésorerie Générale du Royaume (TGR)</option>
                  <option value="Direction des Entreprises Publiques et de la Privatisation">Direction des Entreprises Publiques et de la Privatisation (DEPP)</option>
                  <option value="Direction du Trésor et des Finances Extérieures">Direction du Trésor et des Finances Extérieures (DTFE)</option>
                  <option value="Direction des Affaires Domestiques et Générales">Direction des Affaires Domestiques et Générales (DAG)</option>
                  <option value="Inspection Générale des Finances">Inspection Générale des Finances (IGF)</option>
                  <option value="Direction des Études et des Prévisions Financières">Direction des Études et des Prévisions Financières (DEPF)</option>
                </select></div>
              </div>
              <div><label className="text-xs font-bold text-gray-700 block mb-1">Téléphone</label><input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} placeholder="+212 6XX XX XX XX" className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" /></div>
              
              {/* Premium Institutional Warning Alert */}
              <div className="bg-[#070D1B] border border-[#C5A059]/40 rounded-xl p-3.5 text-xs text-white flex items-start gap-3 shadow-lg">
                <Shield className="w-4 h-4 text-[#E5C17C] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="text-[#E5C17C] font-extrabold block">Sécurité & Habilitation Ministère MEF :</strong>
                  <span className="text-slate-300 text-[11px] leading-relaxed">
                    Un mot de passe temporaire unique et sécurisé est généré automatiquement par le système et immédiatement envoyé par email à l'agent. L'agent sera <u>forcé de le modifier</u> dès sa première connexion.
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="h-9 px-4 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
                <button type="submit" className="h-9 px-5 gold-gradient-bg text-[#070D1B] rounded-xl text-xs font-black hover:opacity-95 shadow-md cursor-pointer">Créer le Compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="flex items-center justify-between p-5 bg-[#070D1B] text-white">
              <div>
                <h3 className="text-[16px] font-bold font-['Outfit']">Modifier l'Agent #{editingUser?.id}</h3>
                <p className="text-[11px] text-[#E5C17C]">{editingUser?.prenom} {editingUser?.nom} — {editingUser?.matricule}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-white/10 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Matricule *</label><input type="text" value={formData.matricule} onChange={(e) => setFormData({...formData, matricule: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Nom *</label><input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Prénom *</label><input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" required /></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Rôle Système *</label><select value={formData.role || 'GESTIONNAIRE_LOCAL'} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs cursor-pointer outline-none font-medium focus:border-[#C5A059]">
                  <option value="ADMIN">ADMIN</option>
                  <option value="GESTIONNAIRE_CENTRAL">GESTIONNAIRE_CENTRAL</option>
                  <option value="GESTIONNAIRE_LOCAL">GESTIONNAIRE_LOCAL</option>
                  <option value="RESPONSABLE_FINANCIER">RESPONSABLE_FINANCIER</option>
                  <option value="RESPONSABLE_SERVICE">RESPONSABLE_SERVICE</option>
                  <option value="CONDUCTEUR">CONDUCTEUR</option>
                  <option value="CONSULTATION">CONSULTATION</option>
                </select></div>
                <div><label className="text-xs font-bold text-gray-700 block mb-1">Direction MEF *</label><select value={formData.direction} onChange={(e) => setFormData({...formData, direction: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs cursor-pointer outline-none font-medium focus:border-[#C5A059]">
                  <option value="Direction du Budget">Direction du Budget (DB)</option>
                  <option value="Direction Générale des Impôts">Direction Générale des Impôts (DGI)</option>
                  <option value="Administration des Douanes et Impôts Indirects">Administration des Douanes et Impôts Indirects (ADII)</option>
                  <option value="Trésorerie Générale du Royaume">Trésorerie Générale du Royaume (TGR)</option>
                  <option value="Direction des Entreprises Publiques et de la Privatisation">Direction des Entreprises Publiques et de la Privatisation (DEPP)</option>
                  <option value="Direction du Trésor et des Finances Extérieures">Direction du Trésor et des Finances Extérieures (DTFE)</option>
                  <option value="Direction des Affaires Domestiques et Générales">Direction des Affaires Domestiques et Générales (DAG)</option>
                  <option value="Inspection Générale des Finances">Inspection Générale des Finances (IGF)</option>
                  <option value="Direction des Études et des Prévisions Financières">Direction des Études et des Prévisions Financières (DEPF)</option>
                </select></div>
              </div>

              <div><label className="text-xs font-bold text-gray-700 block mb-1">Téléphone</label><input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full h-9 px-3 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#C5A059]" /></div>

              {/* High-End iOS Style Toggle Switch for Account Status */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Statut du Compte Agent *</label>
                <div 
                  onClick={() => setFormData({ ...formData, statut: formData.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                  className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:border-[#C5A059] transition-all select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${formData.statut === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-red-500'}`} />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        {formData.statut === 'ACTIVE' ? 'Compte Agent Actif' : 'Compte Agent Désactivé'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {formData.statut === 'ACTIVE' ? 'Accès et fonctionnalités système autorisés' : 'Accès bloqué en base de données (Conforme Cahier des Charges)'}
                      </span>
                    </div>
                  </div>

                  {/* iOS Style Custom Switch */}
                  <div className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-300 flex items-center flex-shrink-0 ${
                    formData.statut === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}>
                    <div className={`w-5.5 h-5.5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      formData.statut === 'ACTIVE' ? 'translate-x-[22px]' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="h-9 px-4 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">Annuler</button>
                <button type="submit" className="h-9 px-5 gold-gradient-bg text-[#070D1B] rounded-xl text-xs font-black hover:opacity-95 shadow-md cursor-pointer">Enregistrer les Modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
