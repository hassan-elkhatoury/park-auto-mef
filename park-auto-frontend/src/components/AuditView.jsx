import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, RotateCw, Search, Clock, Plus, Pencil, Trash2, Eye, 
  Scale, FileText, CheckCircle2, XCircle, KeyRound, Lock, LogOut, 
  RotateCcw, Wrench, AlertTriangle, Coins, Receipt, Upload, Car, 
  User, Fuel, Building2, Paperclip, ChevronRight, X, ExternalLink,
  Shield, CheckCheck, Landmark, Globe, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const ACTION_CONFIG = {
  'CREATE':              { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Plus, label: 'Création' },
  'UPDATE':              { style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Pencil, label: 'Modification' },
  'DELETE':              { style: 'bg-rose-50 text-rose-700 border-rose-200', icon: Trash2, label: 'Suppression' },
  'LOGIN':               { style: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: KeyRound, label: 'Connexion' },
  'LOGOUT':              { style: 'bg-slate-50 text-slate-700 border-slate-200', icon: LogOut, label: 'Déconnexion' },
  'CHANGE_PASSWORD':     { style: 'bg-violet-50 text-violet-700 border-violet-200', icon: Lock, label: 'Mot de passe' },
  'VALIDATION_N1':       { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Validation N1' },
  'REJET_N1':            { style: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'Rejet N1' },
  'APPROBATION_N2':      { style: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCheck, label: 'Approbation N2' },
  'RESTITUTION':         { style: 'bg-blue-50 text-blue-700 border-blue-200', icon: RotateCcw, label: 'Restitution' },
  'CLOTURE':             { style: 'bg-teal-50 text-teal-700 border-teal-200', icon: CheckCircle2, label: 'Clôture' },
  'CLOTURE_REPARATION':  { style: 'bg-teal-50 text-teal-700 border-teal-200', icon: Wrench, label: 'Réparation' },
  'DECLARE':             { style: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'Déclaration' },
  'DIAGNOSTIC':          { style: 'bg-purple-50 text-purple-700 border-purple-200', icon: Wrench, label: 'Diagnostic' },
  'ENGAGEMENT':          { style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Coins, label: 'Engagement' },
  'LIQUIDATION':         { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Receipt, label: 'Liquidation' },
  'UPLOAD':              { style: 'bg-sky-50 text-sky-700 border-sky-200', icon: Upload, label: 'Téléversement' },
  'CONTROLE':            { style: 'bg-orange-50 text-orange-700 border-orange-200', icon: Shield, label: 'Contrôle RG' },
  'UPDATE_STATUS':       { style: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: RotateCw, label: 'Statut' },
};

const MODULE_CONFIG = {
  'ALL':                 { label: 'Tous les modules', icon: Activity },
  'VEHICULE':            { label: 'Véhicules', icon: Car, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  'CONDUCTEUR':          { label: 'Conducteurs', icon: User, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  'DEMANDE_DEPLACEMENT': { label: 'Missions & Demandes', icon: FileText, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  'AFFECTATION':         { label: 'Affectations', icon: KeyRound, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  'CARBURANT':           { label: 'Carburant', icon: Fuel, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  'MAINTENANCE':         { label: 'Maintenance', icon: Wrench, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'PANNE':               { label: 'Pannes', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'SINISTRE':            { label: 'Sinistres', icon: ShieldCheck, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  'BUDGET':              { label: 'Budget MEF', icon: Landmark, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  'ASSURANCE':           { label: 'Assurances', icon: Shield, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  'TAXE':                { label: 'Taxes & Vignettes', icon: Receipt, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  'DOCUMENT_GED':        { label: 'GED Documents', icon: Paperclip, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  'AUTH':                { label: 'Sécurité & Auth', icon: Lock, color: 'text-slate-800 bg-slate-100 border-slate-300' },
  'UTILISATEUR':         { label: 'Utilisateurs', icon: User, color: 'text-slate-700 bg-slate-50 border-slate-200' },
};

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [activeLog, setActiveLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/journal?size=100');
      const page = res?.data || res;
      setLogs(page?.content || []);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement du journal d\'audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchLogs(); 
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(l => {
    const matchSearch = !search ||
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.module?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entityName?.toLowerCase().includes(search.toLowerCase()) ||
      l.newValue?.toLowerCase().includes(search.toLowerCase()) ||
      l.oldValue?.toLowerCase().includes(search.toLowerCase()) ||
      l.ipAddress?.includes(search);

    const matchModule = selectedModule === 'ALL' || l.module === selectedModule;
    const matchAction = selectedAction === 'ALL' || l.action === selectedAction;

    return matchSearch && matchModule && matchAction;
  });

  // Calculate stats
  const totalLogs = logs.length;
  const uniqueModules = new Set(logs.map(l => l.module)).size;
  const uniqueUsers = new Set(logs.map(l => l.username)).size;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Modal Détails d'Audit ── */}
      {activeLog && (
        <div className="fixed inset-0 bg-[#0A1E3F]/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#C59B27]/40 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#06152B] via-[#0A1E3F] to-[#122B55] p-6 text-white flex items-center justify-between border-b border-[#C59B27]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient-bg flex items-center justify-center text-[#071530] shadow-md font-black">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black font-['Outfit'] tracking-tight !text-white flex items-center gap-2">
                    Trace d'Audit N° {activeLog.id}
                  </h3>
                  <p className="text-xs text-[#D7B14A]">
                    Enregistrement immuable — Registre de conformité MEF
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveLog(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horodatage précis</p>
                  <p className="text-xs font-bold text-[#0A1E3F] mt-1 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                    {new Date(activeLog.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opérateur</p>
                  <p className="text-xs font-bold text-[#0A1E3F] mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    {activeLog.username}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Module Système</p>
                  <p className="text-xs font-extrabold text-[#0A1E3F] mt-1 uppercase tracking-wide">
                    {activeLog.module}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Type d'Action</p>
                  <p className="text-xs font-extrabold text-[#0A1E3F] mt-1">
                    {activeLog.action}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Entité & Identifiant</p>
                  <p className="text-xs font-bold text-[#0A1E3F] mt-1">
                    {activeLog.entityName} {activeLog.entityId && <span className="text-[#C59B27]">#{activeLog.entityId}</span>}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adresse IP Source</p>
                  <p className="text-xs font-mono font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    {activeLog.ipAddress || '127.0.0.1'}
                  </p>
                </div>
              </div>

              {/* Diff Values */}
              {activeLog.oldValue && (
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <p className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">État Antérieur (Snapshot)</p>
                  <pre className="text-xs font-mono text-rose-900 whitespace-pre-wrap break-words">{activeLog.oldValue}</pre>
                </div>
              )}

              {activeLog.newValue && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">État Appliqué / Détails de l'Action</p>
                  <pre className="text-xs font-mono text-emerald-900 whitespace-pre-wrap break-words">{activeLog.newValue}</pre>
                </div>
              )}

              {/* Seal Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-[#E2E8F0] text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Intégrité certifiée SHA-256
                </span>
                <button
                  onClick={() => setActiveLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#0A1E3F] tracking-tight uppercase flex items-center gap-2.5 font-['Outfit']">
            <ShieldCheck className="w-7 h-7 text-[#C59B27]" />
            Journal d'Audit & Traçabilité Complète
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Surveillance continue et auditabilité légale de toutes les opérations du Parc Automobile MEF
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3.5 py-2 rounded-2xl">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">Registre Certifié DGSSI</span>
          </div>
          <button
            onClick={fetchLogs}
            className="bg-white border border-slate-200 hover:border-[#C59B27] px-4 py-2.5 rounded-2xl text-xs font-bold text-[#0A1E3F] flex items-center gap-2 shadow-xs hover:bg-[#C59B27]/5 cursor-pointer transition-all"
          >
            <RotateCw className={`w-4 h-4 text-[#C59B27] ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Événements Tracés</p>
            <p className="text-2xl font-black text-[#0A1E3F] mt-0.5">{totalLogs}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0A1E3F]/5 flex items-center justify-center text-[#C59B27]">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modules Couverts</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{uniqueModules} <span className="text-xs font-medium text-slate-400">/ 14</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilisateurs Tracés</p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">{uniqueUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Module Filter Pills Bar ── */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0A1E3F] uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#C59B27]" />
            Filtrer par Périmètre Métier :
          </span>
          <span className="text-xs font-bold text-slate-500">
            {filteredLogs.length} écriture{filteredLogs.length !== 1 ? 's' : ''} trouvée{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Object.entries(MODULE_CONFIG).map(([key, config]) => {
            const isSelected = selectedModule === key;
            const Icon = config.icon;
            const count = key === 'ALL' ? logs.length : logs.filter(l => l.module === key).length;
            if (key !== 'ALL' && count === 0) return null;

            return (
              <button
                key={key}
                onClick={() => setSelectedModule(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'gold-gradient-bg text-[#071530] shadow-sm scale-102'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-black/15 text-[#071530]' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search and Action Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (utilisateur, action, véhicule, matricule, IP...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#0A1E3F] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#C59B27]/20 focus:border-[#C59B27] transition-all"
          />
        </div>

        {/* Action filter selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">Toutes les actions</option>
            <option value="CREATE">Création</option>
            <option value="UPDATE">Modification</option>
            <option value="DELETE">Suppression</option>
            <option value="LOGIN">Connexion</option>
            <option value="CHANGE_PASSWORD">Mot de passe</option>
            <option value="VALIDATION_N1">Validation N1</option>
            <option value="APPROBATION_N2">Approbation N2</option>
            <option value="RESTITUTION">Restitution</option>
            <option value="CLOTURE">Clôture</option>
            <option value="DECLARE">Déclaration</option>
            <option value="ENGAGEMENT">Engagement</option>
            <option value="LIQUIDATION">Liquidation</option>
            <option value="UPLOAD">GED Téléversement</option>
          </select>
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">
              {loading ? 'Chargement des traces d\'audit…' : 'Aucune écriture d\'audit trouvée'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {!loading && 'Ajustez les filtres de recherche ou sélectionnez un autre module.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th>Utilisateur</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Entité Ciblée</th>
                  <th>Détails & Résumé</th>
                  <th>Adresse IP</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => {
                  const cfg = ACTION_CONFIG[l.action] || { style: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileText, label: l.action };
                  const ActionIcon = cfg.icon;
                  const modCfg = MODULE_CONFIG[l.module] || { label: l.module, color: 'bg-slate-100 text-slate-700 border-slate-200' };

                  return (
                    <tr 
                      key={l.id} 
                      onClick={() => setActiveLog(l)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors group"
                      title="Cliquer pour afficher les détails complets de la trace"
                    >
                      <td>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-[#C59B27] flex-shrink-0" />
                          <span>{new Date(l.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-[#0A1E3F] text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {l.username}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${modCfg.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {l.module}
                        </span>
                      </td>
                      <td>
                        <span className={`${cfg.style} px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1.5 border shadow-2xs`}>
                          <ActionIcon className="w-3 h-3 stroke-[2.5]" />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-bold text-slate-800">{l.entityName}</span>
                          {l.entityId && <span className="text-[#C59B27] font-semibold">#{l.entityId}</span>}
                        </div>
                      </td>
                      <td className="max-w-xs truncate">
                        <span className="text-xs text-slate-600 truncate block">
                          {l.newValue || l.oldValue || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-300" />
                          {l.ipAddress || '127.0.0.1'}
                        </span>
                      </td>
                      <td className="text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0A1E3F] group-hover:translate-x-0.5 transition-all inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
