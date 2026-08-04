# ⚖️ TETRIS BALANCE

Un **Tetris multijoueur tour par tour** posé sur une **balance** : chaque pièce a un **poids**, et si le plateau penche trop… tout s'effondre ! Avec des **handicaps façon Mario Kart** (objets, poids variables, événements aléatoires) et une direction artistique **néon arcade rétro**.

🎮 **Jouer en ligne** : https://aineasu00.github.io/tetris-balance/

## Les règles

- **2 à 4 joueurs** sur le même écran, chacun son tour (une pièce par tour).
- Chaque pièce possède un **multiplicateur de poids** : plus elle est lourde, plus elle fait pencher la balance… **et plus elle tombe vite** (la gravité peut être un piège !).
- Le plateau tient en équilibre sur un pivot : si le centre de gravité sort de la base de support, **effondrement** — le joueur fautif perd une vie (3 vies par joueur).
- Les lignes complétées rapportent des points (100 / 300 / 500 / 800) et un **bonus ZEN +50** si la balance est quasi parfaitement équilibrée.

## Modes de jeu

| Mode | Description |
|------|-------------|
| ⏱️ **60 TOURS** | Sprint au score : le meilleur total au tour 60 gagne |
| ♾️ **INFINI** | Pas de limite : l'élimination seule décide du vainqueur |

## Modes de balance

| Mode | Effet |
|------|-------|
| ⚖️ **STABLE** | La balance classique, tolérante |
| 🤸 **CORDE RAIDE** | Base étroite : ça bascule VITE |
| 🛼 **PIVOT MOBILE** | Le pivot patine de gauche à droite en permanence |
| 🌪️ **TEMPÊTE** | Des rafales imprévisibles secouent la balance |
| 🪓 **USURE** | La balance s'affaiblit tour après tour… |

## Handicaps façon Mario Kart

Le **rubber-banding** avantage les derniers et piège le leader (qui reçoit des pièces plus lourdes).

**Objets** (touche `E`) : 🪶 Plume (pièce sans poids) • ⚓ Enclume (prochaine pièce adverse ultra lourde) • 🏛️ Pilier (balance renforcée 3 tours) • 🧨 Dynamite (détruit la ligne la plus basse).

**Événements aléatoires** : 🌋 Tremblement • 🌧️ Pluie de fer • 🍃 Brise légère • 💨 Vent lateral.

## Contrôles

| Touche | Action |
|--------|--------|
| ◀ ▶ | Déplacer la pièce |
| ▲ | Pivoter |
| ▼ | Descendre / poser |
| `ESPACE` | Chute libre (pose immédiate) |
| `E` | Utiliser l'objet |

## Développement

Stack : **React 19 + TypeScript + Vite + Tailwind CSS**, rendu sur canvas 2D, sons synthétisés en WebAudio (aucun asset).

```bash
npm install
npm run dev    # développement
npm run build  # production (dist/)
```

Le déploiement sur **GitHub Pages** est automatique : chaque push sur `main` déclenche le workflow GitHub Actions qui build et publie `dist/` sur la branche `gh-pages`.
