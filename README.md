# F7 — Flip 7 Tracker `v4.1`

Tracker de scores pour le jeu de cartes **Flip 7**, utilisable sur mobile et desktop, sans installation.

---

## Fonctionnalités

- **Ajout de joueurs** avant le début de la partie
- **Scores en temps réel** avec affichage du dernier ajout
- **Barre de progression** par joueur (blanc → bleu → or → vert selon l'avancement)
- **Bonus Flip 7** (⚡F7) : case à cocher pour ajouter automatiquement le bonus au score
- **Crash** (☠️) : remet le score du tour à 0 pour un joueur
- **Rotation du dealer** automatique à chaque manche
- **Classement** en temps réel (`#1`, `#2`…)
- **Trophées** (🏆) : compteur de victoires par joueur sur plusieurs parties
- **Revanche** : relance une partie en gardant les joueurs et les victoires
- **Annuler** la dernière action (5 niveaux d'historique)
- **Mode Plein Écran** pour une utilisation en table
- **Paramètres** configurables via modal (score cible, bonus F7, nombre de colonnes)
- **Sauvegarde automatique** dans le `localStorage` (état persisté entre les sessions)

---

## Utilisation

### 1. Avant la partie

1. Saisir le nom d'un joueur dans le champ texte, valider avec **Entrée** ou **Ajouter**
2. Répéter pour chaque joueur
3. Cliquer sur **Démarrer**

### 2. Pendant la partie

Pour chaque joueur à chaque manche :

| Action | Comment |
|---|---|
| Saisir les points et cliquer **+** | Ajoute les points au score du joueur |
| Cocher **⚡F7** avant **+** | Ajoute les points + le bonus Flip 7 |
| Cliquer **☠️** | Enregistre un Crash (score de la manche = 0) |
| Cliquer **◀️** | Annule la dernière action |

Cliquer **Manche Suivante >>** pour passer à la manche suivante (le dealer tourne automatiquement).

### 3. Fin de partie

Quand un joueur atteint le score cible, sa carte passe en vert.

- **🏆 Revanche** : lance une nouvelle partie, le vainqueur reçoit un trophée, les scores sont remis à zéro
- **☠️ Reset Total** : remet tout à zéro (joueurs, scores, victoires)

---

## Paramètres

Accessible via le bouton **⚙** en haut à droite.

| Paramètre | Défaut | Description |
|---|---|---|
| Score cible | 200 pts | Score à atteindre pour gagner |
| Bonus Flip 7 | 15 pts | Points ajoutés en cas de Flip 7 |
| Colonnes (mobile) | 2 | Nombre de colonnes dans la grille |

---

## Barre de progression

La barre de chaque joueur reflète visuellement son avancement :

| État | Couleur | Condition |
|---|---|---|
| Vide | Blanc | 0 pt |
| Normal | Bleu | < 75 % du score cible |
| Proche | Or | ≥ 75 % du score cible |
| Victoire | Vert (pulsé) | Score cible atteint |

---

## Installation

Aucune installation requise. L'application est un fichier HTML statique.

```
f7/
├── index.html   # Structure de l'application
├── style.css    # Styles et animations
├── script.js    # Logique de jeu et état
└── README.md
```

Ouvrir `index.html` dans un navigateur, ou héberger les fichiers sur n'importe quel serveur statique.

### Ajouter à l'écran d'accueil (iOS/Android)

L'application est compatible PWA légère :
- **iOS Safari** : Partager → Sur l'écran d'accueil
- **Android Chrome** : Menu → Ajouter à l'écran d'accueil

---

## Changelog

### v4.1
- Barre de progression sur fond blanc pour une meilleure lisibilité à 0 pt
- Amélioration de la flexibilité visuelle du design

### v4.0
- Refonte complète de l'interface (thème dark, neon)
- Bouton Revanche avec comptage des victoires (trophées)
- Paramètres via modal (score cible, bonus F7, colonnes)
- Mode plein écran
- Barre de progression avec états colorés (bleu / or / vert)
- Rotation automatique du dealer
- Historique des actions (annuler)
- Sauvegarde automatique localStorage
