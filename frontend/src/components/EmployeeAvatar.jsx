import React, { useState } from 'react';

// Palette de dégradés élégants et dynamiques
const GRADIENTS = [
  'from-emerald-500 to-teal-700 text-white',
  'from-blue-600 to-indigo-800 text-white',
  'from-amber-500 to-orange-700 text-white',
  'from-violet-600 to-purple-800 text-white',
  'from-rose-500 to-pink-700 text-white',
  'from-cyan-500 to-blue-700 text-white',
  'from-emerald-600 to-green-800 text-white',
  'from-slate-700 to-slate-900 text-white'
];

/**
 * Composant Avatar Robuste et Haute Définition
 * - Affiche la photo de profil avec `object-cover`
 * - Détecte les erreurs de chargement et bascule instantanément sur les initiales colorées
 * - Détermine un dégradé unique et constant basé sur le nom / matricule
 */
const EmployeeAvatar = ({
  src,
  alt = 'Collaborateur',
  nom = '',
  prenoms = '',
  matricule = '',
  size = 'md', // 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
  className = '',
  rounded = 'rounded-2xl',
  border = 'border border-slate-200/60 shadow-sm'
}) => {
  const [hasError, setHasError] = useState(false);

  // Tailles prédéfinies
  const sizeClasses = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-3xl'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Calcul des initiales (ex: "Kouamé Jean" -> "KJ")
  const getInitials = () => {
    const n = (nom || '').trim().charAt(0).toUpperCase();
    const p = (prenoms || '').trim().charAt(0).toUpperCase();
    if (n && p) return `${n}${p}`;
    if (n) return n;
    if (matricule) return matricule.replace(/[^A-Za-z0-9]/g, '').substring(0, 2).toUpperCase();
    return 'RH';
  };

  // Dégradé déterministe
  const getGradient = () => {
    const key = `${nom}_${prenoms}_${matricule}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GRADIENTS.length;
    return GRADIENTS[index];
  };

  const hasValidPhoto = Boolean(src && typeof src === 'string' && src.trim().length > 10 && !hasError);

  if (hasValidPhoto) {
    return (
      <div className={`relative shrink-0 overflow-hidden ${currentSizeClass} ${rounded} ${border} ${className}`}>
        <img
          src={src}
          alt={alt || nom || 'Photo'}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback initiales avec badge stylisé
  return (
    <div
      className={`shrink-0 flex items-center justify-center font-black tracking-tight bg-gradient-to-br ${getGradient()} ${currentSizeClass} ${rounded} ${border} shadow-inner select-none ${className}`}
      title={`${nom} ${prenoms}`.trim() || matricule}
    >
      <span>{getInitials()}</span>
    </div>
  );
};

export default EmployeeAvatar;
