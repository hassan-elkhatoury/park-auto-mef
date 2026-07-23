import React, { useState, useEffect } from 'react';
import { 
  Car, CheckCircle2, Wrench, AlertTriangle, Box, Search, Plus, Filter, 
  RotateCw, History, Archive, PenTool, Fuel, Gauge, HeartPulse, FileSpreadsheet, X
} from 'lucide-react';
import api from '../services/api';

export default function DashboardView() {
  const [vehicules, setVehicules] = useState([]);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);

  // Status Change Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedVehiculeForStatus, setSelectedVehiculeForStatus] = useState(null);
  const [statusFormData, setStatusFormData] = useState({
    nouveauStatutAdministratif: 'DISPONIBLE',
    nouveauEtatTechnique: 'BON_ETAT',
    motif: '',
    pieceJustificative: ''
  });

  // History Timeline Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historiqueList, setHistoriqueList] = useState([]);
  const [historyVehiculeInfo, setHistoryVehiculeInfo] = useState(null);

  // Vehicle Form State
  const [formData, setFormData] = useState({
    immatriculation: '',
    numeroInventaire: '',
    numeroChassis: '',
    marque: '',
    modele: '',
    typeCarburant: 'DIESEL',
    kilometrageInitial: 0,
    kilometrageActuel: 1000,
    organisme: 'Ministère de l\'Économie et des Finances',
    direction: 'Direction du Budget',
    statutAdministratif: 'DISPONIBLE',
    etatTechnique: 'NEUF'
  });

  const fetchVehicules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicules?size=100');
      if (res && res.data) {
        setVehicules(res.data.content || []);
      }
    } catch (err) {
      console.error('Erreur de chargement des véhicules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicules();
  }, []);

  // Real Metrics Calculated from Backend Data
  const total = vehicules.length;
  const disponibles = vehicules.filter(v => v.statutAdministratif === 'DISPONIBLE').length;
  const entretien = vehicules.filter(v => ['EN_ENTRETIEN', 'EN_REPARATION', 'IMMOBILISE'].includes(v.statutAdministratif)).length;
  const horsService = vehicules.filter(v => ['HORS_SERVICE', 'ACCIDENTE', 'REFORME'].includes(v.statutAdministratif) || v.etatTechnique === 'HORS_SERVICE').length;
  const archives = vehicules.filter(v => v.statutAdministratif === 'ARCHIVE').length;

  const filteredVehicules = vehicules.filter(v => {
    const matchesSearch = !search || 
      (v.immatriculation && v.immatriculation.toLowerCase().includes(search.toLowerCase())) ||
      (v.marque && v.marque.toLowerCase().includes(search.toLowerCase())) ||
      (v.modele && v.modele.toLowerCase().includes(search.toLowerCase())) ||
      (v.numeroInventaire && v.numeroInventaire.toLowerCase().includes(search.toLowerCase()));

    const matchesStatut = !statutFilter || v.statutAdministratif === statutFilter;
    return matchesSearch && matchesStatut;
  });

  const handleSaveVehicule = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicule) {
        await api.put(`/vehicules/${editingVehicule.id}`, formData);
      } else {
        await api.post('/vehicules', formData);
      }
      setIsModalOpen(false);
      setEditingVehicule(null);
      fetchVehicules();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'enregistrement du véhicule');
    }
  };

  const handleStatusChangeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVehiculeForStatus) return;
    try {
      await api.put(`/vehicules/${selectedVehiculeForStatus.id}/statut`, statusFormData);
      setIsStatusModalOpen(false);
      setSelectedVehiculeForStatus(null);
      fetchVehicules();
    } catch (err) {
      alert(err.message || 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleOpenHistory = async (vehicule) => {
    try {
      setHistoryVehiculeInfo(vehicule);
      const res = await api.get(`/vehicules/${vehicule.id}/historique`);
      if (res && res.data) {
        setHistoriqueList(res.data || []);
      }
      setIsHistoryModalOpen(true);
    } catch (err) {
      alert('Impossible de charger l\'historique');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Voulez-vous vraiment archiver ce véhicule ? (Archivage logique Sprint 2)')) return;
    try {
      await api.delete(`/vehicules/${id}`);
      fetchVehicules();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'archivage');
    }
  };

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">
        
        {/* Top Meta Bar */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black font-['Outfit'] text-slate-900">Parc Automobile — MEF Maroc</h2>
            <p className="text-xs text-slate-500 mt-0.5">Données temps réel connectées à la base de données REST (Sprint 2)</p>
          </div>
          <button 
            onClick={fetchVehicules}
            className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser les Données</span>
          </button>
        </div>

        {/* 5 Real Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 border-t-4 border-t-[#C5A059] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl flex-shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Total Véhicules</span>
              <span className="text-2xl font-black font-['Outfit'] text-slate-900">{total}</span>
              <span className="text-[10px] font-bold text-slate-400 block">Enregistrés en base</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 border-t-4 border-t-emerald-500 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Disponibles</span>
              <span className="text-2xl font-black font-['Outfit'] text-slate-900">{disponibles}</span>
              <span className="text-[10px] font-bold text-emerald-600 block">Statut DISPONIBLE</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 border-t-4 border-t-amber-500 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">En Entretien</span>
              <span className="text-2xl font-black font-['Outfit'] text-slate-900">{entretien}</span>
              <span className="text-[10px] font-bold text-amber-600 block">En maintenance</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 border-t-4 border-t-red-500 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Hors Service</span>
              <span className="text-2xl font-black font-['Outfit'] text-slate-900">{horsService}</span>
              <span className="text-[10px] font-bold text-red-600 block">Accidentés / Réformés</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 border-t-4 border-t-slate-400 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl flex-shrink-0">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block">Archivés</span>
              <span className="text-2xl font-black font-['Outfit'] text-slate-900">{archives}</span>
              <span className="text-[10px] font-bold text-slate-500 block">Soft delete</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par immatriculation, marque, modèle, n° inventaire..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#C5A059]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="AFFECTE">Affecté</option>
              <option value="EN_ENTRETIEN">En Entretien</option>
              <option value="EN_REPARATION">En Réparation</option>
              <option value="IMMOBILISE">Immobilisé</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </div>

          <button 
            onClick={() => {
              setEditingVehicule(null);
              setFormData({
                immatriculation: '',
                numeroInventaire: '',
                numeroChassis: '',
                marque: '',
                modele: '',
                typeCarburant: 'DIESEL',
                kilometrageInitial: 0,
                kilometrageActuel: 1000,
                organisme: 'Ministère de l\'Économie et des Finances',
                direction: 'Direction du Budget',
                statutAdministratif: 'DISPONIBLE',
                etatTechnique: 'NEUF'
              });
              setIsModalOpen(true);
            }}
            className="gold-gradient-bg text-[#070D1B] font-extrabold text-xs px-4 py-2.5 rounded-xl gold-glow flex items-center gap-2 cursor-pointer hover:brightness-105"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Véhicule</span>
          </button>
        </div>

        {/* Vehicles Cards Grid */}
        {filteredVehicules.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
            Aucun véhicule trouvé dans la base de données. Cliquez sur <strong>"Nouveau Véhicule"</strong> pour créer une fiche.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVehicules.map((v) => (
              <div key={v.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="h-36 bg-slate-200 overflow-hidden relative">
                  <img src="/assets/car_default.jpg" alt={v.marque} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="bg-[#070D1B] text-white px-3 py-1 rounded-md font-mono text-xs font-bold tracking-wider border border-[#C5A059]/40">
                      {v.immatriculation}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      v.statutAdministratif === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-300' :
                      v.statutAdministratif === 'AFFECTE' ? 'bg-blue-50 text-blue-600 border border-blue-300' : 'bg-amber-50 text-amber-600 border border-amber-300'
                    }`}>
                      {v.statutAdministratif}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-['Outfit'] font-extrabold text-base text-slate-900">{v.marque} {v.modele}</h3>
                    <span className="text-[11px] text-slate-500">N° Inventaire MEF: <strong className="text-slate-800">{v.numeroInventaire}</strong></span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Fuel className="w-3.5 h-3.5 text-[#9B783E]" /> {v.typeCarburant}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Gauge className="w-3.5 h-3.5 text-[#9B783E]" /> {v.kilometrageActuel} km
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Car className="w-3.5 h-3.5 text-[#9B783E]" /> Châssis: {v.numeroChassis}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <HeartPulse className="w-3.5 h-3.5 text-[#9B783E]" /> {v.etatTechnique}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => {
                        setEditingVehicule(v);
                        setFormData(v);
                        setIsModalOpen(true);
                      }}
                      className="flex-1 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-[#070D1B] hover:text-[#E5C17C] flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" /> Modifier
                    </button>

                    <button 
                      onClick={() => {
                        setSelectedVehiculeForStatus(v);
                        setStatusFormData({
                          nouveauStatutAdministratif: v.statutAdministratif,
                          nouveauEtatTechnique: v.etatTechnique,
                          motif: '',
                          pieceJustificative: ''
                        });
                        setIsStatusModalOpen(true);
                      }}
                      className="py-1.5 px-3 bg-[#C5A059]/15 border border-[#C5A059]/40 text-[#9B783E] rounded-lg text-xs font-bold hover:bg-[#C5A059] hover:text-[#070D1B] transition-all cursor-pointer"
                      title="Changer le statut"
                    >
                      Statut
                    </button>

                    <button 
                      onClick={() => handleOpenHistory(v)}
                      className="py-1.5 px-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                      title="Historique des statuts"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    <button 
                      onClick={() => handleArchive(v.id)}
                      className="py-1.5 px-2.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-red-600 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                      title="Archiver (Soft delete)"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* CRUD Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#070D1B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[650px] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-slate-900">
                {editingVehicule ? 'Modifier la Fiche Véhicule (Sprint 2)' : 'Nouveau Véhicule (Sprint 2)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleSaveVehicule} className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Immatriculation *</label>
                <input 
                  type="text" 
                  value={formData.immatriculation} 
                  onChange={(e) => setFormData({...formData, immatriculation: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="12345-A-1"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">N° Inventaire MEF *</label>
                <input 
                  type="text" 
                  value={formData.numeroInventaire} 
                  onChange={(e) => setFormData({...formData, numeroInventaire: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="INV-2026-001"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">N° Châssis *</label>
                <input 
                  type="text" 
                  value={formData.numeroChassis} 
                  onChange={(e) => setFormData({...formData, numeroChassis: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="VF1ABC123456789"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Marque *</label>
                <input 
                  type="text" 
                  value={formData.marque} 
                  onChange={(e) => setFormData({...formData, marque: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="Peugeot"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Modèle *</label>
                <input 
                  type="text" 
                  value={formData.modele} 
                  onChange={(e) => setFormData({...formData, modele: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="508"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Carburant *</label>
                <select 
                  value={formData.typeCarburant} 
                  onChange={(e) => setFormData({...formData, typeCarburant: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="DIESEL">Diesel</option>
                  <option value="ESSENCE">Essence</option>
                  <option value="HYBRIDE">Hybride</option>
                  <option value="ELECTRIQUE">Électrique</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Kilométrage Actuel (km) *</label>
                <input 
                  type="number" 
                  value={formData.kilometrageActuel} 
                  onChange={(e) => setFormData({...formData, kilometrageActuel: parseInt(e.target.value)})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Direction / Rattachement</label>
                <input 
                  type="text" 
                  value={formData.direction} 
                  onChange={(e) => setFormData({...formData, direction: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 gold-gradient-bg text-[#070D1B] font-extrabold text-xs rounded-xl shadow-md cursor-pointer">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {isStatusModalOpen && selectedVehiculeForStatus && (
        <div className="fixed inset-0 bg-[#070D1B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-['Outfit'] font-extrabold text-base text-slate-900">
                Changement de Statut — {selectedVehiculeForStatus.immatriculation}
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <form onSubmit={handleStatusChangeSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nouveau Statut Administratif</label>
                <select 
                  value={statusFormData.nouveauStatutAdministratif}
                  onChange={(e) => setStatusFormData({...statusFormData, nouveauStatutAdministratif: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="AFFECTE">AFFECTE</option>
                  <option value="RESERVE">RESERVE</option>
                  <option value="EN_ENTRETIEN">EN_ENTRETIEN</option>
                  <option value="EN_REPARATION">EN_REPARATION</option>
                  <option value="IMMOBILISE">IMMOBILISE</option>
                  <option value="TRANSFERE">TRANSFERE</option>
                  <option value="REFORME">REFORME</option>
                  <option value="ARCHIVE">ARCHIVE (Soft Delete)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nouveau État Technique</label>
                <select 
                  value={statusFormData.nouveauEtatTechnique}
                  onChange={(e) => setStatusFormData({...statusFormData, nouveauEtatTechnique: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="NEUF">NEUF</option>
                  <option value="BON_ETAT">BON_ETAT</option>
                  <option value="ETAT_MOYEN">ETAT_MOYEN</option>
                  <option value="ENTRETIEN_NECESSAIRE">ENTRETIEN_NECESSAIRE</option>
                  <option value="ACCIDENTE">ACCIDENTE</option>
                  <option value="EN_REPARATION">EN_REPARATION</option>
                  <option value="HORS_SERVICE">HORS_SERVICE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motif du changement *</label>
                <textarea 
                  value={statusFormData.motif}
                  onChange={(e) => setStatusFormData({...statusFormData, motif: e.target.value})}
                  placeholder="Ex: Entretien périodique programmé par la Direction"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  rows={3}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 gold-gradient-bg text-[#070D1B] font-extrabold text-xs rounded-xl shadow-md cursor-pointer">Valider le Changement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Timeline Modal */}
      {isHistoryModalOpen && historyVehiculeInfo && (
        <div className="fixed inset-0 bg-[#070D1B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[600px] rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h3 className="font-['Outfit'] font-extrabold text-base text-slate-900">
                  Historique des Statuts — {historyVehiculeInfo.immatriculation}
                </h3>
                <span className="text-xs text-slate-500">{historyVehiculeInfo.marque} {historyVehiculeInfo.modele}</span>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">&times;</button>
            </div>

            {historiqueList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Aucune transition de statut enregistrée pour ce véhicule.
              </div>
            ) : (
              <div className="flex flex-col gap-4 relative pl-4 border-l-2 border-[#C5A059]/40 my-2">
                {historiqueList.map((h) => (
                  <div key={h.id} className="relative flex flex-col gap-1">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-[#C5A059] border-2 border-white shadow-sm" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900">
                        {h.ancienStatutAdministratif || 'INITIAL'} → <span className="text-[#9B783E]">{h.nouveauStatutAdministratif}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(h.dateChangement).toLocaleString('fr-FR')}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong>Motif:</strong> {h.motif || 'Non renseigné'}
                    </p>
                    <span className="text-[10px] text-slate-400">Agent responsable: <strong>{h.utilisateur}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
