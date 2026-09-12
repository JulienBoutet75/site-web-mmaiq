# Mise en œuvre UI, UX et conversion

12 septembre 2026 · Suite de [l'audit](../README.md) · Version locale, sans déploiement.

Cette évolution privilégie l'inscription au lancement, conformément à l'état actuel du produit : application en préparation et Academy sans formation publiée. L'identité sombre et violette, les captures réelles et les prix existants sont conservés.

## Changements visibles

- **Accueil :** promesse concrète, disponibilité annoncée dès le premier écran, inscription directe sans compte, démonstration et présentation d'un coach issu des contenus existants.
- **Application :** cinq démonstrations sélectionnables au clavier, lecture contrôlée par le visiteur, détails des modules repliables et bouton mobile masqué lorsque le formulaire est visible ou après inscription.
- **Tarifs :** quatre cartes lisibles, prix stables, comparaison détaillée secondaire avec texte à 14 px minimum. Coach Suite reste distinct. La séparation entre tutoriels de l'app et formations Academy est explicite.
- **Academy :** inscription dédiée lorsque le catalogue est vide ; distinction entre chargement, erreur et absence de cours. Dès publication, les formations passent avant les coachs. Les fiches présentent prix, niveau, durée et achat dès le haut. Un extrait explicitement public peut être regardé sans compte ; les chapitres payants gardent leur protection.
- **Navigation :** Application, Tarifs, Academy et Pour les salles toujours accessibles. Menu mobile défilable en paysage, fermeture Échap, focus contenu dans le panneau ouvert et restitution de la position à la fermeture.
- **Compte :** champs étiquetés, autocomplétion, affichage du mot de passe et nouveau formulaire de réinitialisation. Le retour d'un lien de récupération est pris en charge.
- **Administration :** distinction entre inscriptions app et Academy, filtres et export CSV enrichi. Les anciennes inscriptions restent classées dans l'app. Les nouveaux leads conservent leur origine et les paramètres de campagne présents sur la page de soumission ; les codes salle sont préservés.
- **Lisibilité :** boutons principaux sur fond violet uni et survol plus foncé, vidéos avec contrôles natifs, suppression de plusieurs répétitions et promesses de disponibilité prématurées.

## Captures de la version locale

| Accueil mobile | Accueil ordinateur | Tarifs mobile |
| --- | --- | --- |
| [390 × 844](accueil-mobile.png) | [1 440 × 1 000](accueil-ordinateur.png) | [Cartes de plans](tarifs-mobile.png) |

## Vérifications

- `npm run lint` : contrôle TypeScript.
- `npm run build` : compilation de production. L'avertissement Vite sur un fichier JavaScript dépassant 500 ko reste présent ; aucune mesure de performance en production n'est revendiquée.
- `git diff --check` : absence d'erreurs d'espacement dans le diff.
- Contrôles navigateur de l'accueil à 320, 390, 768, 1 024 et 1 440 px ; comparaison tarifaire lisible et absence de débordement horizontal global.
- Menu testé au clavier et à 844 × 390, avec ouverture, défilement, fermeture et restauration du focus. Liens vers les formulaires vérifiés, y compris les clics répétés et les routes avec slash final.
- **19 scénarios d'inscription simulés :** validation des champs, erreur serveur, nouvelle tentative, double clic, attribution salle, confirmation et synchronisation des formulaires. Les requêtes d'écriture ont été interceptées ; aucun lead réel créé.
- **12 contrôles Academy dans le navigateur avec données simulées :** catalogue vide, brouillons exclus, erreur puis nouvelle tentative, cours publié, résumé mobile, extrait public, média privé bloqué et conservation de la destination après inscription/connexion. Aucun paiement ni accès à une vidéo payante effectué.
- **9 contrôles isolés du relais de récupération :** événement ou marqueur de récupération, attente de chargement, redirection unique, consommation du signal et sortie sans boucle. Une connexion ordinaire ne déclenche pas le parcours.
- **13 contrôles isolés du formulaire de réinitialisation :** attente de session, lien invalide, validation et confirmation, succès, mot de passe faible ou identique, session expirée et erreur réseau. Aucun mot de passe réel modifié.

Les types React manquants ont également été ajoutés. Le contrôle TypeScript a permis de supprimer un ancien composant de connexion admin à code fixe au profit de la connexion standard et de retirer deux attributs vidéo non pris en charge.

## Avant la mise en ligne et l'ouverture des ventes

- Vérifier la configuration des URL de retour et le modèle d'email de Supabase, décrits dans le [README du projet](../../../../README.md#réinitialisation-du-mot-de-passe), puis tester un email de récupération réel avec un compte de recette. La configuration distante n'a pas été modifiée.
- Préparer les parcours de paiement et d'accès après achat avant l'ouverture commerciale : cette évolution ne constitue pas une recette Stripe. Les points correspondants de l'audit restent à traiter.
- Mesurer les inscriptions par visite et par source après publication. Aucun outil d'analytics complet, test A/B ou gain de conversion mesuré n'est inclus dans cette évolution.
- Ajouter des retours de testeurs et des éléments sur l'équipe lorsqu'ils sont disponibles et autorisés. Aucun témoignage, résultat sportif ou chiffre de popularité n'a été inventé.
