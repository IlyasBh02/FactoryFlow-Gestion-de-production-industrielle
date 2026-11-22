# Verification locale — 22 novembre 2026

## Commandes

| Verification | Resultat |
| --- | --- |
| Frontend : `npm run lint` | Reussi, aucun avertissement |
| Frontend : `npm test -- --ci` | 24 tests reussis, 2 suites Jest |
| Frontend : `npm run build` | Build Vite reussi |
| Backend : `npm test` | 67 tests reussis |
| Docker Compose | Images React/Nginx et API construites ; replica set MongoDB sain |
| Script HTTP `scripts/smoke.mjs` | Reussi contre une base MongoDB reelle et neuve |
| Edge desktop / mobile | Navigation, popup et sauvegarde verifiees |
| Redemarrage des conteneurs | Donnees conservees |

Les 91 tests automatises utilisent des reponses API ou repositories simules. Les controles Docker suivants utilisent en plus un vrai replica set MongoDB.

## Scenarios reels verifies

- Deux installations concurrentes : une reponse 201, une reponse 409 ; une seule installation.
- Inscription sans session : 401. Catalogue consulte par un Operateur : 403.
- Creation des matieres X/Y, de leurs stocks et de deux produits.
- Ordre de 10 A et 5 B. Composition de A modifiee ensuite dans le catalogue : l'ordre conserve sa copie initiale.
- Modification d'un ordre planifie : les copies existantes sont conservees.
- Acces a l'ordre depuis un autre Operateur : 403.
- Avec X = 100 et Y = 0, demarrage refuse : X reste a 100, aucun mouvement de sortie n'est conserve.
- Ajout de 5 kg de Y, puis deux demarrages simultanes : une reponse 200, une reponse 409.
- Apres demarrage : X = 65 et Y = 0, une seule sortie par matiere pour l'ordre.
- Cloture reussie ; annulation et modification d'un ordre termine refusees.
- L'autre Operateur ne voit aucun ordre qui ne lui est pas affecte.
- Deconnexion : le JWT utilise devient invalide.
- Une requete directe sur `/orders/:id` renvoie bien la page React depuis Nginx.

## Navigateur

Edge avec un profil de test isole, ecran desktop de 1365 × 900 et mobile de 390 × 844. Les controles ont couvert la navigation, les formulaires, la popup native, une modification de matiere enregistree par l'API et la composition d'un ordre. Aucun debordement horizontal de la page n'a ete observe sur les vues mobiles controlees ; aucune exception JavaScript n'a ete remontee.

Les [captures](interface.md) utilisent exclusivement des donnees synthetiques. La liste et les tableaux peuvent defiler a l'interieur de leur conteneur sur mobile.

## Persistance et portee

Les conteneurs MongoDB, API et Nginx ont ete redemarres. Les 2 matieres, 2 stocks et 1 ordre de la base de test sont restes presents.

Les controles ont utilise des projets Compose de verification isoles, sans modifier la base Windows existante. Les services de verification sont arretes apres les controles ; leurs volumes de test sont conserves.

Le workflow GitHub Actions a ete prepare et ses commandes ont ete executees localement. Aucun push GitHub, publication Jira/Figma ni deploiement AWS n'a ete effectue.
