import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCw, Search, Clock, Plus, Pencil, Trash2, Eye, Scale, FileText } from 'lucide-react';
import api from '../services/api';

const actionConfig = {
  'CREATE': { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Plus, label: 'Création' },
  'UPDATE': { style: 'bg-amber-50 text-amber-700 border-amber-200', icon: Pencil, label: 'Modification' },
  'DELETE': { style: 'bg-red-50 text-red-700 border-red-200', icon: Trash2, label: 'Suppression' },
  'READ': { style: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye, label: 'Lecture' },
};

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/journal?size=50');
      const page = res?.data || res;
      setLogs(page?.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(l => !search ||
    l.username?.toLowerCase().includes(search.toLowerCase()) ||
    l.module?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.entityName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#0A1E3F] tracking-wide uppercase flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#C59B27]" />
            Journal d'Audit Système
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité et auditabilité complète des opérations administratives du Parc Automobile MEF
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-2 rounded-xl">
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700">Registre Sécurisé & Certifié</span>
          </div>
          <button
            onClick={fetchLogs}
            className="bg-white border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <div className="text-xs">
          <strong className="text-slate-900 block font-bold">Traçabilité &amp; Immuabilité des Écritures</strong>
          <span className="text-slate-600">Chaque opération d'écriture enregistre une ligne d'audit avec horodatage, utilisateur et adresse IP source.</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-[360px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par utilisateur, module, action..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#C59B27]/30 focus:border-[#C59B27]"
          />
        </div>
        <span className="text-xs text-slate-500 font-bold shrink-0">{filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">{loading ? 'Chargement...' : 'Aucune entrée d\'audit'}</p>
            <p className="text-xs text-slate-400 mt-1">{!loading && 'Les opérations d\'écriture seront automatiquement tracées ici.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Horodatage</th>
                  <th>Utilisateur</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Entité</th>
                  <th>Adresse IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => {
                  const cfg = actionConfig[l.action] || actionConfig['READ'];
                  const ActionIcon = cfg.icon;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80">
                      <td>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(l.timestamp).toLocaleString('fr-FR')}
                        </div>
                      </td>
                      <td className="font-semibold text-slate-800">{l.username}</td>
                      <td>
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-bold">{l.module}</span>
                      </td>
                      <td>
                        <span className={`${cfg.style} px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border`}>
                          <ActionIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-700">{l.entityName}</span> <span className="text-slate-400">#{l.entityId}</span>
                      </td>
                      <td className="font-mono text-xs text-slate-400">{l.ipAddress || '127.0.0.1'}</td>
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
