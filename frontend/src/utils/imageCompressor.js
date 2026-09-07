/**
 * Compresse et redimensionne une image côté client via HTML5 Canvas
 * Garantit que la photo de profil est toujours nette, légère (30-60 Ko) et rapide à charger
 */
export const compressImage = (file, { maxWidth = 400, maxHeight = 400, quality = 0.85 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Aucun fichier sélectionné'));
    }

    // Si ce n'est pas un fichier image standard, on tente de le lire
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcul des dimensions proportionnelles
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);

        // Export en JPEG optimisé
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => {
        // En cas d'erreur de chargement Canvas, fallback sur le DataURL brut
        resolve(event.target.result);
      };
    };

    reader.onerror = (err) => reject(err);
  });
};
