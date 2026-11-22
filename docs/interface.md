# Interface FactoryFlow

L'interface conserve les couleurs du projet : fond sombre, panneaux gris et boutons indigo. Les pages utilisent des tableaux et des formulaires classiques.

## Charte

| Element | Choix |
| --- | --- |
| Police | Arial, police systeme sans telechargement externe |
| Fond | Slate 950, `#020617` |
| Panneaux | Slate 900, `#0f172a` |
| Bordures | Slate 800, `#1e293b` |
| Action principale | Indigo 600 |
| Texte secondaire | Slate 400 |
| Alerte | Ambre ; message de texte en plus de la couleur |
| Erreur / succes | Rouge / vert ; messages avec `role="alert"` ou `role="status"` |
| Espacement | 16 a 24 px entre les blocs |
| Formulaires | Libelles visibles, controles natifs, bouton desactive pendant la requete |
| Mobile | Colonnes empilees, navigation sur plusieurs lignes, defilement interne des tableaux |

## Ecrans et parcours

1. Installation : premier administrateur uniquement.
2. Connexion commune, puis navigation selon le role.
3. Tableau de bord : totaux, statuts et alertes de stock.
4. Matieres : liste, recherche, creation et popup d'edition.
5. Produits : liste et formulaire de composition.
6. Stocks : initialisation, entrees, seuil et mouvements.
7. Operateurs : liste, creation et modification du profil.
8. Ordres : filtres, pagination, formulaire multi-produits, besoins et details.
9. Execution : confirmation du demarrage, erreur de stock, cloture.
10. Pages d'acces refuse et adresse inconnue.

Les captures dans [screenshots](screenshots/) ont ete prises dans Edge sur l'instance Docker de verification, avec des donnees de test. Elles servent de reference pour preparer la maquette Figma. Aucun fichier Figma n'a ete cree ou publie dans un espace externe.

- [Connexion](screenshots/connexion.png)
- [Tableau de bord](screenshots/dashboard.png)
- [Edition d'une matiere](screenshots/matiere-edit.png)
- [Produits](screenshots/produits.png)
- [Stocks et historique](screenshots/stocks.png)
- [Ordre multi-produits](screenshots/ordre-formulaire.png)
- [Ordres sur mobile](screenshots/ordres-mobile.png)
- [Formulaire sur mobile](screenshots/ordre-mobile.png)
