import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Plus, X, BarChart2, PieChart as PieChartIcon, 
  Building2, Fuel, Calendar, Calculator, CheckCircle2, AlertTriangle, AlertOctagon, 
  Filter, Eye, Trash2, Edit, Lock, Unlock, FileText, ArrowUpRight, ShieldAlert, Check, 
  RefreshCw, Clock, Search, ChevronRight, Layers, ArrowRight, AlertCircle, CheckCircle,
  HelpCircle, Receipt, Landmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { budgetService } from '../services/budgetService';
import { getApiErrorMessage } from '../services/api';
import ConfirmModal from './ConfirmModal';
import { directionShort } from '../utils/vehicule';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import MefSelect from './ui/MefSelect';

const DIRECTIONS = [
  'Direction du Budget',
  'Direction Générale des Impôts',
  'Administration des Douanes et Impôts Indirects',
  'Trésorerie Générale du Royaume',
  'Direction des Affaires Domaniales',
  'Direction des Affaires Administratives et Générales (DAAG)'
];

const NATURES_DEPENSE = [
  { key: 'CARBURANT', label: 'Carburant & Lubrifiants', icon: Fuel, color: 'text-amber-500 bg-amber-50' },
  { key: 'LUBRIFIANTS', label: 'Lubrifiants & Huiles', icon: Fuel, color: 'text-amber-600 bg-amber-50' },
  { key: 'ASSURANCE', label: 'Assurances Flotte', icon: ShieldAlert, color: 'text-blue-500 bg-blue-50' },
  { key: 'ENTRETIEN', label: 'Entretiens Préventifs', icon: Layers, color: 'text-indigo-500 bg-indigo-50' },
  { key: 'REPARATION', label: 'Réparations Curatives & Pannes', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
  { key: 'PIECES_RECHANGE', label: 'Pièces de Rechange', icon: Layers, color: 'text-purple-500 bg-purple-50' },
  { key: 'PNEUS', label: 'Pneumatiques & Équilibrage', icon: Layers, color: 'text-slate-500 bg-slate-50' },
  { key: 'VISITE_TECHNIQUE', label: 'Visites Techniques & Contrôles', icon: CheckCircle2, color: 'text-teal-500 bg-teal-50' },
  { key: 'TAXES', label: 'Vignettes & Taxes Automobiles', icon: Landmark, color: 'text-emerald-500 bg-emerald-50' },
  { key: 'LOCATION', label: 'Location Longue Durée (LLD)', icon: Building2, color: 'text-cyan-500 bg-cyan-50' },
  { key: 'AUTRES', label: 'Autres Frais d\'Exploitation', icon: Receipt, color: 'text-gray-500 bg-gray-50' }
];

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const PALETTE = ['#0F1D32', '#C5A059', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

const readCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export default function BudgetView({ user: userProp }) {
  const user = userProp || readCurrentUser();
  const roleName = typeof user?.role === 'string' ? user.role : (user?.role?.nom || user?.role?.name || 'CONSULTATION');
  const canManageBudget = ['ADMIN', 'RESPONSABLE_FINANCIER'].includes(roleName);

  const [activeTab, setActiveTab] = useState('directions'); // 'directions' | 'engagements' | 'exercices' | 'alertes' | 'previsions' | 'synthese'
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [budgets, setBudgets] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [previsions, setPrevisions] = useState([]);
  const [synthese, setSynthese] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('ALL');
  const [filterNature, setFilterNature] = useState('ALL');
  const [filterStatutEng, setFilterStatutEng] = useState('ALL');

  // Modals
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showEngagementModal, setShowEngagementModal] = useState(false);
  const [showLiquidationModal, setShowLiquidationModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [showExerciceModal, setShowExerciceModal] = useState(false);
  const [showPrevisionModal, setShowPrevisionModal] = useState(false);
  const [selectedEngagementDetail, setSelectedEngagementDetail] = useState(null);

  // Selected item for actions
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [selectedExercice, setSelectedExercice] = useState(null);

  // Confirm Modals (replace window.confirm / window.prompt)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', message: '', label: '', placeholder: '', onConfirm: () => {}, loading: false });

  // Forms
  const [budgetForm, setBudgetForm] = useState({
    id: null,
    annee: new Date().getFullYear(),
    direction: DIRECTIONS[0],
    service: 'Division du Parc Automobile',
    centreCout: 'CC-PARC-01',
    natureDepense: 'CARBURANT',
    montantAlloue: '',
    montantEngage: 0,
    montantRealise: 0
  });

  const [engagementForm, setEngagementForm] = useState({
    annee: new Date().getFullYear(),
    direction: DIRECTIONS[0],
    service: 'Division du Parc Automobile',
    centreCout: 'CC-PARC-01',
    natureDepense: 'CARBURANT',
    montantEngage: '',
    beneficiaire: '',
    objet: '',
    referencePiece: ''
  });

  const [liquidationForm, setLiquidationForm] = useState({
    montantLiquide: '',
    referenceFacture: ''
  });

  const [clotureForm, setClotureForm] = useState({
    observations: ''
  });

  const [exerciceForm, setExerciceForm] = useState({
    annee: new Date().getFullYear() + 1,
    observations: ''
  });

  const [previsionForm, setPrevisionForm] = useState({
    id: null,
    direction: DIRECTIONS[0],
    annee: new Date().getFullYear(),
    mois: 1,
    kmPrevus: '',
    consoMoyenne: '7.5',
    prixUnitairePrevus: '13.50',
    quantiteReelle: 0,
    montantReel: 0
  });

  // Current year exercice status
  const currentExercice = exercices.find(e => Number(e.annee) === Number(annee));
  const isExerciceCloture = currentExercice?.statut === 'CLOTURE';

  useEffect(() => {
    fetchData();
  }, [annee]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let loadErrors = [];
      const [bData, eData, exData, aData, pData, sData] = await Promise.all([
        budgetService.getBudgetsByAnnee(annee).catch((e) => { loadErrors.push(e); return []; }),
        budgetService.getAllEngagements(annee).catch((e) => { loadErrors.push(e); return []; }),
        budgetService.getAllExercices().catch((e) => { loadErrors.push(e); return []; }),
        budgetService.getAlertesActives(annee).catch((e) => { loadErrors.push(e); return []; }),
        budgetService.getAllPrevisions().catch((e) => { loadErrors.push(e); return []; }),
        budgetService.getSynthese(annee).catch((e) => { loadErrors.push(e); return null; })
      ]);
      if (loadErrors.length > 0) toast.error(`Certaines données n'ont pas pu être chargées (${loadErrors.length} erreur(s)).`);

      const bList = Array.isArray(bData) ? bData : (bData?.content || bData?.data || []);
      setBudgets(Array.isArray(bList) ? bList : []);
      const eList = Array.isArray(eData) ? eData : (eData?.content || eData?.data || []);
      setEngagements(Array.isArray(eList) ? eList : []);
      const exList = Array.isArray(exData) ? exData : (exData?.content || exData?.data || []);
      setExercices(Array.isArray(exList) ? exList : []);
      const aList = Array.isArray(aData) ? aData : (aData?.content || aData?.data || []);
      setAlertes(Array.isArray(aList) ? aList : []);
      const pList = Array.isArray(pData) ? pData : (pData?.content || pData?.data || []);
      setPrevisions(Array.isArray(pList) ? pList : []);
      setSynthese(sData);
    } catch (err) {
      console.error('Erreur chargement budget:', err);
      toast.error('Erreur lors du chargement des données budgétaires');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers: Budget Envelope ---
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...budgetForm,
        annee: Number(budgetForm.annee),
        montantAlloue: parseFloat(budgetForm.montantAlloue),
        montantEngage: parseFloat(budgetForm.montantEngage || 0),
        montantRealise: parseFloat(budgetForm.montantRealise || 0)
      };
      if (!Number.isFinite(payload.montantAlloue) || payload.montantAlloue < 0) {
        toast.error('Le montant alloué doit être un nombre positif.');
        return;
      }
      if (budgetForm.id) {
        await budgetService.updateBudget(budgetForm.id, payload);
        toast.success('Enveloppe budgétaire mise à jour avec succès');
      } else {
        await budgetService.createBudget(payload);
        toast.success('Nouvelle dotation budgétaire créée avec succès');
      }
      setShowBudgetModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la sauvegarde de la dotation'));
    }
  };

  const handleEditBudget = (b) => {
    setBudgetForm({
      id: b.id,
      annee: b.annee,
      direction: b.direction,
      service: b.service || '',
      centreCout: b.centreCout || '',
      natureDepense: b.natureDepense,
      montantAlloue: String(b.montantAlloue || ''),
      montantEngage: b.montantEngage || 0,
      montantRealise: b.montantRealise || 0
    });
    setShowBudgetModal(true);
  };

  const handleDeleteBudget = (b) => {
    setConfirmModal({
      isOpen: true,
      title: 'Suppression d\'enveloppe budgétaire',
      message: `Confirmez-vous la suppression de l'enveloppe budgétaire pour ${b.direction} (${b.natureDepense}) ?`,
      variant: 'danger',
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await budgetService.deleteBudget(b.id);
          toast.success('Enveloppe budgétaire supprimée');
          setConfirmModal({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false });
          fetchData();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible de supprimer cette enveloppe budgétaire'));
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // --- Handlers: Engagement ---
  const handleOpenEngagementModal = (presetBudget = null) => {
    if (isExerciceCloture) {
      toast.error(`L'exercice fiscal ${annee} est clôturé. Aucun nouvel engagement n'est autorisé.`);
      return;
    }
    setEngagementForm({
      annee: annee,
      direction: presetBudget ? presetBudget.direction : DIRECTIONS[0],
      service: presetBudget?.service || 'Division du Parc Automobile',
      centreCout: presetBudget?.centreCout || 'CC-PARC-01',
      natureDepense: presetBudget ? presetBudget.natureDepense : 'CARBURANT',
      montantEngage: '',
      beneficiaire: '',
      objet: '',
      referencePiece: ''
    });
    setShowEngagementModal(true);
  };

  // Live balance for selected engagement form combination
  const currentAvailableBalance = useMemo(() => {
    const found = budgets.find(b => 
      b.direction === engagementForm.direction && 
      b.natureDepense === engagementForm.natureDepense &&
      Number(b.annee) === Number(engagementForm.annee)
    );
    if (!found) return null;
    const alloue = Number(found.montantAlloue || 0);
    const engage = Number(found.montantEngage || 0);
    const realise = Number(found.montantRealise || 0);
    const bloque = Math.max(engage, realise);
    return Math.max(0, alloue - bloque);
  }, [budgets, engagementForm.direction, engagementForm.natureDepense, engagementForm.annee]);

  const handleEngagementSubmit = async (e) => {
    e.preventDefault();
    try {
      const montant = parseFloat(engagementForm.montantEngage);
      if (!Number.isFinite(montant) || montant <= 0) {
        toast.error('Le montant de l\'engagement doit être strictement positif.');
        return;
      }
      if (currentAvailableBalance !== null && montant > currentAvailableBalance) {
        toast.error(`Solde budgétaire insuffisant. Disponible : ${currentAvailableBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD.`);
        return;
      }
      const payload = {
        ...engagementForm,
        annee: Number(engagementForm.annee),
        montantEngage: montant
      };
      await budgetService.createEngagement(payload);
      toast.success('Engagement budgétaire enregistré et validé avec succès');
      setShowEngagementModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement de l\'engagement'));
    }
  };

  const handleOpenLiquidation = (eng) => {
    setSelectedEngagement(eng);
    setLiquidationForm({
      montantLiquide: String(eng.montantEngage || ''),
      referenceFacture: eng.referencePiece || ''
    });
    setShowLiquidationModal(true);
  };

  const handleLiquidationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEngagement) return;
    try {
      const montant = parseFloat(liquidationForm.montantLiquide);
      if (!Number.isFinite(montant) || montant <= 0) {
        toast.error('Le montant de liquidation doit être positif.');
        return;
      }
      await budgetService.liquiderEngagement(selectedEngagement.id, {
        montantLiquide: montant,
        referenceFacture: liquidationForm.referenceFacture
      });
      toast.success('Engagement liquidé et facture enregistrée');
      setShowLiquidationModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la liquidation'));
    }
  };

  const handleAnnulerEngagement = (eng) => {
    setPromptModal({
      isOpen: true,
      title: `Annulation de l'engagement ${eng.numeroEngagement}`,
      message: `Veuillez saisir le motif d'annulation pour cet engagement budgétaire.`,
      label: 'Motif d\'annulation',
      placeholder: 'Saisir le motif d\'annulation...',
      loading: false,
      onConfirm: async (motif) => {
        setPromptModal(prev => ({ ...prev, loading: true }));
        try {
          await budgetService.annulerEngagement(eng.id, motif);
          toast.success(`Engagement ${eng.numeroEngagement} annulé`);
          setPromptModal({ isOpen: false, title: '', message: '', label: '', placeholder: '', onConfirm: () => {}, loading: false });
          fetchData();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible d\'annuler cet engagement'));
          setPromptModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  // --- Handlers: Exercices Fiscaux ---
  const handleOpenCloture = (ex) => {
    setSelectedExercice(ex);
    setClotureForm({
      observations: `Clôture annuelle de l'exercice budgétaire ${ex.annee} par la Direction du Budget.`
    });
    setShowClotureModal(true);
  };

  const handleClotureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExercice) return;
    try {
      await budgetService.cloturerExercice(selectedExercice.annee, clotureForm);
      toast.success(`Exercice ${selectedExercice.annee} clôturé avec succès`);
      setShowClotureModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de la clôture de l\'exercice'));
    }
  };

  const handleRouvrirExercice = (ex) => {
    setConfirmModal({
      isOpen: true,
      title: `Réouverture de l'exercice ${ex.annee}`,
      message: `Voulez-vous rouvrir l'exercice fiscal ${ex.annee} ? Les engagements seront de nouveau autorisés.`,
      variant: 'warning',
      loading: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
          await budgetService.rouvrirExercice(ex.annee);
          toast.success(`Exercice ${ex.annee} réouvert`);
          setConfirmModal({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false });
          fetchData();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Impossible de rouvrir cet exercice'));
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleEditExercice = (ex) => {
    setExerciceForm({
      isEdit: true,
      annee: ex.annee,
      observations: ex.observations || ''
    });
    setShowExerciceModal(true);
  };

  const handleDeleteExercice = (ex) => {
    setConfirmModal({
      isOpen: true,
      title: `Supprimer l'exercice ${ex.annee}`,
      message: `Êtes-vous sûr de vouloir supprimer définitivement l'exercice fiscal ${ex.annee} ? Cette action est irréversible.`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          setConfirmModal(prev => ({ ...prev, loading: true }));
          await budgetService.deleteExercice(ex.annee);
          toast.success(`Exercice fiscal ${ex.annee} supprimé avec succès`);
          setConfirmModal({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false });
          fetchData();
        } catch (err) {
          toast.error(getApiErrorMessage(err, 'Erreur lors de la suppression de l\'exercice'));
          setConfirmModal(prev => ({ ...prev, loading: false }));
        }
      }
    });
  };

  const handleExerciceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (exerciceForm.isEdit) {
        await budgetService.updateExercice(Number(exerciceForm.annee), {
          observations: exerciceForm.observations
        });
        toast.success(`Exercice fiscal ${exerciceForm.annee} mis à jour avec succès`);
      } else {
        await budgetService.createExercice({
          annee: Number(exerciceForm.annee),
          observations: exerciceForm.observations
        });
        toast.success(`Exercice fiscal ${exerciceForm.annee} initialisé avec succès`);
      }
      setShowExerciceModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, exerciceForm.isEdit ? 'Erreur lors de la modification de l\'exercice' : 'Erreur lors de la création de l\'exercice'));
    }
  };

  // --- Handlers: Previsions Carburant ---
  const handlePrevisionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...previsionForm,
        annee: Number(previsionForm.annee),
        mois: Number(previsionForm.mois),
        kmPrevus: parseFloat(previsionForm.kmPrevus),
        consoMoyenne: parseFloat(previsionForm.consoMoyenne),
        prixUnitairePrevus: parseFloat(previsionForm.prixUnitairePrevus)
      };
      if (previsionForm.id) {
        await budgetService.updatePrevision(previsionForm.id, payload);
        toast.success('Prévision carburant mise à jour');
      } else {
        await budgetService.createPrevision(payload);
        toast.success('Prévision carburant enregistrée');
      }
      setShowPrevisionModal(false);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Erreur lors de l\'enregistrement de la prévision'));
    }
  };

  // --- Calculations for Synthesis KPI Bar ---
  const totalAlloue = useMemo(() => budgets.reduce((acc, b) => acc + Number(b.montantAlloue || 0), 0), [budgets]);
  const totalEngage = useMemo(() => budgets.reduce((acc, b) => acc + Number(b.montantEngage || 0), 0), [budgets]);
  const totalRealise = useMemo(() => budgets.reduce((acc, b) => acc + Number(b.montantRealise || 0), 0), [budgets]);
  const totalDisponible = Math.max(0, totalAlloue - Math.max(totalEngage, totalRealise));
  const globalRate = totalAlloue > 0 ? (totalEngage / totalAlloue) * 100 : 0;
  const executionRate = totalAlloue > 0 ? (totalRealise / totalAlloue) * 100 : 0;

  // Filtered Budgets
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      if (filterDirection !== 'ALL' && b.direction !== filterDirection) return false;
      if (filterNature !== 'ALL' && b.natureDepense !== filterNature) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchDir = b.direction?.toLowerCase().includes(q);
        const matchNat = b.natureDepense?.toLowerCase().includes(q);
        const matchSrv = b.service?.toLowerCase().includes(q);
        const matchCc = b.centreCout?.toLowerCase().includes(q);
        if (!matchDir && !matchNat && !matchSrv && !matchCc) return false;
      }
      return true;
    });
  }, [budgets, filterDirection, filterNature, searchTerm]);

  // Filtered Engagements
  const filteredEngagements = useMemo(() => {
    return engagements.filter(e => {
      if (filterDirection !== 'ALL' && e.direction !== filterDirection) return false;
      if (filterNature !== 'ALL' && e.natureDepense !== filterNature) return false;
      if (filterStatutEng !== 'ALL' && e.statutEngagement !== filterStatutEng) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNum = e.numeroEngagement?.toLowerCase().includes(q);
        const matchBen = e.beneficiaire?.toLowerCase().includes(q);
        const matchObj = e.objet?.toLowerCase().includes(q);
        const matchRef = e.referencePiece?.toLowerCase().includes(q);
        if (!matchNum && !matchBen && !matchObj && !matchRef) return false;
      }
      return true;
    });
  }, [engagements, filterDirection, filterNature, filterStatutEng, searchTerm]);

  // Chart Data: Budgets by Direction
  const chartDataDirections = useMemo(() => {
    const map = {};
    budgets.forEach(b => {
      if (!map[b.direction]) map[b.direction] = { direction: b.direction, alloue: 0, engage: 0, realise: 0 };
      map[b.direction].alloue += Number(b.montantAlloue || 0);
      map[b.direction].engage += Number(b.montantEngage || 0);
      map[b.direction].realise += Number(b.montantRealise || 0);
    });
    return Object.values(map);
  }, [budgets]);

  // Chart Data: Budgets by Nature
  const chartDataNatures = useMemo(() => {
    const map = {};
    budgets.forEach(b => {
      const k = b.natureDepense;
      if (!map[k]) map[k] = { name: k, value: 0 };
      map[k].value += Number(b.montantAlloue || 0);
    });
    return Object.values(map);
  }, [budgets]);

  // Actual existing exercices for the dropdown
  const availableAnnees = useMemo(() => {
    const years = new Set(exercices.map(e => Number(e.annee)).filter(Boolean));
    if (annee) years.add(Number(annee));
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [exercices, annee]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A1E3F]/5 border border-[#C59B27]/30 flex items-center justify-center text-[#C59B27]">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
              Suivi Budgétaire & Dépenses du Parc
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dotations par direction, chaîne d'engagements financiers, seuils d'alertes 80% / 95% et gestion des exercices annuels.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Année Sélecteur */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-2 mr-1" />
            <MefSelect
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-2 py-1 cursor-pointer"
            >
              {availableAnnees.map(y => (
                <option key={y} value={y}>Exercice {y}</option>
              ))}
            </MefSelect>
          </div>

          <button
            onClick={fetchData}
            title="Actualiser les données"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* 2. Executive KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Budget Total Alloué */}
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Budget Alloué</span>
            <span className="text-xl font-black text-[#0A1E3F] mt-1 block">
              {totalAlloue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MAD</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{budgets.length} lignes budgétaires ({annee})</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 2: Total Engagé */}
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Total Engagé</span>
            <span className="text-xl font-black text-amber-700 mt-1 block">
              {totalEngage.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MAD</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Taux d'engagement &nbsp; <strong className="text-amber-600">{globalRate.toFixed(1)}%</strong></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 3: Total Réalisé (Facturé) */}
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Total Liquidé</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              {totalRealise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MAD</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Taux de réalisation &nbsp; <strong className="text-emerald-600">{executionRate.toFixed(1)}%</strong></span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 4: Solde Disponible */}
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Solde Disponible</span>
            <span className="text-xl font-black text-[#0A1E3F] mt-1 block">
              {totalDisponible.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-slate-400">MAD</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Capacité d'engagement restante</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
        </motion.div>

        {/* KPI 5: Alertes Actives */}
        <motion.div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${alertes.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Alertes Dépassement</span>
            <span className={`text-xl font-black mt-1 block ${alertes.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {alertes.length} <span className="text-xs font-normal text-slate-400">enveloppe(s)</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Seuils 80% et 95%</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alertes.length > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <motion.div 
        className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'directions', label: 'Dotations', icon: Building2, count: budgets.length },
            { key: 'engagements', label: 'Engagements', icon: FileText, count: engagements.length },
            { key: 'exercices', label: 'Exercices', icon: Calendar, count: exercices.length },
            { key: 'alertes', label: 'Alertes', icon: AlertTriangle, count: alertes.length },
            { key: 'previsions', label: 'Prévisions', icon: Fuel, count: previsions.length },
            { key: 'synthese', label: 'Synthèse', icon: BarChart2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive ? 'gold-gradient-bg text-[#0A1E3F]' : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
              </button>
            );
          })}
        </div>

        {canManageBudget && activeTab === 'directions' && (
          <button
            type="button"
            onClick={() => {
              setBudgetForm({
                id: null,
                annee: annee,
                direction: DIRECTIONS[0],
                service: 'Division du Parc Automobile',
                centreCout: 'CC-PARC-01',
                natureDepense: 'CARBURANT',
                montantAlloue: '',
                montantEngage: 0,
                montantRealise: 0
              });
              setShowBudgetModal(true);
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle Dotation
          </button>
        )}
        {canManageBudget && activeTab === 'engagements' && (
          <button
            type="button"
            onClick={() => handleOpenEngagementModal()}
            disabled={isExerciceCloture}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvel Engagement
          </button>
        )}
        {canManageBudget && activeTab === 'exercices' && (
          <button
            type="button"
            onClick={() => {
              setExerciceForm({
                isEdit: false,
                annee: new Date().getFullYear() + 1,
                observations: `Exercice fiscal ${new Date().getFullYear() + 1} initialisé pour la programmation triennale.`
              });
              setShowExerciceModal(true);
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvel Exercice
          </button>
        )}
        {canManageBudget && activeTab === 'previsions' && (
          <button
            type="button"
            onClick={() => {
              setPrevisionForm({
                id: null,
                direction: DIRECTIONS[0],
                annee: annee,
                mois: 1,
                kmPrevus: '',
                consoMoyenne: '7.5',
                prixUnitairePrevus: '13.50',
                quantiteReelle: 0,
                montantReel: 0
              });
              setShowPrevisionModal(true);
            }}
            className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-4 py-2 rounded-xl shadow-gold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouvelle Prévision
          </button>
        )}
      </motion.div>

      {/* Global Search & Filters Toolbar */}
      {(activeTab === 'directions' || activeTab === 'engagements') && (
        <motion.div 
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 lg:w-56"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <MefSelect
              value={filterDirection}
              onChange={(e) => setFilterDirection(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Toutes les Directions</option>
              {DIRECTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </MefSelect>

            <MefSelect
              value={filterNature}
              onChange={(e) => setFilterNature(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Toutes les Natures</option>
              {NATURES_DEPENSE.map(n => (
                <option key={n.key} value={n.key}>{n.label}</option>
              ))}
            </MefSelect>
          </div>
        </motion.div>
      )}

      {/* 4. Tab Content Area */}
      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Chargement des données budgétaires du MEF...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: DOTATIONS PAR DIRECTION */}
          {activeTab === 'directions' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Enveloppes Budgétaires Analytiques ({filteredBudgets.length})
                </span>
                <span className="text-xs text-slate-400">
                  Exercice {annee} — Dépenses par Direction & Nature
                </span>
              </div>

              {filteredBudgets.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">Aucune dotation budgétaire trouvée</p>
                  <p className="text-xs text-slate-400 mt-1">Créez une enveloppe budgétaire pour cet exercice.</p>
                  {canManageBudget && (
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" /> Nouvelle Dotation
                  </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-100">
                        <th className="py-3 px-4">Direction & Service</th>
                        <th className="py-3 px-4">Nature de Dépense</th>
                        <th className="py-3 px-4 text-right">Montant Alloué</th>
                        <th className="py-3 px-4 text-right">Engagé</th>
                        <th className="py-3 px-4 text-right">Réalisé (Factures)</th>
                        <th className="py-3 px-4 text-right">Solde Disponible</th>
                        <th className="py-3 px-4 text-center">Consommation</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBudgets.map(b => {
                        const alloue = Number(b.montantAlloue || 0);
                        const engage = Number(b.montantEngage || 0);
                        const realise = Number(b.montantRealise || 0);
                        const bloque = Math.max(engage, realise);
                        const disponible = Math.max(0, alloue - bloque);
                        const rate = alloue > 0 ? (engage / alloue) * 100 : 0;
                        const is95 = rate >= 95;
                        const is80 = rate >= 80 && rate < 95;

                        return (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800">{b.direction}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span>{b.service || 'Direction centrale'}</span>
                                {b.centreCout && (
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px]">
                                    {b.centreCout}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                                {b.natureDepense}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                              {alloue.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                              {engage.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">
                              {realise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-indigo-700">
                              {disponible.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="w-28 mx-auto">
                                <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                  <span className={is95 ? 'text-rose-600' : is80 ? 'text-amber-600' : 'text-slate-600'}>
                                    {rate.toFixed(1)}%
                                  </span>
                                  {is95 && <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-black">95%</span>}
                                  {is80 && <span className="px-1 py-0.2 rounded bg-amber-100 text-amber-700 text-[9px] font-black">80%</span>}
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      is95 ? 'bg-rose-500' : is80 ? 'bg-amber-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(100, rate)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {canManageBudget ? (
                                  <>
                                    <button
                                      onClick={() => handleOpenEngagementModal(b)}
                                      disabled={isExerciceCloture || disponible <= 0}
                                      title="Engager une dépense sur cette enveloppe"
                                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEditBudget(b)}
                                      title="Modifier la dotation"
                                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBudget(b)}
                                      title="Supprimer"
                                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 italic">Lecture seule</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENGAGEMENTS & LIQUIDATIONS */}
          {activeTab === 'engagements' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Journal des Engagements Budgétaires ({filteredEngagements.length})
                </span>
                <div className="flex items-center gap-2">
                  <MefSelect
                    value={filterStatutEng}
                    onChange={(e) => setFilterStatutEng(e.target.value)}
                    className="bg-white border border-slate-200 text-xs rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">Tous les Statuts</option>
                    <option value="ENGAGE">Engagé (En cours)</option>
                    <option value="LIQUIDE">Liquidé (Payé)</option>
                    <option value="ANNULE">Annulé</option>
                  </MefSelect>
                </div>
              </div>

              {filteredEngagements.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">Aucun engagement enregistré</p>
                  <p className="text-xs text-slate-400 mt-1">Créez un engagement pour imputer sur le solde disponible.</p>
                  {canManageBudget && (
                  <button
                    onClick={() => handleOpenEngagementModal()}
                    disabled={isExerciceCloture}
                    className="mt-4 inline-flex items-center gap-2 bg-[#0F1D32] hover:bg-[#1A2E4C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 text-amber-400" /> Nouvel Engagement
                  </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-100">
                        <th className="py-3 px-4">N° Engagement & Date</th>
                        <th className="py-3 px-4">Direction & Imputation</th>
                        <th className="py-3 px-4">Bénéficiaire & Objet</th>
                        <th className="py-3 px-4 text-right">Montant Engagé</th>
                        <th className="py-3 px-4 text-right">Montant Liquidé</th>
                        <th className="py-3 px-4 text-center">Statut</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEngagements.map(eng => {
                        const isLiquide = eng.statutEngagement === 'LIQUIDE';
                        const isAnnule = eng.statutEngagement === 'ANNULE';

                        return (
                          <tr key={eng.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-blue-900">{eng.numeroEngagement}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{eng.dateEngagement}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800">{eng.direction}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium">{eng.natureDepense}</span>
                                {eng.centreCout && <span className="text-slate-400">({eng.centreCout})</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800">{eng.beneficiaire || 'Non spécifié'}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{eng.objet || '-'}</div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                              {Number(eng.montantEngage || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                              {eng.montantLiquide ? `${Number(eng.montantLiquide).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD` : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {isLiquide ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Liquidé
                                </span>
                              ) : isAnnule ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                  <X className="w-3 h-3" /> Annulé
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Engagé
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {canManageBudget && !isLiquide && !isAnnule && (
                                  <>
                                    <button
                                      onClick={() => handleOpenLiquidation(eng)}
                                      title="Liquider sur facture"
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1 shadow-sm"
                                    >
                                      <Check className="w-3 h-3" /> Liquider
                                    </button>
                                    <button
                                      onClick={() => handleAnnulerEngagement(eng)}
                                      title="Annuler l'engagement"
                                      className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => setSelectedEngagementDetail(eng)}
                                  title="Voir détails"
                                  className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXERCICES FISCAUX */}
          {activeTab === 'exercices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Gestion des Exercices Fiscaux du MEF</h3>
                  <p className="text-xs text-slate-500">
                    Clôture annuelle au 31 Décembre avec scellement comptable et bascule en lecture seule.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exercices.map(ex => {
                  const isCloture = ex.statut === 'CLOTURE';
                  const isCurrent = Number(ex.annee) === Number(annee);

                  return (
                    <div
                      key={ex.id}
                      className={`bg-white p-6 rounded-2xl border transition-all relative overflow-hidden ${
                        isCurrent ? 'ring-2 ring-blue-600 border-transparent shadow-md' : 'border-slate-100 shadow-sm'
                      }`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCloture ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-slate-800">Exercice {ex.annee}</span>
                        <div className="flex items-center gap-2">
                          {isCloture ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Clôturé
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Unlock className="w-3 h-3" /> Ouvert
                            </span>
                          )}
                          {canManageBudget && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditExercice(ex)}
                                title="Modifier les observations de l'exercice"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExercice(ex)}
                                title="Supprimer cet exercice fiscal"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 mb-4 min-h-[36px]">
                        {ex.observations || 'Aucune observation enregistrée.'}
                      </p>

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                        {ex.dateCloture && (
                          <div>Clôturé le : <span className="font-semibold text-slate-700">{ex.dateCloture}</span></div>
                        )}
                        {ex.cloturePar && (
                          <div>Par : <span className="font-semibold text-slate-700">{ex.cloturePar}</span></div>
                        )}
                      </div>

                      {canManageBudget && (
                      <div className="mt-4 pt-3 flex items-center gap-2">
                        {isCloture ? (
                          <button
                            onClick={() => handleRouvrirExercice(ex)}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Rouvrir l'exercice
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenCloture(ex)}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Lock className="w-3.5 h-3.5" /> Clôturer l'exercice
                          </button>
                        )}
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ALERTES SEUILS (80% / 95%) */}
          {activeTab === 'alertes' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide">Surveillance Automatique des Seuils</h4>
                  <p className="text-xs mt-0.5 text-amber-800">
                    Dès qu'une enveloppe budgétaire atteint 80% (alerte préventive) ou 95% (alerte critique de blocage), une notification instantanée est diffusée au Responsable Financier et un e-mail SMTP est expédié.
                  </p>
                </div>
              </div>

              {alertes.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                  <p className="font-bold text-slate-700">Toutes les enveloppes budgétaires sont sous contrôle</p>
                  <p className="text-xs text-slate-400 mt-1">Aucun dépassement de seuil (80% ou 95%) n'est actuellement détecté pour l'exercice {annee}.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alertes.map((alt, idx) => {
                    const rate = Number(alt.tauxConsommation || 0);
                    const is95 = rate >= 95;

                    return (
                      <div
                        key={idx}
                        className={`bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
                          is95 ? 'border-rose-200 bg-rose-50/20' : 'border-amber-200 bg-amber-50/20'
                        }`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${is95 ? 'bg-rose-500' : 'bg-amber-500'}`} />

                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            is95 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {is95 ? 'Alerte Critique (≥ 95%)' : 'Alerte Préventive (≥ 80%)'}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {alt.annee}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 text-sm">{alt.direction}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Nature : <span className="font-semibold text-slate-700">{alt.natureDepense}</span>
                        </p>

                        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Montant Alloué :</span>
                            <span className="font-bold text-slate-800">{Number(alt.montantAlloue || 0).toLocaleString('fr-FR')} MAD</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Montant Engagé :</span>
                            <span className={`font-bold ${is95 ? 'text-rose-600' : 'text-amber-600'}`}>
                              {Number(alt.montantEngage || 0).toLocaleString('fr-FR')} MAD
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${is95 ? 'bg-rose-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, rate)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-400">Taux engagé :</span>
                            <span className={is95 ? 'text-rose-600' : 'text-amber-600'}>{rate.toFixed(1)}%</span>
                          </div>
                        </div>

                        {canManageBudget && (
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const b = budgets.find(x => x.direction === alt.direction && x.natureDepense === alt.natureDepense);
                              if (b) handleEditBudget(b);
                              else toast.error('Dotation introuvable');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            Réajuster Dotation
                          </button>
                        </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PRÉVISIONS CARBURANT */}
          {activeTab === 'previsions' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Planification & Prévisions Carburant ({previsions.length})
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modélisation des volumes (Litres) et montants prévisionnels par Direction et par mois.
                  </p>
                </div>
              </div>

              {previsions.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Fuel className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-600">Aucune prévision carburant enregistrée</p>
                  <p className="text-xs text-slate-400 mt-1">Planifiez les consommations kilométriques et les dotations mensuelles.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-100">
                        <th className="py-3 px-4">Direction</th>
                        <th className="py-3 px-4">Période</th>
                        <th className="py-3 px-4 text-right">Km Prévus</th>
                        <th className="py-3 px-4 text-right">Conso (L/100km)</th>
                        <th className="py-3 px-4 text-right">Litres Prévus</th>
                        <th className="py-3 px-4 text-right">Prix Unitaire</th>
                        <th className="py-3 px-4 text-right">Budget Prévu</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previsions.map(p => {
                        const km = Number(p.kmPrevus || 0);
                        const conso = Number(p.consoMoyenne || 0);
                        const pu = Number(p.prixUnitairePrevus || 13.5);
                        const litresPrev = (km * conso) / 100;
                        const budgetPrev = litresPrev * pu;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800">{p.direction}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-700">
                                {MOIS_NOMS[p.mois - 1]} {p.annee}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                              {km.toLocaleString('fr-FR')} km
                            </td>
                            <td className="py-3.5 px-4 text-right text-slate-600">{conso.toFixed(1)} L/100</td>
                            <td className="py-3.5 px-4 text-right font-bold text-amber-600">{litresPrev.toFixed(0)} L</td>
                            <td className="py-3.5 px-4 text-right text-slate-600">{pu.toFixed(2)} MAD/L</td>
                            <td className="py-3.5 px-4 text-right font-black text-indigo-700">
                              {budgetPrev.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {canManageBudget && (
                              <button
                                onClick={() => {
                                  setConfirmModal({
                                    isOpen: true,
                                    title: 'Supprimer la prévision carburant',
                                    message: `Supprimer la prévision carburant pour ${p.direction} (${MOIS_NOMS[p.mois - 1] || ''} ${p.annee}) ?`,
                                    variant: 'danger',
                                    loading: false,
                                    onConfirm: async () => {
                                      setConfirmModal(prev => ({ ...prev, loading: true }));
                                      try {
                                        await budgetService.deletePrevision(p.id);
                                        toast.success('Prévision supprimée');
                                        setConfirmModal({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false });
                                        fetchData();
                                      } catch (err) {
                                        toast.error('Erreur suppression');
                                        setConfirmModal(prev => ({ ...prev, loading: false }));
                                      }
                                    }
                                  });
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SYNTHÈSE GRAPHIQUE */}
          {activeTab === 'synthese' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Répartition par Direction */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Budget Alloué vs Engagé par Direction (MAD)
                </h3>
                <p className="text-xs text-slate-400 mb-4">Exercice fiscal {annee}</p>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataDirections} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="direction" 
                        tickFormatter={(v) => directionShort(v)} 
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} 
                        axisLine={{ stroke: '#CBD5E1' }} 
                        tickLine={false} 
                        height={35} 
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString('fr-FR')} MAD`]}
                        labelFormatter={(label) => `Direction : ${label}`}
                      />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '16px', fontSize: '11px', fontWeight: 600 }} />
                      <Bar dataKey="alloue" name="Budget Alloué" fill="#0A1E3F" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="engage" name="Montant Engagé" fill="#C59B27" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      <Bar dataKey="realise" name="Montant Réalisé" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Structure des dépenses par Nature */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Structure des Dotations par Nature de Dépense
                </h3>
                <p className="text-xs text-slate-400 mb-4">Ventilation analytique de l'enveloppe</p>

                <div className="h-72 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDataNatures}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartDataNatures.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} MAD`} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NOUVEL ENGAGEMENT BUDGETAIRE                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showEngagementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">Nouvel Engagement Budgétaire</h3>
                    <p className="text-[11px] text-slate-300 font-normal">Chaîne d'engagement et réservation des crédits</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowEngagementModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEngagementSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Direction MEF *</label>
                      <MefSelect
                        value={engagementForm.direction}
                        onChange={(e) => setEngagementForm({ ...engagementForm, direction: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </MefSelect>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature de Dépense *</label>
                      <MefSelect
                        value={engagementForm.natureDepense}
                        onChange={(e) => setEngagementForm({ ...engagementForm, natureDepense: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {NATURES_DEPENSE.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
                      </MefSelect>
                    </div>
                  </div>

                  {/* Live Balance Card Banner */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    currentAvailableBalance !== null && currentAvailableBalance > 0
                      ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Solde Budgétaire Disponible
                      </span>
                      <span className="text-base font-black">
                        {currentAvailableBalance !== null
                          ? `${currentAvailableBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD`
                          : 'Aucune dotation définie pour ce poste'}
                      </span>
                    </div>
                    {currentAvailableBalance !== null && currentAvailableBalance > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <AlertOctagon className="w-5 h-5 text-rose-600" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant à Engager (MAD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 15000.00"
                        value={engagementForm.montantEngage}
                        onChange={(e) => setEngagementForm({ ...engagementForm, montantEngage: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Bénéficiaire / Prestataire</label>
                      <input
                        type="text"
                        placeholder="Ex: TotalEnergies, Renault..."
                        value={engagementForm.beneficiaire}
                        onChange={(e) => setEngagementForm({ ...engagementForm, beneficiaire: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">N° Bon de Commande / Réf Pièce</label>
                    <input
                      type="text"
                      placeholder="Ex: BC-2026-0045"
                      value={engagementForm.referencePiece}
                      onChange={(e) => setEngagementForm({ ...engagementForm, referencePiece: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Objet / Motif de l'engagement</label>
                    <textarea
                      rows={2}
                      placeholder="Détail de la commande ou de l'intervention..."
                      value={engagementForm.objet}
                      onChange={(e) => setEngagementForm({ ...engagementForm, objet: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEngagementModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Valider l'Engagement</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: DOTATION BUDGETAIRE (CREATE / EDIT)                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showBudgetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {budgetForm.id ? 'Modifier l\'Enveloppe Budgétaire' : 'Nouvelle Dotation Budgétaire'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">Allocation des crédits budgétaires par Direction</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowBudgetModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBudgetSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Direction MEF *</label>
                      <MefSelect
                        value={budgetForm.direction}
                        onChange={(e) => setBudgetForm({ ...budgetForm, direction: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </MefSelect>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nature de Dépense *</label>
                      <MefSelect
                        value={budgetForm.natureDepense}
                        onChange={(e) => setBudgetForm({ ...budgetForm, natureDepense: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {NATURES_DEPENSE.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
                      </MefSelect>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Service</label>
                      <input
                        type="text"
                        placeholder="Ex: Division du Parc Automobile"
                        value={budgetForm.service}
                        onChange={(e) => setBudgetForm({ ...budgetForm, service: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Centre de Coût</label>
                      <input
                        type="text"
                        placeholder="Ex: CC-PARC-01"
                        value={budgetForm.centreCout}
                        onChange={(e) => setBudgetForm({ ...budgetForm, centreCout: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Alloué Annuel (MAD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 250000.00"
                      value={budgetForm.montantAlloue}
                      onChange={(e) => setBudgetForm({ ...budgetForm, montantAlloue: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBudgetModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Enregistrer la Dotation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: LIQUIDATION SUR FACTURE                                          */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showLiquidationModal && selectedEngagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">Liquidation sur Facture</h3>
                    <p className="text-[11px] text-slate-300 font-normal">Règlement définitif et imputation comptable</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowLiquidationModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleLiquidationSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="text-slate-500">N° Engagement : <span className="font-mono font-bold text-slate-800">{selectedEngagement.numeroEngagement}</span></div>
                    <div className="text-slate-500">Bénéficiaire : <span className="font-bold text-slate-800">{selectedEngagement.beneficiaire}</span></div>
                    <div className="text-slate-500">Montant Engagé Initial : <span className="font-bold text-amber-600">{Number(selectedEngagement.montantEngage).toLocaleString('fr-FR')} MAD</span></div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Montant Liquidé Réel (TTC) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={liquidationForm.montantLiquide}
                      onChange={(e) => setLiquidationForm({ ...liquidationForm, montantLiquide: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Référence Facture / Mandat *</label>
                    <input
                      type="text"
                      placeholder="Ex: FACT-2026-0899"
                      value={liquidationForm.referenceFacture}
                      onChange={(e) => setLiquidationForm({ ...liquidationForm, referenceFacture: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowLiquidationModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmer la Liquidation</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: CLÔTURE DE L'EXERCICE FISCAL                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showClotureModal && selectedExercice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">Clôturer l'Exercice {selectedExercice.annee}</h3>
                    <p className="text-[11px] text-slate-300 font-normal">Clôture comptable annuelle & gel des engagements</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowClotureModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleClotureSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                    <span className="font-bold block">Avertissement :</span>
                    <span>La clôture de l'exercice fiscal bloque définitivement toute nouvelle création ou modification d'engagement budgétaire pour l'année {selectedExercice.annee}.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations de la Commission MEF *</label>
                    <textarea
                      rows={3}
                      value={clotureForm.observations}
                      onChange={(e) => setClotureForm({ ...clotureForm, observations: e.target.value })}
                      required
                      placeholder="Décision de la commission budgétaire..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowClotureModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirmer la Clôture Définitive</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 5: OUVRIR NOUVEL EXERCICE FISCAL                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showExerciceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">
                      {exerciceForm.isEdit ? `Modifier l'Exercice Fiscal ${exerciceForm.annee}` : 'Ouvrir un Nouvel Exercice Fiscal'}
                    </h3>
                    <p className="text-[11px] text-slate-300 font-normal">
                      {exerciceForm.isEdit ? 'Mise à jour des observations et du cadrage budgétaire' : 'Initialisation du nouvel exercice et cadrage budgétaire'}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowExerciceModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExerciceSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Année Fiscale *</label>
                    <input
                      type="number"
                      value={exerciceForm.annee}
                      disabled={exerciceForm.isEdit}
                      onChange={(e) => setExerciceForm({ ...exerciceForm, annee: e.target.value })}
                      required
                      className={`w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold ${
                        exerciceForm.isEdit ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Observations / Cadrage Budgétaire</label>
                    <textarea
                      rows={3}
                      placeholder="Notes de cadrage pour l'exercice..."
                      value={exerciceForm.observations}
                      onChange={(e) => setExerciceForm({ ...exerciceForm, observations: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27]"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowExerciceModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{exerciceForm.isEdit ? 'Enregistrer les modifications' : "Initialiser l'Exercice"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 6: NOUVELLE PREVISION CARBURANT                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showPrevisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">Prévision de Consommation Carburant</h3>
                    <p className="text-[11px] text-slate-300 font-normal">Modèle prédictif basé sur le kilométrage prévisionnel</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowPrevisionModal(false)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePrevisionSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Direction MEF *</label>
                      <MefSelect
                        value={previsionForm.direction}
                        onChange={(e) => setPrevisionForm({ ...previsionForm, direction: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </MefSelect>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mois de Prévision *</label>
                      <MefSelect
                        value={previsionForm.mois}
                        onChange={(e) => setPrevisionForm({ ...previsionForm, mois: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] cursor-pointer font-medium"
                      >
                        {MOIS_NOMS.map((m, idx) => (
                          <option key={idx + 1} value={idx + 1}>{m}</option>
                        ))}
                      </MefSelect>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Km Prévus *</label>
                      <input
                        type="number"
                        placeholder="Ex: 25000"
                        value={previsionForm.kmPrevus}
                        onChange={(e) => setPrevisionForm({ ...previsionForm, kmPrevus: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Conso (L/100km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={previsionForm.consoMoyenne}
                        onChange={(e) => setPrevisionForm({ ...previsionForm, consoMoyenne: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Prix Unit. (MAD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={previsionForm.prixUnitairePrevus}
                        onChange={(e) => setPrevisionForm({ ...previsionForm, prixUnitairePrevus: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-[#C59B27] font-mono"
                      />
                    </div>
                  </div>

                  {previsionForm.kmPrevus && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-amber-900 font-medium">
                      <div className="flex justify-between">
                        <span>Volume Prévisionnel :</span>
                        <span className="font-bold">
                          {((parseFloat(previsionForm.kmPrevus || 0) * parseFloat(previsionForm.consoMoyenne || 7.5)) / 100).toFixed(0)} Litres
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Budget Total Estimé :</span>
                        <span className="font-black text-sm text-amber-800">
                          {(((parseFloat(previsionForm.kmPrevus || 0) * parseFloat(previsionForm.consoMoyenne || 7.5)) / 100) * parseFloat(previsionForm.prixUnitairePrevus || 13.5)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowPrevisionModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="gold-gradient-bg text-[#0A1E3F] font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-gold hover:brightness-105 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Fuel className="w-3.5 h-3.5" />
                    <span>Enregistrer la Prévision</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 7: DETAILS ENGAGEMENT                                               */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedEngagementDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header Banner */}
              <div className="bg-[#0A1E3F] text-white p-5 flex items-center justify-between border-b border-[#C59B27]/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-white">Détails de l'Engagement</h3>
                    <p className="text-[11px] text-slate-300 font-normal">{selectedEngagementDetail.numeroEngagement}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedEngagementDetail(null)} 
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">N° d'Engagement :</span>
                  <span className="font-mono font-bold text-blue-900 text-sm">{selectedEngagementDetail.numeroEngagement}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Direction :</span>
                  <span className="font-bold text-slate-800">{selectedEngagementDetail.direction}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Nature de Dépense :</span>
                  <span className="font-semibold text-slate-700">{selectedEngagementDetail.natureDepense}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Bénéficiaire :</span>
                  <span className="font-bold text-slate-800">{selectedEngagementDetail.beneficiaire || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Montant Engagé :</span>
                  <span className="font-bold text-amber-600">{Number(selectedEngagementDetail.montantEngage).toLocaleString('fr-FR')} MAD</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Montant Liquidé :</span>
                  <span className="font-bold text-emerald-600">
                    {selectedEngagementDetail.montantLiquide ? `${Number(selectedEngagementDetail.montantLiquide).toLocaleString('fr-FR')} MAD` : 'Non liquidé'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-slate-500">Réf Pièce / Bon Commande :</span>
                  <span className="font-mono text-slate-700">{selectedEngagementDetail.referencePiece || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1.5">Objet / Motif :</span>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-xs leading-relaxed">
                    {selectedEngagementDetail.objet || 'Aucun descriptif.'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEngagementDetail(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Modal (replaces all window.confirm) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Confirmer"
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {}, loading: false })}
      />

      {/* Prompt Modal (replaces window.prompt) */}
      <ConfirmModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        variant="prompt"
        promptLabel={promptModal.label}
        promptPlaceholder={promptModal.placeholder}
        confirmText="Valider"
        loading={promptModal.loading}
        onConfirm={promptModal.onConfirm}
        onClose={() => setPromptModal({ isOpen: false, title: '', message: '', label: '', placeholder: '', onConfirm: () => {}, loading: false })}
      />
    </div>
  );
}
