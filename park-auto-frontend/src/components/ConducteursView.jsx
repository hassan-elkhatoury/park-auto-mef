import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, UserCheck, AlertTriangle, ShieldCheck, Phone, Mail, Edit, Trash2, Award, Eye, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from './ConfirmModal';
import MefSelect from './ui/MefSelect';

export default function ConducteursView() {
  const navigate = useNavigate();
  const [conducteurs, setConducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConducteur, setSelectedConducteur] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    conducteur: null,
    loading: false
  });

  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    cin: '',
    direction: '',
    service: '',
    telephone: '',
    email: '',
    numeroPermis: '',
    categoriePermis: 'B',
    dateDelivrancePermis: '',
    dateExpirationPermis: '',
    statut: 'ACTIF',
    habilitationsSpeciales: '',
  });

  useEffect(() => {
    fetchConducteurs();
  }, []);

  const fetchConducteurs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/conducteurs');
      setConducteurs(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des conducteurs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (conducteur = null) => {
    if (conducteur) {
      setSelectedConducteur(conducteur);
      setFormData({
        matricule: conducteur.matricule || '',
        nom: conducteur.nom || '',
        prenom: conducteur.prenom || '',
        cin: conducteur.cin || '',
        direction: conducteur.direction || '',
        service: conducteur.service || '',
        telephone: conducteur.telephone || '',
        email: conducteur.email || '',
        numeroPermis: conducteur.numeroPermis || '',
        categoriePermis: conducteur.categoriePermis || 'B',
        dateDelivrancePermis: conducteur.dateDelivrancePermis || '',
        dateExpirationPermis: conducteur.dateExpirationPermis || '',
        statut: conducteur.statut || 'ACTIF',
        habilitationsSpeciales: conducteur.habilitationsSpeciales || '',
      });
    } else {
      setSelectedConducteur(null);
      setFormData({
        matricule: `CND-${Math.floor(100 + Math.random() * 900)}`,
        nom: '',
        prenom: '',
        cin: '',
        direction: 'Direction du Budget',
        service: 'Service Transport & Logistique',
        telephone: '',
        email: '',
        numeroPermis: '',
        categoriePermis: 'B',
        dateDelivrancePermis: '',
        dateExpirationPermis: '',
        statut: 'ACTIF',
        habilitationsSpeciales: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedConducteur) {
        await api.put(`/conducteurs/${selectedConducteur.id}`, formData);
        toast.success('Conducteur mis à jour avec succès');
      } else {
        await api.post('/conducteurs', formData);
        toast.success('Conducteur créé avec succès');
      }
      setIsModalOpen(false);
      fetchConducteurs();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement du conducteur');
    }
  };

  const requestDelete = (conducteur) => {
    setDeleteModal({
      isOpen: true,
      conducteur: conducteur,
      loading: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.conducteur) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await api.delete(`/conducteurs/${deleteModal.conducteur.id}`);
      toast.success(`Conducteur ${deleteModal.conducteur.prenom} ${deleteModal.conducteur.nom} supprimé avec succès !`);
      setDeleteModal({ isOpen: false, conducteur: null, loading: false });
      fetchConducteurs();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredConducteurs = conducteurs.filter((c) => {
    const matchesSearch =
      c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numeroPermis.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatut = filterStatut === 'TOUS' || c.statut === filterStatut;
    return matchesSearch && matchesStatut;
  });

  const isPermisExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canManageConducteur = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#C59B27]" />
            Gestion des Conducteurs & Chauffeurs Habilités
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Référentiel des chauffeurs, contrôle de la validité des permis et affectations ministérielles.
          </p>
        </div>

        {canManageConducteur && (
          <button
            onClick={() => handleOpenModal()}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nouveau Conducteur
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, CIN, n° permis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C59B27]/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['TOUS', 'ACTIF', 'SUSPENDU', 'INACTIF'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatut === st
                  ? 'bg-[#0A1E3F] text-[#D7B14A]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Data Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Chargement des conducteurs...</div>
      ) : filteredConducteurs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Aucun conducteur trouvé.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Conducteurs</h3>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredConducteurs.length} conducteur{filteredConducteurs.length !== 1 ? 's' : ''} affiché{filteredConducteurs.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Conducteur</th>
                  <th>Matricule / CIN</th>
                  <th>Direction</th>
                  <th>Permis</th>
                  <th>Expiration</th>
                  <th>Contact</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConducteurs.map((c) => {
                  const expired = isPermisExpired(c.dateExpirationPermis);
                  return (
                    <tr key={c.id} className="cursor-pointer" onClick={() => navigate(`/conducteurs/${c.id}`)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 flex items-center justify-center flex-shrink-0">
                            <UserCheck className="w-4 h-4 text-[#94700E]" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">{c.nom} {c.prenom}</span>
                            {c.habilitationsSpeciales && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Award className="w-3 h-3 text-[#C59B27]" /> {c.habilitationsSpeciales}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs font-mono font-bold text-slate-700">{c.matricule}</span>
                        <span className="text-[10px] text-slate-400 block">CIN: {c.cin}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-slate-700 block max-w-[220px] truncate">{c.direction}</span>
                        {c.service && <span className="text-[10px] text-slate-400 block">{c.service}</span>}
                      </td>
                      <td>
                        <span className="text-xs font-bold text-slate-800 font-mono">{c.numeroPermis}</span>
                        <span className="text-[10px] text-slate-400 block">Cat. {c.categoriePermis}</span>
                      </td>
                      <td>
                        <span className={`text-xs font-bold flex items-center gap-1 whitespace-nowrap ${expired ? 'text-red-600' : 'text-slate-700'}`}>
                          {expired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                          {c.dateExpirationPermis}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          {c.telephone && (
                            <a href={`tel:${c.telephone}`} onClick={(e) => e.stopPropagation()} className="text-xs font-semibold text-slate-700 hover:text-[#C59B27] flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#94700E]" /> {c.telephone}
                            </a>
                          )}
                          {c.email && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate max-w-[180px]">
                              <Mail className="w-3 h-3" /> {c.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border ${
                          c.statut === 'ACTIF'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : c.statut === 'SUSPENDU'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}>
                          <ShieldCheck className="w-3 h-3" /> {c.statut}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/conducteurs/${c.id}`); }}
                            className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[#0A1E3F] hover:bg-[#0A1E3F] hover:text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                            title="Consulter la fiche conducteur"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManageConducteur && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                                className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); requestDelete(c); }}
                                className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Driver */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header Banner */}
            <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    {selectedConducteur ? 'Modifier le Conducteur' : 'Nouveau Conducteur Habilité'}
                  </h3>
                  <p className="text-[11px] text-slate-300 font-normal">Gestion des chauffeurs et agents habilités MEF</p>
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

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Matricule *</label>
                    <input
                      type="text"
                      required
                      value={formData.matricule}
                      onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono font-bold"
                      placeholder="MAT-00123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">N° CIN *</label>
                    <input
                      type="text"
                      required
                      value={formData.cin}
                      onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      placeholder="AA123456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">N° Permis de conduire *</label>
                    <input
                      type="text"
                      required
                      value={formData.numeroPermis}
                      onChange={(e) => setFormData({ ...formData, numeroPermis: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-mono"
                      placeholder="01/123456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Catégorie(s) du Permis *</label>
                    <MefSelect
                      value={formData.categoriePermis}
                      onChange={(e) => setFormData({ ...formData, categoriePermis: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all font-bold cursor-pointer"
                    >
                      <option value="B">Catégorie B (Tourisme)</option>
                      <option value="B, C">Catégories B, C (Poids Lourd)</option>
                      <option value="B, C, D">Catégories B, C, D (Transport Personnel)</option>
                    </MefSelect>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date délivrance permis</label>
                    <input
                      type="date"
                      value={formData.dateDelivrancePermis}
                      onChange={(e) => setFormData({ ...formData, dateDelivrancePermis: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Date d'expiration permis *</label>
                    <input
                      type="date"
                      required
                      value={formData.dateExpirationPermis}
                      onChange={(e) => setFormData({ ...formData, dateExpirationPermis: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Direction</label>
                    <input
                      type="text"
                      value={formData.direction}
                      onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      placeholder="Direction du Budget"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Service</label>
                    <input
                      type="text"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      placeholder="Service du Parc Automobile"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Téléphone</label>
                    <input
                      type="text"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      placeholder="+212 600 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                      placeholder="nom.prenom@finances.gov.ma"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Habilitations spéciales</label>
                  <input
                    type="text"
                    placeholder="ex: Conduite 4x4, Escorte Officielle, VIP..."
                    value={formData.habilitationsSpeciales}
                    onChange={(e) => setFormData({ ...formData, habilitationsSpeciales: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-[#C59B27] transition-all"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{selectedConducteur ? 'Enregistrer les modifications' : 'Enregistrer le conducteur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Premium Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Suppression de Fiche Conducteur"
        message={`Voulez-vous vraiment supprimer la fiche du conducteur ${deleteModal.conducteur?.prenom} ${deleteModal.conducteur?.nom} (Permis N° ${deleteModal.conducteur?.numeroPermis}) ?`}
        badgeText="La suppression sera enregistrée dans le journal d'audit du Ministère"
        confirmText="Supprimer le conducteur"
        cancelText="Annuler"
        variant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        onClose={() => setDeleteModal({ isOpen: false, conducteur: null, loading: false })}
      />
    </div>
  );
}
