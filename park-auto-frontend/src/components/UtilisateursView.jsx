import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Plus, RotateCw, Search, Lock, UserPlus, X } from 'lucide-react';
import api from '../services/api';

export default function UtilisateursView() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Register Form State
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    motDePasse: 'User@2026',
    telephone: '',
    direction: 'Direction du Budget',
    service: 'Service Logistique',
    region: 'Rabat-Salé-Kénitra',
    roles: ['GESTIONNAIRE_LOCAL']
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/utilisateurs?size=50');
      if (res && res.data) {
        setUsers(res.data.content || []);
      }
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      if (res && res.data) {
        setRoles(res.data || []);
      }
    } catch (err) {
      console.error('Erreur chargement rôles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      alert('Compte utilisateur créé avec succès !');
      setIsModalOpen(false);
      setFormData({
        matricule: '',
        nom: '',
        prenom: '',
        email: '',
        motDePasse: 'User@2026',
        telephone: '',
        direction: 'Direction du Budget',
        service: 'Service Logistique',
        region: 'Rabat-Salé-Kénitra',
        roles: ['GESTIONNAIRE_LOCAL']
      });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Erreur lors de la création du compte');
    }
  };

  const filteredUsers = users.filter(u => 
    !search || 
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.matricule.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black font-['Outfit'] text-slate-900">Gestion des Utilisateurs (Sprint 1)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Comptes d'accès et attribution des rôles du Ministère (`/api/utilisateurs`)</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="gold-gradient-bg text-[#070D1B] font-extrabold text-xs px-4 py-2 rounded-xl gold-glow flex items-center gap-2 cursor-pointer hover:brightness-105 shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span>Créer un Compte</span>
            </button>
            <button 
              onClick={fetchUsers}
              className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div className="relative flex-1 max-w-[400px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom, email, matricule..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Total utilisateurs: <span className="text-[#9B783E]">{users.length}</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070D1B] text-[#E5C17C] uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Matricule</th>
                <th className="p-3.5">Utilisateur</th>
                <th className="p-3.5">Email Professionnel</th>
                <th className="p-3.5">Direction</th>
                <th className="p-3.5">Rôles Attribués</th>
                <th className="p-3.5">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-800">{u.matricule}</td>
                  <td className="p-3.5 font-bold text-slate-900">{u.prenom} {u.nom}</td>
                  <td className="p-3.5 text-slate-600">{u.email}</td>
                  <td className="p-3.5 text-slate-600">{u.direction || 'Direction du Budget'}</td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r, idx) => (
                          <span key={idx} className="bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#9B783E] px-2 py-0.5 rounded-md font-bold text-[10px]">
                            {typeof r === 'object' ? r.nom : r}
                          </span>
                        ))
                      ) : (
                        <span className="bg-[#C5A059]/15 border border-[#C5A059]/30 text-[#9B783E] px-2 py-0.5 rounded-md font-bold text-[10px]">
                          GESTIONNAIRE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-300 px-2 py-0.5 rounded-full font-extrabold text-[10px]">
                      {u.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Register User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#070D1B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[550px] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-['Outfit'] font-extrabold text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#9B783E]" /> Créer un Compte Agent (Sprint 1)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Matricule *</label>
                <input 
                  type="text" 
                  value={formData.matricule}
                  onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                  placeholder="MEF-2026-099"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Nom *</label>
                <input 
                  type="text" 
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  placeholder="El Mansouri"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Prénom *</label>
                <input 
                  type="text" 
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  placeholder="Khadija"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Email Professionnel *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="k.mansouri@mef.gov.ma"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Mot de Passe Initial *</label>
                <input 
                  type="password" 
                  value={formData.motDePasse}
                  onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Rôle Attribué *</label>
                <select 
                  value={formData.roles[0]}
                  onChange={(e) => setFormData({...formData, roles: [e.target.value]})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="GESTIONNAIRE_CENTRAL">GESTIONNAIRE_CENTRAL</option>
                  <option value="GESTIONNAIRE_LOCAL">GESTIONNAIRE_LOCAL</option>
                  <option value="RESPONSABLE_SERVICE">RESPONSABLE_SERVICE</option>
                  <option value="CONDUCTEUR">CONDUCTEUR</option>
                  <option value="CONSULTATION">CONSULTATION</option>
                </select>
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 gold-gradient-bg text-[#070D1B] font-extrabold text-xs rounded-xl shadow-md cursor-pointer">Créer le Compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
