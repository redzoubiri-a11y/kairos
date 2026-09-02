# AlloTruck — canevas de design complet

Source des planches d'un canevas Claude Design (format `.dc.html`), construit sur la
direction retenue dans `../bordereau/` et etendu en systeme de design complet pour
AlloTruck : palette (claire + sombre derivee), typographie, echelle d'espacement/rayons/
elevation, iconographie, bibliotheque de composants (etat par etat), logotype, et six
ecrans reels — trois mobile, deux back-office, plus la planche de composants.

Canevas publie : https://claude.ai/code/artifact/e9b3335f-e145-41a9-8df2-c521930c5dc1

## Contenu

| Fichier                          | Planche                                              |
| --------------------------------- | ----------------------------------------------------- |
| `Main.dc.html`                    | Systeme : palette, typographie, espacement/rayons, iconographie, regle du tampon, logotype |
| `Components.dc.html`              | Bibliotheque de composants, chaque etat represente     |
| `MobileMap.dc.html`               | Carte + fiche camion (feuille remontante)              |
| `MobileMissionForm.dc.html`       | Formulaire de nouvelle mission                         |
| `MobileMissionsReceived.dc.html`  | Missions recues, tampon vert en situation              |
| `AdminDashboard.dc.html`          | Tableau de bord back-office                            |
| `AdminTransporters.dc.html`       | File de moderation des transporteurs                   |
| `canvas.json`                     | Disposition des planches sur le canevas                |

Ces fichiers sont la source du canevas, pas des pages web autonomes : `<script
src="./support.js">` est remplace par l'editeur au moment de la publication. Pour les
reediter, repartir du skill `design` de Claude Code avec ces fichiers comme planches de
depart.

**Rien ici n'est encore applique au code vivant** des applications mobile et back-office —
c'est un livrable de reference, comme `../bordereau/`.
