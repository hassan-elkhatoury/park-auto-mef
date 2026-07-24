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

// Self-contained add/edit vehicle modal. `vehicule` = null for creation.
export default function VehiculeFormModal({ open, onClose, onSaved, vehicule }) {
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) setFormData(vehicule ? { ...EMPTY_FORM, ...vehicule } : EMPTY_FORM);
  }, [open, vehicule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (vehicule) {
        await api.put(`/vehicules/${vehicule.id}`, formData);
        toast.success('Véhicule mis à jour avec succès');
      } else {
        await api.post('/vehicules', formData);
        toast.success('Nouveau véhicule enregistré avec succès');
      }
      onClose();
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'enregistrement du véhicule');
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
                    <div className="mt-1 flex items-stretch gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={plate.num}
                        onChange={(e) => setPlate('num', e.target.value.replace(/\D/g, ''))}
                        className="flex-1 min-w-0 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none text-center font-bold font-outfit tracking-widest"
                        placeholder="12345"
                        maxLength={6}
                        required
                      />
                      <select
                        value={plate.letter}
                        onChange={(e) => setPlate('letter', e.target.value)}
                        className="w-[72px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none cursor-pointer text-center font-bold"
                        title="Lettre de série"
                      >
                        {PLATE_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                        {!PLATE_LETTERS.includes(plate.letter) && <option value={plate.letter}>{plate.letter}</option>}
                      </select>
                      <select
                        value={plate.region}
                        onChange={(e) => setPlate('region', e.target.value)}
                        className="w-[92px] p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none cursor-pointer text-center font-bold font-outfit"
                        title="Suffixe régional"
                      >
                        {PLATE_REGIONS.map((r) => <option key={r} value={r}>| {r}</option>)}
                        {!PLATE_REGIONS.includes(plate.region) && <option value={plate.region}>| {plate.region}</option>}
                      </select>
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
