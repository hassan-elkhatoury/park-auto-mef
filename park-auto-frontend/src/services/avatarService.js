/**
 * Service de gestion dynamique des photos de profil (Avatar).
 * Permet l'upload personnalisé, la compression automatique en WebP/JPEG,
 * la persistance locale par utilisateur et la synchronisation réactive entre Navbar & Profil.
 */

const AVATAR_STORAGE_PREFIX = 'parkauto_avatar_';

/**
 * Galerie de portraits officiels / institutionnels prédéfinis
 */
export const PRESET_AVATARS = [
  { id: 'admin', label: 'Cadre Supérieur', url: '/assets/avatar_admin.jpg' },
  { id: 'pres1', label: 'Gestionnaire MEF', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face' },
  { id: 'pres2', label: 'Responsable Femme', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face' },
  { id: 'pres3', label: 'Conducteur / Agent', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face' },
  { id: 'pres4', label: 'Ingénieur / Technique', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&crop=face' },
  { id: 'pres5', label: 'Cadre Financier', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=face' },
];

/**
 * Récupère l'URL de l'avatar actuel de l'utilisateur
 */
export const getUserAvatar = (user) => {
  if (!user) return '/assets/avatar_admin.jpg';
  const key = user.email || user.matricule || user.id || 'default';
  try {
    const saved = localStorage.getItem(AVATAR_STORAGE_PREFIX + key);
    if (saved) return saved;
  } catch (e) {
    // Ignore localStorage error
  }
  return user.photoUrl || user.avatarUrl || '/assets/avatar_admin.jpg';
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

/**
 * Enregistre un nouvel avatar pour l'utilisateur et émet un événement global
 */
export const saveUserAvatar = (user, avatarUrl) => {
  if (!user) return;
  const key = user.email || user.matricule || user.id || 'default';
  try {
    localStorage.setItem(AVATAR_STORAGE_PREFIX + key, avatarUrl);
  } catch (e) {
    console.warn('Stockage local plein pour avatar:', e);
  }

  // Notifier toute l'application (Navbar, Profile, etc.)
  window.dispatchEvent(new CustomEvent('parkauto:avatar-updated', {
    detail: { email: user.email, avatarUrl }
  }));
};

/**
 * Réinitialise l'avatar par défaut
 */
export const resetUserAvatar = (user) => {
  if (!user) return;
  const key = user.email || user.matricule || user.id || 'default';
  try {
    localStorage.removeItem(AVATAR_STORAGE_PREFIX + key);
  } catch (e) {}

  window.dispatchEvent(new CustomEvent('parkauto:avatar-updated', {
    detail: { email: user.email, avatarUrl: '/assets/avatar_admin.jpg' }
  }));
};
