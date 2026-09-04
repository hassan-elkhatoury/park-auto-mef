/**
 * Service de gestion des photos de profil (Avatar).
 * Source de vérité : `user.photoUrl` renvoyé par le backend (login / /auth/me).
 * localStorage n'est qu'un cache d'affichage, vidé à la déconnexion.
 */

import api from './api';

const AVATAR_STORAGE_PREFIX = 'parkauto_avatar_';

export const DEFAULT_AVATAR = '/assets/portraits/mef-administrateur.jpg';

/**
 * Galerie de portraits officiels / institutionnels prédéfinis
 */
export const PRESET_AVATARS = [
  { id: 'admin', label: 'Administrateur MEF', url: '/assets/portraits/mef-administrateur.jpg' },
  { id: 'gestionnaire', label: 'Gestionnaire local', url: '/assets/portraits/mef-gestionnaire-local.jpg' },
  { id: 'conducteur', label: 'Conducteur', url: '/assets/portraits/mef-conducteur.jpg' },
  { id: 'cadre-f1', label: 'Cadre MEF', url: '/assets/portraits/mef-cadre-femme-1.png' },
  { id: 'cadre-h1', label: 'Cadre MEF', url: '/assets/portraits/mef-cadre-homme-1.png' },
  { id: 'cadre-f2', label: 'Cadre MEF', url: '/assets/portraits/mef-cadre-femme-2.png' },
  { id: 'cadre-h2', label: 'Cadre MEF', url: '/assets/portraits/mef-cadre-homme-2.png' },
];

const isUploadedPhotoUrl = (url) =>
  typeof url === 'string' && url.startsWith('/api/auth/photos/');

const withPhotoCacheBuster = (url, user) => {
  if (!isUploadedPhotoUrl(url)) return url;
  const version = user?.dateModification || user?.id || '';
  if (!version) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${encodeURIComponent(version)}`;
};

/**
 * Récupère l'URL de l'avatar actuel de l'utilisateur.
 * Priorité : photo serveur, puis cache local, puis portrait par défaut.
 */
export const getUserAvatar = (user) => {
  if (!user) return DEFAULT_AVATAR;
  const fromServer = String(user.photoUrl || user.avatarUrl || '').trim();
  if (fromServer) return withPhotoCacheBuster(fromServer, user);
  const key = user.email || user.matricule || user.id || 'default';
  try {
    const saved = localStorage.getItem(AVATAR_STORAGE_PREFIX + key);
    if (saved) return saved;
  } catch (e) {
    // Ignore localStorage error
  }
  return DEFAULT_AVATAR;
};

/**
 * Compresse et redimensionne une image (File) en DataURL base64 (max 256x256)
 */
export const processImageFile = (file, maxSize = 256, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Veuillez sélectionner un fichier image valide.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcul du recadrage carré centré
        const minDim = Math.min(width, height);
        const startX = (width - minDim) / 2;
        const startY = (height - minDim) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          startX, startY, minDim, minDim,
          0, 0, maxSize, maxSize
        );

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Impossible de lire l'image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

const dataUrlToJpegFile = (dataUrl) => {
  const comma = dataUrl.indexOf(',');
  const header = comma >= 0 ? dataUrl.slice(0, comma) : '';
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = /data:(.*?);/.exec(header)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], 'avatar.jpg', { type: mime });
};

const unwrapUser = (res) => {
  if (!res || typeof res !== 'object') return null;
  if (res.data?.email || res.data?.id != null || res.data?.photoUrl) return res.data;
  if (res.data?.utilisateur?.email || res.data?.utilisateur?.id != null) return res.data.utilisateur;
  if (res.utilisateur?.email || res.utilisateur?.id != null) return res.utilisateur;
  if (res.email || res.id != null || res.photoUrl) return res;
  return null;
};

/**
 * Persiste la photo côté serveur (portrait prédéfini ou fichier uploadé).
 * @returns {Promise<object>} utilisateur mis à jour (avec photoUrl)
 */
export const persistUserAvatar = async (avatarUrl) => {
  let raw;
  if (avatarUrl && avatarUrl.startsWith('data:')) {
    const form = new FormData();
    form.append('file', dataUrlToJpegFile(avatarUrl));
    raw = await api.put('/auth/me/photo', form);
  } else {
    const normalized = String(avatarUrl || DEFAULT_AVATAR).trim().split('?')[0];
    raw = isUploadedPhotoUrl(normalized)
      ? await api.get('/auth/me')
      : await api.put('/auth/me/photo', { photoUrl: normalized || DEFAULT_AVATAR });
  }

  const user = unwrapUser(raw);
  if (!user || (user.email == null && user.id == null)) {
    throw new Error("Le serveur n'a pas enregistré la photo de profil.");
  }
  return user;
};

/**
 * Enregistre un nouvel avatar en cache local et émet un événement global
 */
export const saveUserAvatar = (user, avatarUrl) => {
  if (!user) return;
  const key = user.email || user.matricule || user.id || 'default';
  try {
    localStorage.setItem(AVATAR_STORAGE_PREFIX + key, avatarUrl);
  } catch (e) {
    console.warn('Stockage local plein pour avatar:', e);
  }

  window.dispatchEvent(new CustomEvent('parkauto:avatar-updated', {
    detail: { email: user.email, avatarUrl }
  }));
};

/**
 * Réinitialise l'avatar par défaut (cache local uniquement)
 */
export const resetUserAvatar = (user) => {
  if (!user) return;
  const key = user.email || user.matricule || user.id || 'default';
  try {
    localStorage.removeItem(AVATAR_STORAGE_PREFIX + key);
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('parkauto:avatar-updated', {
    detail: { email: user.email, avatarUrl: DEFAULT_AVATAR }
  }));
};
