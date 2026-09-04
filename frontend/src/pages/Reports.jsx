import React from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { BarChart3, PieChart, TrendingDown, Users, DollarSign, Download, FileSpreadsheet } from 'lucide-react';
import { calculateDetailedPaie } from '../utils/payrollCalc';

const Reports = () => {
  const { data, loading } = useData();

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted animate-pulse">Génération des rapports BI...</div>;

  const rawEmployees = data?.employees || [];
  const activeEmployees = rawEmployees.filter(e => e.statut === 'Actif' && !e.is_deleted);
  const inactiveEmployees = rawEmployees.filter(e => e.statut !== 'Actif' || e.is_deleted);
  const payrollHistory = data?.payrollHistory || [];

  // Calculate live total salary cost
  const totalCost = activeEmployees.reduce((sum, emp) => {
    const p = calculateDetailedPaie(emp, 0);
    return sum + p.brutTotal + p.cnpsPatronal + p.taxesPatronalesDetails.totalTaxesPatronales;
  }, 0);

  const avgSalary = activeEmployees.length > 0 ? (activeEmployees.reduce((sum, e) => sum + (e.salaireBase || 0), 0) / activeEmployees.length) : 0;
  const turnover = activeEmployees.length > 0 ? ((inactiveEmployees.length / activeEmployees.length) * 100).toFixed(1) : '0.0';

  const formatCurrency = (val) => {
    return val >= 1000000 
      ? `${(val / 1000000).toFixed(2)}M F`
      : `${new Intl.NumberFormat('fr-FR').format(Math.round(val))} F`;
  };

  // Contract Breakdown
  const contractCounts = activeEmployees.reduce((acc, emp) => {
    const type = emp.type || 'CDI';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const totalEmps = activeEmployees.length || 1;
  const contractTypes = [
    { label: 'CDI (Contrat Indéterminé)', val: Math.round(((contractCounts['CDI'] || 0) / totalEmps) * 100), color: 'bg-ci-green' },
    { label: 'CDD (Contrat Déterminé)', val: Math.round(((contractCounts['CDD'] || 0) / totalEmps) * 100), color: 'bg-ci-orange' },
    { label: 'Stage / Prestation', val: Math.round((((contractCounts['Stage'] || 0) + (contractCounts['Consultance'] || 0)) / totalEmps) * 100), color: 'bg-ci-info' }
  ];

  // Payroll evolution bars
  const historyBars = payrollHistory.length > 0
    ? payrollHistory.slice(0, 6).reverse().map(h => ({ period: h.periode, masse: h.masseBrute || h.masseNette || 0 }))
    : [
        { period: 'Jan', masse: totalCost * 0.9 },
        { period: 'Fév', masse: totalCost * 0.95 },
        { period: 'Mar', masse: totalCost * 0.98 },
        { period: 'Avr', masse: totalCost * 0.99 },
        { period: 'Mai', masse: totalCost },
        { period: 'Juin', masse: totalCost }
      ];

  const maxMasse = Math.max(...historyBars.map(b => b.masse), 1);

  const handleExportBI = () => {
    let csv = "data:text/csv;charset=utf-8,Indicateur,Valeur\n";
    csv += `Effectifs Actifs,${activeEmployees.length}\n`;
    csv += `Cout Total Masse Salariale FCFA,${Math.round(totalCost)}\n`;
    csv += `Salaire Moyen FCFA,${Math.round(avgSalary)}\n`;
    csv += `Taux Turnover %,${turnover}\n`;

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_BI_RH_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Rapports & Analytics BI" 
        subtitle="Business Intelligence & Indicateurs Décisionnels RH (Côte d'Ivoire)"
        actions={
            <button 
              onClick={handleExportBI}
              className="bg-ci-sidebar text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
            >
                <Download size={14} /> Exporter Rapport BI (CSV)
            </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-[0.2em] mb-2">Coût Total Masse Salariale</p>
            <h3 className="text-4xl font-black text-ci-green tracking-tighter">{formatCurrency(totalCost)}</h3>
            <p className="text-[10px] font-bold text-ci-muted uppercase mt-4">Cotisations sociales & Impôts inclus</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-[0.2em] mb-2">Taux de Turn-over</p>
            <h3 className="text-4xl font-black text-ci-orange tracking-tighter">{turnover}%</h3>
            <p className="text-[10px] font-bold text-ci-muted uppercase mt-4">Inactifs / Actifs en BDD</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm group hover:shadow-xl transition-all">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-[0.2em] mb-2">Moyenne Salariale Brute</p>
            <h3 className="text-4xl font-black text-ci-info tracking-tighter">{formatCurrency(avgSalary)}</h3>
            <p className="text-[10px] font-bold text-ci-muted uppercase mt-4">Calculée sur {activeEmployees.length} salariés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[3rem] p-10 border border-ci-border shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h4 className="text-xs font-black text-ci-text uppercase tracking-widest">Évolution de la Masse Salariale</h4>
                <BarChart3 size={20} className="text-ci-green" />
            </div>
            <div className="h-64 flex items-end justify-between gap-4">
                {historyBars.map((b, i) => {
                  const pct = Math.round((b.masse / maxMasse) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="w-full bg-ci-greenLight rounded-t-xl group-hover:bg-ci-green transition-all relative" style={{ height: `${Math.max(15, pct)}%` }}>
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                            {formatCurrency(b.masse)}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-ci-muted uppercase">{b.period}</span>
                    </div>
                  );
                })}
            </div>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-ci-border shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <h4 className="text-xs font-black text-ci-text uppercase tracking-widest">Répartition des Salariés par Contrat</h4>
                <PieChart size={20} className="text-ci-orange" />
            </div>
            <div className="space-y-6">
                {contractTypes.map((item, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                            <span>{item.label}</span>
                            <span>{item.val}%</span>
                        </div>
                        <div className="h-2 bg-ci-bg rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
