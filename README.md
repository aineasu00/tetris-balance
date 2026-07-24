# ⚖️ TETRIS BALANCE

Un Tetris **tour par tour (2 à 4 joueurs)** posé sur une balance : chaque pièce a un **poids**, et si le centre de gravité sort de la base… tout s'effondre ! Handicaps façon **Mario Kart** : objets bonus, poids variables, événements surprises.

## 🎮 Jouer

▶️ **[Jouer en ligne sur GitHub Pages](https://aineasu00.github.io/tetris-balance/)**

## 📜 Règles

- À tour de rôle, chaque joueur place **1 pièce** sur le plateau partagé (même clavier)
- Les pièces **tombent toutes seules** : plus elles sont lourdes, plus elles dévalent vite — une enclume ne pardonne pas
- Trop de poids d'un côté = **EFFONDREMENT** → 1 vie en moins (3 vies, puis élimination)
- Compléter des lignes **allège la balance** et rapporte des points (+ objets bonus)
- Bonus **ZEN +50** si la balance reste quasi parfaitement équilibrée
- **Dernier joueur debout** — ou meilleur score au tour 60 — gagne la partie

## 🕹️ Contrôles

| Touche | Action |
|--------|--------|
| ◀ ▶ | déplacer la pièce |
| ▲ | pivoter |
| ▼ | descendre / poser |
| ESPACE | chute libre |
| E | utiliser l'objet |

## 🏎️ Handicaps façon Mario Kart

- **Poids variables** : LÉGER / NORMAL / LOURD (et le poids pilote la vitesse de chute)
- **Objets bonus** : 🪶 Plume (pièce sans poids) • ⚓ Enclume (pièce ultra lourde pour l'adversaire) • 🏛️ Pilier (balance renforcée ×2) • 🧨 Dynamite (fait sauter la ligne du bas)
- **Événements aléatoires** : 🌋 tremblement de terre • ☄️ pluie de fer • 🍃 brise légère • 🌀 vent latéral
- **Rubber-banding** : le leader reçoit des pièces plus lourdes, le dernier reçoit des boîtes surprises

## 🛠️ Développement

```bash
npm install
npm run dev      # serveur local
npm run build    # build de production (dist/)
```

Stack : React 19 + TypeScript + Vite + Tailwind CSS — rendu canvas, synthèse WebAudio, DA néon arcade rétro.

Le déploiement sur GitHub Pages est automatique via GitHub Actions à chaque push sur `main` (build → branche `gh-pages`).
