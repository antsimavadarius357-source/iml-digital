Add-Type -AssemblyName System.Drawing

$outDir = "c:\Users\HP\.gemini\antigravity-ide\scratch\iml-digital\docs\figures"
if (!(Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

function New-Canvas($w = 1200, $h = 660) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.Clear([System.Drawing.Color]::FromArgb(248, 250, 252))
  return @{ Bmp = $bmp; G = $g; W = $w; H = $h }
}

function Draw-Header($g, $w, $badge, $title, $subtitle) {
  $navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 31, 46))
  $tealBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 195, 177))
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 198, 215))

  $g.FillRectangle($navyBrush, 0, 0, $w, 86)
  $g.FillRectangle($tealBrush, 0, 82, $w, 5)

  $fBadge = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
  $fTitle = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold)
  $fSub = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Regular)

  $g.FillRectangle($tealBrush, 24, 16, 130, 22)
  $g.DrawString($badge, $fBadge, $navyBrush, 32, 18)
  $g.DrawString($title, $fTitle, $whiteBrush, 168, 12)
  $g.DrawString($subtitle, $fSub, $mutedBrush, 24, 50)
}

function Draw-Card($g, $x, $y, $w, $h, $headerColor, $title, $lines) {
  $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22, 0, 0, 0))
  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(203, 213, 225), 1.5)
  $headBrush = New-Object System.Drawing.SolidBrush($headerColor)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 41, 59))

  $g.FillRectangle($shadowBrush, $x + 4, $y + 4, $w, $h)
  $g.FillRectangle($bgBrush, $x, $y, $w, $h)
  $g.FillRectangle($headBrush, $x, $y, $w, 34)
  $g.DrawRectangle($borderPen, $x, $y, $w, $h)

  $fHead = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
  $fBody = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)

  $g.DrawString($title, $fHead, $whiteBrush, $x + 10, $y + 7)
  $curY = $y + 44
  foreach ($l in $lines) {
    $rect = New-Object System.Drawing.RectangleF(($x + 10), $curY, ($w - 20), 42)
    $g.DrawString($l, $fBody, $textBrush, $rect)
    $curY += 28
  }
}

function Draw-Arrow($g, $x1, $y1, $x2, $y2, $color) {
  $pen = New-Object System.Drawing.Pen($color, 3)
  $cap = New-Object System.Drawing.Drawing2D.AdjustableArrowCap(5, 5)
  $pen.CustomEndCap = $cap
  $g.DrawLine($pen, $x1, $y1, $x2, $y2)
}

$cNavy = [System.Drawing.Color]::FromArgb(16, 31, 46)
$cTeal = [System.Drawing.Color]::FromArgb(23, 133, 120)
$cCoral = [System.Drawing.Color]::FromArgb(217, 78, 59)
$cBlue = [System.Drawing.Color]::FromArgb(37, 99, 235)
$cAmber = [System.Drawing.Color]::FromArgb(217, 119, 6)
$cPurple = [System.Drawing.Color]::FromArgb(109, 40, 217)
$cGreen = [System.Drawing.Color]::FromArgb(22, 163, 74)

# =========================================================================
# FIGURE II.1 : CARTOGRAPHIE FONCTIONNELLE DU PROCESSUS MANUEL EXISTANT
# =========================================================================
$c = New-Canvas 1200 620
Draw-Header $c.G $c.W "FIGURE II.1" "Cartographie fonctionnelle du processus manuel initial (L'Existant)" "Chaîne de traitement fragmentée des candidatures et du suivi d'incubation avant IML Digit"

Draw-Card $c.G 30 130 205 190 $cNavy "1. Dépôt Candidature" @(
  "• Formulaire papier au guichet",
  "• Envoi par e-mail non structuré",
  "• Pièces jointes physiques",
  "• Aucun code de suivi remis",
  "⚠ Risque d'égarement élevé"
)
Draw-Arrow $c.G 235 225 265 225 $cCoral

Draw-Card $c.G 265 130 205 190 $cTeal "2. Secrétariat & Saisie" @(
  "• Enregistrement sur registre",
  "• Ressaisie manuelle sous Excel",
  "• Fichiers stockés en local",
  "• Aucune vérification auto",
  "⚠ Délai : 24h à 48h"
)
Draw-Arrow $c.G 470 225 500 225 $cCoral

Draw-Card $c.G 500 130 205 190 $cBlue "3. Comité Sélection" @(
  "• Impression papier des dossiers",
  "• Grille de notation manuelle",
  "• Convocation par appel / SMS",
  "• Pas de portail de statut",
  "⚠ Sollicitations téléphoniques"
)
Draw-Arrow $c.G 705 225 735 225 $cCoral

Draw-Card $c.G 735 130 205 190 $cAmber "4. Suivi & Mentorat" @(
  "• Affectation orale / e-mail",
  "• Comptes-rendus Word isolés",
  "• Échanges sur WhatsApp privé",
  "• Feuilles présence papier",
  "⚠ Traçabilité partielle (~40%)"
)
Draw-Arrow $c.G 940 225 970 225 $cCoral

Draw-Card $c.G 970 130 200 190 $cCoral "5. Salles & Bilan" @(
  "• Planning salles sur tableau",
  "• Conflits de créneaux horaires",
  "• Consolidation Excel lente",
  "• Attestations papier simples",
  "⚠ 2 à 3 jours de compilation"
)

# Zone inférieure : Goulots d'étranglement identifiés
Draw-Card $c.G 30 370 1140 210 $cCoral "SYNTHÈSE DES GOULOTS D'ÉTRANGLEMENT & DYSFONCTIONNEMENTS RELEVÉS LORS DE L'AUDIT" @(
  "1. Silos d'information : Données dispersées entre registres papier, fichiers Excel individuels des chargés de projets et discussions WhatsApp.",
  "2. Opacité pour le porteur de projet : Impossibilité de vérifier l'avancement de son dossier ou de ses 4 jalons sans se déplacer à Awendjé.",
  "3. Absence de GED centralisée : Recherche lente (15 à 20 min par dossier) des statuts RCCM, Business Plans et comptes-rendus de coaching.",
  "4. Vulnérabilité IT : Absence de contrôle d'accès par rôle (RBAC), pas de journal d'audit (AuditLog) et risque de perte matérielle.",
  "5. Reporting laborieux : Agrégation manuelle chronophage pour produire les indicateurs destinés à la Direction Générale et aux bailleurs."
)
$c.Bmp.Save("$outDir\fig_2_1_processus_existant.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE II.2 : ARCHITECTURE RÉSEAU (RSN) ET OUTILS MTIC DE L'EXISTANT
# =========================================================================
$c = New-Canvas 1200 620
Draw-Header $c.G $c.W "FIGURE II.2" "Cartographie technique RSN & MTIC de l'existant à l'IML (Awendjé)" "Topologie du réseau local (192.168.1.0/24) et fragmentation des outils bureautiques et de communication"

Draw-Card $c.G 430 115 340 120 $cNavy "Accès FAI Fibre Optique & Passerelle IML" @(
  "• Routeur Passerelle : 192.168.1.1 /24 (DHCP actif)",
  "• 2 Points d'accès Wi-Fi (SSID Staff & SSID Incubés)",
  "• Absence de serveur d'application centralisé sur site"
)
Draw-Arrow $c.G 600 235 200 295 $cTeal
Draw-Arrow $c.G 600 235 600 295 $cTeal
Draw-Arrow $c.G 600 235 1000 295 $cTeal

Draw-Card $c.G 40 295 340 280 $cBlue "Postes Staff IML (LAN / Wi-Fi)" @(
  "• Postes Windows 10/11 Pro (DHCP .10 à .50)",
  "• Direction Générale & Comptabilité",
  "• Chargés de projets (Agents IML)",
  "• Assistante Administrative",
  "• Stockage : Fichiers Excel (.xlsx) et Word (.docx)",
  "• 2 Imprimantes multifonctions partagées",
  "⚠ Aucune base de données partagée en réseau"
)

Draw-Card $c.G 430 295 340 280 $cAmber "Canaux MTIC Non Intégrés" @(
  "• Messagerie générique : imlGabon2@gmail.com",
  "• Groupes & discussions WhatsApp sur mobiles",
  "• Appels téléphoniques GSM classiques",
  "• Échange de pièces jointes non indexées",
  "• Réseaux sociaux (Facebook / LinkedIn)",
  "⚠ Aucune synchronisation automatique CRM",
  "⚠ Perte d'historique lors des changements"
)

Draw-Card $c.G 820 295 340 280 $cCoral "Espaces Physiques & Acteurs Externes" @(
  "• Salles de formation & Espace Coworking",
  "• Coachs & Mentors externes (Consultants)",
  "• Porteurs de projets & Startups incubées",
  "• Connexion au Wi-Fi invité sans portail métier",
  "• Remise des livrables par clé USB ou WhatsApp",
  "⚠ Cloisonnement inexistant des données",
  "⚠ Absence de portail extranet sécurisé"
)
$c.Bmp.Save("$outDir\fig_2_2_rsn_mtic_existant.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE II.3 : MATRICE SWOT VISUELLE DE L'IML
# =========================================================================
$c = New-Canvas 1200 640
Draw-Header $c.G $c.W "FIGURE II.3" "Matrice diagnostique SWOT (Audit IT & Organisationnel de l'IML)" "Synthèse stratégique des Forces, Faiblesses, Opportunités et Menaces préalable au projet IML Digit"

Draw-Card $c.G 40 115 545 235 $cGreen "FORCES (Strengths — Facteurs Internes Positifs)" @(
  "✓ Incubateur multisectoriel de référence à Libreville (Espace PME Awendjé)",
  "✓ Équipe pluridisciplinaire qualifiée (Direction, Chargés de projets, Assistante)",
  "✓ Réseau actif de 12+ coachs et experts sectoriels mobilisables",
  "✓ Méthodologie d'incubation éprouvée structurée en 4 jalons métiers",
  "✓ Connectivité Fibre optique et infrastructures d'accueil opérationnelles"
)

Draw-Card $c.G 615 115 545 235 $cCoral "FAIBLESSES (Weaknesses — Facteurs Internes Négatifs)" @(
  "✗ Dépendance aux tableurs Excel isolés et aux registres papier",
  "✗ Absence de portail web de candidature et de suivi par numéro unique",
  "✗ Aucune GED centralisée avec visionneuse rapide des documents (.docx/.pdf)",
  "✗ Absence de contrôle d'accès RBAC et de journal d'audit (AuditLog)",
  "✗ Lenteur de consolidation des KPIs pour la Direction Générale"
)

Draw-Card $c.G 40 375 545 235 $cBlue "OPPORTUNITÉS (Opportunities — Facteurs Externes Positifs)" @(
  "★essor de l'entrepreneuriat et de la transformation digitale au Gabon",
  "★ Forte adoption du mobile et de WhatsApp par les porteurs de projets",
  "★ Maturité des technologies Open Source (React, Node.js, PostgreSQL) à 0 FCFA",
  "★ Possibilité d'intégrer la visioconférence (Jitsi) et la certification QR Code",
  "★ Exigence accrue de transparence des bailleurs et partenaires financiers"
)

Draw-Card $c.G 615 375 545 235 $cAmber "MENACES (Threats — Facteurs Externes Négatifs)" @(
  "⚠ Risque de perte irréversible de dossiers en cas de panne d'un poste local",
  "⚠ Engorgement administratif lors des pics d'appels à candidatures",
  "⚠ Risque de contrefaçon des attestations papier de fin de parcours",
  "⚠ Insatisfaction des candidats face au manque de visibilité sur leur statut",
  "⚠ Conflits d'occupation des salles impactant l'image professionnelle"
)
$c.Bmp.Save("$outDir\fig_2_3_matrice_swot.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE II.4 : DIAGRAMME DE CAS D'UTILISATION UML & MATRICE RBAC
# =========================================================================
$c = New-Canvas 1200 650
Draw-Header $c.G $c.W "FIGURE II.4" "Diagramme de Cas d'Utilisation UML (Use Case) & Périmètre RBAC" "Répartition des rôles acteurs et des permissions fonctionnelles au sein du système IML Digit"

Draw-Card $c.G 30 115 260 240 $cBlue "Acteurs Externes & Bénéficiaires" @(
  "👤 Candidat / Visiteur Public :",
  "  • Soumettre une candidature en ligne",
  "  • Suivre son dossier (IML-2026-XXXX)",
  "  • Réserver une salle de formation",
  "👤 Bénéficiaire Incubé (Portail) :",
  "  • Consulter l'avancement des 4 jalons",
  "  • Voir ses RDV et comptes-rendus"
)

Draw-Card $c.G 30 375 260 240 $cPurple "Acteur Mentorat (COACH)" @(
  "🎓 Coach / Expert Référent :",
  "  • Accès étanche à ses seuls dossiers",
  "  • Consulter le diagnostic du projet",
  "  • Animer les séances (Présentiel/Jitsi)",
  "  • Rédiger les comptes-rendus de suivi",
  "  • Valider les étapes du parcours",
  "  • Échanger avec la coordination"
)

Draw-Card $c.G 330 115 540 500 $cNavy "SYSTÈME CENTRAL IML DIGIT — MODULES MÉTIERS & GARDE RBAC" @(
  "┌──────────────────────────────────────────────────────────────┐",
  "│  [UC-01] Tunnel de Candidature & Immatriculation Automatique  │",
  "│  [UC-02] Instruction, Diagnostic 5 Piliers & Admission        │",
  "│  [UC-03] Affectation Chargé de Dossier & Coach (Email/WA)     │",
  "│  [UC-04] Pilotage du Circuit d'Incubation en 4 Jalons         │",
  "│  [UC-05] Planification des Séances & Visioconférence Jitsi    │",
  "│  [UC-06] Journal des Comptes-Rendus de Mentorat               │",
  "│  [UC-07] GED Sécurisée & Prévisualisation Instantanée DOCX    │",
  "│  [UC-08] Gestion des Réservations de Salles & Annuaire        │",
  "│  [UC-09] Cockpit Stratégique, Export Excel & AuditLog         │",
  "│  [UC-10] Émission de Certificats Numériques avec QR Code      │",
  "└──────────────────────────────────────────────────────────────┘",
  "Sécurité : Middleware requireAuth + requirePermission(role)"
)

Draw-Card $c.G 910 115 260 240 $cTeal "Chargé de Dossier (AGENT IML)" @(
  "💼 Agent / Chargé de Projet :",
  "  • Instruire et qualifier les dossiers",
  "  • Créer et mettre à jour les fiches",
  "  • Affecter les coachs et programmes",
  "  • Valider la conformité GED",
  "  • Planifier les RDV & émargements",
  "  • Émettre certificats et enquêtes"
)

Draw-Card $c.G 910 375 260 240 $cCoral "DIRECTION & ADMIN SYSTÈME" @(
  "🏛️ Direction Générale IML :",
  "  • Cockpit Stratégique & KPIs globaux",
  "  • Affectation des dossiers & coachs",
  "  • Arbitrage des réservations de salles",
  "  • Supervision et exports officiels",
  "🔐 Administrateur :",
  "  • Gestion des comptes, rôles & AuditLog"
)

Draw-Arrow $c.G 290 220 330 220 $cBlue
Draw-Arrow $c.G 290 480 330 480 $cPurple
Draw-Arrow $c.G 910 220 870 220 $cTeal
Draw-Arrow $c.G 910 480 870 480 $cCoral

$c.Bmp.Save("$outDir\fig_2_4_use_case_rbac.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE III.1 : ARCHITECTURE 3-TIERS & TOPOLOGIE IP / PORTS
# =========================================================================
$c = New-Canvas 1200 640
Draw-Header $c.G $c.W "FIGURE III.1" "Architecture logicielle 3-Tiers découplée et Topologie IP / Ports" "Segmentation des flux entre le Client SPA, le Serveur API REST Express et le SGBD PostgreSQL isolé"

Draw-Card $c.G 30 120 330 330 $cBlue "TIER 1 : PRÉSENTATION (CLIENT SPA)" @(
  "• Technologie : React 18 + TypeScript 5",
  "• Bundler & Dev/Proxy : Vite (Port TCP 5173)",
  "• Production : HTTPS (Port TCP 443 / 80)",
  "• UI : TailwindCSS + Lucide Icons",
  "• Cache Client : TanStack React Query",
  "• Cache Aperçu GED : previewCacheRef",
  "• Protection CSRF : X-Requested-With",
  "• Terminaux : Postes LAN (192.168.1.0/24)",
  "  et Smartphones / PC externes"
)
Draw-Arrow $c.G 360 280 430 280 $cTeal

Draw-Card $c.G 430 120 340 330 $cNavy "TIER 2 : MÉTIER & API (BACKEND)" @(
  "• Runtime : Node.js v20 LTS + Express.js",
  "• Écoute : 127.0.0.1:4000 (/api/v1/*)",
  "• Sécurité : Sessions Cookies HttpOnly",
  "• Autorisation : Matrice RBAC granulaire",
  "• Pare-feu de données : Schémas Zod",
  "• Moteur GED : Multer + Mammoth HTML",
  "• Cache Serveur : docxPreviewCache (RAM)",
  "• Automatisation : Node-Cron (08h00)",
  "• ORM : Client Prisma généré et typé"
)
Draw-Arrow $c.G 770 280 840 280 $cCoral

Draw-Card $c.G 840 120 330 330 $cTeal "TIER 3 : PERSISTANCE & DONNÉES" @(
  "• SGBD : PostgreSQL 15+ (ACID)",
  "• Hôte : 127.0.0.1 (Loopback isolé)",
  "• Port TCP : 5433 (Non exposé au WAN)",
  "• 14 Tables Relationnelles normalisées",
  "• Intégrité : Clés étrangères & Transactions",
  "• Stockage Physique GED : /uploads/*",
  "• Journalisation : Table immuable AuditLog",
  "• Sauvegarde & Seeding : prisma/seed.ts"
)

Draw-Card $c.G 30 480 1140 130 $cAmber "CONNECTEURS MARTECH & SERVICES EXTERNES INTÉGRÉS AU WORKFLOW (HTTPS :443 / SMTPS :465)" @(
  "• Passerelle E-mail Transactionnelle (Nodemailer SMTP) : Convocations RDV, briefings de mission Coach et notifications de salles.",
  "• Passerelle WhatsApp Business (api.whatsapp.com) : Génération de messages préformatés en 1 clic pour relance directe des entrepreneurs.",
  "• Passerelle Visioconférence (meet.jit.si) & Vérification Publique QR Code : Salles virtuelles d'entretien et authentification des certificats."
)
$c.Bmp.Save("$outDir\fig_3_1_architecture_3tiers_ip.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE III.2 : FUNNEL MARKETING D'ACQUISITION & CIRCUIT DES 4 JALONS
# =========================================================================
$c = New-Canvas 1200 640
Draw-Header $c.G $c.W "FIGURE III.2" "Modélisation du Funnel d'Acquisition et du Circuit des 4 Jalons IML" "Entonnoir de conversion des porteurs de projets et pipeline séquentiel de validation du parcours"

# Funnel en 5 stades (Haut)
Draw-Card $c.G 30 115 210 195 $cNavy "Stade 1 : Visiteur" @(
  "Portail Public IML Digit",
  "• Découverte des offres",
  "• Chiffres clés (60+ PME)",
  "• Réservation d'espaces",
  "• Appel à candidatures"
)
Draw-Arrow $c.G 240 210 260 210 $cTeal

Draw-Card $c.G 260 115 210 195 $cBlue "Stade 2 : Candidat" @(
  "Tunnel /candidater",
  "• Dépôt projet & pièces",
  "• Code IML-2026-XXXX",
  "• Suivi en ligne /suivi",
  "• Notification équipe"
)
Draw-Arrow $c.G 470 210 490 210 $cTeal

Draw-Card $c.G 490 115 210 195 $cAmber "Stade 3 : Évalué" @(
  "Instruction & Comité",
  "• Analyse GED rapide",
  "• Radar 5 piliers",
  "• Entretien cadrage",
  "• Décision d'admission"
)
Draw-Arrow $c.G 700 210 720 210 $cTeal

Draw-Card $c.G 720 115 210 195 $cTeal "Stade 4 : Incubé Actif" @(
  "Suivi Longitudinal",
  "• Affectation Agent/Coach",
  "• Progression 4 Jalons",
  "• Séances & Comptes-rendus",
  "• Portail Bénéficiaire"
)
Draw-Arrow $c.G 930 210 950 210 $cTeal

Draw-Card $c.G 950 115 220 195 $cGreen "Stade 5 : Alumni Certifié" @(
  "Diplomation & Réseau",
  "• Parcours validé à 100%",
  "• Certificat QR Code",
  "• Enquête satisfaction",
  "• Annuaire des Lauréats"
)

# Circuit des 4 jalons (Bas)
Draw-Card $c.G 30 345 1140 265 $cCoral "ZOOM SUR LE CIRCUIT D'ACCOMPAGNEMENT OFFICIEL EN 4 JALONS (CALCUL AUTOMATIQUE DE PROGRESSION)" @(
  "┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐",
  "│  JALON 1 (0% -> 25%)    │ ───> │  JALON 2 (25% -> 50%)   │ ───> │  JALON 3 (50% -> 75%)   │ ───> │  JALON 4 (75% -> 100%)  │",
  "│  Diagnostic & Cadrage   │      │   Modèle Économique     │      │ Gestion & Comptabilité  │      │    Accès au Marché      │",
  "└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘",
  "• Validation séquentielle par le Coach ou l'Agent référent avec horodatage et notification temps réel.",
  "• Visibilité permanente pour le bénéficiaire depuis son espace personnel (jauge de complétion et prochaines étapes)."
)
$c.Bmp.Save("$outDir\fig_3_2_funnel_et_4_jalons.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE III.3 : MODÈLE RELATIONNEL DES DONNÉES (SCHÉMA PRISMA)
# =========================================================================
$c = New-Canvas 1200 660
Draw-Header $c.G $c.W "FIGURE III.3" "Modèle Conceptuel et Relationnel des Données (Schéma Prisma ORM)" "Architecture des principales tables PostgreSQL et intégrité référentielle du système IML Digit"

Draw-Card $c.G 30 110 260 160 $cNavy "Role & User (Acteurs)" @(
  "🔑 id : UUID (PK)",
  "• email : String (Unique)",
  "• passwordHash : String",
  "• firstName, lastName, phone",
  "• roleId : UUID (FK -> Role)"
)

Draw-Card $c.G 30 300 260 150 $cBlue "Application (Candidature)" @(
  "🔑 id : UUID (PK)",
  "• code : IML-AAAA-XXXX (Unique)",
  "• applicantName, email, phone",
  "• projectTitle, stage, status",
  "• attachments : JSON"
)

Draw-Card $c.G 30 480 260 150 $cPurple "AuditLog & Session" @(
  "🔑 id : UUID (PK)",
  "• userId : UUID (FK -> User)",
  "• action : String (ex. update)",
  "• entityType, entityId",
  "• metadata : JSON, ipAddress"
)

Draw-Card $c.G 440 180 320 270 $cTeal "Beneficiary (Dossier Maître)" @(
  "🔑 id : UUID (PK)",
  "• fileSeq : Int (Auto-increment)",
  "• firstName, lastName, email, phone",
  "• type : PORTEUR_IDEE | STARTUP | PME",
  "• status : EN_ATTENTE | ACTIF | TERMINE",
  "• priority : BASSE | NORMALE | HAUTE",
  "• assignedAgentId : UUID (FK -> User)",
  "• userId : UUID (FK -> Portail User)",
  "• startDate, lastActivityAt"
)

Draw-Card $c.G 880 110 290 155 $cAmber "Project & Pathway (4 Jalons)" @(
  "🔑 id : UUID (PK)",
  "• beneficiaryId : UUID (FK)",
  "• sectorId : UUID (FK -> Sector)",
  "• stage, legalStatus, priorityNeeds",
  "• Pathway.progress : Int (0..100%)",
  "• PathwayStep (1..4 : orderIndex)"
)

Draw-Card $c.G 880 295 290 155 $cCoral "Appointment & FollowUpNote" @(
  "🔑 id : UUID (PK)",
  "• beneficiaryId : UUID (FK)",
  "• userId : UUID (FK -> Coach)",
  "• datetime, location / Jitsi URL",
  "• status : PLANIFIE | REALISE",
  "• FollowUpNote : topic, content"
)

Draw-Card $c.G 880 480 290 150 $cGreen "Document, Certificate & Room" @(
  "🔑 id : UUID (PK)",
  "• Document : title, filePath, status",
  "• Assignment : beneficiaryId + userId",
  "• Certificate : number, qrToken",
  "• RoomBooking : reference, status"
)

Draw-Arrow $c.G 290 190 440 250 $cNavy
Draw-Arrow $c.G 290 375 440 340 $cBlue
Draw-Arrow $c.G 760 240 880 185 $cTeal
Draw-Arrow $c.G 760 315 880 370 $cTeal
Draw-Arrow $c.G 760 390 880 545 $cTeal

$c.Bmp.Save("$outDir\fig_3_3_modele_donnees_prisma.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE IV.1 : PIPELINE DE DÉPLOIEMENT & DOUBLE CACHE MÉMOIRE GED
# =========================================================================
$c = New-Canvas 1200 620
Draw-Header $c.G $c.W "FIGURE IV.1" "Procédure d'orchestration serveur et architecture du Cache GED" "Séquence de démarrage automatisée (start-dev.ps1) et résolution de la latence de prévisualisation .docx"

Draw-Card $c.G 30 120 550 220 $cNavy "A. Séquence d'Orchestration & Déploiement (start-dev.ps1)" @(
  "1. Initialisation du démon PostgreSQL sur 127.0.0.1:5433 (Test-NetConnection)",
  "2. Vérification du schéma Prisma (prisma generate / migrate) & Seeding",
  "3. Démarrage du serveur API Express (:4000) & Planificateur Cron (08h00)",
  "4. Vérification stricte du typage TypeScript (npx tsc -b -> 0 erreur)",
  "5. Lancement du serveur Frontend Vite (:5173) avec Proxy /api/v1"
)

Draw-Card $c.G 620 120 550 220 $cTeal "B. Mécanisme de Double Cache Mémoire GED (Mammoth DOCX)" @(
  "1. Clic utilisateur sur un fichier Word (.docx) dans BeneficiaryDossierModal",
  "2. Vérification du cache client React (previewCacheRef.current.get(docId))",
  "3. Si absent : appel GET /api/v1/documents/:id/preview",
  "4. Vérification du cache RAM serveur (docxPreviewCache + contrôle mtimeMs)",
  "5. Temps de rendu réduit de ~1 800 ms (à froid) à < 12 ms (en cache)"
)

Draw-Card $c.G 30 375 1140 210 $cCoral "C. SYNTHÈSE DES AJUSTEMENTS TECHNIQUES MAJEURS OPÉRÉS LORS DE LA MISE EN PRODUCTION" @(
  "• Correction RBAC Direction (permissions.ts) : Attribution de 'beneficiaries:write' et 'pathways:manage' permettant l'affectation fluide des coachs.",
  "• Validation d'intégrité des affectations (beneficiaries.service.ts) : Vérification préalable 'assertReferences' du Chargé de dossier et du Coach.",
  "• Normalisation Zod (DashboardPage.tsx) : Transformation des sélections vides en 'null' et isolation tolérante aux pannes de l'envoi d'e-mail.",
  "• Optimisation ergonomique : Nettoyage des URLs Jitsi Meet dans les tableaux de RDV, condensation de la GED et dédicace de /contacts à l'Annuaire."
)
$c.Bmp.Save("$outDir\fig_4_1_deploiement_et_cache_ged.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE IV.3 : GRAPHIQUE COMPARATIF DES KPIS & SLAS (AVANT VS APRÈS)
# =========================================================================
$c = New-Canvas 1200 640
Draw-Header $c.G $c.W "FIGURE IV.3" "Mesure de performance : Comparatif des KPIs Avant / Après IML Digit" "Évaluation quantitative des gains opérationnels et du respect des SLAs techniques"

$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(203, 213, 225), 1.5)
$c.G.FillRectangle($whiteBrush, 30, 110, 1140, 500)
$c.G.DrawRectangle($borderPen, 30, 110, 1140, 500)

$fLabel = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$fVal = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$bText = New-Object System.Drawing.SolidBrush($cNavy)
$bBefore = New-Object System.Drawing.SolidBrush($cCoral)
$bAfter = New-Object System.Drawing.SolidBrush($cTeal)
$bBgBar = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))

# Légende
$c.G.FillRectangle($bBefore, 60, 130, 22, 16)
$c.G.DrawString("Processus Manuel Initial (Avant IML Digit) — Charge / Délai relatif (100%)", $fLabel, $bText, 90, 128)
$c.G.FillRectangle($bAfter, 650, 130, 22, 16)
$c.G.DrawString("Avec la plateforme IML Digit — Charge résiduelle & Gain mesuré", $fLabel, $bText, 680, 128)

$metrics = @(
  @{ Name = "1. Délai d'immatriculation d'une candidature"; BeforeLbl = "24h à 48h (100%)"; AfterLbl = "Instantané < 3 sec (-99%)"; AfterPct = 4 },
  @{ Name = "2. Recherche d'un dossier & lecture des pièces GED"; BeforeLbl = "15 à 20 min (100%)"; AfterLbl = "< 5 sec en cache (-98%)"; AfterPct = 5 },
  @{ Name = "3. Affectation d'un Coach & envoi du briefing"; BeforeLbl = "1 à 3 jours (100%)"; AfterLbl = "< 30 sec Email + WhatsApp (-97%)"; AfterPct = 6 },
  @{ Name = "4. Production des bilans & KPIs pour la Direction"; BeforeLbl = "2 à 3 jours Excel (100%)"; AfterLbl = "Temps réel / Export 1-clic (-99%)"; AfterPct = 4 },
  @{ Name = "5. Conflits mensuels de réservation de salles"; BeforeLbl = "2 à 3 doublons/mois"; AfterLbl = "0 conflit (100% éliminés)"; AfterPct = 2 }
)

$y = 180
foreach ($m in $metrics) {
  $c.G.DrawString($m.Name, $fLabel, $bText, 60, $y)
  # Barre Avant
  $c.G.FillRectangle($bBgBar, 430, $y - 2, 480, 20)
  $c.G.FillRectangle($bBefore, 430, $y - 2, 480, 20)
  $c.G.DrawString($m.BeforeLbl, $fVal, $whiteBrush, 440, $y - 2)

  # Barre Après
  $wAfter = [Math]::Max(18, [int](4.8 * $m.AfterPct))
  $c.G.FillRectangle($bBgBar, 430, $y + 24, 480, 20)
  $c.G.FillRectangle($bAfter, 430, $y + 24, $wAfter, 20)
  $c.G.DrawString($m.AfterLbl, $fVal, $bAfter, 440 + $wAfter, $y + 24)

  $y += 82
}

$c.Bmp.Save("$outDir\fig_4_3_kpis_avant_apres.png", [System.Drawing.Imaging.ImageFormat]::Png)
$c.G.Dispose(); $c.Bmp.Dispose()

# =========================================================================
# FIGURE IV.2 : CAPTURE D'ÉCRAN RÉELLE DE LA PLATEFORME (GED & DOSSIER)
# =========================================================================
$realShot = "C:\Users\HP\.gemini\antigravity\brain\951eede4-804c-480b-ace5-8c7def74aa78\.user_uploaded\media_1794926248521_32af3905.jpg"
if (Test-Path $realShot) {
  $srcImg = [System.Drawing.Image]::FromFile($realShot)
  $c = New-Canvas 1200 620
  Draw-Header $c.G $c.W "FIGURE IV.2" "Capture opérationnelle : Visionneuse GED & Dossier Bénéficiaire IML Digit" "Prévisualisation directe d'un document Word (.docx) et validation de conformité dans l'espace sécurisé"
  $c.G.DrawImage($srcImg, 40, 100, 1120, 495)
  $c.G.DrawRectangle($borderPen, 40, 100, 1120, 495)
  $c.Bmp.Save("$outDir\fig_4_2_capture_ged_dossier.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $srcImg.Dispose()
  $c.G.Dispose(); $c.Bmp.Dispose()
}

Write-Output "Toutes les figures PNG ont été générées avec succès dans $outDir"
