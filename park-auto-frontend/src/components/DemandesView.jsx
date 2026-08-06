import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, CheckCircle, XCircle, Clock, Calendar, MapPin, Users,
  Plus, Search, X, SlidersHorizontal,
  ChevronRight, Clock8, ClipboardCheck, Ban,
  UserCheck, ArrowUpDown, RefreshCw, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const STATUT_OPTIONS = [
  { id: 'TOUTES', label: 'Toutes les Demandes', color: 'slate' },
  { id: 'EN_ATTENTE_VALIDATION', label: 'En Attente (N1)', color: 'amber' },
  { id: 'VALIDEE_SERVICE', label: 'Validées Service', color: 'blue' },
  { id: 'APPROUVEE_AFFECTEE', label: 'Affectées & En Cours', color: 'emerald' },
  { id: 'TERMINEE', label: 'Terminées', color: 'slate' },
  { id: 'REJETEE', label: 'Rejetées', color: 'red' },
];

const STATUS_STYLES = {
  EN_ATTENTE_VALIDATION: {
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Clock,
    label: 'En Attente N1',
  },
  VALIDEE_SERVICE: {
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: ClipboardCheck,
    label: 'Validée Service',
  },
  APPROUVEE_AFFECTEE: {
    bg: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle,
    label: 'Affectée',
  },
  REJETEE: {
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
    label: 'Rejetée',
  },
  TERMINEE: {
    bg: 'bg-slate-50 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: CheckCircle,
    label: 'Terminée',
  },
  ANNULEE: {
    bg: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: Ban,
    label: 'Annulée',
  },
};

export default function DemandesView({ onOpenAffectationModal }) {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('TOUTES');
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('TOUTES');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    motif: '',
    destination: '',
    dateHeureDepart: '',
    dateHeureRetourEstimee: '',
    nombrePassagers: 1,
    listePassagers: '',
  });

  const [isValidN1ModalOpen, setIsValidN1ModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [valAction, setValAction] = useState('APPROUVER');
  const [motifRejet, setMotifRejet] = useState('');

  useEffect(() => { fetchDemandes(); }, []);

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/demandes');
      setDemandes(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemande = async (e) => {
    e.preventDefault();
    try {
      await api.post('/demandes', newForm);
      toast.success('Demande créée avec succès');
      setIsNewModalOpen(false);
      setNewForm({ motif: '', destination: '', dateHeureDepart: '', dateHeureRetourEstimee: '', nombrePassagers: 1, listePassagers: '' });
      fetchDemandes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleOpenValidationModal = (demande) => {
    setSelectedDemande(demande);
    setValAction('APPROUVER');
    setMotifRejet('');
    setIsValidN1ModalOpen(true);
  };

  const handleValidationN1Submit = async (e) => {
    e.preventDefault();
    if (!selectedDemande) return;
    const isApprouve = valAction === 'APPROUVER';
    if (!isApprouve && (!motifRejet || !motifRejet.trim())) {
      toast.error('Le motif de rejet est obligatoire');
      return;
    }
    try {
      await api.patch(`/demandes/${selectedDemande.id}/validation-service`, {
        approuve: isApprouve,
        motifRejet: isApprouve ? null : motifRejet.trim(),
      });
      toast.success(isApprouve ? 'Demande validée (Niveau 1)' : 'Demande rejetée');
      setIsValidN1ModalOpen(false);
      fetchDemandes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const destinations = useMemo(() => {
    const set = new Set(demandes.map(d => d.destination).filter(Boolean));
    return ['TOUTES', ...Array.from(set).sort()];
  }, [demandes]);

  const filteredDemandes = useMemo(() => {
    let result = [...demandes];

    if (filterStatut !== 'TOUTES') {
      result = result.filter(d => d.statut === filterStatut);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(d =>
        (d.reference && d.reference.toLowerCase().includes(q)) ||
        (d.motif && d.motif.toLowerCase().includes(q)) ||
        (d.destination && d.destination.toLowerCase().includes(q)) ||
        (d.demandeurNomComplet && d.demandeurNomComplet.toLowerCase().includes(q)) ||
        (d.demandeurDirection && d.demandeurDirection.toLowerCase().includes(q))
      );
    }

    if (destinationFilter !== 'TOUTES') {
      result = result.filter(d => d.destination === destinationFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [demandes, filterStatut, searchQuery, destinationFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: demandes.length,
    enAttente: demandes.filter(d => d.statut === 'EN_ATTENTE_VALIDATION').length,
    validees: demandes.filter(d => d.statut === 'VALIDEE_SERVICE').length,
    affectees: demandes.filter(d => d.statut === 'APPROUVEE_AFFECTEE' || d.statut === 'EN_COURS').length,
    rejetees: demandes.filter(d => d.statut === 'REJETEE').length,
    terminees: demandes.filter(d => d.statut === 'TERMINEE').length,
  }), [demandes]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = savedUser?.role?.nom || savedUser?.role || 'CONSULTATION';
  const canValidateN1 = ['ADMIN', 'RESPONSABLE_SERVICE', 'GESTIONNAIRE_CENTRAL'].includes(roleName);
  const canAffecterN2 = ['ADMIN', 'GESTIONNAIRE_CENTRAL', 'GESTIONNAIRE_LOCAL'].includes(roleName);

  const StatCard = ({ icon: Icon, label, count, color }) => (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-black text-[#0A1E3F]">{count}</p>
      </div>
    </div>
  );

  const StatusBadge = ({ statut }) => {
    const s = STATUS_STYLES[statut];
    if (!s) return <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100">{statut}</span>;
    const Icon = s.icon;
    return (
      <span className={`${s.badge} text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5 border`}>
        <Icon className="w-3 h-3" /> {s.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-lg md:text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <Send className="w-5 h-5 md:w-6 md:h-6 text-[#C59B27]" />
            Demandes de Déplacement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total} demande{stats.total !== 1 ? 's' : ''} enregistrée{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:brightness-105 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Nouvelle Demande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Clock8} label="En Attente N1" count={stats.enAttente} color="bg-amber-500" />
        <StatCard icon={ClipboardCheck} label="Validées Service" count={stats.validees} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Affectées" count={stats.affectees} color="bg-emerald-500" />
        <StatCard icon={Ban} label="Rejetées" count={stats.rejetees} color="bg-red-500" />
        <StatCard icon={CheckCircle} label="Terminées" count={stats.terminees} color="bg-slate-500" />
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, motif, destination, agent..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 focus:border-[#C59B27] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              showFilters || destinationFilter !== 'TOUTES'
                ? 'bg-[#0A1E3F] text-[#D7B14A] border-[#0A1E3F]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres
            {destinationFilter !== 'TOUTES' && (
              <span className="w-2 h-2 rounded-full bg-[#C59B27]" />
            )}
          </button>
          <button
            onClick={fetchDemandes}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer shrink-0"
            title="Rafraîchir"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={destinationFilter}
                onChange={e => setDestinationFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30"
              >
                <option value="TOUTES">Toutes les destinations</option>
                {destinations.filter(d => d !== 'TOUTES').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Trier par :</span>
              {['createdAt', 'dateHeureDepart', 'destination'].map(f => (
                <button
                  key={f}
                  onClick={() => toggleSort(f)}
                  className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    sortField === f
                      ? 'bg-[#0A1E3F] text-[#D7B14A]'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {f === 'createdAt' ? 'Date' : f === 'dateHeureDepart' ? 'Départ' : 'Destination'}
                  {sortField === f && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUT_OPTIONS.filter(t => t.id !== 'TERMINEE' && t.id !== 'REJETEE' || stats[t.id === 'TERMINEE' ? 'terminees' : 'rejetees'] > 0 || filterStatut === t.id).map((tab) => {
            const count = tab.id === 'TOUTES' ? stats.total
              : tab.id === 'EN_ATTENTE_VALIDATION' ? stats.enAttente
              : tab.id === 'VALIDEE_SERVICE' ? stats.validees
              : tab.id === 'APPROUVEE_AFFECTEE' ? stats.affectees
              : tab.id === 'REJETEE' ? stats.rejetees
              : stats.terminees;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatut(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filterStatut === tab.id
                    ? tab.id === 'TOUTES'
                      ? 'bg-[#0A1E3F] text-[#D7B14A] shadow-sm'
                      : tab.id === 'EN_ATTENTE_VALIDATION' ? 'bg-amber-500 text-white shadow-sm'
                      : tab.id === 'VALIDEE_SERVICE' ? 'bg-blue-500 text-white shadow-sm'
                      : tab.id === 'APPROUVEE_AFFECTEE' ? 'bg-emerald-500 text-white shadow-sm'
                      : tab.id === 'REJETEE' ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-slate-500 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {tab.id !== 'TOUTES' && count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    filterStatut === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-outfit font-extrabold text-sm text-slate-900">Registre des Demandes</h3>
          <span className="text-[11px] font-bold text-slate-400">
            {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? 's' : ''} affichée{filteredDemandes.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400">Chargement des demandes...</div>
          ) : filteredDemandes.length === 0 ? (
            <div className="p-10 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">Aucune demande trouvée</p>
            </div>
          ) : (
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Motif</th>
                  <th>Destination</th>
                  <th>Départ</th>
                  <th>Demandeur</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemandes.map((d) => (
                  <tr key={d.id} className="cursor-pointer" onClick={() => navigate(`/demandes/${d.id}`)}>
                    <td>
                      <span className="font-mono text-xs font-black text-[#C59B27] bg-[#C59B27]/10 px-2.5 py-1 rounded-lg border border-[#C59B27]/20">
                        {d.reference}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-extrabold text-slate-900 block leading-tight max-w-[280px] truncate">{d.motif}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(d.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B27]" /> {d.destination}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(d.dateHeureDepart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {new Date(d.dateHeureRetourEstimee).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {new Date(d.dateHeureDepart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-slate-800 block">{d.demandeurNomComplet || 'Agent MEF'}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {d.nombrePassagers} passager{d.nombrePassagers > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <StatusBadge statut={d.statut} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/demandes/${d.id}`); }}
                          className="w-8 h-8 rounded-lg bg-[#0A1E3F]/5 border border-[#0A1E3F]/10 text-[#0A1E3F] hover:bg-[#0A1E3F] hover:text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                          title="Consulter la fiche demande"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {d.statut === 'EN_ATTENTE_VALIDATION' && canValidateN1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenValidationModal(d); }}
                            className="w-8 h-8 rounded-lg bg-[#0A1E3F] hover:bg-[#122B55] text-[#D7B14A] flex items-center justify-center transition-all cursor-pointer"
                            title="Décision N1"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {d.statut === 'VALIDEE_SERVICE' && canAffecterN2 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenAffectationModal && onOpenAffectationModal(d); }}
                            className="w-8 h-8 rounded-lg bg-[#C59B27]/10 border border-[#C59B27]/40 text-[#94700E] hover:bg-[#C59B27] hover:text-[#0A1E3F] flex items-center justify-center transition-all cursor-pointer"
                            title="Affecter Véhicule"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {filteredDemandes.length > 0 && (
        <div className="text-center text-[10px] text-slate-400 font-medium pb-2">
          {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? 's' : ''} affichée{filteredDemandes.length !== 1 ? 's' : ''}
          {demandes.length !== filteredDemandes.length && ` sur ${demandes.length} totale${demandes.length !== 1 ? 's' : ''}`}
        </div>
      )}

      {filteredDemandes.length > 0 && (
        <div className="text-center text-[10px] text-slate-400 font-medium pb-2">
          {filteredDemandes.length} demande{filteredDemandes.length !== 1 ? 's' : ''} affichée{filteredDemandes.length !== 1 ? 's' : ''}
          {demandes.length !== filteredDemandes.length && ` sur ${demandes.length} totale${demandes.length !== 1 ? 's' : ''}`}
        </div>
      )}

      {/* Modal New Request */}
      {isNewModalOpen && (
        <div className="fixed inset-0 bg-[#0A1E3F]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
                <Send className="w-5 h-5 text-[#C59B27]" />
                Nouvelle Demande
              </h2>
              <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDemande} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Motif de la mission *</label>
                <input type="text" required placeholder="ex: Inspection budgétaire régionale..." value={newForm.motif} onChange={e => setNewForm({ ...newForm, motif: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-medium" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Destination *</label>
                <input type="text" required placeholder="ex: Tanger, Casablanca..." value={newForm.destination} onChange={e => setNewForm({ ...newForm, destination: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Départ *</label>
                  <input type="datetime-local" required value={newForm.dateHeureDepart} onChange={e => setNewForm({ ...newForm, dateHeureDepart: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Retour estimé *</label>
                  <input type="datetime-local" required value={newForm.dateHeureRetourEstimee} onChange={e => setNewForm({ ...newForm, dateHeureRetourEstimee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-medium" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Passagers</label>
                  <input type="number" min="1" value={newForm.nombrePassagers} onChange={e => setNewForm({ ...newForm, nombrePassagers: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-bold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Accompagnateurs</label>
                  <input type="text" placeholder="M. Bennani, Mme Alami..." value={newForm.listePassagers} onChange={e => setNewForm({ ...newForm, listePassagers: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C59B27]/30 font-medium" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs transition-all cursor-pointer">Annuler</button>
                <button type="submit"
                  className="px-4 py-2.5 rounded-xl gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs shadow-md hover:brightness-105 transition-all cursor-pointer">Soumettre la demande</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Validation N1 */}
      {isValidN1ModalOpen && selectedDemande && (
        <div className="fixed inset-0 bg-[#0A1E3F]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#0A1E3F] uppercase flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#C59B27]" />
                Décision N1 (Service)
              </h2>
              <button onClick={() => setIsValidN1ModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="font-bold text-slate-700">Réf :</span> {selectedDemande.reference}</p>
              <p><span className="font-bold text-slate-700">Motif :</span> {selectedDemande.motif}</p>
              <p><span className="font-bold text-slate-700">Destination :</span> {selectedDemande.destination}</p>
              <p><span className="font-bold text-slate-700">Agent :</span> {selectedDemande.demandeurNomComplet}</p>
            </div>
            <form onSubmit={handleValidationN1Submit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-2">Décision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setValAction('APPROUVER')}
                    className={`p-3 rounded-xl font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      valAction === 'APPROUVER' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <CheckCircle className="w-4 h-4" /> Approuver
                  </button>
                  <button type="button" onClick={() => setValAction('REJETER')}
                    className={`p-3 rounded-xl font-extrabold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      valAction === 'REJETER' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}>
                    <XCircle className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              </div>
              {valAction === 'REJETER' && (
                <div>
                  <label className="block font-bold text-red-700 mb-1.5">Motif du rejet *</label>
                  <textarea required rows={3} placeholder="Raison détaillée du rejet..." value={motifRejet}
                    onChange={e => setMotifRejet(e.target.value)}
                    className="w-full p-2.5 bg-red-50/50 border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 font-medium" />
                </div>
              )}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsValidN1ModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 transition-all cursor-pointer">Annuler</button>
                <button type="submit"
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-white shadow-md transition-all cursor-pointer ${
                    valAction === 'APPROUVER' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}>Valider la décision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
