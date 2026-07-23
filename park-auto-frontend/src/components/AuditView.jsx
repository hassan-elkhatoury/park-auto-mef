import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, RotateCw, Search, Clock } from 'lucide-react';
import api from '../services/api';

export default function AuditView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/journal?size=50');
      if (res && res.data) {
        setLogs(res.data.content || []);
      }
    } catch (err) {
      console.error('Erreur chargement journal audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => 
    !search || 
    (l.username && l.username.toLowerCase().includes(search.toLowerCase())) ||
    (l.module && l.module.toLowerCase().includes(search.toLowerCase())) ||
    (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
    (l.entityName && l.entityName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <div className="max-w-[1380px] mx-auto flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black font-['Outfit'] text-slate-900">Journal d'Audit Système (Sprint 1)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Traçabilité et auditabilité conformément à la Section 30 du Cahier des Charges (`/api/journal`)</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser le Journal</span>
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 bg.amber-500/10 border border-[#C5A059]/30 p-4 rounded-xl text-xs text-[#9B783E]">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#C5A059]" />
            <div>
              <strong className="block font-bold">Traçabilité & Immuabilité des Écritures (Section 30 Cahier des Charges)</strong>
              <span>Chaque création, modification de véhicule, mise à jour de rôle ou changement de statut enregistre une ligne d'audit avec horodatage, utilisateur et IP.</span>
            </div>
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
              placeholder="Rechercher par utilisateur, module, action, entité..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
            />
          </div>
          <div className="text-xs font-bold text-slate-500">
            Lignes d'audit enregistrées: <span className="text-[#9B783E]">{logs.length}</span>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              {loading ? 'Chargement du journal d\'audit...' : 'Aucune entrée d\'audit trouvée pour le moment.'}
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
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-3.5 font-mono text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#9B783E]" />
                      {new Date(l.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{l.username}</td>
                    <td className="p-3.5 font-semibold text-slate-700">{l.module}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                        l.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-300' :
                        l.action === 'UPDATE' ? 'bg-amber-50 text-amber-600 border border-amber-300' : 'bg-blue-50 text-blue-600 border border-blue-300'
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{l.entityName} #{l.entityId}</td>
                    <td className="p-3.5 font-mono text-slate-500">{l.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
