#!/usr/bin/env node
// Script CJS de copie post-build: copie frontend/dist/ vers dist/ (racine)
// Utilisé par le buildCommand Vercel
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'frontend', 'dist');
const dest = path.join(__dirname, 'dist');

if (!fs.existsSync(src)) {
  console.error('ERROR: frontend/dist/ introuvable. Assurez-vous que vite build a été exécuté.');
  process.exit(1);
}

console.log(`Copie de ${src} vers ${dest}...`);
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true, force: true });
console.log('✅ Copie réussie.');
