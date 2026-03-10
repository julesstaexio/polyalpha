# ◈ PolyAlpha — AI Signal Engine

> Scanner de marchés Polymarket en temps réel, analysé par Claude AI.  
> Détecte les probabilités sous/sur-évaluées et génère des signaux LONG/SHORT.

---

## 📐 Architecture

```
polyalpha/
├── backend/        → Proxy Node.js (contourne le CORS de Polymarket)
│   └── server.js
└── frontend/       → Dashboard React + Vite
    ├── src/
    │   ├── App.jsx     ← dashboard principal
    │   └── main.jsx
    ├── index.html
    └── vite.config.js
```

**Flux de données :**
```
Polymarket API → backend/server.js (proxy) → frontend/App.jsx → Claude API → Signaux
```

---

## 🚀 Installation & Lancement

### Prérequis
- [Node.js 18+](https://nodejs.org/)
- Une clé API Claude → [console.anthropic.com](https://console.anthropic.com)

---

### 1. Cloner le repo

```bash
git clone https://github.com/TON_USERNAME/polyalpha.git
cd polyalpha
```

---

### 2. Lancer le backend (proxy)

```bash
cd backend
node server.js
```

Tu dois voir :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ◈ PolyAlpha Proxy Server — port 3001
  → http://localhost:3001/markets
  → http://localhost:3001/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

> ✅ Aucun `npm install` nécessaire — uniquement des modules Node.js natifs.

---

### 3. Lancer le frontend

Dans un **nouveau terminal** :

```bash
cd frontend
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173) dans ton navigateur.

---

## 🔑 Clé API Claude

L'analyse IA utilise l'API Anthropic directement depuis le navigateur.  
**Chaque développeur utilise sa propre clé Claude.**

La clé est injectée automatiquement par Claude.ai si tu utilises l'artifact intégré.  
Pour un usage local (hors Claude.ai), modifie l'en-tête dans `frontend/src/App.jsx` :

```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": "sk-ant-VOTRE_CLE_ICI",   // ← ajouter cette ligne
  "anthropic-version": "2023-06-01",
},
```

> ⚠️ Ne commite **jamais** ta clé API sur GitHub. Utilise une variable d'environnement ou un `.env` (déjà dans `.gitignore`).

---

## ✨ Fonctionnalités actuelles

| Module | Statut | Description |
|--------|--------|-------------|
| Scraper Polymarket | ✅ | Récupère les marchés actifs en temps réel via proxy |
| Analyse Claude AI | ✅ | Probabilité estimée, verdict, bull/bear case, edge |
| Dashboard React | ✅ | Filtres LONG/SHORT/HOT, barre de progression, refresh auto |
| Alertes Telegram | 🔜 Module 3 | Signal push dès qu'une opportunité est détectée |

---

## 🛣️ Roadmap

- [ ] **Module 3** — Bot Telegram : alertes automatiques sur signaux forts
- [ ] **Module 4** — Historique des signaux + taux de réussite
- [ ] **Module 5** — Score de confiance basé sur les news en temps réel

---

## 🤝 Contribuer

1. Fork le repo
2. Crée une branche : `git checkout -b feature/ma-feature`
3. Commit : `git commit -m "feat: ma feature"`
4. Push : `git push origin feature/ma-feature`
5. Ouvre une Pull Request

---

## ⚠️ Disclaimer

Ce projet est à but éducatif. Les signaux générés par l'IA ne constituent pas des conseils financiers.  
Utilise Polymarket à tes risques et dans le respect de leurs conditions d'utilisation.
