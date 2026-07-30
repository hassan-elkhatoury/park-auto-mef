import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, AlertTriangle, ShieldCheck, Phone, Mail, Edit, Trash2, Calendar, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

export default function ConducteursView() {
  const [conducteurs, setConducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('TOUS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConducteur, setSelectedConducteur] = useState(null);

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

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce conducteur ?')) return;
    try {
      await api.delete(`/conducteurs/${id}`);
      toast.success('Conducteur supprimé');
      fetchConducteurs();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
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
          <h1 className="text-xl font-black text-[#0F1D32] tracking-wide uppercase flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#C5A059]" />
            Gestion des Conducteurs & Chauffeurs Habilités
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Référentiel des chauffeurs, contrôle de la validité des permis et affectations ministérielles.
          </p>
        </div>

        {canManageConducteur && (
          <button
            onClick={() => handleOpenModal()}
            className="gold-gradient-bg text-[#070D1B] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer"
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
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C5A059]/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {['TOUS', 'ACTIF', 'SUSPENDU', 'INACTIF'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatut(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatut === st
                  ? 'bg-[#0F1D32] text-[#E5C17C]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers List Grid / Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Chargement des conducteurs...</div>
      ) : filteredConducteurs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          Aucun conducteur trouvé.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConducteurs.map((c) => {
            const expired = isPermisExpired(c.dateExpirationPermis);
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                        {c.matricule} • CIN: {c.cin}
                      </span>
                      <h3 className="text-base font-extrabold text-[#0F1D32]">
                        {c.nom} {c.prenom}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.direction} {c.service ? `(${c.service})` : ''}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                        c.statut === 'ACTIF'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : c.statut === 'SUSPENDU'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {c.statut}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-2 border border-slate-100 mb-4 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Permis N°:</span>
                      <span className="font-bold text-[#0F1D32]">{c.numeroPermis}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Catégorie(s):</span>
                      <span className="font-bold text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                        Cat. {c.categoriePermis}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Expiration:</span>
                      <span className={`font-bold flex items-center gap-1 ${expired ? 'text-red-600' : 'text-slate-700'}`}>
                        {expired && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        {c.dateExpirationPermis}
                      </span>
                    </div>

                    {c.habilitationsSpeciales && (
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1 text-[11px] text-[#0F1D32]">
                        <Award className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>{c.habilitationsSpeciales}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    {c.telephone && (
                      <a href={`tel:${c.telephone}`} className="hover:text-[#C5A059] flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {c.telephone}
                      </a>
                    )}
                  </div>

                  {canManageConducteur && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(c)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Driver */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold text-[#0F1D32] uppercase flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#C5A059]" />
              {selectedConducteur ? 'Modifier le Conducteur' : 'Nouveau Conducteur Habilité'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Matricule *</label>
                  <input
                    type="text"
                    required
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° CIN *</label>
                  <input
                    type="text"
                    required
                    value={formData.cin}
                    onChange={(e) => setFormData({ ...formData, cin: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Permis de conduire *</label>
                  <input
                    type="text"
                    required
                    value={formData.numeroPermis}
                    onChange={(e) => setFormData({ ...formData, numeroPermis: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie(s) du Permis *</label>
                  <select
                    value={formData.categoriePermis}
                    onChange={(e) => setFormData({ ...formData, categoriePermis: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="B">Catégorie B (Tourisme)</option>
                    <option value="B, C">Catégories B, C (Poids Lourd)</option>
                    <option value="B, C, D">Catégories B, C, D (Transport Personnel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date délivrance permis</label>
                  <input
                    type="date"
                    value={formData.dateDelivrancePermis}
                    onChange={(e) => setFormData({ ...formData, dateDelivrancePermis: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date d'expiration permis *</label>
                  <input
                    type="date"
                    required
                    value={formData.dateExpirationPermis}
                    onChange={(e) => setFormData({ ...formData, dateExpirationPermis: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Direction</label>
                  <input
                    type="text"
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service</label>
                  <input
                    type="text"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Habilitations spéciales</label>
                <input
                  type="text"
                  placeholder="ex: Conduite 4x4, Escorte Officielle, VIP..."
                  value={formData.habilitationsSpeciales}
                  onChange={(e) => setFormData({ ...formData, habilitationsSpeciales: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg gold-gradient-bg text-[#070D1B] font-extrabold shadow-md hover:brightness-105"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
