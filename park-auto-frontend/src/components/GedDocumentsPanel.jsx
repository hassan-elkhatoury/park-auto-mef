import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Paperclip, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { documentService } from '../services/documentService';
import { getApiErrorMessage } from '../services/api';

const fmtSize = (bytes) => {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
};

const fmtDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

/**
 * Pièces jointes GED : liste, téléchargement, upload et files en attente
 * (avant que l'entité ait un identifiant).
 */
export default function GedDocumentsPanel({
  entite,
  entiteId,
  typeDocument = 'DOCUMENT',
  canUpload = false,
  canDelete = false,
  pendingFiles = [],
  onPendingFilesChange,
  title = 'Pièces justificatives (GED)',
  hint = 'PDF, PNG, JPG ou XLSX — 10 Mo max.',
}) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadDocs = useCallback(async () => {
    if (!entiteId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    try {
      const list = await documentService.getByEntite(entite, entiteId);
      setDocs(typeDocument
        ? list.filter((d) => String(d.typeDocument || '').toUpperCase() === String(typeDocument).toUpperCase())
        : list);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Impossible de charger les documents GED.'));
    } finally {
      setLoading(false);
    }
  }, [entite, entiteId, typeDocument]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    if (entiteId && canUpload) {
      setUploading(true);
      try {
        await documentService.uploadMany(files, entite, entiteId, typeDocument);
        toast.success(files.length > 1 ? `${files.length} documents déposés` : 'Document déposé');
        await loadDocs();
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Échec du dépôt GED.'));
      } finally {
        setUploading(false);
      }
      return;
    }

    onPendingFilesChange?.([...pendingFiles, ...files]);
  };

  const handleDelete = async (doc) => {
    try {
      await documentService.delete(doc.id);
      toast.success('Document retiré de la GED');
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Suppression GED refusée.'));
    }
  };

  const handleDownload = async (doc) => {
    try {
      await documentService.downloadAndSave(doc);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Téléchargement impossible.'));
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-[#C59B27]" />
            {title}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>
        </div>
        {(canUpload || onPendingFilesChange) && (
          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition-colors ${uploading ? 'bg-slate-200 text-slate-400' : 'bg-[#0A1E3F] text-white hover:bg-[#122B55]'}`}>
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Dépôt…' : 'Joindre'}
            <input
              type="file"
              multiple
              accept={documentService.acceptTypes}
              className="hidden"
              disabled={uploading}
              onChange={handleSelect}
            />
          </label>
        )}
      </div>

      {loading ? (
        <p className="text-[11px] text-slate-400 font-semibold">Chargement des pièces…</p>
      ) : docs.length === 0 && pendingFiles.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Aucune pièce jointe pour le moment.</p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-2">
              <FileText className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#0A1E3F] truncate">{doc.nomFichier}</p>
                <p className="text-[10px] text-slate-400">
                  {doc.typeDocument || 'DOCUMENT'} · {fmtSize(doc.taille)}
                  {doc.dateUpload ? ` · ${fmtDate(doc.dateUpload)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
          {pendingFiles.map((file, idx) => (
            <li key={`${file.name}-${idx}`} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-amber-900 truncate">{file.name}</p>
                <p className="text-[10px] text-amber-700">En attente d’enregistrement · {fmtSize(file.size)}</p>
              </div>
              {onPendingFilesChange && (
                <button
                  type="button"
                  onClick={() => onPendingFilesChange(pendingFiles.filter((_, i) => i !== idx))}
                  className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg"
                  title="Retirer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
