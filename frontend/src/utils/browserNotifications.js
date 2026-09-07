/**
 * Utilitaire de gestion des Notifications Navigateur (Web Notifications API)
 * et Synthétiseur Audio Web Audio API pour GEBAT RH
 */

/**
 * Vérifie si l'API de notification est supportée par le navigateur
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Récupère le statut actuel de la permission ('default', 'granted', 'denied')
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Sollicite l'autorisation de l'utilisateur pour les notifications push navigateur
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('gebat_browser_notifications_enabled', 'true');
    }
    return permission;
  } catch (err) {
    console.error("Erreur lors de la demande de permission de notification:", err);
    return Notification.permission;
  }
};

/**
 * Joue un carillon discret et élégant via l'API Web Audio (aucun fichier MP3 requis)
 */
export const playNotificationSound = () => {
  try {
    const isSoundEnabled = localStorage.getItem('gebat_notification_sound_enabled') !== 'false';
    if (!isSoundEnabled) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Fréquences pour un carillon harmonieux (Do - Sol ascendant)
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Enveloppe d'attaque et décroissance douce
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(587.33, now, 0.35);       // Ré5
    playTone(880.00, now + 0.12, 0.45); // La5
  } catch (e) {
    // AudioContext bloqué par la politique autoplay du navigateur avant premier clic
  }
};

/**
 * Déclenche une notification système du navigateur
 */
export const sendBrowserNotification = (title, options = {}) => {
  if (!isNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  const isEnabled = localStorage.getItem('gebat_browser_notifications_enabled') !== 'false';
  if (!isEnabled) return null;

  try {
    playNotificationSound();

    const notif = new Notification(title, {
      icon: '/gebat_logo.png',
      badge: '/gebat_logo.png',
      body: options.body || 'Nouvelle alerte dans votre espace GEBAT RH',
      tag: options.tag || 'gebat-rh-alert',
      renotify: true,
      requireInteraction: options.requireInteraction || false,
      ...options
    });

    notif.onclick = function(event) {
      event.preventDefault();
      window.focus();
      if (options.onClickUrl) {
        window.location.href = options.onClickUrl;
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.error("Erreur lors de l'envoi de la notification navigateur:", err);
    return null;
  }
};

/**
 * Déclenche une notification de test immédiate
 */
export const testBrowserNotification = async () => {
  let perm = getNotificationPermission();
  if (perm !== 'granted') {
    perm = await requestNotificationPermission();
  }

  if (perm === 'granted') {
    sendBrowserNotification("🔔 GEBAT RH - Notifications Activées", {
      body: "Les alertes système de GEBAT RH sont désormais configurées et fonctionnelles sur votre poste.",
      tag: 'gebat-test-' + Date.now()
    });
    return true;
  }
  return false;
};
