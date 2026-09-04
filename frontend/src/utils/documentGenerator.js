/**
 * Générateur de documents RH & Contrats de Travail de Qualité Exécutive
 * Conforme au Code du Travail de la République de Côte d'Ivoire (2024/2026).
 */

const getCommonStyle = (primaryColor = '#009E49', secondaryColor = '#F77F00') => `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
  
  @page {
    size: A4;
    margin: 15mm 20mm;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
    line-height: 1.6;
    margin: 0;
    padding: 30px;
    background-color: #f8fafc;
  }

  .doc-container {
    max-width: 850px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 50px 60px;
    position: relative;
    min-height: 1050px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* Top Accent Branding Header */
  .brand-bar {
    height: 6px;
    width: 100%;
    background: linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%);
    position: absolute;
    top: 0;
    left: 0;
  }

  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f1f5f9;
  }

  .logo-cell {
    width: 120px;
    vertical-align: top;
  }

  .logo-img {
    max-width: 110px;
    max-height: 80px;
    object-fit: contain;
  }

  .company-info h1 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 18px;
    font-weight: 900;
    color: ${primaryColor};
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }

  .company-info p {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    margin: 1px 0;
    line-height: 1.4;
  }

  .security-cell {
    text-align: right;
    vertical-align: top;
  }

  .security-ref {
    font-size: 9px;
    font-weight: 800;
    color: #475569;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .qr-code {
    width: 75px;
    height: 75px;
    border: 1px solid #e2e8f0;
    padding: 3px;
    background: #ffffff;
    border-radius: 8px;
  }

  .doc-date {
    text-align: right;
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 30px;
  }

  .doc-title-box {
    text-align: center;
    margin-bottom: 40px;
  }

  .doc-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #0f172a;
    display: inline-block;
    padding: 10px 30px;
    border-bottom: 3px solid ${primaryColor};
    background: #f8fafc;
    border-radius: 8px;
  }

  .doc-body {
    font-size: 13.5px;
    color: #334155;
    text-align: justify;
    flex-grow: 1;
    line-height: 1.7;
  }

  .doc-body p {
    margin-bottom: 18px;
  }

  .highlight {
    font-weight: 800;
    color: #0f172a;
  }

  .article-title {
    font-weight: 800;
    color: #0f172a;
    margin-top: 25px;
    margin-bottom: 10px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-left: 4px solid ${primaryColor};
    padding-left: 12px;
    background: #f8fafc;
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .salary-table {
    width: 100%;
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 12px;
  }

  .salary-table th {
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 800;
    text-transform: uppercase;
    padding: 10px 14px;
    text-align: left;
    font-size: 10.5px;
    letter-spacing: 0.5px;
  }

  .salary-table td {
    padding: 10px 14px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    font-weight: 600;
  }

  .footer-signature {
    margin-top: 50px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 20px;
  }

  .signature-block {
    width: 45%;
    text-align: center;
  }

  .signature-title {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: #475569;
    margin-bottom: 15px;
    letter-spacing: 0.5px;
  }

  .company-seal {
    width: 110px;
    height: 110px;
    border: 2px dashed ${primaryColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5px;
    color: ${primaryColor};
    font-weight: 800;
    text-transform: uppercase;
    margin: 0 auto;
    opacity: 0.7;
    background: #f0fdf4;
  }

  .footer-legal-bar {
    margin-top: 40px;
    padding-top: 15px;
    border-top: 1px solid #e2e8f0;
    text-align: center;
    font-size: 8.5px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .no-print-bar {
    max-width: 850px;
    margin: 0 auto 15px auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .print-btn {
    background-color: ${primaryColor};
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 800;
    cursor: pointer;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
  }

  .print-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  @media print {
    body {
      padding: 0;
      background: white;
    }
    .doc-container {
      border: none;
      box-shadow: none;
      padding: 0;
    }
    .no-print-bar {
      display: none;
    }
  }
`;

const openPrintWindow = (htmlContent) => {
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(htmlContent);
    win.document.close();
  } else {
    alert('Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer le document.');
  }
};

const getSecurityQR = (type, emp, company) => {
  const text = `SIRH-CIV VALIDATED | Doc: ${type} | Emp: ${emp.nom} ${emp.prenoms} (${emp.matricule}) | Ste: ${company.companyName || 'SIRH'}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
};

/**
 * 1. ATTESTATION DE TRAVAIL (EN POSTE)
 */
export const generateAttestationTravail = (emp, company) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `REF: AT-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const logoUrl = company.logo || '';

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Attestation de Travail - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 11px; font-weight: 800; color: #64748b;">DOCUMENT RH OFFICIEL</span>
          <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                <td class="logo-cell" style="vertical-align: middle; padding-right: 15px;">
                  ${logoUrl ? `<img src="${logoUrl}" class="logo-img" alt="Logo" />` : `<div style="width:55px; height:55px; background:${primaryColor}; color:white; border-radius:12px; font-weight:900; font-size:24px; display:flex; align-items:center; justify-content:center;">${(company.companyName || 'E').charAt(0)}</div>`}
                </td>
                <td class="company-info" style="vertical-align: middle;">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || 'CI-ABJ-03-2024-B12'} | CC : ${company.cc || '2401234 A'}</p>
                  <p>N° CNPS Employeur : ${company.cnps_employer || '12345678'}</p>
                  <p>Siège : ${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                  <p>Tél : ${company.phone || '+225 27 20 00 00 00'} | E-mail : ${company.email || 'rh@entreprise.ci'}</p>
                </td>
                <td class="security-cell" style="vertical-align: middle;">
                  <div class="security-ref">${refCode}</div>
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title">Attestation de Travail</div>
            </div>

            <div class="doc-body">
              <p>Je soussigné, Direction des Ressources Humaines de la société <span class="highlight">${company.companyName || 'l\'Entreprise'}</span>, atteste par la présente que :</p>
              
              <p>Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, titulaire du matricule interne <span class="highlight">${emp.matricule}</span> et immatriculé(e) à la CNPS sous le N° <span class="highlight">${emp.cnps || '—'}</span>, résidant à ${emp.site || 'Abidjan'}, de nationalité ${emp.nationalite || 'Ivoirienne'},</p>
              
              <p>Est employé(e) au sein de notre entreprise depuis le <span class="highlight">${emp.dateEmbauche || '—'}</span> et y exerce à ce jour les fonctions de <span class="highlight">${emp.poste}</span> au sein du département <span class="highlight">${emp.departement}</span> sous un contrat à durée ${emp.type === 'CDI' ? 'Indéterminée (CDI)' : 'Déterminée (CDD)'}.</p>
              
              <p>À la date d'établissement de la présente attestation, Monsieur / Madame ${emp.nom.toUpperCase()} ${emp.prenoms} est libre de tout engagement d'ordre disciplinaire et exerce ses fonctions avec pleine satisfaction.</p>
              
              <p>La présente attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 11px; color: #475569; text-transform: uppercase;">Cachet de l'Entreprise</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction des Ressources Humaines</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">Le Responsable RH</div>
              </div>
            </div>

            <div class="footer-legal-bar">
              ${company.companyName || 'ENTREPRISE'} • RC : ${company.rc || '—'} • CC : ${company.cc || '—'} • CNPS : ${company.cnps_employer || '—'} • CONFORME CODE DU TRAVAIL CI
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * 2. CERTIFICAT DE TRAVAIL (OBLIGATION ART. 16.8 FIN DE CONTRAT)
 */
export const generateCertificatTravail = (emp, company) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `CERT: CT-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const qrUrl = getSecurityQR('Certificat de Travail', emp, company);

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Certificat de Travail - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 11px; font-weight: 800; color: #64748b;">CERTIFICAT DE FIN DE CONTRAT (ART 16.8 CODE DU TRAVAIL)</span>
          <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                  <p>N° CNPS Employeur : ${company.cnps_employer || '—'}</p>
                  <p>Siège : ${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                </td>
                <td class="security-cell">
                  <div class="security-ref">${refCode}</div>
                  <br/>
                  <img src="${qrUrl}" class="qr-code" alt="Vérification QR" />
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title">Certificat de Travail</div>
            </div>

            <div class="doc-body">
              <p>Nous soussignés, la société <span class="highlight">${company.companyName || 'l\'Entreprise'}</span>, certifions par la présente que :</p>
              
              <p>Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, immatriculé(e) sous le numéro CNPS <span class="highlight">${emp.cnps || '—'}</span> et le matricule <span class="highlight">${emp.matricule}</span>, a été employé(e) dans notre société du <span class="highlight">${emp.dateEmbauche || '—'}</span> au <span class="highlight">${dateStr}</span>.</p>
              
              <p>Durant toute cette période, Monsieur / Madame ${emp.nom.toUpperCase()} ${emp.prenoms} a successivement occupé le(s) poste(s) et fonctions de <span class="highlight">${emp.poste}</span> avec conscience professionnelle et probité.</p>
              
              <p>L'intéressé(e) quitte notre société ce jour, libre de tout engagement envers notre entreprise.</p>
              
              <p>En foi de quoi, le présent Certificat de Travail lui est délivré en application de l'Article 16.8 du Code du Travail de la République de Côte d'Ivoire pour servir et valoir ce que de droit.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div class="company-seal">CACHET OFFICIEL<br/>FIN DE CONTRAT</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction Générale</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">Le Directeur des Ressources Humaines</div>
              </div>
            </div>

            <div class="footer-legal-bar">
              CERTIFICAT LÉGAL OBLIGATOIRE DE RÉSILIATION • REPUBLIQUE DE COTE D'IVOIRE
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * 3. ATTESTATION DE SALAIRE (DEMANDE DE PRÊT / BANQUE)
 */
export const generateAttestationSalaire = (emp, company, payslipDetails) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `SAL: AS-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const qrUrl = getSecurityQR('Attestation de Salaire', emp, company);

  const baseVal = payslipDetails?.base || emp.salaireBase || 0;
  const logementVal = payslipDetails?.logement || Math.round(baseVal * 0.15);
  const transportVal = payslipDetails?.transport || 30000;
  const brutTotal = payslipDetails?.brutTotal || (baseVal + logementVal + transportVal);
  const cnpsVal = Math.round(baseVal * 0.063);
  const netEst = Math.round(brutTotal - cnpsVal - (baseVal * 0.02));

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Attestation de Salaire - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 11px; font-weight: 800; color: #64748b;">ATTESTATION DE SALAIRE POUR ORGANISME BANCAIRE</span>
          <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                  <p>N° CNPS Employeur : ${company.cnps_employer || '—'}</p>
                  <p>Siège : ${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                </td>
                <td class="security-cell">
                  <div class="security-ref">${refCode}</div>
                  <br/>
                  <img src="${qrUrl}" class="qr-code" alt="Vérification QR" />
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title">Attestation de Salaire</div>
            </div>

            <div class="doc-body">
              <p>La société <span class="highlight">${company.companyName || 'l\'Entreprise'}</span> atteste par la présente que Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, exerçant la fonction de <span class="highlight">${emp.poste}</span> (Matricule : <span class="highlight">${emp.matricule}</span>), perçoit à ce titre les éléments de rémunération mensuelle suivants :</p>
              
              <table class="salary-table">
                <thead>
                  <tr>
                    <th>Élément de Rémunération</th>
                    <th style="text-align: right;">Montant Mensuel (FCFA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Salaire Categoriel de Base</td>
                    <td style="text-align: right; font-weight: 800;">${new Intl.NumberFormat('fr-CI').format(baseVal)} F CFA</td>
                  </tr>
                  <tr>
                    <td>Indemnité de Logement (15%)</td>
                    <td style="text-align: right;">${new Intl.NumberFormat('fr-CI').format(logementVal)} F CFA</td>
                  </tr>
                  <tr>
                    <td>Indemnité de Transport Réglementaire</td>
                    <td style="text-align: right;">${new Intl.NumberFormat('fr-CI').format(transportVal)} F CFA</td>
                  </tr>
                  <tr style="background-color: #f8fafc; font-weight: 800;">
                    <td style="color: #0f172a;">SALAIRE BRUT MENSUEL GLOBAL</td>
                    <td style="text-align: right; color: ${primaryColor}; font-size: 14px;">${new Intl.NumberFormat('fr-CI').format(brutTotal)} F CFA</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; font-size: 11px;">Cotisation Retraite CNPS Salarié (6.3%)</td>
                    <td style="text-align: right; color: #dc2626; font-size: 11px;">- ${new Intl.NumberFormat('fr-CI').format(cnpsVal)} F CFA</td>
                  </tr>
                  <tr style="background-color: #f0fdf4; border-top: 2px solid ${primaryColor}; font-weight: 900;">
                    <td style="color: #065f46;">SALAIRE NET ESTIMÉ PAYÉ</td>
                    <td style="text-align: right; color: #065f46; font-size: 15px;">${new Intl.NumberFormat('fr-CI').format(netEst)} F CFA</td>
                  </tr>
                </tbody>
              </table>

              <p>Mode de Règlement : <span class="highlight">${emp.modePaiement || 'Virement Bancaire'}</span> ${emp.rib ? `(RIB : ${emp.rib})` : ''}</p>
              
              <p>Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, notamment auprès des établissements bancaires et financiers.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div class="company-seal">SERVICE PAIE<br/>& COMPTABILITÉ</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">Le Directeur Financier / Chef Comptable</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">Visa Comptabilité Paie</div>
              </div>
            </div>

            <div class="footer-legal-bar">
              ATTESTATION CONFIRMÉE ET CONFORME AUX BULLETINS DE PAIE RÉGLEMENTAIRES
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * 4. CONTRAT DE TRAVAIL OFFICIEL (CDI / CDD / STAGE)
 */
export const generateContratTravail = (emp, company, contract) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `CONTRAT: CT-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const qrUrl = getSecurityQR('Contrat de Travail', emp, company);

  const typeContratFull = contract.type === 'CDI' ? 'CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)' : 
                         contract.type === 'CDD' ? 'CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)' :
                         'CONVENTION DE STAGE DE QUALIFICATION PROFESSIONNELLE';

  const baseVal = emp.salaireBase || 0;
  const logementVal = Math.round(baseVal * 0.15);

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Contrat de Travail - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 11px; font-weight: 800; color: #64748b;">CONTRAT CONFORME CODE DU TRAVAIL IVOIRIEN</span>
          <button class="print-btn" onclick="window.print()">Imprimer le Contrat</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                  <p>N° CNPS Employeur : ${company.cnps_employer || '—'}</p>
                  <p>Siège : ${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                </td>
                <td class="security-cell">
                  <div class="security-ref">${refCode}</div>
                  <br/>
                  <img src="${qrUrl}" class="qr-code" alt="Vérification QR" />
                </td>
              </tr>
            </table>

            <div class="doc-title-box">
              <div class="doc-title" style="font-size: 16px;">${typeContratFull}</div>
            </div>

            <div class="doc-body" style="text-indent: 0;">
              <p style="font-weight: 800; text-transform: uppercase;">Entre les soussignés :</p>
              
              <p>La société <span class="highlight">${company.companyName || 'ENTREPRISE'}</span>, au capital de droit ivoirien, sise à ${company.address || 'Abidjan'}, immatriculée au RC sous le N° ${company.rc || '—'} et au CC N° ${company.cc || '—'}, représentée par son Responsable RH, ci-après dénommée <strong>"L'Employeur"</strong>,</p>
              <p><em>D'une part,</em></p>
              
              <p>Et,</p>
              <p>Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, résidant à ${emp.site || 'Abidjan'}, de nationalité ${emp.nationalite || 'Ivoirienne'}, situation matrimoniale : ${emp.situationMatrimoniale || 'Célibataire'}, titulaire du N° CNPS ${emp.cnps || '—'}, ci-après dénommé(e) <strong>"Le Collaborateur"</strong>,</p>
              <p><em>D'autre part,</em></p>
              
              <p style="font-weight: 800; margin-top: 15px;">IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</p>

              <div class="article-title">Article 1 : Engagement & Fonction</div>
              <p>Le Collaborateur est engagé à compter du <span class="highlight">${contract.debut || emp.dateEmbauche || '—'}</span> en qualité de <span class="highlight">${emp.poste}</span> au sein du département <span class="highlight">${emp.departement}</span>.</p>

              <div class="article-title">Article 2 : Période d'Essai (Art. 14.2 Code du Travail)</div>
              <p>Le présent contrat est assorti d'une période d'essai de <strong>${contract.type === 'CDI' ? 'trois (3) mois' : 'un (1) mois'}</strong>, au cours de laquelle chacune des parties pourra librement rompre l'engagement sans préavis ni indemnité.</p>

              <div class="article-title">Article 3 : Durée du Contrat</div>
              <p>${contract.type === 'CDI' ? 
                'Le présent contrat est conclu pour une durée indéterminée à compter de la date de prise de service.' : 
                `Le présent contrat est conclu pour une durée déterminée (CDD), du <span class="highlight">${contract.debut || '—'}</span> au <span class="highlight">${contract.fin || '—'}</span>, conformément au Code du Travail.`
              }</p>

              <div class="article-title">Article 4 : Rémunération & Avantages Sociaux</div>
              <p>En contrepartie de ses prestations, le Collaborateur percevra un salaire de base mensuel de <span class="highlight">${new Intl.NumberFormat('fr-CI').format(baseVal)} FCFA</span>, une indemnité de logement de <span class="highlight">${new Intl.NumberFormat('fr-CI').format(logementVal)} FCFA</span> et la prime de transport réglementaire. Les cotisations CNPS (6.3% salarial / 16.15% patronal) et impôts ITS seront retenus à la source.</p>

              <div class="article-title">Article 5 : Obligations de Confidentialité & Non-Concurrence</div>
              <p>Le Collaborateur s'engage à observer une entière discrétion sur les secrets de fabrication, procédés technologiques et données financières de l'entreprise pendant et après la rupture du présent contrat.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div class="signature-title">Le Collaborateur</div>
                <div style="font-size: 10px; color: #64748b; margin-bottom: 40px;">(Précédé de la mention "Lu et approuvé")</div>
                <div style="font-weight: 800; font-size: 11px; color: #0f172a;">${emp.nom} ${emp.prenoms}</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">Pour l'Employeur (Direction)</div>
                <div className="company-seal" style="margin-bottom: 10px;">CACHE OFFICIEL</div>
                <div style="font-weight: 800; font-size: 11px; color: #0f172a;">Le Directeur Général</div>
              </div>
            </div>

            <div class="footer-legal-bar">
              CONTRAT ÉTABLI EN DEUX EXEMPLAIRES ORIGINAUX CONFORMES AU CODE DU TRAVAIL IVOIRIEN
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * 5. ATTESTATION DE STAGE
 */
export const generateAttestationStage = (emp, company) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `STAGE: ST-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const qrUrl = getSecurityQR('Attestation de Stage', emp, company);

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Attestation de Stage - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <span style="font-size: 11px; font-weight: 800; color: #64748b;">ATTESTATION DE STAGE ACADÉMIQUE / PRO</span>
          <button class="print-btn" onclick="window.print()">Imprimer / Enregistrer PDF</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                  <p>Siège : ${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                </td>
                <td class="security-cell">
                  <div class="security-ref">${refCode}</div>
                  <br/>
                  <img src="${qrUrl}" class="qr-code" alt="Vérification QR" />
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title">Attestation de Stage</div>
            </div>

            <div class="doc-body">
              <p>Je soussigné, Direction des Ressources Humaines de la société <span class="highlight">${company.companyName || 'l\'Entreprise'}</span>, atteste par la présente que :</p>
              
              <p>Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, étudiant(e) / stagiaire immatriculé(e) sous le N° ${emp.matricule}, a effectué un stage professionnel au sein de notre établissement du <span class="highlight">${emp.dateEmbauche || '—'}</span> au <span class="highlight">${dateStr}</span> en qualité de <span class="highlight">${emp.poste}</span>.</p>
              
              <p>Durant son stage, Monsieur / Madame ${emp.nom.toUpperCase()} ${emp.prenoms} a fait preuve d'assiduité, d'esprit d'initiative et d'une excellente intégration au sein de l'équipe du département ${emp.departement}.</p>
              
              <p>La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div class="company-seal">CACHET STAGE</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction des Ressources Humaines</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 12px; color: #0f172a;">Le Maître de Stage / DRH</div>
              </div>
            </div>

            <div class="footer-legal-bar">
              ATTESTATION DE STAGE PROFESSIONNEL DE QUALIFICATION • SIRH-CIV
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

export const generateOrdreMission = (emp, company, missionDetails) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const refCode = `MIS: OM-${new Date().getFullYear()}-${emp.id || '00'}`;
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';
  const qrUrl = getSecurityQR('Ordre de Mission', emp, company);

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Ordre de Mission - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="print-btn" onclick="window.print()">Imprimer l'Ordre de Mission</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                </td>
                <td class="security-cell">
                  <div class="security-ref">${refCode}</div>
                  <br/>
                  <img src="${qrUrl}" class="qr-code" alt="Vérification QR" />
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title">Ordre de Mission Professionnelle</div>
            </div>

            <div class="doc-body">
              <p>Il est ordonné par la présente à :</p>
              <p>Monsieur / Madame <span class="highlight">${emp.nom.toUpperCase()} ${emp.prenoms}</span>, occupant le poste de <span class="highlight">${emp.poste}</span> (Matricule : ${emp.matricule}), de se rendre en mission de service.</p>
              
              <table class="salary-table">
                <tbody>
                  <tr>
                    <td style="width: 30%; background: #f8fafc; font-weight: 800;">Objet de la Mission</td>
                    <td style="font-weight: 800; color: ${primaryColor};">${missionDetails.objet || 'Intervention technique / Mission commerciale'}</td>
                  </tr>
                  <tr>
                    <td style="background: #f8fafc; font-weight: 800;">Destination</td>
                    <td>${missionDetails.destination || 'Yamoussoukro / San Pédro, Côte d\'Ivoire'}</td>
                  </tr>
                  <tr>
                    <td style="background: #f8fafc; font-weight: 800;">Période du Déplacement</td>
                    <td>Du ${missionDetails.debut || '—'} au ${missionDetails.fin || '—'}</td>
                  </tr>
                  <tr>
                    <td style="background: #f8fafc; font-weight: 800;">Moyen de Transport</td>
                    <td>${missionDetails.transport || 'Véhicule de service entreprise'}</td>
                  </tr>
                </tbody>
              </table>

              <p>Les autorités civiles, militaires et forces de l'ordre sont priées de bien vouloir lui prêter assistance et faciliter son déplacement.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block">
                <div class="company-seal">VISA DIRECTION</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction Générale</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: 800; font-size: 12px;">Le Directeur Général</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

export const generateDemandeExplication = (emp, company, deDetails) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Demande d'Explication - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="print-btn" onclick="window.print()">Imprimer la Lettre</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar" style="background: #dc2626;"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                  <p>RC : ${company.rc || '—'} | CC : ${company.cc || '—'}</p>
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title" style="color: #dc2626; border-bottom: 3px solid #dc2626;">Demande d'Explications Écrites</div>
            </div>

            <div class="doc-body" style="text-indent: 0;">
              <p>À l'attention de : <strong>Monsieur / Madame ${emp.nom.toUpperCase()} ${emp.prenoms}</strong> (Matricule : ${emp.matricule})</p>
              <p>Poste : ${emp.poste} | Département : ${emp.departement}</p>
              
              <br/>
              <p>Monsieur / Madame,</p>
              <p>Dans le cadre du contrôle de la discipline professionnelle, il a été constaté à votre encontre le manquement suivant :</p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; font-weight: 700; font-size: 13px; color: #991b1b; border-radius: 6px;">
                ${deDetails.motif || 'Manquement aux règles disciplinaires.'}
              </div>

              <p>Nous vous demandons de bien vouloir nous fournir vos explications écrites sous un délai impératif de <strong>quarante-huit heures (48h)</strong> à compter du jour de réception de la présente.</p>
              <p>À défaut de réponse dans ce délai, nous serons dans l'obligation d'appliquer les sanctions disciplinaires réglementaires prévues par le Code du Travail ivoirien.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block" style="text-align: left; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-size: 10px;">
                <strong style="text-transform: uppercase;">Accusé de Réception Salarié :</strong><br/><br/>
                Date : _____ / _____ / 2026<br/>
                Signature :
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction des Ressources Humaines</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

export const generateLettreAvertissement = (emp, company, warningDetails) => {
  const dateStr = new Date().toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  const primaryColor = company.primaryColor || '#009E49';
  const secondaryColor = company.secondaryColor || '#F77F00';

  const html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Avertissement - ${emp.nom} ${emp.prenoms}</title>
        <style>${getCommonStyle(primaryColor, secondaryColor)}</style>
      </head>
      <body>
        <div class="no-print-bar">
          <button class="print-btn" onclick="window.print()">Imprimer la Lettre</button>
        </div>
        <div class="doc-container">
          <div class="brand-bar" style="background: #dc2626;"></div>
          <div>
            <table class="header-table">
              <tr>
                ${company.logo ? `<td class="logo-cell"><img src="${company.logo}" class="logo-img" alt="Logo" /></td>` : ''}
                <td class="company-info">
                  <h1>${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h1>
                </td>
              </tr>
            </table>

            <div class="doc-date">Abidjan, le ${dateStr}</div>
            
            <div class="doc-title-box">
              <div class="doc-title" style="color: #dc2626; border-bottom: 3px solid #dc2626;">Lettre d'Avertissement Disciplinaire</div>
            </div>

            <div class="doc-body" style="text-indent: 0;">
              <p>À l'attention de : <strong>Monsieur / Madame ${emp.nom.toUpperCase()} ${emp.prenoms}</strong> (Matricule : ${emp.matricule})</p>
              
              <br/>
              <p>Monsieur / Madame,</p>
              <p>Suite à la demande d'explications écrites qui vous a été notifiée, vos réponses n'ont pas permis d'atténuer la gravité des faits reprochés :</p>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; font-weight: 700; font-size: 13px; color: #991b1b; border-radius: 6px;">
                ${warningDetails.motif || 'Non-respect des règles de service.'}
              </div>

              <p>En conséquence, nous vous notifions par la présente un <strong>Avertissement Disciplinaire</strong> qui sera consigné dans votre dossier individuel.</p>
              <p>Toute récidive de votre part entraînera des sanctions disciplinaires plus sévères pouvant aller jusqu'à la rupture de votre contrat de travail.</p>
            </div>
          </div>

          <div>
            <div class="footer-signature">
              <div class="signature-block" style="text-align: left; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; font-size: 10px;">
                <strong style="text-transform: uppercase;">Accusé de Réception Salarié :</strong><br/><br/>
                Signature :
              </div>
              <div class="signature-block">
                <div class="signature-title">La Direction Générale</div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>`;
  openPrintWindow(html);
};

/**
 * Helper de conversion d'un chiffre en lettres (en Français)
 */
export const numberToFrenchWords = (n) => {
  if (!n || n === 0) return 'Zéro FRANC CFA';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];

  const convertChunk = (num) => {
    let str = '';
    if (num >= 100) {
      const hundreds = Math.floor(num / 100);
      if (hundreds === 1) str += 'cent ';
      else str += units[hundreds] + ' cent ';
      num %= 100;
    }
    if (num > 0) {
      if (num < 20) {
        str += units[num] + ' ';
      } else {
        const t = Math.floor(num / 10);
        const u = num % 10;
        if (t === 7 || t === 9) {
          str += tens[t - 1] + '-' + units[10 + u] + ' ';
        } else {
          str += tens[t] + (u === 1 ? ' et un' : u > 0 ? '-' + units[u] : '') + ' ';
        }
      }
    }
    return str.trim();
  };

  let num = Math.floor(Math.abs(n));
  let result = '';

  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += convertChunk(millions) + ' million' + (millions > 1 ? 's' : '') + ' ';
    num %= 1000000;
  }

  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    if (thousands === 1) result += 'mille ';
    else result += convertChunk(thousands) + ' mille ';
    num %= 1000;
  }

  if (num > 0) {
    result += convertChunk(num);
  }

  result = result.trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return `${result} FRANC CFA`;
};

/**
 * Générateur du BULLETIN DE PAIE officiel conforme au modèle de référence Ivoirien (CCN Côte d'Ivoire)
 */
export const generateOfficialCIVBulletin = (emp, payslipDetails, company, selectedMonth = 'Juin 2026') => {
  const formatNum = (v) => (v !== undefined && v !== null && v !== 0) ? new Intl.NumberFormat('fr-FR').format(Math.round(v)) : '';
  const formatTaux = (v) => (v !== undefined && v !== null && v !== 0) ? v.toFixed(2).replace('.', ',') : '';
  
  const base = payslipDetails.base || emp.salaireBase || 0;
  const primeAnc = payslipDetails.primeAnc || 0;
  const logement = payslipDetails.logement || Math.round(base * 0.15);
  const sursalaire = Math.max(0, payslipDetails.brutTotal - base - primeAnc - logement - (payslipDetails.transport || 30000) - (payslipDetails.risque || 0));
  const transport = payslipDetails.transport || 30000;
  const risque = payslipDetails.risque || 0;
  
  const brutTotal = payslipDetails.brutTotal || (base + logement + transport + risque + sursalaire + primeAnc);
  const brutImposable = payslipDetails.brutImposable || (brutTotal - 30000);
  
  const cnpsSalarial = payslipDetails.cnpsSalarial || Math.round(brutImposable * 0.063);
  const cmuSalarial = 500;
  const cmuPatronal = 500;
  const itsSalarial = payslipDetails.itsNet || 0;
  const avanceSurSalaire = payslipDetails.avanceSurSalaire || 0;

  const cnpsPatRetraite = payslipDetails.cnpsPatronalDetails?.retraite || Math.round(brutImposable * 0.077);
  const cnpsPatPF = payslipDetails.cnpsPatronalDetails?.prestationsFamiliales || Math.round(Math.min(brutImposable, 75000) * 0.0575);
  const cnpsPatAM = Math.round(Math.min(brutImposable, 75000) * 0.0075);
  const cnpsPatAT = payslipDetails.cnpsPatronalDetails?.accidentTravail || Math.round(Math.min(brutImposable, 75000) * 0.03);
  const itsPatronal = payslipDetails.taxesPatronalesDetails?.itsPatronal || Math.round(brutImposable * 0.012);
  const taPatronal = payslipDetails.taxesPatronalesDetails?.taxeApprentissage || Math.round(brutImposable * 0.004);
  const fpcPatronal = payslipDetails.taxesPatronalesDetails?.fdfp || Math.round(brutImposable * 0.006);

  const totalRetenuesSalariales = cnpsSalarial + cmuSalarial + itsSalarial + avanceSurSalaire;
  const totalChargesPatronales = cnpsPatRetraite + cnpsPatPF + cnpsPatAM + cnpsPatAT + itsPatronal + taPatronal + fpcPatronal + cmuPatronal;

  const netAPayer = payslipDetails.netAPayer || (brutTotal - totalRetenuesSalariales);
  const netInWords = numberToFrenchWords(netAPayer);

  const isCadre = (emp.salaireBase || 0) >= 400000 || (emp.poste || '').toLowerCase().includes('cadre') || (emp.poste || '').toLowerCase().includes('direct');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bulletin de Paie - ${emp.nom} ${emp.prenoms}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Roboto', 'Arial', sans-serif;
      font-size: 10px;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 10px;
      line-height: 1.3;
    }

    .no-print-bar {
      max-width: 900px;
      margin: 0 auto 12px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-print {
      background-color: #009E49;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 11px;
      text-transform: uppercase;
    }

    .bulletin-container {
      max-width: 900px;
      margin: 0 auto;
      border: 1px solid #9ca3af;
      padding: 12px;
      background: #ffffff;
    }

    /* Top Grid Header */
    .top-header-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 10px;
      margin-bottom: 8px;
    }

    .bulletin-badge-box {
      background: #dcfce7;
      border: 1px solid #86efac;
      padding: 6px 12px;
      border-radius: 4px;
      display: inline-block;
      font-weight: 900;
      font-size: 14px;
      color: #065f46;
      text-transform: uppercase;
    }

    .table-spec {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }

    .table-spec td, .table-spec th {
      border: 1px solid #9ca3af;
      padding: 3px 6px;
    }

    .table-spec th {
      background: #f3f4f6;
      font-weight: 700;
      color: #374151;
      text-align: left;
    }

    /* Employee Info Box */
    .employee-box {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 8px;
      border: 1px solid #9ca3af;
      margin-bottom: 8px;
    }

    .emp-left-sub {
      border-right: 1px solid #9ca3af;
      padding: 6px;
      font-size: 8.5px;
    }

    .conge-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 8px;
      text-align: center;
    }

    .conge-table td, .conge-table th {
      border: 1px solid #cbd5e1;
      padding: 2px;
    }

    .emp-right-sub {
      padding: 0;
    }

    .emp-name-header {
      background: #dcfce7;
      color: #065f46;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      border-bottom: 1px solid #9ca3af;
    }

    .emp-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px 12px;
      padding: 6px 10px;
      font-size: 9px;
    }

    .detail-line {
      display: flex;
      justify-content: space-between;
    }

    .detail-label {
      color: #4b5563;
      font-weight: 500;
    }

    .detail-val {
      font-weight: 700;
      color: #111827;
    }

    /* Main Table Rubriques */
    .table-rubriques {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
      font-size: 9px;
    }

    .table-rubriques th {
      border: 1px solid #9ca3af;
      padding: 4px 6px;
      background: #f3f4f6;
      font-weight: 700;
      text-align: center;
    }

    .table-rubriques td {
      border-x: 1px solid #d1d5db;
      border-y: 1px solid #f3f4f6;
      padding: 3px 6px;
    }

    .cell-num { text-align: right; font-family: monospace; font-size: 9.5px; }
    .cell-center { text-align: center; }
    .bold-row { font-weight: 800; background: #f9fafb; }
    .total-row { font-weight: 900; background: #f3f4f6; border-y: 2px solid #6b7280; }

    /* Bottom Cumuls & Net Box */
    .table-cumuls {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5px;
      margin-bottom: 8px;
    }

    .table-cumuls td, .table-cumuls th {
      border: 1px solid #9ca3af;
      padding: 4px;
      text-align: center;
    }

    .net-payer-badge {
      background: #dcfce7;
      color: #065f46;
      font-size: 13px;
      font-weight: 900;
      padding: 4px 8px;
      border-radius: 4px;
      display: block;
    }

    /* Footer Lines */
    .footer-legal-text {
      font-size: 8.5px;
      color: #4b5563;
      margin-bottom: 6px;
    }

    .amount-in-words {
      font-size: 10.5px;
      font-weight: 900;
      color: #111827;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 10px;
    }

    .sig-box {
      border: 1px solid #d1d5db;
      height: 55px;
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 700;
      color: #4b5563;
    }

    @media print {
      body { padding: 0; background: white; }
      .no-print-bar { display: none; }
      .bulletin-container { border: none; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="no-print-bar">
    <span style="font-weight: 700; font-size: 12px; color: #4b5563;">BULLETIN DE PAIE SÉCURISÉ — CONFORME CCN CÔTE D'IVOIRE</span>
    <button class="btn-print" onclick="window.print();">Imprimer / Télécharger PDF</button>
  </div>

  <div class="bulletin-container">
    
    <!-- Top Header -->
    <div class="top-header-grid">
      <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start;">
        ${company.logo ? `<img src="${company.logo}" style="max-width: 150px; max-height: 60px; object-fit: contain; margin-bottom: 6px;" alt="Logo Entreprise" />` : `<div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${company.primaryColor || '#009E49'} 0%, ${company.secondaryColor || '#F77F00'} 100%); color: white; border-radius: 10px; font-weight: 900; font-size: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.15); margin-bottom: 6px;">${(company.companyName || 'E').charAt(0)}</div>`}
        <div class="bulletin-badge-box">BULLETIN DE PAIE</div>
      </div>
      <div>
        <table class="table-spec">
          <tr>
            <td colspan="3"><strong>Période du :</strong> 01/06/2026 <strong>au :</strong> 30/06/2026</td>
            <td colspan="3"><strong>Paiement le :</strong> 30/06/2026 <strong>par :</strong> Virement</td>
          </tr>
          <tr>
            <th>Matricule</th>
            <th>Niveau</th>
            <th>Coefficient</th>
            <th>Indice</th>
            <th>Ancienneté</th>
            <th>N° Sécurité Sociale</th>
          </tr>
          <tr>
            <td><strong>${emp.matricule}</strong></td>
            <td>III</td>
            <td>250</td>
            <td>100</td>
            <td>${payslipDetails.seniorityYears || 0} an(s)</td>
            <td><strong>${emp.cnps || '19905'}</strong></td>
          </tr>
          <tr>
            <td colspan="2"><strong>Bât. / Établissement :</strong> Siège</td>
            <td colspan="2"><strong>Emploi :</strong> ${emp.poste}</td>
            <td colspan="2"><strong>Département :</strong> ${emp.departement}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Qualification :</strong> ${isCadre ? 'CADRE' : 'NON CADRE'}</td>
            <td><strong>Horaire :</strong> 173,330</td>
            <td colspan="3"><strong>CCN :</strong> CONVENTION COLLECTIVE INTERPROFESSIONNELLE</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Employee Section -->
    <div class="employee-box">
      <div class="emp-left-sub">
        <div><strong>Langue(s) parlée(s) :</strong> Français</div>
        <div><strong>Diplôme(s) :</strong> COMPTABILITE</div>
        <div><strong>Ecole :</strong> CBCG TREICHVILLE</div>
        <div style="font-weight: 700; margin-top: 2px;">${emp.type || 'CDI'} ${emp.type === 'CDD' ? 'Contrat à durée déterminée' : 'Contrat à durée indéterminée'}</div>
        
        <table class="conge-table">
          <tr>
            <th></th>
            <th>Acquis</th>
            <th>Reste</th>
            <th>Pris</th>
          </tr>
          <tr>
            <td>Repos comp.</td>
            <td>0,000</td>
            <td>0,000</td>
            <td>0,000</td>
          </tr>
          <tr>
            <td>Congés</td>
            <td>2,200</td>
            <td>2,200</td>
            <td>0,000</td>
          </tr>
        </table>
      </div>

      <div class="emp-right-sub">
        <div class="emp-name-header">M ${emp.nom.toUpperCase()} ${emp.prenoms.toUpperCase()}</div>
        <div class="emp-details-grid">
          <div class="detail-line"><span class="detail-label">Date de Naissance :</span> <span class="detail-val">31/05/1999</span></div>
          <div class="detail-line"><span class="detail-label">à :</span> <span class="detail-val">DALOA</span></div>
          <div class="detail-line"><span class="detail-label">Commune :</span> <span class="detail-val">ABOBO</span></div>
          <div class="detail-line"><span class="detail-label">Téléphone :</span> <span class="detail-val">${emp.telephone || '0205196033'}</span></div>
          <div class="detail-line"><span class="detail-label">Email :</span> <span class="detail-val">${emp.email || 'collaborateur@entreprise.ci'}</span></div>
          <div class="detail-line"><span class="detail-label">Nationalité :</span> <span class="detail-val">${emp.nationalite || 'IVOIRIENNE'}</span></div>
          <div class="detail-line"><span class="detail-label">Adresse :</span> <span class="detail-val">${emp.site || 'ABOBO RUE MAIRIE'}</span></div>
          <div class="detail-line"><span class="detail-label">Pays d'origine :</span> <span class="detail-val">CÔTE D'IVOIRE</span></div>
          <div class="detail-line"><span class="detail-label">Sexe :</span> <span class="detail-val">${emp.sexe === 'M' ? 'Masculin' : 'Féminin'}</span></div>
          <div class="detail-line"><span class="detail-label">Nombre d'enfant :</span> <span class="detail-val">${emp.nbEnfants || 0}</span></div>
          <div class="detail-line"><span class="detail-label">Date entrée :</span> <span class="detail-val">${emp.dateEmbauche || '10/01/2026'}</span></div>
          <div class="detail-line"><span class="detail-label">Date sortie :</span> <span class="detail-val">—</span></div>
          <div class="detail-line"><span class="detail-label">Banque :</span> <span class="detail-val">${emp.modePaiement || 'SOCIETE IVOIRIENNE BANQUE'}</span></div>
          <div class="detail-line"><span class="detail-label">N°Guichet :</span> <span class="detail-val">12546</span></div>
          <div class="detail-line"><span class="detail-label">N°compte :</span> <span class="detail-val">${emp.rib || emp.numeroMobileMoney || '00001256895'}</span></div>
          <div class="detail-line"><span class="detail-label">Code banque :</span> <span class="detail-val">00000</span></div>
        </div>
      </div>
    </div>

    <!-- Main Rubriques Table -->
    <table class="table-rubriques">
      <thead>
        <tr>
          <th rowspan="2" style="width: 5%;">N°</th>
          <th rowspan="2" style="width: 32%;">Désignation</th>
          <th rowspan="2" style="width: 6%;">Nombre</th>
          <th rowspan="2" style="width: 14%;">Base</th>
          <th colspan="2" style="width: 23%;">Part salariale</th>
          <th colspan="3" style="width: 20%;">Part patronale</th>
        </tr>
        <tr>
          <th style="width: 11.5%;">Gain</th>
          <th style="width: 11.5%;">Retenue</th>
          <th style="width: 6%;">Taux</th>
          <th style="width: 7%;">Retenue (+)</th>
          <th style="width: 7%;">Retenue (-)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cell-center">10</td>
          <td>SALAIRE DE BASE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(base)}</td>
          <td class="cell-num">${formatNum(base)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>
        ${sursalaire > 0 ? `
        <tr>
          <td class="cell-center">20</td>
          <td>SURSALAIRE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(sursalaire)}</td>
          <td class="cell-num">${formatNum(sursalaire)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>` : ''}
        ${primeAnc > 0 ? `
        <tr>
          <td class="cell-center">30</td>
          <td>PRIME D'ANCIENNETE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(base)}</td>
          <td class="cell-num">${formatNum(primeAnc)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>` : ''}
        ${logement > 0 ? `
        <tr>
          <td class="cell-center">40</td>
          <td>INDEMNITE DE LOGEMENT (15%)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(base)}</td>
          <td class="cell-num">${formatNum(logement)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>` : ''}
        ${risque > 0 ? `
        <tr>
          <td class="cell-center">50</td>
          <td>INDEMNITE DE RISQUE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(risque)}</td>
          <td class="cell-num">${formatNum(risque)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>` : ''}

        <tr class="bold-row">
          <td class="cell-center"></td>
          <td><strong>Total Brut</strong></td>
          <td class="cell-center"></td>
          <td class="cell-num"><strong>${formatNum(brutImposable)}</strong></td>
          <td class="cell-num"><strong>${formatNum(brutTotal)}</strong></td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>

        <tr>
          <td class="cell-center">414</td>
          <td>ITS (IMPOT SALARIAL DGI)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-num"></td>
          <td class="cell-num">${formatNum(itsSalarial)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num">0</td>
        </tr>
        <tr>
          <td class="cell-center">415</td>
          <td>CMU (COUVERTURE MALADIE UNIVERSELLE)</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
          <td class="cell-num">500</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num">500</td>
        </tr>
        <tr>
          <td class="cell-center">452</td>
          <td>C.N.P.S. (RETRAITE SALARIÉ)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-center">6,30</td>
          <td class="cell-num">${formatNum(cnpsSalarial)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">470</td>
          <td>RETRAITE GENERALE PATRONALE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">7,70</td>
          <td class="cell-num">${formatNum(cnpsPatRetraite)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">480</td>
          <td>PRESTATION FAMILIALE (PF)</td>
          <td class="cell-center"></td>
          <td class="cell-num">75 000</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">5,75</td>
          <td class="cell-num">${formatNum(cnpsPatPF)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">481</td>
          <td>ASSURANCE MATERNITE</td>
          <td class="cell-center"></td>
          <td class="cell-num">75 000</td>
          <td class="cell-center">0,00</td>
          <td class="cell-num">0</td>
          <td class="cell-center">0,75</td>
          <td class="cell-num">${formatNum(cnpsPatAM)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">490</td>
          <td>ACCIDENT DE TRAVAIL (AT)</td>
          <td class="cell-center"></td>
          <td class="cell-num">75 000</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">3,00</td>
          <td class="cell-num">${formatNum(cnpsPatAT)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">500</td>
          <td>PART PATRONALE CN (ITS DGI)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">1,20</td>
          <td class="cell-num">${formatNum(itsPatronal)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">520</td>
          <td>TAXE D'APPRENTISSAGE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">0,40</td>
          <td class="cell-num">${formatNum(taPatronal)}</td>
          <td class="cell-num"></td>
        </tr>
        <tr>
          <td class="cell-center">530</td>
          <td>TAXE F.P.C (FDFP)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(brutImposable)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-center">0,60</td>
          <td class="cell-num">${formatNum(fpcPatronal)}</td>
          <td class="cell-num"></td>
        </tr>

        <tr class="total-row">
          <td class="cell-center"></td>
          <td><strong>Total Cotisations</strong></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
          <td class="cell-num"><strong>${formatNum(totalRetenuesSalariales)}</strong></td>
          <td class="cell-center"></td>
          <td class="cell-num"><strong>${formatNum(totalChargesPatronales)}</strong></td>
          <td class="cell-num"></td>
        </tr>

        <tr>
          <td class="cell-center">708</td>
          <td>PRIME DE TRANSPORT (EXONÉRÉE)</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(transport)}</td>
          <td class="cell-num">${formatNum(transport)}</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>
        ${avanceSurSalaire > 0 ? `
        <tr>
          <td class="cell-center">750</td>
          <td>RETENUE AVANCE SUR SALAIRE</td>
          <td class="cell-center"></td>
          <td class="cell-num">${formatNum(avanceSurSalaire)}</td>
          <td class="cell-num"></td>
          <td class="cell-num" style="color: #dc2626;">${formatNum(avanceSurSalaire)}</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>` : ''}
        <tr>
          <td class="cell-center">781</td>
          <td>ARRONDI</td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num">0</td>
          <td class="cell-num"></td>
          <td class="cell-center"></td>
          <td class="cell-num"></td>
          <td class="cell-num"></td>
        </tr>
      </tbody>
    </table>

    <!-- Bottom Cumuls & Net Box -->
    <table class="table-cumuls">
      <thead>
        <tr>
          <th>Cumuls</th>
          <th>Salaire brut</th>
          <th>Net imposable</th>
          <th>Charges salariales</th>
          <th>Charges patronales</th>
          <th>Heures travaillées</th>
          <th>Heures sup.</th>
          <th>Avantages en nature</th>
          <th style="width: 180px; background: #dcfce7; color: #065f46; border: 2px solid #86efac;">NET A PAYER</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Période</strong></td>
          <td>${formatNum(brutTotal)}</td>
          <td>${formatNum(brutImposable)}</td>
          <td>${formatNum(totalRetenuesSalariales)}</td>
          <td>${formatNum(totalChargesPatronales)}</td>
          <td>173</td>
          <td>0</td>
          <td>0</td>
          <td rowspan="2" style="background: #dcfce7; vertical-align: middle;">
            <span class="net-payer-badge">${formatNum(netAPayer)}</span>
          </td>
        </tr>
        <tr>
          <td><strong>Année</strong></td>
          <td>${formatNum(brutTotal * 12)}</td>
          <td>${formatNum(brutImposable * 12)}</td>
          <td>${formatNum(totalRetenuesSalariales * 12)}</td>
          <td>${formatNum(totalChargesPatronales * 12)}</td>
          <td>2 080</td>
          <td>0</td>
          <td>0</td>
        </tr>
      </tbody>
    </table>

    <div class="footer-legal-text">
      Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée.
    </div>

    <div class="amount-in-words">
      Net à payer en lettres : ${netInWords}
    </div>

    <div class="signatures-grid">
      <div class="sig-box">
        Employeur(se)<br/><br/>
        Signature & Cachet
      </div>
      <div class="sig-box">
        Employé(e)<br/><br/>
        Signature
      </div>
    </div>

  </div>

</body>
</html>`;

  openPrintWindow(html);
};
