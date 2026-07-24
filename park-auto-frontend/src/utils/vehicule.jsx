import React from 'react';

// Les 9 directions officielles du MEF (value = libellé stocké en base, short = acronyme)
export const DIRECTIONS_MEF = [
  { value: 'Direction du Budget', short: 'DB' },
  { value: 'Direction Générale des Impôts', short: 'DGI' },
  { value: 'Administration des Douanes et Impôts Indirects', short: 'ADII' },
  { value: 'Trésorerie Générale du Royaume', short: 'TGR' },
  { value: 'Direction des Entreprises Publiques et de la Privatisation', short: 'DEPP' },
  { value: 'Direction du Trésor et des Finances Extérieures', short: 'DTFE' },
  { value: 'Direction des Affaires Domestiques et Générales', short: 'DAG' },
  { value: 'Inspection Générale des Finances', short: 'IGF' },
  { value: 'Direction des Études et des Prévisions Financières', short: 'DEPF' },
];

export const directionShort = (direction) =>
  DIRECTIONS_MEF.find((d) => d.value === direction)?.short || direction || '—';

export const FUEL_LABELS = {
  DIESEL: 'Diesel',
  ESSENCE: 'Essence',
  HYBRIDE: 'Hybride',
  ELECTRIQUE: 'Électrique',
};

// Map vehicle brand/model to actual fleet photos deployed in /public/assets
export const getVehiclePhoto = (marque, modele) => {
  const brand = (marque || '').toLowerCase();
  const model = (modele || '').toLowerCase();
  if (brand.includes('peugeot') && model.includes('508')) return '/assets/car_peugeot508.jpg';
  if (brand.includes('dacia') || model.includes('duster')) return '/assets/car_duster.jpg';
  if (brand.includes('toyota') || model.includes('hilux')) return '/assets/car_toyota_hilux.jpg';
  return '/assets/car_default.jpg';
};

// Status badge CSS class (defined in index.css)
export const getStatusStyle = (statut) => {
  switch (statut) {
    case 'DISPONIBLE': return 'status-disponible';
    case 'AFFECTE': return 'status-affecte';
    case 'EN_ENTRETIEN': case 'EN_REPARATION': case 'IMMOBILISE': return 'status-en-entretien';
    case 'HORS_SERVICE': case 'ACCIDENTE': case 'REFORME': return 'status-hors-service';
    case 'ARCHIVE': return 'status-archive';
    case 'RESERVE': case 'TRANSFERE': return 'status-reserve';
    default: return 'status-disponible';
  }
};

// Official Moroccan plate rendering: "12345 | أ | 1"
export function MoroccanPlate({ immatriculation, className = '' }) {
  if (!immatriculation) return null;
  const parts = immatriculation.split('-');
  if (parts.length >= 3) {
    return (
      <div className={`moroccan-plate ${className}`}>
        <div className="plate-content">
          <span>{parts[0]}</span>
          <span className="plate-separator">|</span>
          <span>{parts[1]}</span>
          <span className="plate-separator">|</span>
          <span>{parts[2]}</span>
        </div>
      </div>
    );
  }
  return (
    <span className={`bg-[#070D1B] text-white px-3 py-1 rounded-md font-mono text-xs font-bold tracking-wider border border-[#C5A059]/40 ${className}`}>
      {immatriculation}
    </span>
  );
}
