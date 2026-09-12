# Audit UI, UX et conversion — MMA IQ

Audit du 12 septembre 2026 · [Site examiné](https://mmaiq.fr) · Version publique et code du dépôt.

**Le site possède une identité reconnaissable, mais sa présentation commerciale devance ce que le visiteur peut réellement obtenir.** L'application conduit à une liste d'attente et le catalogue Academy est vide. Les premières améliorations doivent clarifier cette situation, rendre l'inscription attractive et simplifier la lecture sur mobile. Une refonte graphique complète n'est pas nécessaire pour traiter ces obstacles.

## Périmètre et niveau de certitude

Inspection visuelle des pages Accueil, Application, Tarifs, Academy, À propos, Contact, Connexion et Partenaires. Captures principales à 1 440 × 1 000 et 390 × 844 ; contrôles supplémentaires à 375 × 667, 844 × 390 et 1 024 × 768. Parcours des liens, ouverture de la modale de plans, retour vers la liste d'attente et ouverture du menu mobile.

Les constats marqués **observés** ont été vérifiés sur le site public. Ceux marqués **code** nécessitent une recette fonctionnelle avant commercialisation. Aucun formulaire envoyé, compte créé ou paiement effectué. L'application mobile elle-même et les espaces authentifiés ne sont pas inclus. Il ne s'agit ni d'un test avec des utilisateurs, ni d'une mesure de conversion, ni d'un audit exhaustif de conformité ou de performance.

Les impacts commerciaux sont des hypothèses à tester ; aucun taux d'abandon ou gain de conversion n'est inventé. Le contenu public peut remplacer les valeurs par défaut du dépôt : notamment, **Tarifs existe dans la navigation par défaut du code, mais n'apparaît pas dans le menu public observé**.

Faute d'objectif commercial confirmé au moment de l'audit, la recommandation retient l'état public actuel : **obtenir des inscriptions au lancement de l'app**, avec une entrée distincte pour les salles et une inscription spécifique pour les futures formations.

## Ce qui mérite d'être conservé

- L'univers sombre, le violet, le logo et les titres donnent une identité cohérente avec le MMA.
- Les captures réelles et vidéos de l'application rendent le produit tangible. Elles sont plus convaincantes que des maquettes génériques.
- Les grands boutons du premier écran sont faciles à repérer ; `/app` dispose déjà d'un bouton fixe sur mobile.
- Contact présente des libellés explicites, des états d'envoi et un email de secours. Les accordéons partagés prévoient des attributs d'accessibilité et le site possède un focus clavier visible.
- La page Partenaires expose un bénéfice précis et un simulateur concret : c'est une approche à reprendre pour expliquer la valeur aux pratiquants.
- La boutique vide est retirée du menu public. Les logos de partenaires ne sont affichés que s'ils existent dans la base.

## Priorités

P0 : à corriger avant une campagne d'acquisition importante. P1 : à traiter dans la prochaine évolution. P2 : à préparer avant l'ouverture des ventes concernées. L'effort est relatif, pas un devis.

| Priorité | Problème | Correction attendue | Effort |
| --- | --- | --- | --- |
| P0 | Disponibilité comprise trop tard | Afficher le prélancement dès l'accueil et aligner toutes les promesses | Faible |
| P0 | « Découvrir les vidéos » aboutit à un catalogue vide | Présenter l'Academy à venir et proposer une notification dédiée | Faible à moyen |
| P0 | Prix à 8 px sur mobile | Cartes de plans lisibles, comparaison détaillée secondaire | Moyen |
| P0 | Plusieurs étapes pour rejoindre une même liste d'attente | Formulaire direct, sans modale de choix obligatoire | Moyen |
| P1 | Valeur noyée dans une succession de fonctionnalités | Promesse ciblée, démonstration courte, trois bénéfices concrets | Moyen |
| P1 | Peu de preuves humaines à proximité des décisions | Présenter l'équipe, les coachs et des retours attribués lorsqu'ils existent | Dépend des contenus |
| P1 | Navigation incomplète et cassée en paysage | Tarifs visible, libellés courts, panneau mobile défilable | Faible à moyen |
| P1 | Contenu vidéo de l'abonnement ambigu | Distinguer tutoriels de l'app et formations Academy | Faible |
| P1 | Lecture et animations parfois excessives | Revoir contraste des boutons, densité et contrôle des démos | Moyen |
| P2 | Parcours compte et achat encore fragiles | Terminer récupération, retour achat et accès au produit | Moyen à élevé |

## 1. Rendre le statut du produit évident

**Observé.** L'accueil présente « Progresse en MMA avec méthode » et des cours « dans une seule app », sans annoncer son indisponibilité. Le premier bouton conduit vers `/app`, qui indique « Bientôt sur iOS & Android ». La page Academy invite à découvrir les vidéos et à créer un compte, mais ne propose aucune formation publiée au moment de l'audit.

Le visiteur peut comprendre qu'il va utiliser ou acheter un produit, puis découvrir qu'il doit attendre. Cette rupture est plus importante que la couleur d'un bouton.

**Recommandation :** afficher le statut dès le premier écran, annoncer exactement l'action réalisable et préciser les prochaines étapes. Tant que l'app est en préparation, privilégier « Être prévenu du lancement ». Une date, un accès bêta ou un avantage de lancement ne doivent être annoncés que s'ils sont réellement prévus.

**Critère de réussite :** après cinq secondes sur l'accueil, une personne doit pouvoir expliquer ce que fait MMA IQ, pour qui, si c'est disponible et ce qui arrive après le clic.

Preuves : [accueil mobile](captures/accueil-mobile.png), [application mobile](captures/application-mobile.png) ; `src/pages/Home.tsx:93`, `src/pages/AppPage.tsx:147`.

## 2. Donner une issue utile au catalogue vide

**Observé.** « Découvrir les vidéos » défile vers des filtres de recherche et le message « Catalogue en préparation ». Il n'y a pas de prochaine action dans cet état. L'invitation à créer un compte apparaît avant même qu'un contenu soit disponible.

**Recommandation immédiate :** transformer cet écran en présentation de la première formation à venir, si son contenu est confirmé : coach, sujet, niveau visé et bénéfice. Ajouter « Être prévenu des premières formations ». Masquer recherche et filtres tant qu'ils n'ont aucun contenu à explorer. La newsletter générale du footer ne remplace pas cette inscription contextualisée.

**Après publication :** mettre les formations avant la longue présentation des coachs ; afficher prix, niveau, durée, résultat pédagogique et extrait dans les cartes ou à proximité. Un seul coach peut être mis en valeur dans un bloc éditorial large : la grille actuelle à quatre colonnes laisse beaucoup d'espace inutilisé sur ordinateur.

Preuve : [destination du bouton Academy](captures/academy-catalogue-vide.png) ; `src/pages/Instructional.tsx:269`, `:298`, `:572`.

## 3. Repenser la lecture des tarifs sur téléphone

**Observé.** À 390 px de large, le tableau conserve quatre plans et onze critères. Les prix sont affichés à **8 px**, les noms des plans à **9 px**, les critères à **10 px**. Ce sont des mesures du style calculé dans le navigateur. La comparaison demande un effort disproportionné pour une décision commerciale importante.

« Visu Perf », « Lim. », « Marketplace » et « Crédits IA » décrivent des fonctions sans expliquer assez clairement ce que le client obtient. La phrase expliquant les usages des crédits existe déjà, mais elle ne permet pas d'estimer ce que représentent 30 ou 80 crédits.

**Recommandation :** présenter d'abord des cartes lisibles avec prix, profil concerné et trois différences décisives. Garder toutes les offres accessibles et placer le tableau complet en deuxième niveau. Utiliser 16 px pour le contenu courant et viser 14 px pour les détails commerciaux ; ce sont des choix de confort proposés, pas une prétendue taille minimale WCAG. Réserver Coach Suite à une entrée coach distincte.

Remplacer les abréviations par des mots compréhensibles. Expliquer les crédits avec des exemples fondés sur leur consommation réelle. Conserver le montant annuel total, déjà présent sur les cartes, à côté de l'équivalent mensuel.

Preuve : [tableau mobile](captures/tarifs-mobile.png) ; `src/components/PricingSection.tsx:398`, `:413`.

## 4. Simplifier l'inscription au lancement

**Observé et code.** Le parcours est : tableau → « Choisir mon offre » → modale → carte de plan → formulaire en bas de `/app`. Tous les plans conduisent au même formulaire ; l'offre choisie n'est pas transmise dans le lead. Le lien vers le formulaire fonctionne lors du test.

**Recommandation :** placer le formulaire directement près de la promesse sur l'accueil et sur `/app`. Pour le prélancement, un email suffit. Si le plan choisi sert à qualifier la demande, le conserver explicitement et le rappeler dans la confirmation ; autrement, enlever cette décision intermédiaire.

Le champ « Code salle » peut devenir « J'ai un code salle » et s'ouvrir sur demande, tout en gardant le préremplissage existant pour les personnes venues d'une salle. La confirmation doit expliquer ce que l'inscrit recevra. Ajouter une raison spécifique de s'inscrire uniquement si l'équipe peut la tenir.

Le bouton fixe mobile existe déjà : le conserver, mais le masquer lorsque le formulaire est visible afin de dégager l'écran. Éviter aussi de doubler le même bouton pendant toute la visibilité du bouton principal du premier écran.

Preuves : [modale actuelle](captures/tarifs-modale-mobile.png), [arrivée au formulaire](captures/inscription-mobile.png) ; `src/components/PricingSection.tsx:214`, `:440`, `src/pages/AppPage.tsx:94`, `:576`.

## 5. Passer d'une liste de fonctions à une proposition de valeur

**Observé.** La page app s'adresse simultanément aux débutants, amateurs, pros et coachs. Elle présente plusieurs séries de captures, une comparaison avant/après, huit modules et un gameplan. Sur le format mobile examiné, l'accueil mesure environ **7 034 px** et la page app **10 152 px**. Le bloc tarifs de l'accueil commence vers **4 027 px**.

Ces mesures décrivent la longueur, pas un abandon mesuré. Le bouton fixe de `/app` permet déjà de rejoindre le formulaire rapidement. Le problème est surtout la répétition : chaque nouvelle section devrait répondre à une question différente du prospect.

**Recommandation :** choisir un profil d'acquisition principal, puis montrer une situation concrète : préparer sa semaine, savoir quoi travailler, suivre ses progrès. Remplacer « Il y a un avant et un après MMA IQ » par une promesse qui décrit ce changement. Le positionnement précis doit ensuite être confronté à de vrais pratiquants.

Les titres « Un écosystème complet » et « Un seul objectif » peuvent laisser la place à des bénéfices précis. Les mots « cutting », « gameplan » ou « instructional » peuvent rester lorsqu'ils conviennent au public, avec une explication simple pour les débutants.

Preuves : `src/pages/AppPage.tsx:149`, `:396` ; mesures conservées dans `observations.json`.

## 6. Construire la confiance avec des personnes et des preuves

**Observé.** Aucun logo partenaire ni témoignage attribué n'est apparu sur l'accueil examiné. La page À propos décrit « notre équipe » sans présenter de personnes nommées. Johnny Frachey apparaît sur Academy, mais sa crédibilité reste éloignée de la promesse principale de l'app.

**Code.** Le badge Elite « Le plus populaire » dépend d'un booléen statique. Le dépôt ne fournit pas de donnée démontrant cette popularité. Cela ne prouve pas que l'affirmation est fausse : elle demande une justification.

**Recommandation :** présenter les personnes responsables, leur rôle concret et leur implication dans le produit. Montrer un exemple commenté de programme ou d'analyse. Ajouter des retours de testeurs nommés, contextualisés et autorisés lorsqu'ils existent. Expliquer ce qu'un coach a conçu ou validé, sans lui attribuer un rôle non confirmé.

La démonstration de fonctionnement déjà disponible constitue une preuve immédiate. Un témoignage sur la progression exige un retour réel. Éviter les statistiques, étoiles ou logos ajoutés uniquement pour remplir l'espace. Si aucune donnée ne justifie « Le plus populaire », préférer une indication telle que « Pour un accompagnement complet », conforme au contenu réel de l'offre.

Preuves : `src/components/TrustBar.tsx:45`, `src/components/PricingSection.tsx:87`, `src/pages/About.tsx:138`.

## 7. Corriger navigation et accessibilité ciblée

**Observé.** Le menu public met en avant Application, Coaching vidéo, À propos, FAQ et Contact ; Tarifs apparaît dans le footer. À 1 024 px, plusieurs libellés passent sur deux lignes et le premier lien arrive contre le logo. À **844 × 390**, FAQ, Contact et Connexion sont sous la zone visible du menu : le panneau possède `overflow-y: hidden`. À 375 × 667, les liens du menu déconnecté étaient visibles : le défaut reproduit concerne bien la faible hauteur, pas tous les mobiles.

**Recommandation :** raccourcir la navigation : « Application », « Tarifs », « Academy », « Pour les salles », avec les ressources dans une entrée secondaire ou le footer. Adapter le seuil du menu compact à la place disponible. Rendre le panneau mobile défilable, prévoir fermeture Échap et gestion du focus.

**Observé.** Les champs email et mot de passe de Connexion n'ont pas de label associé dans le DOM ni d'autocomplétion explicite. Associer les labels, faciliter le remplissage et ajouter une commande pour afficher le mot de passe. Les formulaires Contact et les accordéons partagés fournissent déjà une base à conserver.

Pour les boutons importants, viser une zone tactile d'environ 44–48 px. C'est une cible de confort proposée ; le critère WCAG 2.2 AA prévoit un minimum de 24 × 24 px avec exceptions, et ne permet pas de conclure à une non-conformité à partir de la seule hauteur d'un lien. [Référence W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Preuves : [menu paysage](captures/menu-paysage.png), [navigation tablette](captures/navigation-tablette.png) ; `src/components/Layout.tsx:242`, `src/pages/Connexion.tsx:301`.

## 8. Clarifier les droits inclus dans chaque offre

**Observé et code.** La grille de prix indique « Cours vidéos » : 1, 5, puis illimité. La FAQ précise que les formations s'achètent à l'unité, en complément. Le prospect peut comprendre que l'abonnement inclut l'ensemble d'Academy.

**Recommandation :** si cette distinction reflète le produit, employer « Tutoriels techniques dans l'app » dans les plans et « Formations Academy — achat séparé » sous la comparaison. Expliquer également ce que signifie une limite : nombre de vidéos accessibles, renouvellement éventuel ou autre règle réelle.

Le footer mentionne toujours de l'équipement alors que la boutique est masquée : aligner cette description sur les offres réellement présentées. Distinguer aussi explicitement inscription gratuite à la liste d'attente et futur abonnement payant.

Preuves : `src/components/PricingSection.tsx:21`, `:44`, `:67`, `src/data/faq.tsx:43`, `src/components/Layout.tsx:403`.

## 9. Affiner la direction visuelle

**Jugement de design fondé sur les captures.** L'identité fonctionne, mais beaucoup d'éléments sollicitent le regard : titres condensés en capitales, halos, dégradés, bordures et animations. Des descriptions et tableaux paraissent petits face à ces titres. Le produit gagnerait en maturité avec davantage de calme autour des informations décisives.

| Élément | Direction recommandée |
| --- | --- |
| Couleurs | Garder le violet principal ; utiliser cyan, rouge et or avec un rôle clair |
| Typographie | Garder la police condensée pour les grands titres courts ; privilégier DM Sans pour comparaison, consignes et preuves |
| Premier écran | Montrer une capture utile plus tôt, avec une promesse et un statut commercial explicites |
| Espacements | Réduire les grands vides qui retardent la démonstration ; augmenter l'espace utile autour des détails et actions |
| Vidéos | Ajouter lecture/pause et agrandissement ; la petite capture en boucle aide à voir le produit, moins à lire ses détails |
| Animations | Garder les transitions utiles ; retirer les compteurs de prix et pulsations permanentes qui compliquent la lecture |
| Boutons | Employer un fond suffisamment contrasté sur toute la surface, avec un état de focus net |

Le dégradé des boutons atteint `#B28DFF` avec du texte blanc : le contraste de ces deux couleurs est d'environ **2,58:1** au point clair. La valeur locale dépend de la position du texte dans le dégradé ; vérifier chaque bouton rendu. Pour le texte courant, la référence WCAG est 4,5:1. Un fond violet plus foncé et stable rend la lecture plus robuste. [Référence W3C](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## 10. Terminer ces parcours avant les ventes

Ces points viennent du **code** ; aucun achat ni email de récupération n'a été déclenché. Leur priorité dépend de l'activation commerciale.

| Parcours | Risque repéré | Résultat attendu |
| --- | --- | --- |
| Mot de passe oublié | Envoi du lien prévu, aucune UI de nouveau mot de passe ni traitement de récupération trouvé | Lien email → définition du mot de passe → retour à l'espace client |
| Extrait d'une formation | Compte requis pour voir le teaser | Extrait public avant inscription ; compte à l'étape nécessaire |
| Achat formation | Prix et achat en bas de page ; inscription intermédiaire | Encart prix/bénéfices/accès dès le haut, conservation de la formation choisie |
| Abandon d'abonnement | `/cancel` propose de retourner à la boutique masquée | Reprendre le plan et la salle choisis |
| Succès abonnement | « Abonnement activé » puis téléchargement « dès sa sortie » | Expliquer l'accès immédiat, la disponibilité et le début de facturation avant et après paiement |
| Confirmation email | Destination initiale non conservée explicitement pour ce retour | Reprendre la formation ou l'offre choisie après validation |
| Retour client | Connexion standard vers le catalogue | Arrivée dans les formations possédées et leur progression |

Le checkout partenaire est conditionné par une variable d'activation ; la FAQ en parle déjà comme disponible. Vérifier les textes dans les deux états. Ces éléments justifient une recette de vente complète avant ouverture, pas l'affirmation qu'un paiement échoue actuellement.

Preuves : `src/lib/supabase.ts:40`, `src/context/AuthContext.tsx:79`, `src/pages/Course.tsx:640`, `:925`, `src/pages/Cancel.tsx:24`, `server.ts:714`, `src/pages/Success.tsx:160`, `src/pages/Connexion.tsx:54`, `src/pages/Salle.tsx:10`.

## Proposition d'accueil pour le prélancement

Cette rédaction est une piste à tester ; les bénéfices doivent correspondre au produit effectivement livré.

> **Bientôt sur iOS et Android**
>
> **Ta semaine de MMA, avec un plan clair.**
>
> Organise tes entraînements, suis ta progression et prépare tes combats avec MMA IQ.
>
> **[Ton email] [Être prévenu du lancement]**
>
> Inscription gratuite. Nous t'écrirons lorsque l'application sera disponible.
>
> Voir la démonstration

Ordre recommandé :

1. Promesse, statut, capture réelle et inscription.
2. Une démonstration courte et contrôlable d'un usage concret.
3. Trois bénéfices : organiser sa semaine, savoir quoi travailler, suivre ses progrès.
4. Les personnes et preuves qui expliquent pourquoi faire confiance au produit.
5. Une présentation synthétique des futurs plans et des droits inclus.
6. Une FAQ répondant aux objections : disponibilité, prix, niveau, Academy, utilisation avec son club.
7. Rappel d'inscription, puis liens secondaires vers Academy et le programme salles.

Au lancement, remplacer l'inscription par l'accès réel au produit ou l'essai effectivement proposé, et montrer les conditions correspondantes. Pour l'Academy, faire évoluer la page d'annonce vers un catalogue dès qu'une formation achetable existe.

Cette structure applique l'idée de rendre la finalité du site et les points de départ des tâches explicites ; elle reste une recommandation adaptée à MMA IQ, pas une garantie de conversion. [Nielsen Norman Group — Homepage Usability](https://www.nngroup.com/articles/top-ten-guidelines-for-homepage-usability/).

## Plan d'exécution et mesure

**Premier lot : cohérence commerciale.** Statut dès l'accueil, CTA alignés, sortie utile du catalogue vide, libellés app/Academy sans ambiguïté et accès Tarifs visible. Critère : aucun clic principal ne crée une attente incompatible avec sa destination.

**Deuxième lot : page app et mobile.** Formulaire direct, suppression de la modale inutile, tarifs lisibles, navigation paysage corrigée, démos contrôlables et preuves mieux placées. Critère : comprendre l'offre et rejoindre la liste sans zoom ni recherche dans une longue page.

**Troisième lot : recette avant vente.** Parcours compte, confirmation, récupération, achat, abandon et accès au contenu avec comptes de test et environnement de paiement prévu pour la recette. Critère : chaque achat et chaque erreur possède une suite compréhensible.

**Mesure dès le premier lot.** Aucune instrumentation explicite de conversion n'a été trouvée dans le dépôt ; cela n'exclut pas un dispositif extérieur. Séparer les objectifs :

| Objectif | Indicateur principal | Étapes à comprendre |
| --- | --- | --- |
| App avant lancement | Inscriptions réussies / visiteurs uniques de la page | Vue → clic principal → formulaire → succès |
| Academy avant publication | Inscriptions Academy / visiteurs Academy | Intérêt pour le sujet → inscription dédiée |
| Formations publiées | Achats confirmés / visiteurs de fiche | Fiche → extrait → achat initié → paiement confirmé |
| Salles | Demandes reçues puis partenariats signés | Page → simulation → formulaire → qualification |

Conserver la source de trafic et distinguer mobile/ordinateur et nouveaux/anciens visiteurs. La vente doit être comptée sur un paiement confirmé, pas seulement une visite de `/success`. Observer aussi la qualité des inscrits et, après lancement, l'activation dans l'app.

Tester la compréhension avec cinq pratiquants du public visé : « Qu'est-ce que tu peux obtenir aujourd'hui ? », « Que ferais-tu ensuite ? », « Quelle offre te correspond ? », « Les formations sont-elles incluses ? ». Ce petit test permet de détecter des problèmes, pas de mesurer statistiquement un gain. Si le trafic est faible, privilégier ces observations et un suivi avant/après prudent ; lancer un A/B test quand le volume permet une conclusion utile.

## Captures et observations

- [Accueil mobile](captures/accueil-mobile.png) et [accueil ordinateur](captures/accueil-ordinateur.png).
- [Application mobile](captures/application-mobile.png).
- [Tarifs mobile](captures/tarifs-mobile.png) et [modale de plans](captures/tarifs-modale-mobile.png).
- [Formulaire après le choix de plan](captures/inscription-mobile.png).
- [Catalogue Academy vide après le CTA](captures/academy-catalogue-vide.png).
- [Menu mobile paysage](captures/menu-paysage.png) et [navigation à 1 024 px](captures/navigation-tablette.png).
- [Observations chiffrées du navigateur](observations.json).

Les captures documentent l'état public au moment du test. Aucun fichier applicatif n'a été modifié par cet audit.
