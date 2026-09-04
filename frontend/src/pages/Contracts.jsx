import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { FileText, Download, Printer, Plus, X, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';

/* ─────────────────────────────────────────────────────────────
   Génération HTML du contrat de travail ivoirien
───────────────────────────────────────────────────────────── */
const generateContractHTML = (contract, employee, company) => {
  const typeLabels = {
    CDI: "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE",
    CDD: "CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE",
    Stage: "CONVENTION DE STAGE",
    Consultance: "CONTRAT DE PRESTATION DE SERVICES"
  };
  const contractTitle = typeLabels[contract.type] || "CONTRAT DE TRAVAIL";

  const formatDate = (d) => {
    if (!d) return '___________';
    const date = new Date(d);
    return date.toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const salaireMensuel = Math.round((contract.salaireAnnuel || (employee.salaireBase * 12)) / 12);
  const salaireAnnuel = contract.salaireAnnuel || (employee.salaireBase * 12);

  const formatMontant = (m) => new Intl.NumberFormat('fr-CI').format(m) + ' F CFA';

  const refContrat = `${contract.type}-${new Date(contract.debut).getFullYear()}-${String(contract.empId).padStart(3, '0')}`;

  const isStage = contract.type === 'Stage';
  const isCDD = contract.type === 'CDD';
  const isCDI = contract.type === 'CDI';

  // Couleurs de l'entreprise (personnalisables)
  const companyColor = company.primaryColor || '#009E49';
  const companyColorSecondary = company.secondaryColor || '#F77F00';

  // Articles spécifiques selon le type
  const articleDuree = isCDI
    ? `<p>Le présent contrat est conclu pour une durée <strong>indéterminée</strong>, conformément aux dispositions de l'article 14.2 du Code du Travail de Côte d'Ivoire.</p>
       <p>Il prend effet à compter du <strong>${formatDate(contract.debut)}</strong>.</p>
       <p>Le présent contrat est soumis à une période d'essai de <strong>${employee.poste?.toLowerCase().includes('cadre') || (salaireMensuel > 400000) ? 'six (6) mois' : 'trois (3) mois'}</strong>, renouvelable une fois dans les conditions prévues par la convention collective applicable et le Code du Travail ivoirien.</p>`
    : isCDD
    ? `<p>Le présent contrat est conclu pour une durée <strong>déterminée</strong>, conformément aux dispositions de l'article 14.5 du Code du Travail de Côte d'Ivoire.</p>
       <p>Il prend effet à compter du <strong>${formatDate(contract.debut)}</strong> et prend fin le <strong>${formatDate(contract.fin)}</strong>.</p>
       <p>La durée totale du présent contrat, renouvellements compris, ne saurait excéder deux (2) ans, sauf dérogations légales.</p>
       <p>À l'échéance du terme, une <strong>indemnité de fin de contrat</strong> égale à 3% du total des salaires bruts perçus sera versée à l'employé, conformément à l'article 14.8 du Code du Travail.</p>`
    : isStage
    ? `<p>La présente convention de stage est conclu pour une durée de <strong>${contract.fin ? Math.round((new Date(contract.fin) - new Date(contract.debut)) / (1000 * 60 * 60 * 24 * 30)) : '—'} mois</strong>.</p>
       <p>Elle prend effet à compter du <strong>${formatDate(contract.debut)}</strong> et prend fin le <strong>${formatDate(contract.fin)}</strong>.</p>
       <p>Ce stage est effectué dans le cadre de la formation professionnelle du stagiaire et ne saurait être assimilé à un contrat de travail.</p>`
    : `<p>La présente prestation prend effet à compter du <strong>${formatDate(contract.debut)}</strong>${contract.fin ? ` et prend fin le <strong>${formatDate(contract.fin)}</strong>` : ''}.</p>`;

  const articleRemuneration = isStage
    ? `<p>En contrepartie de son stage, le stagiaire percevra une <strong>gratification mensuelle</strong> d'un montant de <strong>${formatMontant(salaireMensuel)}</strong>.</p>
       <p>Cette gratification est versée à la fin de chaque mois de stage effectif. Elle n'est pas soumise aux cotisations sociales si elle est inférieure au SMIG ivoirien.</p>`
    : `<p>En contrepartie de son travail, le Salarié percevra un <strong>salaire brut mensuel</strong> de <strong>${formatMontant(salaireMensuel)}</strong>, soit <strong>${formatMontant(salaireAnnuel)}</strong> annuels.</p>
       <p>Le salaire est versé à la fin de chaque mois de travail effectif, par virement bancaire sur le RIB : <strong>${employee.rib || 'à fournir'}</strong> ou tout autre moyen convenu entre les parties.</p>
       <p>Ce salaire comprend la rémunération de base et est conforme au barème de la convention collective applicable au secteur d'activité de l'Employeur.</p>
       <p>L'Employeur s'acquittera des cotisations patronales CNPS (Caisse Nationale de Prévoyance Sociale) conformément à la législation en vigueur (taux patronal de 16,15 % du salaire brut plafonné). Le Salarié supportera les cotisations salariales CNPS (taux de 3,2 % du salaire brut plafonné).</p>
       <p>L'Impôt sur les Traitements et Salaires (ITS) sera calculé et retenu à la source conformément au Code Général des Impôts de Côte d'Ivoire.</p>`;

  // Article supplémentaire sur la confidentialité
  const articleConfidentialite = !isStage ? `
  <div class="article">
    <div class="article-title">Article 10 – Confidentialité et Propriété Intellectuelle</div>
    <div class="article-body">
      <p>Le Salarié s'engage à respecter la confidentialité de toutes les informations, données, procédés, techniques, et savoir-faire auxquels il aura accès dans l'exercice de ses fonctions.</p>
      <p>Cette obligation de confidentialité persiste après la cessation du contrat, sans limitation de durée.</p>
      <p>Toutes les créations, inventions, logiciels ou développements réalisés par le Salarié dans le cadre de ses fonctions sont la propriété exclusive de la Société.</p>
    </div>
  </div>` : '';

  // Article sur la protection des données
  const articleDonnees = `
  <div class="article">
    <div class="article-title">${isStage ? 'Article 8' : 'Article 11'} – Protection des Données Personnelles</div>
    <div class="article-body">
      <p>Les données personnelles du ${isStage ? 'stagiaire' : 'Salarié'} sont collectées et traitées conformément à la Loi n° 2019-481 du 19 juin 2019 relative à la protection des données personnelles en Côte d'Ivoire.</p>
      <p>Le ${isStage ? 'stagiaire' : 'Salarié'} dispose d'un droit d'accès, de rectification et de suppression de ses données personnelles.</p>
    </div>
  </div>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${contractTitle} – ${employee.nom} ${employee.prenoms}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Times New Roman', serif;
      font-size: 11.5px;
      color: #1a1a2e;
      background: #fff;
      line-height: 1.6;
    }

    .contract-wrapper {
      max-width: 820px;
      margin: 0 auto;
      padding: 30px 40px;
    }

    /* ── ENTÊTE ── */
    .header-band {
      background: ${companyColor};
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 4px 4px 0 0;
      margin-bottom: 0;
    }
    .header-band .company-name {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .header-band .ref-block {
      font-size: 9px;
      text-align: right;
      opacity: 0.85;
      line-height: 1.7;
    }

    .header-box {
      border: 2px solid #1a1a2e;
      border-top: none;
      padding: 18px 20px;
      margin-bottom: 20px;
    }
    .header-meta {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #555;
      margin-bottom: 12px;
    }

    .contract-title {
      text-align: center;
      font-size: 17px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      background: ${companyColor}15;
      border: 1.5px solid ${companyColor};
      color: ${companyColor};
      padding: 12px 0;
      margin: 0;
    }

    /* ── PARTIES ── */
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border: 1.5px solid #1a1a2e;
      margin-bottom: 20px;
    }
    .party-box {
      padding: 14px 18px;
    }
    .party-box:first-child {
      border-right: 1.5px solid #1a1a2e;
    }
    .party-label {
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #555;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ddd;
    }
    .party-name {
      font-size: 13px;
      font-weight: 800;
      color: ${companyColor};
      text-transform: uppercase;
    }
    .party-info {
      font-size: 10px;
      color: #444;
      margin-top: 4px;
      line-height: 1.7;
    }

    /* ── ARTICLES ── */
    .article {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .article-title {
      font-size: 10.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${companyColor};
      background: ${companyColor}10;
      border-left: 4px solid ${companyColor};
      padding: 7px 12px;
      margin-bottom: 8px;
    }
    .article-body {
      padding: 0 12px;
    }
    .article-body p {
      margin-bottom: 6px;
      text-align: justify;
    }
    .article-body ul {
      margin: 6px 0 6px 20px;
    }
    .article-body ul li {
      margin-bottom: 4px;
    }

    /* ── TABLEAU RÉMUNÉRATION ── */
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 10.5px;
    }
    .salary-table th {
      background: ${companyColor};
      color: white;
      padding: 7px 10px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .salary-table td {
      border-bottom: 1px solid #eee;
      padding: 7px 10px;
    }
    .salary-table tr:last-child td {
      font-weight: 800;
      background: ${companyColor}10;
      border-top: 2px solid ${companyColor};
    }

    /* ── SIGNATURES ── */
    .signatures-section {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
    }
    .sig-box {
      border: 1.5px solid #1a1a2e;
      padding: 14px 18px;
    }
    .sig-label {
      font-size: 9px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #555;
      margin-bottom: 5px;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .sig-role {
      font-size: 9.5px;
      color: #666;
      margin-bottom: 30px;
    }
    .sig-line {
      border-top: 1.5px solid #1a1a2e;
      margin-top: 30px;
      padding-top: 5px;
      font-size: 9px;
      color: #888;
    }

    /* ── PIED DE PAGE ── */
    .footer-legal {
      margin-top: 24px;
      border-top: 2px solid #1a1a2e;
      padding-top: 10px;
      font-size: 8.5px;
      color: #666;
      text-align: center;
      line-height: 1.6;
    }

    .stamp-box {
      border: 2px dashed #aaa;
      padding: 20px;
      text-align: center;
      font-size: 9px;
      color: #aaa;
      margin-top: 10px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .contract-wrapper { padding: 10px 20px; }
    }
  </style>
</head>
<body>
<div class="contract-wrapper">

  <!-- ENTÊTE -->
  <div class="header-band">
    <div class="company-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
    <div class="ref-block">
      Réf : ${refContrat}<br/>
      Abidjan, le ${formatDate(new Date().toISOString())}<br/>
      RC : ${company.rc || '—'} &nbsp;|&nbsp; CC : ${company.cc || '—'}
    </div>
  </div>

  <div class="header-box">
    <div class="header-meta">
      <span>📍 ${company.address || 'Abidjan, Côte d\'Ivoire'}</span>
      <span>📞 ${company.phone || ''} &nbsp;&nbsp; ✉ ${company.email || ''}</span>
      <span>CNPS Employeur : ${company.cnps_employer || '—'}</span>
      ${company.website ? `<span>🌐 ${company.website}</span>` : ''}
    </div>
    <div class="contract-title">${contractTitle}</div>
  </div>

  <!-- PRÉAMBULE -->
  <div class="article">
    <div class="article-body">
      <p>
        Entre les soussignés, il a été convenu et arrêté ce qui suit, conformément au <strong>Code du Travail de Côte d'Ivoire (Loi n° 2015-532 du 20 juillet 2015)</strong>, aux conventions collectives interprofessionnelles en vigueur, et à la réglementation sociale applicable en République de Côte d'Ivoire.
      </p>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties-grid">
    <div class="party-box">
      <div class="party-label">L'Employeur (Ci-après « la Société »)</div>
      <div class="party-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
      <div class="party-info">
        Siège social : ${company.address || 'Abidjan, Plateau, Avenue Marchand'}<br/>
        RC : ${company.rc || '—'} &nbsp;|&nbsp; CC : ${company.cc || '—'}<br/>
        CNPS Employeur : ${company.cnps_employer || '—'}<br/>
        Tél. : ${company.phone || '—'} &nbsp;|&nbsp; ${company.email || '—'}
      </div>
    </div>
    <div class="party-box">
      <div class="party-label">${isStage ? 'Le Stagiaire' : 'Le Salarié'} (Ci-après « ${isStage ? 'le Stagiaire' : 'le Salarié'} »)</div>
      <div class="party-name">${employee.nom} ${employee.prenoms}</div>
      <div class="party-info">
        Matricule : <strong>${employee.matricule || '—'}</strong><br/>
        Poste : ${employee.poste || '—'}<br/>
        Département : ${employee.departement || '—'}<br/>
        ${employee.cnps ? `N° CNPS : ${employee.cnps}<br/>` : ''}
        ${employee.rib ? `RIB Bancaire : ${employee.rib}<br/>` : ''}
        Tél. : ${employee.telephone || '—'} &nbsp;|&nbsp; ${employee.email || '—'}
      </div>
    </div>
  </div>

  <!-- ARTICLE 1 : OBJET -->
  <div class="article">
    <div class="article-title">Article 1 – Objet du Contrat</div>
    <div class="article-body">
      ${isStage
        ? `<p>La Société accueille le Stagiaire <strong>${employee.nom} ${employee.prenoms}</strong> en stage au sein de son département <strong>${employee.departement || '—'}</strong>, au poste de <strong>${employee.poste || '—'}</strong>, dans le cadre de sa formation.</p>
           <p>Ce stage a pour objectif de permettre au stagiaire d'acquérir une expérience professionnelle dans le domaine de <strong>${employee.departement || '—'}</strong>.</p>`
        : isCDD
        ? `<p>La Société engage le Salarié <strong>${employee.nom} ${employee.prenoms}</strong> en qualité de <strong>${employee.poste || '—'}</strong>, au sein du département <strong>${employee.departement || '—'}</strong>, site de <strong>${employee.site ? employee.site.charAt(0).toUpperCase() + employee.site.slice(1) : '—'}</strong>.</p>
           <p>Le Salarié exercera ses fonctions conformément à sa fiche de poste et aux instructions de ses supérieurs hiérarchiques. Cette fiche de poste est annexée au présent contrat et en fait partie intégrante.</p>`
        : isCDI
        ? `<p>La Société engage le Salarié <strong>${employee.nom} ${employee.prenoms}</strong> en qualité de <strong>${employee.poste || '—'}</strong>, au sein du département <strong>${employee.departement || '—'}</strong>, site de <strong>${employee.site ? employee.site.charAt(0).toUpperCase() + employee.site.slice(1) : '—'}</strong>.</p>
           <p>Le Salarié exercera ses fonctions conformément à sa fiche de poste et aux instructions de ses supérieurs hiérarchiques. Cette fiche de poste est annexée au présent contrat et en fait partie intégrante.</p>`
        : `<p>Le Prestataire <strong>${employee.nom} ${employee.prenoms}</strong> s'engage à fournir les services de <strong>${employee.poste || '—'}</strong> à la Société, conformément aux termes du présent contrat.</p>`
      }
    </div>
  </div>

  <!-- ARTICLE 2 : DURÉE -->
  <div class="article">
    <div class="article-title">Article 2 – Durée et Prise d'Effet</div>
    <div class="article-body">
      ${articleDuree}
    </div>
  </div>

  <!-- ARTICLE 3 : LIEU DE TRAVAIL -->
  <div class="article">
    <div class="article-title">Article 3 – Lieu de Travail</div>
    <div class="article-body">
      <p>Le lieu habituel de travail est fixé au site de <strong>${employee.site ? employee.site.charAt(0).toUpperCase() + employee.site.slice(1) : '—'}</strong>, ${company.address || 'Abidjan, Côte d\'Ivoire'}.</p>
      <p>La Société se réserve le droit de modifier le lieu de travail en fonction des nécessités de service, dans le respect des dispositions légales et conventionnelles en vigueur.</p>
    </div>
  </div>

  <!-- ARTICLE 4 : RÉMUNÉRATION -->
  <div class="article">
    <div class="article-title">Article 4 – Rémunération</div>
    <div class="article-body">
      ${articleRemuneration}
      <table class="salary-table">
        <thead>
          <tr>
            <th>Élément</th>
            <th style="text-align:right;">Mensuel (F CFA)</th>
            <th style="text-align:right;">Annuel (F CFA)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${isStage ? 'Gratification mensuelle brute' : 'Salaire de base brut'}</td>
            <td style="text-align:right;">${formatMontant(salaireMensuel)}</td>
            <td style="text-align:right;">${formatMontant(salaireAnnuel)}</td>
          </tr>
          ${!isStage ? `
          <tr>
            <td>Cotisation CNPS salariale (3,2 %)</td>
            <td style="text-align:right;">– ${formatMontant(Math.round(Math.min(salaireMensuel, 1647315 / 12) * 0.032))}</td>
            <td style="text-align:right;">– ${formatMontant(Math.round(Math.min(salaireMensuel, 1647315 / 12) * 0.032 * 12))}</td>
          </tr>
          <tr>
            <td><strong>Salaire net estimé (avant ITS)</strong></td>
            <td style="text-align:right;"><strong>${formatMontant(Math.round(salaireMensuel - Math.min(salaireMensuel, 1647315 / 12) * 0.032))}</strong></td>
            <td style="text-align:right;"><strong>${formatMontant(Math.round((salaireMensuel - Math.min(salaireMensuel, 1647315 / 12) * 0.032) * 12))}</strong></td>
          </tr>` : ''}
        </tbody>
      </table>
    </div>
  </div>

  <!-- ARTICLE 5 : DURÉE DU TRAVAIL -->
  <div class="article">
    <div class="article-title">Article 5 – Durée et Organisation du Travail</div>
    <div class="article-body">
      <p>La durée légale du travail est fixée à <strong>40 heures par semaine</strong> (soit 173 heures par mois), conformément aux dispositions de l'article 21.1 du Code du Travail de Côte d'Ivoire.</p>
      <p>Les heures supplémentaires éventuelles feront l'objet d'une majoration de salaire conformément à la loi : <strong>15 %</strong> pour les 6 premières heures supplémentaires, <strong>50 %</strong> pour les heures suivantes, <strong>75 %</strong> pour les heures effectuées les dimanches et jours fériés.</p>
    </div>
  </div>

  <!-- ARTICLE 6 : CONGÉS -->
  <div class="article">
    <div class="article-title">Article 6 – Congés Payés</div>
    <div class="article-body">
      ${isStage
        ? `<p>Le stagiaire bénéficiera de congés au prorata de la durée du stage, selon les règles de la Société et les dispositions légales applicables aux stagiaires.</p>`
        : `<p>Le Salarié bénéficiera de <strong>2,2 jours ouvrables de congés payés</strong> par mois de travail effectif, soit <strong>26,4 jours</strong> par an, conformément à l'article 25.1 du Code du Travail de Côte d'Ivoire.</p>
           <p>Les congés seront pris selon un calendrier établi d'un commun accord entre les parties, en tenant compte des nécessités du service.</p>`
      }
    </div>
  </div>

  <!-- ARTICLE 7 : OBLIGATIONS DES PARTIES -->
  <div class="article">
    <div class="article-title">Article 7 – Obligations des Parties</div>
    <div class="article-body">
      ${isStage ? `
      <p><strong>7.1 – Obligations du Stagiaire :</strong></p>
      <ul>
        <li>Se conformer aux horaires de travail et aux règles de la Société ;</li>
        <li>Exécuter consciencieusement les tâches confiées dans le cadre du stage ;</li>
        <li>Respecter la confidentialité des informations professionnelles ;</li>
        <li>Participer activement aux formations et activités proposées.</li>
      </ul>
      <p style="margin-top:8px;"><strong>7.2 – Obligations de l'Employeur :</strong></p>
      <ul>
        <li>Accueillir le stagiaire dans de bonnes conditions ;</li>
        <li>Désigner un tuteur pour l'accompagner ;</li>
        <li>Verser la gratification convenue ;</li>
        <li>Délivrer une attestation de stage à l'issue.</li>
      </ul>` : contract.type === 'Consultance' ? `
      <p><strong>7.1 – Obligations du Prestataire :</strong></p>
      <ul>
        <li>Fournir les services convenus avec diligence et professionnalisme ;</li>
        <li>Respecter les délais et spécifications convenus ;</li>
        <li>Garantir la qualité et la conformité des livrables ;</li>
        <li>Respecter la confidentialité des informations de la Société.</li>
      </ul>
      <p style="margin-top:8px;"><strong>7.2 – Obligations du Client :</strong></p>
      <ul>
        <li>Fournir les informations et ressources nécessaires ;</li>
        <li>Verser la rémunération convenue aux échéances fixées ;</li>
        <li>Collaborer avec le Prestataire pour le bon déroulement de la mission.</li>
      </ul>` : `
      <p><strong>7.1 – Obligations du Salarié :</strong></p>
      <ul>
        <li>Exécuter consciencieusement et loyalement les tâches qui lui sont confiées ;</li>
        <li>Respecter les horaires de travail et les règlements intérieurs de la Société ;</li>
        <li>Conserver le secret professionnel et la confidentialité des informations sensibles ;</li>
        <li>Ne pas exercer d'activité concurrente pendant la durée du contrat, sauf autorisation expresse de l'Employeur ;</li>
        <li>Signaler toute absence prévisible à l'avance et justifier toute absence imprévue dans les 48 heures.</li>
      </ul>
      <p style="margin-top:8px;"><strong>7.2 – Obligations de l'Employeur :</strong></p>
      <ul>
        <li>Fournir au Salarié les moyens nécessaires à l'accomplissement de ses fonctions ;</li>
        <li>Verser régulièrement la rémunération convenue ;</li>
        <li>Assurer des conditions de travail conformes à la réglementation en matière de sécurité et d'hygiène ;</li>
        <li>Affilier le Salarié à la CNPS et s'acquitter des cotisations correspondantes ;</li>
        <li>Remettre au Salarié un bulletin de paie mensuel détaillé.</li>
      </ul>`}
    </div>
  </div>

  <!-- ARTICLE 8 : CESSATION DU CONTRAT -->
  ${!isStage ? `
  <div class="article">
    <div class="article-title">Article 8 – Cessation du Contrat</div>
    <div class="article-body">
      ${isCDI
        ? `<p>Le présent contrat peut être rompu par l'une ou l'autre des parties moyennant un préavis, dont la durée est fixée comme suit, conformément à l'article 16.1 du Code du Travail :</p>
           <ul>
             <li><strong>Ouvriers et employés :</strong> 1 mois de préavis ;</li>
             <li><strong>Agents de maîtrise et techniciens :</strong> 2 mois de préavis ;</li>
             <li><strong>Cadres et assimilés :</strong> 3 mois de préavis.</li>
           </ul>
           <p>En cas de licenciement, le Salarié ayant accompli au moins un (1) an de service continu au sein de la Société aura droit à une <strong>indemnité de licenciement</strong> calculée conformément aux barèmes légaux et conventionnels en vigueur.</p>`
        : isCDD
        ? `<p>Le présent contrat prend fin de plein droit à l'échéance du terme fixé. L'employeur devra notifier par écrit au Salarié, au moins <strong>8 jours avant l'échéance</strong>, son intention de ne pas renouveler le contrat.</p>
           <p>À l'issue du contrat, le Salarié percevra une <strong>indemnité de fin de contrat</strong> représentant 3 % du total des salaires bruts versés pendant la durée du contrat.</p>`
        : `<p>Le présent contrat de prestation peut être résilié par l'une ou l'autre des parties moyennant un préavis de <strong>30 jours</strong>, sauf accord contraire entre les parties.</p>
           <p>En cas de faute grave ou de non-respect des obligations contractuelles, la résiliation peut être immédiate sans préavis.</p>`
      }
    </div>
  </div>` : `
  <div class="article">
    <div class="article-title">Article 8 – Fin de Stage</div>
    <div class="article-body">
      <p>La présente convention de stage prend fin automatiquement à l'échéance fixée. Elle peut également être rompu par l'une ou l'autre des parties moyennant un préavis de <strong>15 jours</strong>.</p>
      <p>À l'issue du stage, la Société délivrera au stagiaire une attestation de stage mentionnant la durée, les missions effectuées et l'appréciation globale.</p>
    </div>
  </div>`}

  <!-- ARTICLE 9 : LITIGES -->
  <div class="article">
    <div class="article-title">${isStage ? 'Article 8' : 'Article 9'} – Règlement des Litiges</div>
    <div class="article-body">
      <p>Tout différend relatif à l'exécution, l'interprétation ou la résiliation du présent contrat sera soumis, en premier lieu, à une tentative de règlement amiable entre les parties.</p>
      <p>À défaut de règlement amiable, le litige sera porté devant le <strong>Tribunal du Travail d'Abidjan</strong> (ou du ressort géographique compétent), conformément aux dispositions du Code du Travail et du Code de Procédure Civile de Côte d'Ivoire.</p>
    </div>
  </div>

  <!-- ARTICLE FINAL : EXEMPLAIRES -->
  <div class="article">
    <div class="article-title">${isStage ? 'Article 9' : 'Article 12'} – Dispositions Finales</div>
    <div class="article-body">
      <p>Le présent contrat est établi en <strong>deux (2) exemplaires originaux</strong>, un pour chaque partie, et signé à Abidjan, le ${formatDate(new Date().toISOString())}.</p>
      <p>Chaque partie reconnaît avoir pris connaissance du contenu du présent contrat et y adhérer librement et sans contrainte.</p>
      <p>Toute modification du présent contrat devra faire l'objet d'un avenant écrit, signé des deux parties.</p>
    </div>
  </div>

  ${articleConfidentialite}

  ${articleDonnees}

  <!-- SIGNATURES -->
  <div class="signatures-section">
    <div class="signatures-grid">
      <div class="sig-box">
        <div class="sig-label">Pour la Société (L'Employeur)</div>
        <div class="sig-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
        <div class="sig-role">Le Directeur Général / Directeur des Ressources Humaines</div>
        <div class="stamp-box">Cachet et Signature</div>
        <div class="sig-line">Nom &amp; Qualité : ___________________________</div>
      </div>
      <div class="sig-box">
        <div class="sig-label">${isStage ? 'Le Stagiaire' : 'Le Salarié'}</div>
        <div class="sig-name">${employee.nom} ${employee.prenoms}</div>
        <div class="sig-role">${employee.poste || '—'} — Matricule ${employee.matricule || '—'}</div>
        <div class="stamp-box">Signature précédée de la mention<br/>« Lu et approuvé »</div>
        <div class="sig-line">Date : ___________________________</div>
      </div>
    </div>
  </div>

  <!-- PIED DE PAGE LÉGAL -->
  <div class="footer-legal">
    <strong>Document juridique confidential</strong> · Réf. ${refContrat} · Généré le ${formatDate(new Date().toISOString())} via SIRH<br/>
    Contrat établi conformément à la <strong>Loi n° 2015-532 du 20 juillet 2015 portant Code du Travail de Côte d'Ivoire</strong><br/>
    et à la Convention Collective Interprofessionnelle du 19 juillet 1977 et ses avenants.<br/>
    ${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'} · ${company.address || 'Abidjan, Côte d\'Ivoire'}
  </div>

</div>
</body>
</html>`;
};

/* ─────────────────────────────────────────────────────────────
   Composant principal Contracts
───────────────────────────────────────────────────────────── */
const Contracts = () => {
  const { data, loading, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newContract, setNewContract] = useState({
    empId: '',
    type: 'CDI',
    debut: '',
    fin: '',
    salaireAnnuel: ''
  });

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted">Analyse des contrats...</div>;

  const getEmployee = (id) => data?.employees?.find(e => e.id === parseInt(id));
  const getEmpName = (id) => {
    const emp = getEmployee(id);
    return emp ? `${emp.nom} ${emp.prenoms}` : 'Collaborateur';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/contracts', newContract);
      setShowModal(false);
      refreshData();
    } catch (err) {
      alert('Erreur lors de la création du contrat');
    }
  };

  const handleGenerateContract = (contract) => {
    setGenerating(true);
    const employee = getEmployee(contract.empId);
    if (!employee) { alert('Employé introuvable'); setGenerating(false); return; }
    const company = data?.settings || {};

    const html = generateContractHTML(contract, employee, company);
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Veuillez autoriser les pop-ups.'); setGenerating(false); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      setGenerating(false);
    }, 800);
  };

  const handleCreateAndGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      let savedContract = { ...newContract, id: Date.now(), statut: 'Actif' };
      try {
        const res = await axios.post('/api/contracts', newContract);
        savedContract = res.data || savedContract;
        refreshData();
      } catch (_) { /* continue even if API fails */ }

      const employee = getEmployee(newContract.empId);
      if (!employee) { alert('Employé introuvable'); setGenerating(false); return; }
      const company = data?.settings || {};
      const html = generateContractHTML(savedContract, employee, company);
      const printWindow = window.open('', '_blank');
      if (!printWindow) { alert('Veuillez autoriser les pop-ups.'); setGenerating(false); return; }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); setGenerating(false); }, 800);
      setShowModal(false);
      setNewContract({ empId: '', type: 'CDI', debut: '', fin: '', salaireAnnuel: '' });
    } catch (err) {
      setGenerating(false);
      alert('Erreur lors de la génération du contrat');
    }
  };

  const typeColors = {
    CDI: 'bg-emerald-50 text-emerald-700',
    CDD: 'bg-amber-50 text-amber-700',
    Stage: 'bg-blue-50 text-blue-700',
    Consultance: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Contrats de travail"
        subtitle="Gestion des documents juridiques – Droit ivoirien"
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="bg-ci-sidebar text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={14} /> Nouveau Contrat
          </button>
        }
      />

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-ci-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted border-b border-ci-border">
              <tr>
                <th className="px-8 py-5 text-left">Collaborateur</th>
                <th className="px-8 py-5 text-left">Type</th>
                <th className="px-8 py-5 text-left">Début</th>
                <th className="px-8 py-5 text-left">Fin</th>
                <th className="px-8 py-5 text-right">Salaire Mensuel</th>
                <th className="px-8 py-5 text-left">Statut</th>
                <th className="px-8 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ci-bg">
              {(data?.contracts || []).map((c) => (
                <tr key={c.id} className="hover:bg-ci-bg/30 transition-colors">
                  <td className="px-8 py-5">
                    <p className="font-bold text-ci-text">{getEmpName(c.empId)}</p>
                    <p className="text-[10px] font-bold text-ci-muted uppercase mt-0.5">
                      {getEmployee(c.empId)?.matricule || `—`} · {c.type}-{new Date(c.debut).getFullYear()}-{String(c.id).padStart(3,'0')}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tighter ${typeColors[c.type] || 'bg-ci-bg text-ci-text'}`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-bold text-ci-text">
                    {new Date(c.debut).toLocaleDateString('fr-CI')}
                  </td>
                  <td className="px-8 py-5 font-bold text-ci-muted">
                    {c.fin ? (
                      <div>
                        <p>{new Date(c.fin).toLocaleDateString('fr-CI')}</p>
                        {c.type === 'CDD' && Math.round((new Date(c.fin) - new Date(c.debut)) / (1000 * 60 * 60 * 24 * 30.4)) > 24 && (
                          <span className="block text-[9px] text-red-600 font-black uppercase tracking-tight">⚠️ Non-Conforme (&gt; 24 mois)</span>
                        )}
                        {c.type === 'CDD' && (
                          <span className="block text-[9px] text-emerald-600 font-bold">
                            Précarité 3%: {new Intl.NumberFormat('fr-CI').format(Math.round((c.salaireAnnuel / 12) * Math.max(1, Math.round((new Date(c.fin) - new Date(c.debut)) / (1000 * 60 * 60 * 24 * 30.4))) * 0.03))} F
                          </span>
                        )}
                      </div>
                    ) : <span className="text-emerald-600">Indéterminée</span>}
                  </td>
                  <td className="px-8 py-5 text-right font-black text-ci-text">
                    {new Intl.NumberFormat('fr-CI').format(Math.round(c.salaireAnnuel / 12))} F
                    <p className="text-[10px] font-bold text-ci-muted">/mois</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      c.statut === 'Actif' ? 'bg-ci-greenLight text-ci-green' : 'bg-red-50 text-ci-danger'
                    }`}>
                      {c.statut}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Générer & Imprimer le contrat"
                        onClick={() => handleGenerateContract(c)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-ci-sidebar text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all shadow"
                      >
                        <FileText size={13} /> Contrat
                      </button>
                      <button
                        title="Imprimer"
                        onClick={() => handleGenerateContract(c)}
                        className="p-2 hover:bg-ci-bg rounded-lg text-ci-text transition-colors"
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL NOUVEAU CONTRAT ── */}
      {showModal && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl animate-scaleIn p-10 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase text-ci-sidebar">
                Nouveau Contrat
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateAndGenerate} className="space-y-5">
              {/* Collaborateur */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1 text-ci-muted">Collaborateur</label>
                <select
                  required
                  value={newContract.empId}
                  onChange={e => setNewContract({ ...newContract, empId: e.target.value })}
                  className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                >
                  <option value="">Sélectionner un employé...</option>
                  {(data?.employees || []).map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</option>
                  ))}
                </select>
              </div>

              {/* Type + Salaire */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-ci-muted">Type de contrat</label>
                  <select
                    value={newContract.type}
                    onChange={e => setNewContract({ ...newContract, type: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  >
                    <option>CDI</option>
                    <option>CDD</option>
                    <option>Stage</option>
                    <option>Consultance</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-ci-muted">
                    {newContract.type === 'Stage' ? 'Gratification mensuelle' : 'Salaire Annuel Brut'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newContract.salaireAnnuel}
                    onChange={e => setNewContract({ ...newContract, salaireAnnuel: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                    placeholder="F CFA"
                  />
                  {newContract.salaireAnnuel && (
                    <p className="text-[10px] text-ci-muted ml-1 font-bold">
                      ≈ {new Intl.NumberFormat('fr-CI').format(Math.round(newContract.salaireAnnuel / 12))} F CFA / mois
                    </p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-ci-muted">Date d'effet</label>
                  <input
                    type="date"
                    required
                    value={newContract.debut}
                    onChange={e => setNewContract({ ...newContract, debut: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase ml-1 text-ci-muted">
                    Date de fin {newContract.type === 'CDI' ? '(optionnel)' : '(obligatoire)'}
                  </label>
                  <input
                    type="date"
                    required={newContract.type !== 'CDI'}
                    value={newContract.fin}
                    onChange={e => setNewContract({ ...newContract, fin: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  />
                </div>
              </div>

              {newContract.type === 'CDD' && newContract.debut && newContract.fin && Math.round((new Date(newContract.fin) - new Date(newContract.debut)) / (1000 * 60 * 60 * 24 * 30.4)) > 24 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-800 font-bold leading-relaxed">
                    <strong>Alerte Code du Travail CI :</strong> Un contrat de travail à durée déterminée (CDD) ne peut excéder une durée maximale de 24 mois. Ce contrat dépasse la limite légale et doit être requalifié en CDI !
                  </p>
                </div>
              )}

              {/* Info légale */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                  Le document juridique sera généré conformément au <strong>Code du Travail de Côte d'Ivoire (Loi n° 2015-532 du 20 juillet 2015)</strong> et à la Convention Collective Interprofessionnelle. Le document s'imprimera directement depuis votre navigateur.
                </p>
              </div>

              {/* Bouton */}
              <button
                type="submit"
                disabled={generating}
                className="w-full py-5 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all mt-2 flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    Générer le Document Juridique
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
