import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PenTool, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { DIRECTIONS_MEF } from '../utils/vehicule';

// Ministry fleet car brands and models dictionary
const CAR_BRANDS_AND_MODELS = {
  'Peugeot': ['508', '308', '208', '3008', '5008', 'Partner', 'Rifter'],
  'Renault': ['Megane', 'Clio', 'Express', 'Talisman', 'Koleos', 'Master', 'Kangoo'],
  'Dacia': ['Duster', 'Logan', 'Sandero', 'Dokker', 'Jogger'],
  'Toyota': ['Hilux', 'Land Cruiser', 'Prado', 'Corolla', 'RAV4', 'Camry'],
  'Volkswagen': ['Passat', 'Golf', 'Tiguan', 'Caddy', 'Touareg', 'Polo'],
  'Citroën': ['C4', 'C5 Aircross', 'Berlingo', 'C3', 'Jumpy'],
  'Hyundai': ['Tucson', 'Santa Fe', 'Elantra', 'Accent', 'I30'],
  'Mercedes-Benz': ['Classe E', 'Classe C', 'Vito', 'GLE', 'Sprinter'],
  'Nissan': ['Navara', 'Qashqai', 'Patrol', 'X-Trail']
};

// Moroccan plate: Arabic series letters + regional registration codes
const PLATE_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
const PLATE_REGIONS = Array.from({ length: 99 }, (_, i) => String(i + 1));

// Split a "12345-أ-1" plate into its 3 editable parts
const splitPlate = (immat) => {
  const p = (immat || '').split('-');
  return { num: p[0] || '', letter: p[1] || 'أ', region: p[2] || '1' };
};

const EMPTY_FORM = {
  immatriculation: '',
  numeroInventaire: '',
  numeroChassis: '',
  marque: 'Peugeot',
  modele: '508',
  typeCarburant: 'DIESEL',
  kilometrageInitial: 0,
  kilometrageActuel: 1000,
  organisme: 'Ministère de l\'Économie et des Finances',
  direction: 'Direction du Budget',
  statutAdministratif: 'DISPONIBLE',
  etatTechnique: 'NEUF'
};

// Helper to compute next available inventory number MEF
const fetchNextInventaireNumber = async () => {
  try {
    const res = await api.get('/vehicules?size=100');
    const list = res?.data?.content || res?.content || res?.data || (Array.isArray(res) ? res : []);
    let maxNum = 0;
    if (Array.isArray(list)) {
      list.forEach(v => {
        if (v.numeroInventaire) {
          const matches = v.numeroInventaire.match(/\d+/g);
          if (matches) {
            const num = parseInt(matches[matches.length - 1], 10);
            if (num > maxNum && num < 10000) maxNum = num;
          }
        }
      });
    }
    const nextNum = maxNum + 1;
    return `INV-MEF-2026-${String(nextNum).padStart(3, '0')}`;
  } catch (e) {
    return `INV-MEF-2026-${Math.floor(100 + Math.random() * 900)}`;
  }
};

// Self-contained add/edit vehicle modal. `vehicule` = null for creation.
export default function VehiculeFormModal({ open, onClose, onSaved, vehicule }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      if (vehicule) {
        setFormData({ ...EMPTY_FORM, ...vehicule });
      } else {
        fetchNextInventaireNumber().then((autoInv) => {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          const autoPlate = `${randomNum}-أ-1`;
          const autoChassis = `VF1${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
          setFormData({
            ...EMPTY_FORM,
            numeroInventaire: autoInv,
            immatriculation: autoPlate,
            numeroChassis: autoChassis
          });
        });
      }
    }
  }, [open, vehicule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        immatriculation: formData.immatriculation && formData.immatriculation.trim() !== '' && formData.immatriculation !== '--' 
          ? formData.immatriculation 
          : `${Math.floor(10000 + Math.random() * 90000)}-أ-1`,
        numeroInventaire: formData.numeroInventaire && formData.numeroInventaire.trim() !== '' 
          ? formData.numeroInventaire 
          : `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        numeroChassis: formData.numeroChassis && formData.numeroChassis.trim() !== '' 
          ? formData.numeroChassis 
          : `CH-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
        marque: formData.marque || 'Peugeot',
        modele: formData.modele || '508',
        typeCarburant: formData.typeCarburant || 'DIESEL',
        kilometrageInitial: Number(formData.kilometrageInitial) || 0,
        kilometrageActuel: Number(formData.kilometrageActuel) || 1000,
        statutAdministratif: formData.statutAdministratif || 'DISPONIBLE',
        etatTechnique: formData.etatTechnique || 'NEUF'
      };

      if (vehicule) {
        await api.put(`/vehicules/${vehicule.id}`, payload);
        toast.success('Véhicule mis à jour avec succès');
      } else {
        await api.post('/vehicules', payload);
        toast.success('Nouveau véhicule enregistré avec succès');
      }
      onClose();
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement du véhicule');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-[#070D1B]/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full max-w-[650px] rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-outfit font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gold-gradient-bg flex items-center justify-center">
                  {vehicule ? <PenTool className="w-4 h-4 text-[#070D1B]" /> : <Plus className="w-4 h-4 text-[#070D1B]" />}
                </div>
                {vehicule ? 'Modifier la Fiche Véhicule' : 'Nouveau Véhicule'}
              </h3>
              <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700">Immatriculation Marocaine *</label>
                {(() => {
                  const plate = splitPlate(formData.immatriculation);
                  const setPlate = (part, value) => {
                    const next = { ...plate, [part]: value };
                    setFormData({ ...formData, immatriculation: `${next.num}-${next.letter}-${next.region}` });
                  };
                  return (
                      <div className="mt-1 flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#C5A059] focus-within:ring-1 focus-within:ring-[#C5A059]">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={plate.num}
                          onChange={(e) => setPlate('num', e.target.value.replace(/\D/g, ''))}
                          className="flex-1 min-w-0 p-2.5 bg-transparent text-xs outline-none text-center font-bold font-outfit tracking-widest text-slate-900"
                          placeholder="12345"
                          maxLength={6}
                          required
                        />
                        <div className="w-[1px] h-6 bg-slate-200" />
                        <select
                          value={plate.letter}
                          onChange={(e) => setPlate('letter', e.target.value)}
                          className="w-16 p-2.5 bg-transparent text-sm outline-none cursor-pointer text-center font-bold text-slate-900"
                          title="Lettre de série"
                        >
                          {PLATE_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                          {!PLATE_LETTERS.includes(plate.letter) && <option value={plate.letter}>{plate.letter}</option>}
                        </select>
                        <div className="w-[1px] h-6 bg-slate-200" />
                        <span className="px-1.5 text-slate-400 font-bold text-xs select-none">|</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={plate.region}
                          onChange={(e) => setPlate('region', e.target.value.replace(/\D/g, ''))}
                          className="w-14 p-2.5 bg-transparent text-xs outline-none text-center font-bold font-outfit text-slate-900"
                          placeholder="1"
                          maxLength={2}
                          title="Suffixe régional (1 à 99)"
                          required
                        />
                      </div>
                  );
                })()}
                <span className="text-[10px] text-slate-400 mt-1 block">Format officiel : numéro — lettre de série (أ، ب، …) — suffixe régional (1 à 99)</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">N° Inventaire MEF *</label>
                <input
                  type="text"
                  value={formData.numeroInventaire}
                  onChange={(e) => setFormData({ ...formData, numeroInventaire: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, numeroChassis: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  placeholder="VF1ABC123456789"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Marque *</label>
                <select
                  value={formData.marque || 'Peugeot'}
                  onChange={(e) => {
                    const selectedMarque = e.target.value;
                    const defaultModele = CAR_BRANDS_AND_MODELS[selectedMarque]?.[0] || '';
                    setFormData({ ...formData, marque: selectedMarque, modele: defaultModele });
                  }}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer font-medium"
                  required
                >
                  {Object.keys(CAR_BRANDS_AND_MODELS).map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                  {formData.marque && !CAR_BRANDS_AND_MODELS[formData.marque] && (
                    <option value={formData.marque}>{formData.marque}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Modèle *</label>
                <select
                  value={formData.modele || ''}
                  onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer font-medium"
                  required
                >
                  {(CAR_BRANDS_AND_MODELS[formData.marque] || (formData.modele ? [formData.modele] : [])).map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                  {formData.modele && CAR_BRANDS_AND_MODELS[formData.marque] && !CAR_BRANDS_AND_MODELS[formData.marque].includes(formData.modele) && (
                    <option value={formData.modele}>{formData.modele}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Carburant *</label>
                <select
                  value={formData.typeCarburant}
                  onChange={(e) => setFormData({ ...formData, typeCarburant: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, kilometrageActuel: parseInt(e.target.value) })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Direction / Rattachement *</label>
                <select
                  value={formData.direction || 'Direction du Budget'}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer font-medium"
                >
                  {DIRECTIONS_MEF.map((d) => (
                    <option key={d.short} value={d.value}>{d.value} ({d.short})</option>
                  ))}
                  {formData.direction && !DIRECTIONS_MEF.some((d) => d.value === formData.direction) && (
                    <option value={formData.direction}>{formData.direction}</option>
                  )}
                </select>
              </div>

              <div className="col-span-2 flex justify-end gap-3 mt-4 pt-3 border-t">
                <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer transition-colors">Annuler</button>
                <motion.button
                  type="submit"
                  className="px-6 py-2.5 gold-gradient-bg text-[#070D1B] font-extrabold text-xs rounded-xl shadow-gold cursor-pointer"
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(197,160,89,0.5)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enregistrer
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
