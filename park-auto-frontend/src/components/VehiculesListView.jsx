import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Search, Plus, Filter, RotateCw, Eye, PenTool, Archive, Fuel, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import VehiculeFormModal from './VehiculeFormModal';
import { getVehiclePhoto, getStatusStyle, MoroccanPlate, DIRECTIONS_MEF, directionShort, FUEL_LABELS } from '../utils/vehicule';

export default function VehiculesListView() {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [carburantFilter, setCarburantFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Add/Edit modal state (editingVehicule = null → creation)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);

  const fetchVehicules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicules?size=100');
      if (res) {
        const list = res.data?.content || res.content || res.data || (Array.isArray(res) ? res : []);
        setVehicules(Array.isArray(list) ? list : []);
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

  const filteredVehicules = vehicules.filter((v) => {
    const matchesSearch = !search ||
      (v.immatriculation && v.immatriculation.toLowerCase().includes(search.toLowerCase())) ||
      (v.marque && v.marque.toLowerCase().includes(search.toLowerCase())) ||
      (v.modele && v.modele.toLowerCase().includes(search.toLowerCase())) ||
      (v.numeroInventaire && v.numeroInventaire.toLowerCase().includes(search.toLowerCase()));
    const matchesDirection = !directionFilter || v.direction === directionFilter;
    const matchesCarburant = !carburantFilter || v.typeCarburant === carburantFilter;
    const matchesStatut = !statutFilter || v.statutAdministratif === statutFilter;
    return matchesSearch && matchesDirection && matchesCarburant && matchesStatut;
  });

  const handleArchive = async (id) => {
    if (!window.confirm('Voulez-vous vraiment archiver ce véhicule ?')) return;
    try {
      await api.delete(`/vehicules/${id}`);
      toast.success('Véhicule archivé avec succès');
      fetchVehicules();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'archivage');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <Car className="w-6 h-6 text-[#C59B27]" />
            Flotte Automobile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestion opérationnelle des véhicules du Parc Auto MEF
          </p>
        </div>
        <button
          onClick={fetchVehicules}
          className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer shrink-0"
        >
          <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

        {/* Toolbar: search + filters + add */}
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
              placeholder="Rechercher par immatriculation, marque, modèle, n° inventaire..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer max-w-[190px]"
            >
              <option value="">Toutes les directions</option>
              {DIRECTIONS_MEF.map((d) => (
                <option key={d.short} value={d.value}>{d.short} — {d.value}</option>
              ))}
            </select>

            <select
              value={carburantFilter}
              onChange={(e) => setCarburantFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="">Tous carburants</option>
              {Object.entries(FUEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="AFFECTE">Affecté</option>
              <option value="RESERVE">Réservé</option>
              <option value="EN_ENTRETIEN">En Entretien</option>
              <option value="EN_REPARATION">En Réparation</option>
              <option value="IMMOBILISE">Immobilisé</option>
              <option value="HORS_SERVICE">Hors Service</option>
              <option value="ARCHIVE">Archivé</option>
            </select>
          </div>

          <motion.button
            onClick={() => { setEditingVehicule(null); setIsModalOpen(true); }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold flex items-center gap-2 cursor-pointer ml-auto"
            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(197,160,89,0.5)' }}
            whileTap={{ scale: 0.97 }}
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Véhicule</span>
          </motion.button>
        </motion.div>

        {/* Fleet Data Table */}
        <motion.div
          className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Véhicules</h3>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredVehicules.length} véhicule{filteredVehicules.length > 1 ? 's' : ''} affiché{filteredVehicules.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Immatriculation</th>
                  <th>Marque &amp; Modèle</th>
                  <th>Direction MEF</th>
                  <th>Carburant</th>
                  <th>Kilométrage</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="!py-16 text-center">
                      <Car className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">{loading ? 'Chargement des véhicules...' : 'Aucun véhicule trouvé'}</p>
                      {!loading && <p className="text-[11px] text-slate-400 mt-1">Modifiez vos filtres ou cliquez sur « Nouveau Véhicule ».</p>}
                    </td>
                  </tr>
                ) : (
                  filteredVehicules.map((v) => (
                    <tr key={v.id}>
                      {/* Photo */}
                      <td>
                        <img
                          src={getVehiclePhoto(v.marque, v.modele)}
                          alt={`${v.marque} ${v.modele}`}
                          className="w-16 h-11 object-cover rounded-lg border border-slate-200"
                        />
                      </td>

                      {/* Moroccan plate */}
                      <td>
                        <MoroccanPlate immatriculation={v.immatriculation} />
                      </td>

                      {/* Brand & model */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                            <img
                              src={`/assets/logo_${(v.marque || '').toLowerCase().replace(/[^a-z0-9]/g, '')}.png`}
                              alt={v.marque}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-[9px] font-black text-[#94700E] uppercase">${(v.marque || 'MEF').slice(0, 3)}</span>`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold text-slate-900 block leading-tight">{v.marque} {v.modele}</span>
                            <span className="text-[10px] text-slate-400 block">N° Inv. {v.numeroInventaire}</span>
                          </div>
                        </div>
                      </td>

                      {/* MEF direction */}
                      <td>
                        <span
                          className="px-2 py-1 rounded-md bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[11px] font-extrabold text-[#0A1E3F] whitespace-nowrap"
                          title={v.direction}
                        >
                          {directionShort(v.direction)}
                        </span>
                      </td>

                      {/* Fuel */}
                      <td>
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                          <Fuel className="w-3.5 h-3.5 text-[#94700E]" />
                          {FUEL_LABELS[v.typeCarburant] || v.typeCarburant}
                        </span>
                      </td>

                      {/* Mileage */}
                      <td>
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          <Gauge className="w-3.5 h-3.5 text-[#94700E]" />
                          {(v.kilometrageActuel || 0).toLocaleString('fr-FR')} km
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase whitespace-nowrap ${getStatusStyle(v.statutAdministratif)}`}>
                          {v.statutAdministratif}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate(`/vehicules/${v.id}`)}
                            className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[#0A1E3F] hover:bg-[#0A1E3F] hover:text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                            title="Consulter la fiche véhicule"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingVehicule(v); setIsModalOpen(true); }}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Modifier le véhicule"
                          >
                            <PenTool className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(v.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center transition-all cursor-pointer"
                            title="Archiver (Soft delete)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      {/* Add/Edit Vehicle Modal */}
      <VehiculeFormModal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingVehicule(null); }}
        onSaved={fetchVehicules}
        vehicule={editingVehicule}
      />
    </div>
  );
}
