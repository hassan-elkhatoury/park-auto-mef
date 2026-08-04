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

// Map vehicle brand/model to actual fleet photos deployed in /public/assets/cars
export const getVehiclePhoto = (marque, modele) => {
  const brand = (marque || '').toLowerCase();
  const model = (modele || '').toLowerCase();

  // Peugeot
  if (brand.includes('peugeot')) {
    if (model.includes('508')) return '/assets/cars/car_peugeot_508.jpg';
    if (model.includes('208')) return '/assets/cars/car_peugeot_208.jpg';
    if (model.includes('308')) return '/assets/cars/car_peugeot_308.jpg';
    if (model.includes('3008')) return '/assets/cars/car_peugeot_3008.jpg';
    if (model.includes('5008')) return '/assets/cars/car_peugeot_5008.jpg';
    if (model.includes('partner')) return '/assets/cars/car_peugeot_partner.jpg';
    if (model.includes('rifter')) return '/assets/cars/car_peugeot_rifter.jpg';
    return '/assets/cars/car_peugeot_308.jpg';
  }

  // Renault
  if (brand.includes('renault')) {
    if (model.includes('megane') || model.includes('mégane')) return '/assets/cars/car_renault_megane.jpg';
    if (model.includes('clio')) return '/assets/cars/car_renault_clio.jpg';
    if (model.includes('express')) return '/assets/cars/car_renault_express.jpg';
    if (model.includes('talisman')) return '/assets/cars/car_renault_talisman.jpg';
    if (model.includes('koleos')) return '/assets/cars/car_renault_koleos.jpg';
    if (model.includes('master')) return '/assets/cars/car_renault_master.jpg';
    if (model.includes('kangoo')) return '/assets/cars/car_renault_kangoo.jpg';
    return '/assets/cars/car_renault_clio.jpg';
  }

  // Dacia
  if (brand.includes('dacia')) {
    if (model.includes('duster')) return '/assets/cars/car_dacia_duster.jpg';
    if (model.includes('logan')) return '/assets/cars/car_dacia_logan.jpg';
    if (model.includes('sandero')) return '/assets/cars/car_dacia_sandero.jpg';
    if (model.includes('dokker')) return '/assets/cars/car_dacia_dokker.jpg';
    if (model.includes('jogger')) return '/assets/cars/car_dacia_jogger.jpg';
    return '/assets/cars/car_dacia_duster.jpg';
  }

  // Toyota
  if (brand.includes('toyota')) {
    if (model.includes('hilux')) return '/assets/cars/car_toyota_hilux.jpg';
    if (model.includes('prado')) return '/assets/cars/car_toyota_prado.jpg';
    if (model.includes('land cruiser') || model.includes('landcruiser')) return '/assets/cars/car_toyota_land_cruiser.jpg';
    if (model.includes('corolla')) return '/assets/cars/car_toyota_corolla.jpg';
    if (model.includes('rav4') || model.includes('rav 4')) return '/assets/cars/car_toyota_rav4.jpg';
    if (model.includes('camry')) return '/assets/cars/car_toyota_camry.jpg';
    return '/assets/cars/car_toyota_corolla.jpg';
  }

  // Volkswagen
  if (brand.includes('volkswagen') || brand.includes('vw')) {
    if (model.includes('passat')) return '/assets/cars/car_volkswagen_passat.jpg';
    if (model.includes('golf')) return '/assets/cars/car_volkswagen_golf.jpg';
    if (model.includes('tiguan')) return '/assets/cars/car_volkswagen_tiguan.jpg';
    if (model.includes('caddy')) return '/assets/cars/car_volkswagen_caddy.jpg';
    if (model.includes('touareg')) return '/assets/cars/car_volkswagen_touareg.jpg';
    if (model.includes('polo')) return '/assets/cars/car_volkswagen_polo.jpg';
    return '/assets/cars/car_volkswagen_golf.jpg';
  }

  // Citroën
  if (brand.includes('citroen') || brand.includes('citroën')) {
    if (model.includes('c5') || model.includes('aircross')) return '/assets/cars/car_citro_n_c5_aircross.jpg';
    if (model.includes('c4')) return '/assets/cars/car_citro_n_c4.jpg';
    if (model.includes('c3')) return '/assets/cars/car_citro_n_c3.jpg';
    if (model.includes('berlingo')) return '/assets/cars/car_citro_n_berlingo.jpg';
    if (model.includes('jumpy')) return '/assets/cars/car_citro_n_jumpy.jpg';
    return '/assets/cars/car_citro_n_c3.jpg';
  }

  // Hyundai
  if (brand.includes('hyundai')) {
    if (model.includes('tucson')) return '/assets/cars/car_hyundai_tucson.jpg';
    if (model.includes('santa fe') || model.includes('santafe')) return '/assets/cars/car_hyundai_santa_fe.jpg';
    if (model.includes('elantra')) return '/assets/cars/car_hyundai_elantra.jpg';
    if (model.includes('accent')) return '/assets/cars/car_hyundai_accent.jpg';
    if (model.includes('i30')) return '/assets/cars/car_hyundai_i30.jpg';
    return '/assets/cars/car_hyundai_tucson.jpg';
  }

  // Mercedes-Benz
  if (brand.includes('mercedes')) {
    if (model.includes('classe e') || model.includes('e-class') || model.includes('e class')) return '/assets/cars/car_mercedes_benz_classe_e.jpg';
    if (model.includes('classe c') || model.includes('c-class') || model.includes('c class')) return '/assets/cars/car_mercedes_benz_classe_c.jpg';
    if (model.includes('vito')) return '/assets/cars/car_mercedes_benz_vito.jpg';
    if (model.includes('gle')) return '/assets/cars/car_mercedes_benz_gle.jpg';
    if (model.includes('sprinter')) return '/assets/cars/car_mercedes_benz_sprinter.jpg';
    return '/assets/cars/car_mercedes_benz_classe_c.jpg';
  }

  // Nissan
  if (brand.includes('nissan')) {
    if (model.includes('navara')) return '/assets/cars/car_nissan_navara.jpg';
    if (model.includes('qashqai')) return '/assets/cars/car_nissan_qashqai.jpg';
    if (model.includes('patrol')) return '/assets/cars/car_nissan_patrol.jpg';
    if (model.includes('xtrail') || model.includes('x-trail')) return '/assets/cars/car_nissan_x_trail.jpg';
    return '/assets/cars/car_nissan_qashqai.jpg';
  }

  // Standalone model check fallbacks
  if (model.includes('duster')) return '/assets/cars/car_dacia_duster.jpg';
  if (model.includes('hilux')) return '/assets/cars/car_toyota_hilux.jpg';
  if (model.includes('508')) return '/assets/cars/car_peugeot_508.jpg';

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
    <span className={`bg-[#0A1E3F] text-white px-3 py-1 rounded-md font-mono text-xs font-bold tracking-wider border border-[#C59B27]/40 ${className}`}>
      {immatriculation}
    </span>
  );
}
