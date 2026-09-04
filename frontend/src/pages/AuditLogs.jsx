import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { ShieldAlert, Search, Filter, RefreshCw, Calendar, Clock, User, Laptop, Database, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('Tous');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/admin/audit-logs');
      setLogs(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des journaux d\'audit:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return { date: 'N/A', time: 'N/A' };
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: 'N/A', time: 'N/A' };
    return {
      date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const getActionBadgeColor = (action = '') => {
    if (action.includes('CONNEXION')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('SUPPRESSION') || action.includes('ARCHIVAGE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('MODIFICATION') || action.includes('UPDATE')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (action.includes('CREATION') || action.includes('CLOTURE')) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (log.user_name || '').toLowerCase().includes(searchLower) ||
      (log.user_email || '').toLowerCase().includes(searchLower) ||
      (log.action || '').toLowerCase().includes(searchLower) ||
      (log.details || '').toLowerCase().includes(searchLower) ||
      (log.ip_address || '').includes(searchLower);

    const matchesModule = filterModule === 'Tous' || log.module === filterModule || (filterModule === 'Connexions' && log.action.includes('CONNEXION'));
    return matchesSearch && matchesModule;
  });

  const exportLogsToCSV = () => {
    let csv = "data:text/csv;charset=utf-8,ID,Date,Heure,Utilisateur,Email,Role,Action,Module,IP,Navigateur,Details\n";
    filteredLogs.forEach(l => {
      const { date, time } = formatDate(l.created_at);
      csv += `${l.id},"${date}","${time}","${l.user_name || 'Inconnu'}","${l.user_email || ''}",${l.user_role || ''},"${l.action || ''}","${l.module || ''}",${l.ip_address || ''},"${(l.user_agent || '').replace(/"/g, '""')}","${(l.details || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_audit_sirh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader
        title="Journal d'Audit & Sécurité"
        subtitle="Traces d'activité et journalisation des événements système en temps réel"
      />

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-ci-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ci-muted" size={18} />
            <input
              type="text"
              placeholder="Rechercher utilisateur, IP, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ci-bg border border-ci-border rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-ci-green/50"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {['Tous', 'Connexions', 'Employés', 'Contrats', 'Congés', 'Paie', 'Recrutement'].map(mod => (
              <button
                key={mod}
                onClick={() => setFilterModule(mod)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  filterModule === mod ? 'bg-ci-text text-white shadow-md' : 'bg-ci-bg text-ci-muted hover:bg-ci-border/50'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={fetchAuditLogs}
            className="p-3 bg-ci-bg hover:bg-ci-border/50 text-ci-text rounded-2xl transition-all"
            title="Rafraîchir les journaux"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={exportLogsToCSV}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet size={16} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[3rem] border border-ci-border shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center uppercase font-black text-ci-muted animate-pulse">
            Chargement des traces d'audit...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <ShieldAlert size={48} className="mx-auto text-ci-muted" />
            <p className="text-sm font-black text-ci-text uppercase tracking-widest">Aucune trace d'audit trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ci-bg/50 border-b border-ci-border text-[9px] font-black uppercase tracking-widest text-ci-muted">
                  <th className="py-5 px-6">Horodatage</th>
                  <th className="py-5 px-6">Utilisateur & Rôle</th>
                  <th className="py-5 px-6">Action & Module</th>
                  <th className="py-5 px-6">Détails</th>
                  <th className="py-5 px-6">IP / Navigateur</th>
                  <th className="py-5 px-6 text-right">Variations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ci-border text-xs font-bold">
                {filteredLogs.map(log => {
                  const { date, time } = formatDate(log.created_at);
                  const isExpanded = expandedLogId === log.id;
                  const hasValues = log.old_value || log.new_value;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-ci-bg/20 transition-all">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-ci-text font-black">
                            <Calendar size={14} className="text-ci-muted" />
                            {date}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-ci-muted font-semibold mt-0.5">
                            <Clock size={12} />
                            {time}
                          </div>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-ci-green" />
                            <span className="font-black text-ci-text">{log.user_name || log.user_email || 'Anonyme'}</span>
                          </div>
                          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-ci-bg text-ci-muted border border-ci-border">
                            {log.user_role || 'visiteur'}
                          </span>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                          {log.module && (
                            <p className="text-[10px] font-bold text-ci-muted mt-1 uppercase tracking-wider">{log.module}</p>
                          )}
                        </td>

                        <td className="py-4 px-6 max-w-xs truncate text-ci-text font-semibold">
                          {log.details || 'N/A'}
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[10px] text-ci-text">
                            <Database size={12} className="text-ci-muted" />
                            {log.ip_address || '127.0.0.1'}
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px] text-ci-muted truncate max-w-[150px] mt-0.5" title={log.user_agent}>
                            <Laptop size={10} />
                            {log.user_agent || 'Inconnu'}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {hasValues ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-ci-green hover:underline uppercase tracking-wider"
                            >
                              {isExpanded ? 'Masquer' : 'Voir Diff'}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          ) : (
                            <span className="text-[10px] text-ci-muted italic">-</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Row for Old vs New values */}
                      {isExpanded && (
                        <tr className="bg-slate-900 text-white">
                          <td colSpan={6} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                              <div>
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Ancienne Valeur</p>
                                <pre className="bg-black/40 p-4 rounded-xl text-slate-300 overflow-x-auto text-[11px]">
                                  {log.old_value ? JSON.stringify(JSON.parse(log.old_value), null, 2) : 'Aucune donnée antérieure'}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Nouvelle Valeur</p>
                                <pre className="bg-black/40 p-4 rounded-xl text-slate-300 overflow-x-auto text-[11px]">
                                  {log.new_value ? JSON.stringify(JSON.parse(log.new_value), null, 2) : 'Aucune nouvelle donnée'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
