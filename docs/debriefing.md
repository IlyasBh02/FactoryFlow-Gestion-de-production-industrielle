# Preparation du debriefing

## Presenter le besoin

FactoryFlow suit les matieres, les produits et les ordres de fabrication. L'administrateur gere le catalogue et planifie les ordres. Chaque operateur voit seulement ses ordres et peut les demarrer ou les terminer.

## Expliquer le code

- `App.jsx` contient les routes. `PrivateRoute` verifie la session et le role ; `Layout` fournit la navigation commune.
- `AuthProvider` charge l'installation et le profil, puis partage la session avec Context API. `useAuth` lit ce contexte.
- `api.js` contient l'instance Axios, l'envoi du JWT et les erreurs reseau ou HTTP.
- Les pages utilisent `useState` pour les champs, le chargement et les erreurs ; `useEffect` pour charger les donnees.
- `Material` conserve la liste et la matiere selectionnee. Il passe les valeurs et la fonction de sauvegarde a `PopUpEdit` : c'est le lifting state.
- `OrderForm` utilise `useMemo` pour additionner les besoins en matieres quand les produits ou les quantites changent.
- Le backend valide chaque operation. Les routes Admin ont aussi un controle serveur, independamment des boutons visibles dans React.
- La composition est copiee dans l'ordre. Le demarrage utilise cette copie, additionne les besoins et modifie les stocks et le statut dans une transaction MongoDB.

## Demonstration proposee

1. Installer sur une base neuve, puis se connecter comme administrateur.
2. Creer un operateur et deux matieres X et Y.
3. Initialiser 100 kg de X et 0 kg de Y.
4. Creer A : 2 kg de X ; B : 3 kg de X et 1 kg de Y.
5. Planifier 10 A et 5 B : le formulaire affiche 35 kg de X et 5 kg de Y.
6. Se connecter comme operateur. Demarrer : erreur de stock, ordre toujours planifie et X toujours a 100.
7. Ajouter 5 kg de Y depuis le compte Admin, puis demarrer depuis le compte Operateur.
8. Verifier X = 65, Y = 0 et les mouvements de sortie. Terminer l'ordre.
9. Filtrer les ordres termines et recharger directement la page de detail.
10. Montrer les tests, le workflow et les fichiers Docker.

## Points a connaitre

La pagination et les filtres sont appliques aux ordres charges par le client. Pour un gros volume, ils seraient deplaces vers l'API. Le stockage des mouvements est integre au document stock pour garder une entree et son mouvement coherents dans une seule ecriture. Les anciens ordres a un produit restent lisibles.

La planification CSV et les captures sont des livrables locaux. Les espaces Jira/Figma et un deploiement AWS ne sont pas crees automatiquement.
