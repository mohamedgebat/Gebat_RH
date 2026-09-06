import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, CheckCheck, Trash2, ShieldAlert, AlertTriangle, Info, ExternalLink, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'urgente', 'importante', 'info'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // Polling toutes les 45s
    return () => clearInterval(interval);
  }, []);

  // Fermeture du menu au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => !n.is_read && n.type === 'urgente').length;

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {}
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {}
  };

  const handleNavigateModule = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    
    // Routage intelligent selon le type de notification
    if (notif.title.includes('Contrat')) navigate('/contracts');
    else if (notif.title.includes('Congé')) navigate('/leaves');
    else if (notif.title.includes('Attestation')) navigate('/documents');
    else if (notif.title.includes('Disciplinaire')) navigate('/disciplinary');
    else if (notif.title.includes('Avance')) navigate('/payroll');
    else navigate('/employees');
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getPriorityBadge = (type) => {
    switch (type) {
      case 'urgente':
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert size={10} /> Urgente
          </span>
        );
      case 'importante':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={10} /> Importante
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
            <Info size={10} /> Info
          </span>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bouton Cloche de Notification */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 rounded-2xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 active:scale-95"
        title="Notifications Intelligentes GEBAT"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-[#2563EB] animate-wiggle" : "text-slate-500"} />
        
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-black text-white shadow-md flex items-center justify-center min-w-[20px] ${
            urgentCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-[#E5A110]'
          }`}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Tiroir / Dropdown de Notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-scaleIn">
          
          {/* Header du Panneau */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#E5A110]/20 text-[#E5A110] rounded-xl">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Alertes Intelligentes</h3>
                <p className="text-[9px] font-bold text-slate-400">Suivi automatisé GEBAT RH</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-[#E5A110] hover:underline flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-amber-500/30"
              >
                <CheckCheck size={12} /> Tout lire
              </button>
            )}
          </div>

          {/* Onglets Filtres */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-1 text-[10px] font-black uppercase">
            {[
              { id: 'all', label: 'Toutes', count: notifications.length },
              { id: 'urgente', label: 'Urgentes', count: notifications.filter(n => n.type === 'urgente').length },
              { id: 'importante', label: 'Importantes', count: notifications.filter(n => n.type === 'importante').length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-1 py-1.5 rounded-xl transition-all ${
                  filter === tab.id
                    ? 'bg-[#2563EB] text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:bg-slate-200/60'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Liste des Notifications */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto font-black">
                  ✓
                </div>
                <p className="text-xs font-bold text-slate-700">Aucune alerte pour le moment</p>
                <p className="text-[10px] text-slate-400">Le système surveille vos données chantiers et RH en temps réel.</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 transition-all hover:bg-slate-50 relative group ${
                    !notif.is_read ? 'bg-blue-50/30 border-l-4 border-[#2563EB]' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(notif.type)}
                      <span className="text-[9px] font-bold text-slate-400">
                        {new Date(notif.created_at || Date.now()).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Marquer comme lu"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 leading-snug">{typeof notif.title === 'object' ? JSON.stringify(notif.title) : String(notif.title || '')}</h4>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-0.5">{typeof notif.message === 'object' ? JSON.stringify(notif.message) : String(notif.message || '')}</p>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleNavigateModule(notif)}
                      className="text-[10px] font-black text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      <span>Traiter l'action</span>
                      <ExternalLink size={10} />
                    </button>

                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping"></span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer du Panneau */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <button
              onClick={fetchNotifications}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <Sparkles size={12} className="text-[#E5A110]" /> Actualiser l'analyse intelligente
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
