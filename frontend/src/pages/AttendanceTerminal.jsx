import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle, AlertTriangle, ArrowLeft, MapPin, Delete } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const AttendanceTerminal = () => {
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [empPreview, setEmpPreview] = useState(null);
  const [tickerRows, setTickerRows] = useState([]);
  const [feedbackOverlay, setFeedbackOverlay] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio sound effects
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'tap') {
        osc.frequency.value = 580;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  // Instant Employee Lookup on typing
  useEffect(() => {
    const val = currentInput.trim();
    if (!val) {
      setEmpPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/public/attendance/lookup/${val}`);
        if (res.data && res.data.found) {
          setEmpPreview(res.data);
        } else {
          setEmpPreview(null);
        }
      } catch (e) {
        setEmpPreview(null);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [currentInput]);

  // Live activity ticker feed
  const fetchLiveTicker = async () => {
    try {
      const res = await axios.get('/api/public/attendance/ticker');
      setTickerRows(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveTicker();
    const interval = setInterval(fetchLiveTicker, 5000);
    return () => clearInterval(interval);
  }, []);

  const tapNum = (n) => {
    playSound('tap');
    if (currentInput.length < 8) {
      setCurrentInput(prev => prev + n);
    }
  };

  const tapClear = () => {
    playSound('tap');
    setCurrentInput('');
    setEmpPreview(null);
  };

  const tapDelete = () => {
    playSound('tap');
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const triggerOverlay = (type, title, message, actionText, duration = 3500) => {
    playSound(type);
    setFeedbackOverlay({ type, title, message, actionText });
    setTimeout(() => {
      setFeedbackOverlay(null);
      setCurrentInput('');
      setEmpPreview(null);
      fetchLiveTicker();
    }, duration);
  };

  const handlePointage = async (actionType) => {
    if (isProcessing) return;
    const val = currentInput.trim();
    if (!val) {
      triggerOverlay('warning', 'SAISIE MANQUANTE', 'Veuillez saisir votre numéro de matricule (ex: 001 ou 002).', 'SAISIE OBLIGATOIRE', 3000);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await axios.post('/api/public/attendance/terminal', {
        matricule: val,
        type: actionType,
        site: 'Abidjan Plateau'
      });
      setIsProcessing(false);
      triggerOverlay(
        'success',
        'POINTAGE VALIDÉ !',
        res.data.employeeName || 'Pointage effectué',
        actionType === 'IN' ? 'Entrée enregistrée' : 'Départ enregistré',
        3500
      );
    } catch (err) {
      setIsProcessing(false);
      const errMsg = err.response?.data?.error || 'Erreur lors du pointage';
      triggerOverlay('error', 'POINTAGE REFUSÉ', errMsg, 'INVALIDE', 4000);
    }
  };

  const timeString = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' : ');
  const secondsString = currentTime.getSeconds().toString().padStart(2, '0');
  const dateString = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000000_100%)] flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding & Big Digital Clock */}
        <div className="text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-4">
            <div className="bg-white p-2 rounded-3xl shadow-2xl border-2 border-[#E5A110] flex items-center justify-center shrink-0">
              <img src="/gebat_logo.png" alt="GEBAT Logo" className="h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-2">GEBAT <span className="text-[#E5A110]">RH</span></h1>
              <p className="text-[#2563EB] font-bold tracking-[0.3em] uppercase text-xs">Terminal Borne de Pointage</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-7xl md:text-9xl font-black text-white tracking-tighter tabular-nums">{timeString}</div>
            <div className="text-2xl font-bold text-[#009E49]/60 tabular-nums">{secondsString}</div>
            <div className="text-xl font-medium text-white/40 uppercase tracking-widest pt-4 capitalize">{dateString}</div>
          </div>

          <div className="hidden lg:block pt-12">
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Terminal Sécurisé - Zone : Abidjan Plateau
            </p>
          </div>
        </div>

        {/* Right Side: Clean White Rounded Kiosk Card (More compact height) */}
        <div className="bg-white rounded-[36px] shadow-2xl p-6 lg:p-8 relative overflow-hidden">
          
          {/* Fullscreen Feedback Overlay */}
          {feedbackOverlay && (
            <div className={`absolute inset-0 z-50 rounded-[36px] flex flex-col items-center justify-center text-white p-6 text-center transition-all duration-300 ${
              feedbackOverlay.type === 'success' ? 'bg-[#009E49]' : feedbackOverlay.type === 'warning' ? 'bg-amber-600' : 'bg-rose-600'
            }`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                {feedbackOverlay.type === 'success' && <CheckCircle2 className="w-10 h-10" />}
                {feedbackOverlay.type === 'warning' && <AlertTriangle className="w-10 h-10" />}
                {feedbackOverlay.type === 'error' && <AlertCircle className="w-10 h-10" />}
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-wide">{feedbackOverlay.title}</h3>
              <p className="text-lg font-bold opacity-90 max-w-sm">{feedbackOverlay.message}</p>
              <p className="mt-3 px-5 py-1.5 bg-white/20 rounded-full text-xs font-black tracking-widest uppercase">{feedbackOverlay.actionText}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center space-y-0.5">
              <h2 className="text-xl font-black text-[#2d3436]">IDENTIFICATION</h2>
              <p className="text-[#636e72] text-[11px] font-medium">Saisissez votre matricule (ex: 001 ou 002)</p>
            </div>

            <div className="relative">
              <input 
                type="text" 
                readOnly 
                value={currentInput || "--- --- ---"} 
                className="w-full text-center py-3 bg-[#f0f2f5] border-none rounded-2xl text-2xl font-black tracking-[0.2em] text-[#2d3436] placeholder:text-[#dfe6e9]"
              />
            </div>

            {/* Instant Employee Preview Card */}
            {empPreview && (
              <div className="bg-[#f0f2f5] border border-[#dfe6e9] rounded-2xl p-3 transition-all duration-300 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#009E49] text-white font-black flex items-center justify-center text-xs shadow-md uppercase">
                    {empPreview.nom?.[0]}{empPreview.prenoms?.[0]}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-black text-[#2d3436] text-xs truncate">{empPreview.nom} {empPreview.prenoms}</h4>
                    <p className="text-[9px] font-bold text-[#636e72] uppercase truncate">{empPreview.poste} • {empPreview.departement}</p>
                  </div>
                  <div className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 ${
                    empPreview.hasOutToday ? 'bg-orange-100 text-[#F77F00]' :
                    empPreview.hasInToday ? 'bg-emerald-100 text-[#009E49]' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {empPreview.hasOutToday ? `Sortie à ${empPreview.outTime}` : empPreview.hasInToday ? `Arrivée à ${empPreview.inTime}` : 'Prêt à pointer'}
                  </div>
                </div>
              </div>
            )}

            {/* Keypad Matrix (Compact height h-13) */}
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button 
                  key={n}
                  onClick={() => tapNum(String(n))}
                  className="h-13 py-2.5 rounded-xl bg-[#f0f2f5] hover:bg-[#dfe6e9] text-xl font-black text-[#2d3436] transition-all active:scale-95 shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button 
                onClick={tapClear}
                className="h-13 py-2.5 rounded-xl bg-red-50 text-[#d63031] font-black text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                EFFACER
              </button>
              <button 
                onClick={() => tapNum('0')}
                className="h-13 py-2.5 rounded-xl bg-[#f0f2f5] hover:bg-[#dfe6e9] text-xl font-black text-[#2d3436] transition-all active:scale-95 shadow-sm"
              >
                0
              </button>
              <button 
                onClick={tapDelete}
                className="h-13 py-2.5 rounded-xl bg-[#f0f2f5] text-[#2d3436] flex items-center justify-center transition-all active:scale-95 hover:bg-[#dfe6e9]"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons (Compact padding p-4) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={() => handlePointage('IN')}
                className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#009E49] rounded-2xl hover:bg-[#009E49] transition-all shadow-md shadow-[#009E49]/15 active:scale-95"
              >
                <LogIn className="w-6 h-6 text-[#009E49] group-hover:text-white transition-colors" />
                <span className="font-black text-[#009E49] group-hover:text-white uppercase tracking-widest text-[11px]">ARRIVÉE</span>
              </button>

              <button 
                onClick={() => handlePointage('OUT')}
                className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-[#F77F00] rounded-2xl hover:bg-[#F77F00] transition-all shadow-md shadow-[#F77F00]/15 active:scale-95"
              >
                <LogOut className="w-6 h-6 text-[#F77F00] group-hover:text-white transition-colors" />
                <span className="font-black text-[#F77F00] group-hover:text-white uppercase tracking-widest text-[11px]">DÉPART</span>
              </button>
            </div>
          </div>

          {/* Live Scrolling Ticker Feed */}
          <div className="mt-4 p-2.5 bg-[#f0f2f5] rounded-xl border border-[#dfe6e9] flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#009E49] animate-pulse shrink-0"></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-[#009E49] shrink-0">EN DIRECT :</span>
            <div className="overflow-hidden whitespace-nowrap w-full">
              <span className="text-xs font-bold text-[#2d3436] inline-block">
                {tickerRows.length > 0
                  ? tickerRows.map(r => `${r.nom} (${r.type === 'IN' ? 'Entrée' : 'Sortie'} à ${new Date(r.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`).join('   •   ')
                  : 'Chargement des derniers pointages...'
                }
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs font-bold text-[#636e72] hover:text-[#2d3436] transition-colors inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> QUITTER LE TERMINAL
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTerminal;
