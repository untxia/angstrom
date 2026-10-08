# Ångström

Agent IA de recherche de nanomatériaux en langage naturel. Plutôt que d'interroger Materials Project avec une syntaxe API brute, on décrit ce qu'on cherche en langage courant et l'agent traduit, interroge, croise et justifie les résultats.

> **Statut** : socle initial — nom, identité de marque, thème Tailwind v4, système de boutons flottants, client Materials Project et page d'accueil fonctionnelle. L'orchestration IA (Claude + Materials Project) et les écrans de résultats restent à câbler.
> Projet perso — exploration curiosité, pas de contrainte de delivery. Licence MIT.

## Stack

- **Frontend** : SvelteKit (Svelte 5, runes), Tailwind CSS v4
- **3D / scroll** *(à réintégrer)* : Three.js + GSAP ScrollTrigger — zoom de l'échelle humaine à l'échelle atomique
- **IA** : Claude API, orchestration en deux passes (parsing de requête → classement justifié)
- **Données** : Materials Project API (HTTP direct, sans client Python)
- **Stockage** : Supabase

## Identité de marque

- Logo : lettre A stylisée en triangle, orbite/noyau au sommet (référence au Å et à l'atome)
- Palette : cyan `#00E5FF` (actions), violet `#B14EFF` (raisonnement de l'agent — réservé exclusivement à ça), fond `#05070F`
- 5 niveaux de surface (élévation), boutons flottants à 4 couches (voir `Button3D.svelte`)

## Installation

```bash
npm install
cp .env.example .env
# renseigner MP_API_KEY, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, GROQ_API_KEY (ou ANTHROPIC_API_KEY)
npm run dev
```

## Source de données

[Materials Project](https://materialsproject.org/dashboard) — compte + clé API gratuite, ~150 000 matériaux avec propriétés calculées.

## Prochaines étapes

1. ~~Route serveur `POST /api/search`~~ — fait (voir ci-dessous)
2. Fiche matériau (maille cristalline Three.js) ; l'écran de résultats est `/screening`
3. Scène de scroll Three.js/GSAP sur la page d'accueil
4. Historique de sessions + authentification Supabase
5. Tests : `npm test` couvre l'orchestration (faux clients, sans réseau) ; reste les tests de composants

## Agent (v0)

`POST /api/search { query }` renvoie un flux NDJSON d'événements (`stage`, `log`, `filters`, `fetched`, `candidates`, `ranking`, `done`, `error`) que l'écran `/screening?q=…` affiche en direct.

1. **Claude, passe 1** : requête → filtres JSON. Le code revalide tout (symboles chimiques, bornes numériques) avant d'appeler Materials Project.
2. **Materials Project** : `materials/summary`, puis filtre local sur l'énergie au-dessus de l'enveloppe.
3. **Claude, passe 2** : classe jusqu'à 30 candidats et justifie, uniquement à partir des valeurs reçues. Les `material_id` inventés sont écartés ; une valeur absente reste « inconnue ».

Variables : `MP_API_KEY` + `GROQ_API_KEY` (optionnel `GROQ_MODEL`, défaut `llama-3.3-70b-versatile`) ou `ANTHROPIC_API_KEY` (optionnel `ANTHROPIC_MODEL`). Groq est utilisé en priorité s’il est défini. Limite : 8 recherches/minute/IP (en mémoire).
