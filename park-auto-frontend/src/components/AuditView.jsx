import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, RotateCw, Search, Clock, Plus, Pencil, Trash2, Eye, Scale } from 'lucide-react';
import api from '../services/api';

const actionConfig = {
  'CREATE': { style: 'bg-emerald-50 text-emerald-700', icon: Plus, label: 'Création' },
  'UPDATE': { style: 'bg-amber-50 text-amber-700', icon: Pencil, label: 'Modification' },
  'DELETE': { style: 'bg-red-50 text-red-700', icon: Trash2, label: 'Suppression' },
  'READ': { style: 'bg-blue-50 text-blue-700', icon: Eye, label: 'Lecture' },
};

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try { 
      setLoading(true); 
      const res = await api.get('/journal?size=50'); 
      if (res?.data) setLogs(res.data.content || []); 
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
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4">
            <img src="/assets/mef_seal_gold.jpg" alt="Sceau MEF" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal d'Audit Système</h1>
              <p className="text-description text-gray-500 mt-1">Traçabilité et auditabilité — Section 30 du Cahier des Charges</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">Section 30 — Conforme</span>
            </div>
            <button onClick={fetchLogs} className="h-9 px-3 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 shadow-xs cursor-pointer">
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/60 p-4 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-[13px]">
              <strong className="text-gray-900 block font-semibold">Traçabilité & Immuabilité des Écritures</strong>
              <span className="text-gray-600">Chaque opération d'écriture enregistre une ligne d'audit avec horodatage, utilisateur et adresse IP source.</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="relative flex-1 max-w-[360px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par utilisateur, module, action..."
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-[13px] placeholder:text-gray-400 outline-none focus:border-[#C5A059]" />
          </div>
          <span className="text-[13px] text-gray-500 font-medium">{filteredLogs.length} entrée{filteredLogs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-600">{loading ? 'Chargement...' : 'Aucune entrée d\'audit'}</p>
              <p className="text-description text-gray-400 mt-1">{!loading && 'Les opérations d\'écriture seront automatiquement tracées ici.'}</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D1B] text-[#E5C17C] uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Horodatage</th>
                  <th className="p-3.5">Utilisateur</th>
                  <th className="p-3.5">Module</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entité</th>
                  <th className="p-3.5">Adresse IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((l) => {
                  const cfg = actionConfig[l.action] || actionConfig['READ'];
                  const ActionIcon = cfg.icon;
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/80">
                      <td className="p-3.5 font-mono text-[12px] text-gray-500">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" />{new Date(l.timestamp).toLocaleString('fr-FR')}</div>
                      </td>
                      <td className="p-3.5 font-medium text-gray-900">{l.username}</td>
                      <td className="p-3.5"><span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-semibold">{l.module}</span></td>
                      <td className="p-3.5"><span className={`${cfg.style} px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1`}><ActionIcon className="w-3 h-3" />{cfg.label}</span></td>
                      <td className="p-3.5"><span className="font-medium text-gray-700">{l.entityName}</span> <span className="text-gray-400">#{l.entityId}</span></td>
                      <td className="p-3.5 font-mono text-[12px] text-gray-400">{l.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
