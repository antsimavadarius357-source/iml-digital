const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  ImageRun,
} = require('docx');
const fs = require('fs');
const path = require('path');

// Palette institutionnelle & académique (IML / INPTIC)
const NAVY = '101F2E';
const TEAL = '178578';
const LIGHT_TEAL = 'E6F7F5';
const CORAL = 'D94E3B';
const SLATE_DARK = '1E293B';
const SLATE_MUTED = '475569';
const BG_HEADER = '101F2E';
const BG_ALT = 'F8FAFC';
const BORDER_COLOR = 'CBD5E1';

// Helpers de mise en forme académique
function partTitle(partLabel, titleText) {
  return [
    new Paragraph({
      children: [new PageBreak()],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 240 },
      children: [
        new TextRun({
          text: partLabel.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: 'Times New Roman',
          color: TEAL,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 600 },
      border: {
        top: { color: NAVY, space: 12, style: BorderStyle.SINGLE, size: 12 },
        bottom: { color: NAVY, space: 12, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: titleText.toUpperCase(),
          bold: true,
          size: 36, // 18pt
          font: 'Times New Roman',
          color: NAVY,
        }),
      ],
    }),
  ];
}

function chapterHeading(chapNum, chapTitle, withPageBreak = true) {
  const elements = [];
  if (withPageBreak) {
    elements.push(new Paragraph({ children: [new PageBreak()] }));
  }
  elements.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { before: 360, after: 240 },
      border: {
        bottom: { color: TEAL, space: 8, style: BorderStyle.SINGLE, size: 12 },
      },
      children: [
        new TextRun({
          text: `${chapNum} : ${chapTitle.toUpperCase()}`,
          bold: true,
          size: 32, // 16pt
          font: 'Times New Roman',
          color: NAVY,
        }),
      ],
    })
  );
  return elements;
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { before: 320, after: 160 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 28, // 14pt
        font: 'Times New Roman',
        color: TEAL,
      }),
    ],
  });
}

function subSectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 25, // 12.5pt
        font: 'Times New Roman',
        color: NAVY,
      }),
    ],
  });
}

function subSubHeading(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        italics: true,
        size: 24, // 12pt
        font: 'Times New Roman',
        color: CORAL,
      }),
    ],
  });
}

function p(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 140, line: 360 }, // Interligne 1.5 académique
    indent: options.noIndent ? undefined : { firstLine: 420 },
    children: [
      new TextRun({
        text: text,
        size: options.size || 24, // 12pt Times New Roman
        font: 'Times New Roman',
        color: options.color || SLATE_DARK,
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function bullet(boldPrefix, text) {
  const children = [];
  if (boldPrefix) {
    children.push(
      new TextRun({
        text: `${boldPrefix} : `,
        bold: true,
        size: 24,
        font: 'Times New Roman',
        color: NAVY,
      })
    );
  }
  children.push(
    new TextRun({
      text: text,
      size: 24,
      font: 'Times New Roman',
      color: SLATE_DARK,
    })
  );
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    bullet: { level: 0 },
    spacing: { before: 60, after: 80, line: 320 },
    children,
  });
}

function makeTable(headers, rows, widths = null) {
  const colCount = headers.length;
  const colWidths = widths || Array(colCount).fill(Math.floor(100 / colCount));

  const headerCells = headers.map((h, idx) =>
    new TableCell({
      width: { size: colWidths[idx], type: WidthType.PERCENTAGE },
      shading: { fill: BG_HEADER, type: ShadingType.CLEAR, color: 'auto' },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: h,
              bold: true,
              size: 21, // 10.5pt
              font: 'Times New Roman',
              color: 'FFFFFF',
            }),
          ],
        }),
      ],
    })
  );

  const dataRows = rows.map((row, rIdx) => {
    const fill = rIdx % 2 === 1 ? BG_ALT : 'FFFFFF';
    return new TableRow({
      children: row.map((cellText, cIdx) =>
        new TableCell({
          width: { size: colWidths[cIdx], type: WidthType.PERCENTAGE },
          shading: { fill, type: ShadingType.CLEAR, color: 'auto' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { before: 40, after: 40, line: 260 },
              children: [
                new TextRun({
                  text: String(cellText),
                  bold: cIdx === 0,
                  size: 21, // 10.5pt
                  font: 'Times New Roman',
                  color: SLATE_DARK,
                }),
              ],
            }),
          ],
        })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
    },
    rows: [new TableRow({ tableHeader: true, children: headerCells }), ...dataRows],
  });
}

function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 220 },
    children: [
      new TextRun({
        text: text,
        italics: true,
        bold: true,
        size: 20, // 10pt
        font: 'Times New Roman',
        color: SLATE_MUTED,
      }),
    ],
  });
}

function insertFigure(figFileName, figNum, figTitle) {
  const figPath = path.join(__dirname, 'docs', 'figures', figFileName);
  const items = [];
  if (fs.existsSync(figPath)) {
    const imgBuffer = fs.readFileSync(figPath);
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 220, after: 80 },
        children: [
          new ImageRun({
            type: 'png',
            data: imgBuffer,
            transformation: {
              width: 590,
              height: 315,
            },
          }),
        ],
      })
    );
  }
  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 240 },
      children: [
        new TextRun({
          text: `${figNum} : `,
          bold: true,
          size: 21, // 10.5pt
          font: 'Times New Roman',
          color: NAVY,
        }),
        new TextRun({
          text: figTitle,
          italics: true,
          size: 21, // 10.5pt
          font: 'Times New Roman',
          color: SLATE_MUTED,
        }),
      ],
    })
  );
  return items;
}

async function generateReport() {
  const children = [];

  // =========================================================================
  // EN-TÊTE DE PRÉSENTATION DU DOCUMENT
  // =========================================================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: 'RAPPORT DE STAGE DE FIN DE CYCLE — DÉVELOPPEMENT DES CHAPITRES II, III ET IV',
          bold: true,
          size: 24,
          font: 'Times New Roman',
          color: TEAL,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 300 },
      border: {
        bottom: { color: NAVY, space: 10, style: BorderStyle.DOUBLE, size: 12 },
      },
      children: [
        new TextRun({
          text: "THÈME : MISE EN PLACE D'UN OUTIL NUMÉRIQUE DE SUIVI ET D'ACCOMPAGNEMENT DES PORTEURS DE PROJETS : CAS DE L'INCUBATEUR MULTISECTORIEL DE LIBREVILLE (IML)",
          bold: true,
          size: 28,
          font: 'Times New Roman',
          color: NAVY,
        }),
      ],
    })
  );

  // =========================================================================
  // CHAPITRE II : DIAGNOSTIC DE L'EXISTANT ET CAHIER DES CHARGES
  // =========================================================================
  children.push(
    ...chapterHeading('CHAPITRE II', "DIAGNOSTIC DE L'EXISTANT ET CAHIER DES CHARGES", false),
    p(
      "La réussite d'un projet de transformation numérique au sein d'une structure d'appui à l'entrepreneuriat repose avant tout sur une compréhension fine de son écosystème organisationnel, de ses processus métiers et de son infrastructure technologique initiale. Avant de concevoir et de déployer la plateforme « IML Digit », il s'est avéré indispensable de réaliser un diagnostic exhaustif de l'existant au sein de l'Incubateur Multisectoriel de Libreville (IML). Ce deuxième chapitre expose, dans une première section, l'audit fonctionnel et technique du système en place ainsi que la démarche méthodologique d'investigation adoptée. Dans une seconde section, il présente l'analyse critique des dysfonctionnements relevés à travers une matrice SWOT, avant de formaliser le cahier des charges fonctionnel et technique qui gouverne la réalisation de la nouvelle solution."
    ),

    // SECTION 1
    sectionHeading("Section 1 : Audit et analyse de l'existant"),
    p(
      "L'audit de l'existant vise à dresser un état des lieux objectif des pratiques opérationnelles, des flux d'information et du patrimoine technologique de l'Incubateur Multisectoriel de Libreville (IML), situé à l'Immeuble Espace PME au quartier Awendjé. Cette étape permet de comprendre comment les porteurs de projets sont accueillis, sélectionnés et suivis au quotidien."
    ),

    // 1.1
    subSectionHeading('1.1. Cartographie fonctionnelle et technique (RSN / MTIC)'),
    p(
      "L'analyse de l'architecture existante de l'IML s'articule autour de deux dimensions complémentaires : d'une part, la cartographie fonctionnelle qui retrace la chaîne de valeur métier de l'incubation et, d'autre part, la cartographie technique qui recense l'infrastructure Réseaux et Systèmes Numériques (RSN) ainsi que les Moyens et Technologies de l'Information et de la Communication (MTIC) mobilisés par les équipes."
    ),
    subSubHeading('A. Cartographie fonctionnelle des processus métiers de l’IML'),
    p(
      "Sur le plan fonctionnel, le cycle de vie d'un porteur de projet au sein de l'IML s'organise autour de cinq (5) macro-processus opérationnels séquentiels :"
    ),
    bullet(
      '1. Processus d’appel à candidatures et de réception des dossiers',
      "Lors du lancement d'une cohorte ou au fil de l'eau, les porteurs d'idées, startups et PME déposent leurs dossiers soit physiquement au secrétariat de l'incubateur (formulaires papier et pièces justificatives imprimées), soit par courrier électronique. L'assistante administrative procède à un enregistrement manuel dans un registre physique puis dans un tableur."
    ),
    bullet(
      '2. Processus de présélection et de diagnostic d’éligibilité',
      "Les chargés de projets (Agents IML) examinent les dossiers soumis, vérifient la complétude documentaire (pièce d'identité, statuts juridiques RCCM, présentation du projet) et convoquent les candidats par appel téléphonique ou message WhatsApp pour un comité d'audition et de cadrage."
    ),
    bullet(
      '3. Processus d’affectation et de structuration du parcours',
      "Une fois le candidat admis en tant que bénéficiaire, la Direction Générale et le chargé de projet désignent un coach ou mentor référent selon le secteur d'activité (agriculture, numérique, BTP, agroalimentaire, services) et définissent les objectifs d'accompagnement."
    ),
    bullet(
      '4. Processus de suivi opérationnel, de mentorat et de formation',
      "L'accompagnement se déploie en quatre jalons clés : Diagnostic & Cadrage, Modèle Économique, Gestion & Comptabilité, et Accès au Marché. Les séances de travail donnent lieu à des feuilles d'émargement papier et à des comptes-rendus rédigés sous Microsoft Word par les coachs, puis transmis par e-mail aux chargés de projets."
    ),
    bullet(
      '5. Processus de gestion logistique et de bilan de fin de parcours',
      "Parallèlement, l'incubateur gère la réservation de ses salles de réunion et de formation (Espace Coworking, Salle de Conférence, Salle Multimédia) pour les masterclasses ou pour des partenaires externes. En fin de cohorte, la Direction compile manuellement les statistiques d'activité et délivre des attestations imprimées."
    ),
    ...insertFigure(
      'fig_2_1_processus_existant.png',
      'Figure II.1',
      "Cartographie fonctionnelle du processus manuel initial d'accompagnement et goulots d'étranglement à l'IML."
    ),

    subSubHeading('B. Cartographie technique : Infrastructure RSN et écosystème MTIC'),
    p(
      "Sur le plan technique, l'audit du parc informatique, de la connectivité réseau (RSN) et des outils digitaux (MTIC) utilisés par l'IML avant notre intervention a permis de relever la configuration suivante :"
    ),
    bullet(
      'Infrastructure Réseau local (LAN / WLAN)',
      "Le siège de l'IML à Awendjé dispose d'une connexion Internet fibre optique haut débit fournie par un opérateur de télécommunications local, distribuée via un routeur passerelle principal et deux points d'accès Wi-Fi (SSID interne pour le staff administratif et SSID invité pour la salle de formation et l'espace coworking). Le plan d'adressage local repose sur un sous-réseau privé standard (192.168.1.0/24) en attribution DHCP dynamique, sans segmentation VLAN stricte entre le réseau administratif et le réseau des incubés."
    ),
    bullet(
      'Parc matériel et postes de travail',
      "L'équipe permanente (Direction, Chargés de projets, Assistante administrative, Comptabilité) travaille sur des ordinateurs portables individuels sous environnement Microsoft Windows 10 et Windows 11 Professionnel, complétés par deux imprimantes multifonctions réseau partagées."
    ),
    bullet(
      'Outils bureautiques et gestion documentaire (MTIC)',
      "En l'absence d'un progiciel de gestion intégré (ERP/CRM) dédié à l'incubation, le traitement de l'information repose essentiellement sur la suite bureautique Microsoft Office (Excel pour le suivi des cohortes, Word pour les comptes-rendus et fiches d'évaluation) ainsi que sur des dossiers partagés localement ou sur des clés USB."
    ),
    bullet(
      'Canaux de communication et présence numérique',
      "Les échanges opérationnels entre les chargés de projets, les coachs et les bénéficiaires s'effectuent principalement via des groupes et discussions WhatsApp, des appels GSM classiques et une adresse de messagerie électronique générique (Gmail). La visibilité externe de l'incubateur se limitait principalement aux réseaux sociaux institutionnels (Facebook, LinkedIn), sans portail web transactionnel permettant la candidature ou le suivi de dossier en ligne."
    ),

    makeTable(
      ['Domaine audité', 'Composant / Outil en place', 'Usage opérationnel à l’IML', 'Limites techniques observées'],
      [
        [
          'Réseau & Connectivité (RSN)',
          'Routeur Fibre + Points d’accès Wi-Fi (192.168.1.0/24)',
          'Accès Internet pour le personnel, les coachs et les incubés',
          'Aucun serveur d’application local ; pas de cloisonnement logique des flux métiers',
        ],
        [
          'Base de données & Suivi',
          'Fichiers Microsoft Excel (.xlsx) sur postes individuels',
          'Recensement des candidats, listes de présence, annuaire des coachs',
          'Aucune base de données relationnelle ; redondance, conflits de versions et risques de perte',
        ],
        [
          'Gestion Documentaire (GED)',
          'Arborescences Windows locales & pièces jointes e-mail',
          'Stockage des Business Plans, statuts RCCM, CNI et comptes-rendus',
          'Absence d’indexation centrale ; recherche lente et téléchargements répétitifs',
        ],
        [
          'Communication & Convocations (MTIC)',
          'WhatsApp personnel, Appels GSM, Messagerie Gmail',
          'Relance des porteurs de projets, envoi des dates de rendez-vous',
          'Historique dispersé sur les téléphones des agents ; aucune traçabilité institutionnelle',
        ],
        [
          'Planification & Logistique',
          'Registres papier et tableaux blancs muraux',
          'Réservation des salles de formation et planning des séances',
          'Doubles réservations fréquentes ; absence de visibilité à distance pour les coachs',
        ],
      ],
      [22, 26, 26, 26]
    ),
    tableCaption("Tableau 1 : Cartographie synthétique de l'existant fonctionnel et technique (RSN / MTIC) à l'IML."),
    ...insertFigure(
      'fig_2_2_rsn_mtic_existant.png',
      'Figure II.2',
      "Topologie de l'infrastructure Réseau (RSN 192.168.1.0/24) et écosystème MTIC non intégré de l'existant à l'IML."
    ),

    // 1.2
    subSectionHeading("1.2. Méthode d'investigation et collecte de données"),
    p(
      "Afin de garantir la pertinence scientifique et opérationnelle de notre diagnostic, nous avons adopté une méthodologie d'investigation rigoureuse combinant trois (3) techniques complémentaires de recueil de données sur le terrain durant les premières semaines de notre stage au sein de l'IML :"
    ),
    bullet(
      '1. Les entretiens semi-directifs ciblés',
      "Nous avons élaboré un guide d'entretien structuré autour des besoins métiers, des irritants quotidiens et des attentes fonctionnelles. Ces entretiens ont été menés auprès d'un échantillon représentatif de l'écosystème de l'incubateur : la Direction Générale (pilotage stratégique et reporting bailleurs), les Chargés de projets notamment M. Marcelin NGOMO ONDO (instruction des dossiers et suivi des cohortes), l'Assistante Administrative Mme Ketsia MAGANGA ZOME (accueil, réservation de salles et archivage), ainsi que quatre (4) coachs/mentors experts et dix (10) porteurs de projets incubés."
    ),
    bullet(
      '2. L’observation directe et participante',
      "Intégré au quotidien des équipes de l'IML, nous avons participé activement au traitement des dossiers de candidature, à la préparation logistique des séances de coaching et à la consolidation des fiches de suivi. Cette immersion nous a permis de chronométrer les temps de traitement manuels et de relever les points de friction réels que les utilisateurs n'expriment pas toujours lors d'un entretien formel."
    ),
    bullet(
      '3. L’analyse documentaire et l’inventaire des artefacts métiers',
      "Nous avons collecté et analysé l'ensemble des supports physiques et numériques utilisés par l'incubateur : formulaires d'inscription papier, grilles de notation des comités de sélection, modèles de parcours d'accompagnement, feuilles d'émargement, fiches de synthèse de séances de mentorat, ainsi que les modèles d'attestations de fin d'incubation. Cet inventaire a servi de base directe à la modélisation du schéma de données de la future plateforme."
    ),

    makeTable(
      ['Catégorie d’acteurs', 'Effectif interrogé', 'Mode de collecte', 'Principales préoccupations exprimées'],
      [
        [
          'Direction Générale',
          '2 responsables',
          'Entretien stratégique & revue de bilans',
          'Disposer de statistiques fiables en temps réel (KPIs), superviser le travail des agents et des coachs, contrôler l’occupation des salles.',
        ],
        [
          'Chargés de projets (Agents IML)',
          '3 agents',
          'Entretiens approfondis & observation',
          'Centraliser les dossiers des bénéficiaires, automatiser les convocations WhatsApp/Email, suivre l’avancement des 4 jalons sans ressaisie Excel.',
        ],
        [
          'Assistante Administrative',
          '1 responsable',
          'Observation directe au guichet',
          'Éliminer les dossiers papier incomplets, gérer les demandes de réservation de salles en ligne et éditer rapidement les feuilles de présence.',
        ],
        [
          'Coachs & Mentors référents',
          '4 experts',
          'Entretiens individuels',
          'Accéder facilement au dossier de leurs incubés assignés, planifier les séances (présentiel ou visio) et saisir les comptes-rendus en ligne.',
        ],
        [
          'Porteurs de projets (Incubés)',
          '10 entrepreneurs',
          'Questionnaire & échanges directs',
          'Pouvoir candidater à distance, connaître l’état d’avancement de leur dossier en temps réel et consulter leurs rendez-vous et livrables.',
        ],
      ],
      [22, 16, 24, 38]
    ),
    tableCaption("Tableau 2 : Synthèse de la campagne d'investigation et de collecte des besoins auprès des parties prenantes de l'IML."),

    // SECTION 2
    sectionHeading("Section 2 : Critique de l'existant et formalisation du besoin"),
    p(
      "Les données recueillies lors de la phase d'audit permettent de poser un diagnostic précis sur les limites du fonctionnement manuel et semi-informatisé de l'incubateur, puis de traduire ces constats en spécifications fonctionnelles et techniques rigoureuses."
    ),

    // 2.1
    subSectionHeading('2.1. Analyse critique et diagnostic dysfonctionnel (Audit IT / SWOT)'),
    p(
      "L'analyse critique du système d'information existant met en évidence cinq (5) dysfonctionnements majeurs qui freinent la montée en échelle (scalabilité) de l'Incubateur Multisectoriel de Libreville :"
    ),
    bullet(
      '1. Fragmentation de l’information et silos de données',
      "Les données relatives à un même entrepreneur sont éparpillées entre le formulaire de candidature initial, les fichiers Excel des chargés de projets, les comptes-rendus Word des coachs et les échanges WhatsApp. Cette dispersion entraîne une perte de temps considérable (en moyenne 15 à 20 minutes pour reconstituer l'historique complet d'un dossier) et des incohérences lors des mises à jour."
    ),
    bullet(
      '2. Opacité du suivi longitudinal pour le bénéficiaire et la Direction',
      "Une fois son dossier déposé, le candidat ne dispose d'aucun moyen autonome pour vérifier si sa demande a été reçue, instruite ou validée, ce qui génère de multiples appels téléphoniques et déplacements physiques au secrétariat. De même, en cours d'incubation, la progression réelle sur les quatre jalons du parcours n'est pas mesurée par un indicateur visuel partagé."
    ),
    bullet(
      '3. Manque de traçabilité des prestations de coaching et des rendez-vous',
      "L'affectation d'un coach à un bénéficiaire et la tenue effective des séances de mentorat ne sont pas tracées dans un système central. Certains comptes-rendus de séance tardent à être transmis ou restent stockés sur les ordinateurs personnels des consultants externes, privant l'incubateur d'une mémoire institutionnelle pérenne."
    ),
    bullet(
      '4. Gestion artisanale des espaces et conflits de planification',
      "Les demandes de réservation des salles de formation et de réunion, formulées par téléphone ou sur papier, donnent régulièrement lieu à des chevauchements de créneaux horaires ou à des oublis de confirmation."
    ),
    bullet(
      '5. Vulnérabilité sécuritaire et absence d’auditabilité IT',
      "Sur le plan de la sécurité des systèmes d'information (Audit IT), les fichiers Excel et dossiers locaux ne disposent d'aucun contrôle d'accès granulaire par rôle (RBAC), ni de journal d'audit (Audit Log) permettant de savoir qui a modifié ou supprimé une information sensible. De plus, les attestations de fin de parcours délivrées sur papier ne comportent aucun mécanisme cryptographique ou QR Code permettant à une banque ou à un partenaire d'en vérifier l'authenticité."
    ),
    p(
      "Afin de synthétiser ce diagnostic stratégique et technologique, nous avons formalisé la matrice SWOT (Strengths, Weaknesses, Opportunities, Threats) présentée dans le tableau ci-dessous :"
    ),

    makeTable(
      ['FORCES (Strengths - Interne)', 'FAIBLESSES (Weaknesses - Interne)'],
      [
        [
          "• Positionnement stratégique de l'IML comme incubateur multisectoriel de référence à Libreville.\n• Équipe d'encadrement qualifiée (Direction, Chargés de projets, Assistante, Coachs experts).\n• Méthodologie d'accompagnement structurée en 4 jalons métiers clairs.\n• Infrastructure locale dotée d'une connexion fibre optique et d'espaces physiques équipés (salles de formation, coworking).",
          "• Gestion manuelle et dispersée sur tableurs Excel et supports papier.\n• Absence de portail web interactif pour les candidatures et le suivi des dossiers.\n• Aucune GED centralisée avec prévisualisation rapide des pièces justificatives.\n• Absence de cloisonnement sécurisé des accès (RBAC) et de journal d'audit.\n• Lenteur dans la production des statistiques et bilans pour la Direction.",
        ],
      ],
      [50, 50]
    ),
    new Paragraph({ spacing: { before: 80, after: 80 } }),
    makeTable(
      ['OPPORTUNITÉS (Opportunities - Externe)', 'MENACES (Threats - Externe)'],
      [
        [
          "• Dynamisme croissant de l'écosystème entrepreneurial et de la digitalisation au Gabon.\n•Forte pénétration du smartphone et de WhatsApp chez les entrepreneurs gabonais, favorisant les notifications multicanales.\n• Disponibilité de technologies Web Open Source matures (React, Node.js, PostgreSQL) permettant un coût de licence nul.\n• Attente forte des bailleurs de fonds et banques partenaires pour des indicateurs d'impact traçables et certifiés.",
          "• Risque de perte définitive de données critiques en cas de panne matérielle sur les postes individuels.\n• Saturation opérationnelle des chargés de projets face à l'augmentation du volume de candidatures.\n• Risque de falsification des attestations papier de fin d'incubation.\n• Dégradation de l'image de marque de l'incubateur en cas de retards prolongés dans le traitement des candidatures.",
        ],
      ],
      [50, 50]
    ),
    tableCaption("Tableau 3 : Matrice diagnostique SWOT du système d'information et d'accompagnement de l'IML."),
    ...insertFigure(
      'fig_2_3_matrice_swot.png',
      'Figure II.3',
      "Représentation synthétique de la Matrice diagnostique SWOT (Forces, Faiblesses, Opportunités, Menaces) de l'IML."
    ),

    // 2.2
    subSectionHeading('2.2. Cahier des charges et spécifications'),
    p(
      "Pour répondre de manière structurée et pérenne à l'ensemble des dysfonctionnements identifiés, le cahier des charges de la plateforme « IML Digit » définit les objectifs, les rôles acteurs ainsi que les spécifications fonctionnelles et non-fonctionnelles attendues."
    ),
    subSubHeading('A. Objectif général et objectifs spécifiques'),
    p(
      "L'objectif général du projet est de concevoir, développer et déployer une plateforme web intégrée de gestion, de suivi et d'accompagnement des porteurs de projets pour l'Incubateur Multisectoriel de Libreville (IML). Plus spécifiquement, la solution doit permettre de :"
    ),
    bullet('Objectif 1 (Dématérialisation)', "Digitaliser de bout en bout le dépôt des candidatures et la réservation d'espaces avec génération automatique d'un numéro de dossier unique (format IML-AAAA-XXXX)."),
    bullet('Objectif 2 (Transparence)', "Offrir aux candidats et aux bénéficiaires un portail de suivi en temps réel de l'instruction de leur dossier et de leur progression sur les 4 jalons d'incubation."),
    bullet('Objectif 3 (Collaboration & Mentorat)', "Permettre l'affectation fluide des dossiers aux chargés de projets et aux coachs avec notification automatique par e-mail et WhatsApp, planification des rendez-vous (présentiel ou visioconférence intégrée) et saisie des comptes-rendus."),
    bullet('Objectif 4 (GED & Pilotage)', "Centraliser les pièces justificatives dans une Gestion Électronique des Documents (GED) dotée d'une prévisualisation instantanée et fournir à la Direction un cockpit décisionnel complet avec certification numérique par QR Code."),

    subSubHeading('B. Spécifications fonctionnelles détaillées par module'),
    p(
      "Le périmètre fonctionnel de la plateforme « IML Digit » est structuré en huit (8) modules métiers interconnectés, synthétisés dans le tableau des exigences fonctionnelles ci-après :"
    ),

    makeTable(
      ['Code', 'Module fonctionnel', 'Exigences et fonctionnalités clés attendues', 'Acteurs concernés'],
      [
        [
          'MOD-01',
          'Portail Public & Candidatures en ligne',
          "Vitrine institutionnelle de l'IML, formulaire de candidature multi-étapes avec dépôt de pièces jointes, immatriculation unique (IML-2026-XXXX) et barre de recherche publique pour le suivi d'avancement du dossier.",
          'Public, Candidats',
        ],
        [
          'MOD-02',
          'Gestion des Dossiers & Affectations',
          "Répertoire central des bénéficiaires, fiche 360° (identité, projet, secteur, stade), radar de maturité sur 5 piliers, modale d'affectation d'un Chargé de dossier (Agent) et d'un Coach référent avec envoi automatique du briefing par e-mail et WhatsApp.",
          'Direction, Agents IML',
        ],
        [
          'MOD-03',
          'Circuit d’Accompagnement (4 Jalons)',
          "Suivi longitudinal structuré autour des 4 étapes officielles (1. Diagnostic & Cadrage, 2. Modèle Économique, 3. Gestion & Comptabilité, 4. Accès au Marché), validation séquentielle et calcul automatique du pourcentage de progression.",
          'Agents IML, Coachs, Bénéficiaires',
        ],
        [
          'MOD-04',
          'Agenda, Visioconférence & Émargement',
          "Planification de séances en présentiel ou en visioconférence (génération automatique de salon sécurisé Jitsi Meet), convocations multicanales, rappels automatisés et édition des feuilles d'émargement officielles.",
          'Agents IML, Coachs, Bénéficiaires',
        ],
        [
          'MOD-05',
          'Espace Coach & Comptes-rendus',
          "Vue dédiée et cloisonnée pour chaque mentor, journal des comptes-rendus de séances (points abordés, blocages, recommandations, niveau de priorité) synchronisé en temps réel avec la fiche du bénéficiaire.",
          'Coachs / Mentors, Agents IML',
        ],
        [
          'MOD-06',
          'GED & Visionneuse Documentaire',
          "Coffre-fort numérique par bénéficiaire regroupant les documents PDF et Word (.docx), validation de conformité documentaire et prévisualisation directe en un clic sans téléchargement lourd.",
          'Agents IML, Direction, Coachs',
        ],
        [
          'MOD-07',
          'Réservation de Salles & Annuaire',
          "Système de réservation en ligne des espaces de l'IML avec workflow de validation/refus, et annuaire centralisé des acteurs (bénéficiaires, coachs, partenaires institutionnels et financiers).",
          'Public, Agents IML, Direction',
        ],
        [
          'MOD-08',
          'Cockpit Direction, Audit & Certificats',
          "Tableaux de bord analytiques globaux, exportations CSV/Excel, journal d'audit immuable des actions utilisateurs et émission de certificats numériques infalsifiables munis d'un QR Code de vérification.",
          'Direction Générale, Administrateur',
        ],
      ],
      [12, 24, 44, 20]
    ),
    tableCaption("Tableau 4 : Spécifications fonctionnelles détaillées des huit modules de la plateforme IML Digit."),
    ...insertFigure(
      'fig_2_4_use_case_rbac.png',
      'Figure II.4',
      "Diagramme global de Cas d'Utilisation UML (Use Case) et Matrice des Rôles RBAC de la plateforme IML Digit."
    ),

    subSubHeading('C. Spécifications non-fonctionnelles (Sécurité, Performance, Ergonomie)'),
    bullet(
      'Contrôle d’accès basé sur les rôles (RBAC) et sécurité des sessions',
      "Authentification par sessions serveur persistées en base PostgreSQL via cookies sécurisés HttpOnly, hachage des mots de passe avec Bcrypt, protection anti-CSRF par en-tête personnalisé (X-Requested-With: iml-digital) et validation systématique des schémas d'entrée avec Zod."
    ),
    bullet(
      'Performance et réactivité temps réel',
      "Temps de réponse des endpoints API inférieur à 100 ms en lecture courante, mise en cache client via TanStack Query et prévisualisation instantanée des documents bureautiques (.docx) grâce à un cache serveur en mémoire vive."
    ),
    bullet(
      'Ergonomie et sobriété visuelle',
      "Interface utilisateur épurée respectant l'identité visuelle de l'IML (Bleu Nuit #101F2E, Turquoise #23C3B1 et Corail #FF5B37), 100 % responsive (adaptée aux ordinateurs, tablettes et smartphones) et dépourvue de tout élément superflu pouvant alourdir la lecture des tableaux de suivi."
    ),
    p(
      "En somme, ce deuxième chapitre nous a permis de mettre en lumière les limites structurelles de la gestion manuelle au sein de l'IML et d'établir un cahier des charges précis. Ces spécifications constituent le socle de référence pour la deuxième partie de notre étude, consacrée à la conception technique, à l'implémentation et au déploiement opérationnel de la plateforme."
    ),

    // =========================================================================
    // DEUXIÈME PARTIE : IMPLÉMENTATION ET DÉPLOIEMENT OPÉRATIONNEL
    // =========================================================================
    ...partTitle('DEUXIÈME PARTIE', 'IMPLÉMENTATION ET DÉPLOIEMENT OPÉRATIONNEL'),
    p(
      "Après avoir diagnostiqué l'existant et formalisé les exigences fonctionnelles et techniques dans la première partie, cette seconde partie est consacrée à la concrétisation opérationnelle du projet « IML Digit » au sein de l'Incubateur Multisectoriel de Libreville. Elle s'articule autour de deux chapitres complémentaires : le Chapitre III présente l'étude préalable, les choix technologiques, l'architecture réseau/applicative ainsi que la modélisation du système et le banc d'essai ; le Chapitre IV détaille la procédure de déploiement, la résolution des incidents techniques rencontrés, le protocole de recette et l'évaluation des performances à travers des indicateurs clés (KPIs et SLAs)."
    ),

    // =========================================================================
    // CHAPITRE III : ÉTUDE PRÉALABLE ET CONCEPTION DE LA SOLUTION
    // =========================================================================
    ...chapterHeading('CHAPITRE III', 'ÉTUDE PRÉALABLE ET CONCEPTION DE LA SOLUTION', true),
    p(
      "La conception d'une plateforme numérique critique destinée à orchestrer l'ensemble des flux d'un incubateur d'entreprises exige des choix architecturaux et technologiques rigoureusement justifiés. Ce troisième chapitre expose, dans une première section, l'étude comparative des solutions existantes sur le marché et la justification de l'empilement technologique (Stack Full-Stack & MarTech) retenu pour l'IML. Dans une seconde section, il détaille la modélisation technique et organisationnelle du système — incluant la topologie réseau IP, le tunnel de conversion (Funnel) et le modèle de données relationnel — ainsi que la mise en place de l'environnement de simulation et de test."
    ),

    // SECTION 1
    sectionHeading('Section 1 : Analyse comparative et choix technologiques'),
    p(
      "Face aux besoins exprimés dans le cahier des charges, trois grandes options stratégiques s'offraient à l'Incubateur Multisectoriel de Libreville : l'abonnement à une solution SaaS propriétaire spécialisée, l'adaptation d'un ERP/CRM Open Source généraliste, ou le développement sur mesure d'une plateforme web modulaire."
    ),

    // 1.1
    subSectionHeading('1.1. Comparatif des solutions du marché (Open Source vs Propriétaire / Stack MarTech)'),
    p(
      "L'analyse comparative des différentes familles de solutions disponibles sur le marché met en lumière des compromis importants en matière de coût total de possession (TCO), d'adéquation aux processus spécifiques de l'IML et de souveraineté sur les données :"
    ),
    bullet(
      '1. Les plateformes SaaS propriétaires de gestion d’incubateurs et CRM (ex. AcceleratorApp, Skipso, HubSpot Pro, Monday.com)',
      "Ces solutions clés en main offrent des interfaces modernes et des fonctionnalités marketing avancées. Toutefois, leur modèle économique repose sur des abonnements mensuels récurrents élevés (entre 150 000 et 600 000 FCFA par mois selon le nombre d'utilisateurs et de porteurs de projets). De plus, leurs workflows figés se prêtent difficilement aux spécificités administratives gabonaises (circuit des 4 jalons IML, feuilles d'émargement officielles, immatriculation locale) et les données restent hébergées dans des silos propriétaires externes."
    ),
    bullet(
      '2. Les progiciels ERP / CMS Open Source généralistes (ex. Odoo Community, Dolibarr, WordPress + plugins CRM)',
      "Bien que gratuits en licence de base, les ERP généralistes comme Odoo ou Dolibarr sont conçus autour de la facturation, de la comptabilité et de la gestion des stocks. Leur adaptation au métier spécifique de l'accompagnement entrepreneurial (diagnostic de maturité sur 5 piliers, portail candidat sans compte lourd, jumelage Agent/Coach, certificats QR Code) nécessite des développements de modules complexes en Python ou PHP et alourdit l'interface avec des dizaines de menus inutiles pour l'incubateur."
    ),
    bullet(
      '3. Le développement sur mesure basé sur une Stack Web Open Source & MarTech moderne (Solution IML Digit)',
      "Cette approche consiste à bâtir une application web dédiée en s'appuyant sur des briques Open Source de référence industrielle (React, TypeScript, Node.js/Express, PostgreSQL) couplées à des connecteurs MarTech agiles (API WhatsApp Click-to-Chat, notifications SMTP Nodemailer, visioconférence Jitsi Meet, vérification QR Code). Elle garantit une adéquation à 100 % avec le cahier des charges de l'IML, une souveraineté totale sur le code source et la base de données, et l'absence totale de frais de licence logicielle."
    ),

    makeTable(
      ['Critères d’évaluation', 'SaaS Propriétaire (HubSpot / AcceleratorApp)', 'ERP Open Source générique (Odoo / Dolibarr)', 'Développement sur mesure Open Source (IML Digit)'],
      [
        [
          'Coût des licences (TCO)',
          'Très élevé (Abonnement mensuel par siège en devises)',
          'Faible (Gratuit en édition Community, modules payants)',
          'Nul (0 FCFA de frais de licence, 100 % Open Source)',
        ],
        [
          'Adéquation au métier IML (4 jalons, Radar, GED)',
          'Moyenne (Processus standardisés non spécifiques)',
          'Faible (Orienté commerce/facturation et non incubation)',
          'Totale (Conçu sur mesure pour les processus de l’IML)',
        ],
        [
          'Souveraineté & Maîtrise des données',
          'Faible (Données captives chez l’éditeur étranger)',
          'Élevée (Auto-hébergeable)',
          'Totale (Code source et base PostgreSQL propriétés de l’IML)',
        ],
        [
          'Intégration MarTech (WhatsApp, Jitsi, Email)',
          'Souvent facturée en supplément (Add-ons)',
          'Complexe (Nécessite des connecteurs tiers payants)',
          'Native et gratuite (Intégration directe dans le workflow)',
        ],
        [
          'Ergonomie & Rapidité de prise en main',
          'Bonne mais interface chargée',
          'Complexe (Nombreux menus comptables superflus)',
          'Optimale (Interfaces dédiées par rôle : Agent, Coach, Direction)',
        ],
      ],
      [22, 26, 26, 26]
    ),
    tableCaption("Tableau 5 : Analyse multicritères des solutions du marché (Propriétaire vs Open Source générique vs Solution sur mesure IML Digit)."),

    // 1.2
    subSectionHeading('1.2. Justification des choix retenus'),
    p(
      "Au regard de l'analyse comparative précédente, la Direction de l'IML et notre équipe projet ont retenu la troisième option : la conception et le développement de la plateforme sur mesure « IML Digit ». Chaque composant de l'architecture technologique a été sélectionné selon des critères stricts de performance, de sécurité, de maintenabilité et de pérennité :"
    ),
    bullet(
      'Langage de programmation unifié : TypeScript (v5.x)',
      "Utilisé aussi bien côté Frontend que côté Backend (Full-Stack TypeScript), il apporte un typage statique fort qui élimine toute une classe d'erreurs à la compilation (`tsc -b`), documente les structures de données et sécurise la maintenance évolutive du code."
    ),
    bullet(
      'Couche Présentation (Frontend SPA) : React 18 + Vite + TailwindCSS',
      "React 18 permet de construire une interface utilisateur modulaire et réactive sous forme de Single Page Application (SPA). Le bundler Vite assure une compilation quasi instantanée, tandis que TailwindCSS permet de concevoir un design institutionnel sur mesure, léger et parfaitement adaptatif (Responsive Design). La bibliothèque TanStack Query (React Query) gère la synchronisation et la mise en cache intelligente des données issues de l'API."
    ),
    bullet(
      'Couche Métier et API (Backend) : Node.js (v20 LTS) + Express.js + Zod',
      "L'environnement d'exécution asynchrone Node.js couplé au framework Express permet de traiter un grand volume de requêtes concurrentes avec une faible empreinte mémoire. La bibliothèque Zod assure la validation stricte et le nettoyage (sanitization) de toutes les données entrantes avant leur traitement métier."
    ),
    bullet(
      'Couche de Persistance et ORM : PostgreSQL + Prisma ORM',
      "PostgreSQL est le système de gestion de base de données relationnelle Open Source le plus robuste et conforme aux propriétés ACID (Atomicité, Cohérence, Isolation, Durabilité). L'ORM Prisma offre un schéma déclaratif (`schema.prisma`), génère un client SQL entièrement typé et protège nativement l'application contre les injections SQL."
    ),
    bullet(
      'Écosystème MarTech et Traitement Documentaire : Mammoth, Nodemailer, Jitsi & WhatsApp API',
      "Pour répondre aux besoins concrets du terrain gabonais, la plateforme intègre Mammoth.js (conversion ultra-rapide des fichiers Word `.docx` en HTML directement prévisualisable dans le navigateur), Nodemailer (envoi automatisé des briefings coachs et convocations par e-mail), Jitsi Meet (génération automatique de salles de visioconférence sans installation requise) et l'API profondément intégrée de WhatsApp pour l'envoi en un clic des notifications aux entrepreneurs."
    ),

    makeTable(
      ['Couche architecturale', 'Technologie retenue', 'Version', 'Rôle et justification technique dans IML Digit'],
      [
        ['Frontend (Client Web)', 'React + TypeScript + Vite', '18.x / 5.x', 'Interface SPA réactive, routage protégé par rôle et compilation haute performance.'],
        ['Design System & UI', 'TailwindCSS + Lucide React', '3.x / 4.x', 'Charte graphique sur mesure IML, responsive mobile/desktop et iconographie vectorielle.'],
        ['Gestion d’état serveur', 'TanStack React Query', '5.x', 'Mise en cache des requêtes API, invalidation automatique et fluidité de navigation.'],
        ['Backend (Serveur API)', 'Node.js + Express.js', '20 LTS / 4.x', 'Architecture RESTful modulaire (`/api/v1`), gestion des middlewares RBAC et sécurité.'],
        ['Validation & Sécurité', 'Zod + Bcrypt + Cookies HttpOnly', '3.x', 'Validation stricte des payloads JSON, hachage cryptographique et protection CSRF.'],
        ['Base de données & ORM', 'PostgreSQL + Prisma ORM', '15+ / 6.x', 'Persistance relationnelle intègre, transactions atomiques et migrations contrôlées.'],
        ['Moteur GED & Export', 'Multer + Mammoth + SheetJS', '1.x', 'Téléversement sécurisé, prévisualisation instantanée des `.docx` en mémoire et export CSV/Excel.'],
        ['Briques MarTech & Comms', 'Nodemailer + Jitsi + WhatsApp', 'API / Web', 'Automatisation des e-mails de mission, visioconférence intégrée et relances WhatsApp.'],
      ],
      [22, 26, 14, 38]
    ),
    tableCaption("Tableau 6 : Empilement technologique (Stack Full-Stack & MarTech) retenu pour la plateforme IML Digit."),

    // SECTION 2
    sectionHeading("Section 2 : Architecture, modélisation et banc d'essai"),
    p(
      "Une fois les choix technologiques arrêtés, la phase de conception consiste à définir l'architecture technique et réseau du système, à modéliser le parcours de conversion des porteurs de projets ainsi que le schéma de données, et à préparer le banc d'essai permettant de valider la solution."
    ),

    // 2.1
    subSectionHeading('2.1. Modélisation technique et organisationnelle (Topologie IP / Funnel Marketing)'),
    subSubHeading('A. Architecture 3-Tiers et Topologie Réseau / Plan d’adressage IP'),
    p(
      "La plateforme « IML Digit » repose sur une architecture logicielle trois-tiers (3-tiers) strictement découplée qui sépare la couche de présentation, la couche de logique métier et la couche de données. Dans le cadre de son intégration au sein du réseau de l'IML (et de son déploiement sur serveur), les flux réseaux et l'adressage IP/Ports sont segmentés de manière à garantir qu'aucun client externe ne puisse interagir directement avec la base de données :"
    ),
    bullet(
      'Tier 1 — Couche Présentation (Client Web / Frontend)',
      "Exécutée dans le navigateur de l'utilisateur (poste agent sur le LAN 192.168.1.0/24 ou terminal mobile externe en 4G/Fibre), elle communique exclusivement via le protocole HTTP/HTTPS avec l'API en échangeant des flux JSON sécurisés accompagnés de l'en-tête anti-CSRF `X-Requested-With: iml-digital`."
    ),
    bullet(
      'Tier 2 — Couche Application (Serveur API REST Express)',
      "Écoutant sur le port TCP 4000 (`localhost:4000` derrière le proxy inverse ou sur le serveur applicatif interne `192.168.1.10:4000`), ce serveur concentre les contrôleurs métiers, le moteur d'authentification par session, le contrôleur de permissions RBAC et le cache documentaire."
    ),
    bullet(
      'Tier 3 — Couche Données (Serveur PostgreSQL & Stockage GED)',
      "Isolée sur le port TCP 5433 (`127.0.0.1:5433`), l'instance PostgreSQL n'accepte que les connexions locales authentifiées provenant du service Prisma ORM du Backend, rendant la base de données totalement invisible depuis le réseau public ou le Wi-Fi invité."
    ),

    makeTable(
      ['Composant / Noeud', 'Adresse IP / Hôte logique', 'Port TCP / Protocole', 'Rôle et règles de filtrage / Sécurité'],
      [
        ['Passerelle / Proxy Inverse', '192.168.1.1 / Domaine Public', 'TCP 80 / 443 (HTTP/HTTPS)', 'Terminaison TLS/SSL, routage du trafic web vers le Frontend et `/api/v1` vers le Backend.'],
        ['Serveur Frontend (Vite / Web)', '127.0.0.1 / 192.168.1.10', 'TCP 5173 (Dev) / 80 (Prod)', 'Distribution des ressources statiques compilées (bundle React, CSS, assets graphiques).'],
        ['Serveur API Backend (Node/Express)', '127.0.0.1 / 192.168.1.10', 'TCP 4000 (HTTP/REST JSON)', 'Exécution de la logique métier, vérification des cookies `HttpOnly`, pare-feu applicatif Zod.'],
        ['Serveur SGBD PostgreSQL', '127.0.0.1 (Loopback isolé)', 'TCP 5433 (Protocole PG)', 'Stockage relationnel des 14 tables métiers ; accès restreint exclusivement au processus Backend.'],
        ['Passerelles MarTech externes', 'smtp.* / meet.jit.si / api.whatsapp.com', 'TCP 465/587 (SMTPS) & 443', 'Flux sortants pour notifications e-mail, salles de visioconférence et passerelle WhatsApp.'],
      ],
      [24, 24, 20, 32]
    ),
    tableCaption("Tableau 7 : Topologie logique, plan d'adressage IP et matrice des flux réseaux de la plateforme IML Digit."),
    ...insertFigure(
      'fig_3_1_architecture_3tiers_ip.png',
      'Figure III.1',
      "Architecture logicielle 3-Tiers découplée et Topologie IP / Ports de la solution IML Digit."
    ),

    subSubHeading('B. Modélisation organisationnelle : Funnel d’acquisition et Circuit d’accompagnement'),
    p(
      "Sous l'angle du Marketing Digital et de l'ingénierie d'incubation (Funnel Marketing & Opérationnel), la plateforme modélise le parcours du porteur de projet comme un entonnoir de conversion et de maturation structuré en cinq (5) stades successifs :"
    ),
    bullet(
      'Stade 1 — Acquisition & Sensibilisation (Visiteur Public)',
      "Le porteur de projet découvre les programmes de l'IML sur la page d'accueil institutionnelle (`LandingPage`), consulte l'offre d'accompagnement et les indicateurs d'impact réalistes de l'incubateur (+60 entreprises accompagnées, 70 % de pérennité à 2 ans, 12 coachs et mentors actifs)."
    ),
    bullet(
      'Stade 2 — Conversion Candidat (Lead Qualifié)',
      "Le visiteur remplit le tunnel de candidature en ligne (`/candidater`) et joint ses documents (CV, présentation du projet). Le système lui attribue instantanément son code de suivi unique (`IML-2026-XXXX`) et notifie l'équipe de coordination."
    ),
    bullet(
      'Stade 3 — Instruction & Diagnostic d’Admission (Prospect Évalué)',
      "L'Agent IML ou la Direction examine le dossier, consulte les pièces dans la visionneuse intégrée et évalue le potentiel du projet. Le candidat suit l'évolution de son statut (`SOUMISE` -> `EN_EXAMEN` -> `ACCEPTEE`) depuis le portail de suivi."
    ),
    bullet(
      'Stade 4 — Incubation Active & Progression sur les 4 Jalons (Bénéficiaire Actif)',
      "Dès son admission, le dossier est converti en fiche Bénéficiaire. La Direction ou le chargé de dossier lui affecte un Chargé de suivi et un Coach référent (avec transmission automatique du briefing par e-mail et WhatsApp). Le bénéficiaire progresse à travers les 4 jalons officiels : (1) Diagnostic & Cadrage, (2) Modèle Économique, (3) Gestion & Comptabilité, et (4) Accès au Marché, rythmés par des séances planifiées et des comptes-rendus."
    ),
    bullet(
      'Stade 5 — Diplomation & Réseau Alumni (Ambassadeur Certifié)',
      "Une fois les 4 jalons validés à 100 %, l'incubateur délivre un certificat numérique officiel doté d'un QR Code de vérification publique et intègre l'entreprise dans l'annuaire des lauréats."
    ),
    ...insertFigure(
      'fig_3_2_funnel_et_4_jalons.png',
      'Figure III.2',
      "Modélisation du Funnel d'Acquisition (5 stades) et du Circuit d'Accompagnement en 4 Jalons de l'IML."
    ),

    subSubHeading('C. Modélisation de la base de données relationnelle (Schéma Prisma)'),
    p(
      "Le modèle conceptuel et physique des données a été implémenté dans Prisma ORM autour d'entités relationnelles normalisées garantissant l'unicité et la traçabilité des informations :"
    ),

    makeTable(
      ['Entité / Table Prisma', 'Clé primaire & Index', 'Relations principales', 'Rôle fonctionnel dans le système'],
      [
        ['User & Role', 'id (UUID), email (Unique)', '1-N avec Session, Assignment, AuditLog', 'Gestion des utilisateurs internes (Admin, Direction, Agent, Coach) et des comptes portail bénéficiaires.'],
        ['Application', 'id (UUID), code (Unique)', 'Liée au secteur et aux pièces jointes', 'Stockage des candidatures soumises en ligne, statut d’instruction et grille d’évaluation.'],
        ['Beneficiary', 'id (UUID), fileSeq (Auto)', '1-N avec Project, Document, Appointment, Assignment', 'Dossier maître de l’entrepreneur incubé, rattaché à un Agent référent (`assignedAgentId`).'],
        ['Project & Sector', 'id (UUID)', 'N-1 avec Beneficiary et Sector', 'Caractéristiques du projet (stade : Idée à Maturité, secteur d’activité, statut juridique, besoins).'],
        ['Pathway & PathwayStep', 'id (UUID)', '1-1 avec Beneficiary, 1-N avec Steps', 'Parcours d’accompagnement en 4 jalons séquentiels avec calcul temps réel du taux d’avancement (%).'],
        ['Appointment & FollowUpNote', 'id (UUID), datetime', 'N-1 avec Beneficiary et User (Coach)', 'Séances de coaching planifiées (présentiel ou lien Jitsi Meet) et comptes-rendus détaillés du mentor.'],
        ['Document', 'id (UUID)', 'N-1 avec Beneficiary et User', 'Métadonnées de la GED (titre, catégorie, chemin disque, taille, statut de validation : En attente / Validé).'],
        ['RoomBooking & Certificate', 'id (UUID), reference', 'Liens avec salles et bénéficiaires', 'Demandes de réservation des salles de l’IML et certificats de fin de parcours vérifiables par QR Code.'],
        ['AuditLog', 'id (UUID), createdAt', 'N-1 avec User', 'Journal de sécurité immuable traçant chaque création, modification ou affectation avec adresse IP.'],
      ],
      [22, 20, 24, 34]
    ),
    tableCaption("Tableau 8 : Dictionnaire des principales entités relationnelles du schéma de base de données (schema.prisma)."),
    ...insertFigure(
      'fig_3_3_modele_donnees_prisma.png',
      'Figure III.3',
      "Modèle Conceptuel et Relationnel des Données (Schéma Entité-Association Prisma ORM sous PostgreSQL)."
    ),

    // 2.2
    subSectionHeading("2.2. Environnement de test et de simulation (Lab / Staging)"),
    p(
      "Avant tout déploiement en utilisation réelle, nous avons mis en place un environnement de laboratoire et de pré-production (Lab / Staging) reproduisant fidèlement les conditions d'exploitation de l'Incubateur Multisectoriel de Libreville. Cet environnement a permis d'éprouver la robustesse de l'architecture sans risquer d'altérer les opérations courantes."
    ),
    bullet(
      '1. Configuration matérielle et logicielle du banc d’essai',
      "Le banc d'essai a été déployé sur une station de travail sous Windows 11 Professionnel (Processeur multi-cœurs, 16 Go de RAM, SSD NVMe), équipée de Node.js v20, de PostgreSQL (instance dédiée sur le port 5433) et d'un orchestrateur PowerShell (`start-dev.ps1`) permettant de lancer et de superviser simultanément les trois démons (Base de données, Serveur API sur le port 4000 et Serveur Frontend Vite sur le port 5173)."
    ),
    bullet(
      '2. Peuplement automatisé par jeu d’essai réaliste (Database Seeding)',
      "Grâce au script d'amorçage `prisma/seed.ts`, l'environnement de staging est initialisé avec les six (6) rôles RBAC officiels, les huit (8) secteurs d'activité prioritaires au Gabon (Agriculture & Agroalimentaire, Numérique & Tech, Commerce & Distribution, Services aux entreprises, Artisanat, BTP, Santé, Éducation), les modèles de parcours d'incubation et des comptes utilisateurs de test représentatifs de chaque profil (Direction Générale, Chargés de projets comme M. Marcelin NGOMO ONDO, Assistante Administrative Mme Ketsia MAGANGA ZOME, Coachs référents comme Mme Marcella BIYOGHE et porteurs de projets)."
    ),
    bullet(
      '3. Bac à sable de simulation des communications (Mode Simulation MarTech)',
      "Afin de tester intensivement les envois de convocations, les briefings d'affectation aux coachs et les décisions de réservation de salles sans saturer de boîtes mail réelles durant le développement, le service `email.service.ts` intègre un intercepteur intelligent. Lorsque les identifiants SMTP de production ne sont pas activés, le serveur bascule automatiquement en mode `[SIMULATION EMAIL]`, formatant et journalisant l'intégralité des en-têtes, destinataires, horaires et liens de visioconférence Jitsi Meet directement dans la console d'audit du serveur."
    ),
    p(
      "Ce troisième chapitre a permis de justifier nos choix technologiques et de bâtir une architecture logicielle et réseau solide, modélisée autour des processus réels de l'IML et validée sur un banc d'essai complet. Le chapitre suivant présente la mise en œuvre opérationnelle, la résolution des incidents techniques et la mesure des performances obtenues."
    ),

    // =========================================================================
    // CHAPITRE IV : DÉPLOIEMENT, CONFIGURATION ET MESURE DES RÉSULTATS
    // =========================================================================
    ...chapterHeading('CHAPITRE IV', 'DÉPLOIEMENT, CONFIGURATION ET MESURE DES RÉSULTATS', true),
    p(
      "Le passage de la conception théorique à une plateforme pleinement opérationnelle constitue l'étape décisive de notre projet de fin de cycle. Ce quatrième et dernier chapitre expose, dans une première section, le protocole de déploiement et de configuration mis en œuvre ainsi que le journal technique des incidents réels rencontrés et corrigés au cours de l'intégration. Dans une seconde section, il présente la campagne de tests de recette fonctionnelle et l'analyse quantitative des résultats à travers les indicateurs clés de performance (KPIs) et les engagements de niveau de service (SLAs)."
    ),

    // SECTION 1
    sectionHeading("Section 1 : Procédure de mise en œuvre et d'exécution"),
    p(
      "La mise en œuvre opérationnelle de la plateforme « IML Digit » suit une procédure structurée en séquences reproductibles, garantissant une installation fiable et sécurisée des différents composants."
    ),

    // 1.1
    subSectionHeading('1.1. Étapes de configuration et de mise en production'),
    p(
      "Le déploiement complet de la solution s'effectue en cinq (5) étapes techniques ordonnées :"
    ),
    bullet(
      'Étape 1 : Configuration des variables d’environnement et des secrets (.env)',
      "La sécurité de l'application repose sur l'externalisation complète des paramètres sensibles dans le fichier `.env` du serveur Backend : chaîne de connexion PostgreSQL (`DATABASE_URL=\"postgresql://postgres:postgres@localhost:5433/iml_digital\"`), port d'écoute (`PORT=4000`), origines CORS autorisées (`CORS_ORIGIN=http://localhost:5173`), durée de vie des sessions et paramètres SMTP (`DIRECTION_EMAIL`, `SMTP_HOST`, `SMTP_USER`)."
    ),
    bullet(
      'Étape 2 : Provisionnement et migration du schéma PostgreSQL',
      "Le moteur de base de données est démarré sur le port 5433, puis les commandes `npx prisma generate` et `npx prisma migrate deploy` (ou `db push`) sont exécutées. Cette opération crée les tables relationnelles, les index d'unicité et les contraintes d'intégrité référentielle, avant l'exécution du script `npx prisma db seed` qui injecte les référentiels métiers de l'IML."
    ),
    bullet(
      'Étape 3 : Configuration du serveur API Express, de la GED et du planificateur Cron',
      "Au démarrage (`src/server.ts`), le serveur Backend initialise le stockage documentaire (`uploads/`), monte les middlewares de sécurité (analyseur de cookies, vérification de session `requireAuth`, contrôleur de permissions `requirePermission`), active le convertisseur Mammoth avec cache mémoire pour la GED et démarre la tâche planifiée (`node-cron`) configurée pour s'exécuter automatiquement chaque matin à 08h00 afin d'envoyer les rappels de rendez-vous."
    ),
    bullet(
      'Étape 4 : Vérification du typage et compilation du Frontend React',
      "Du côté client (`frontend/`), la commande `npx tsc -b` vérifie l'absence totale d'erreurs de typage TypeScript sur l'ensemble des composants et pages, puis `vite build` génère un bundle de production minifié et optimisé. En environnement local ou intranet, le proxy Vite redirige de manière transparente tous les appels `/api/v1/*` vers le port 4000."
    ),
    bullet(
      'Étape 5 : Orchestration automatisée du démarrage (Script start-dev.ps1)',
      "Pour simplifier l'exploitation quotidienne par l'administrateur de l'IML, nous avons conçu le script PowerShell `start-dev.ps1` et le script d'arrêt `stop-dev.bat`. Ceux-ci démarrent séquentiellement l'instance PostgreSQL, vérifient la disponibilité des ports TCP, lancent l'API Backend et l'interface Frontend, et assurent un arrêt propre libérant l'ensemble des ressources système."
    ),

    // 1.2
    subSectionHeading('1.2. Incidents rencontrés et ajustements techniques'),
    p(
      "Tout projet d'ingénierie logicielle d'envergure est confronté, lors des phases d'intégration et de test en conditions réelles avec les utilisateurs, à des anomalies techniques ou ergonomiques. La rigueur de notre démarche a consisté à diagnostiquer la cause racine (Root Cause Analysis) de chaque incident pour y apporter un correctif pérenne :"
    ),
    bullet(
      'Incident 1 : Lenteur d’ouverture et de prévisualisation des fichiers Word (.docx) dans la GED',
      "Constat : Lorsqu'un agent ou un membre de la Direction cliquait sur un document `.docx` volumineux (ex. Organigramme ou Statuts juridiques de 1,4 Mo) dans la modale du dossier bénéficiaire, la conversion HTML via Mammoth était recalculée à chaque clic, provoquant un délai d'attente de plusieurs secondes. Résolution : Nous avons implémenté un double mécanisme de mise en cache en mémoire vive : côté Backend (`docxPreviewCache` dans `documents.routes.ts` indexé par l'identifiant du document et sa date de modification `mtimeMs`) et côté Frontend (`previewCacheRef` dans `BeneficiaryDossierModal.tsx`). Résultat : L'affichage d'un document déjà consulté est désormais instantané (< 10 ms)."
    ),
    bullet(
      'Incident 2 : Erreur lors de la mise à jour de l’affectation d’un dossier par le profil Direction (Erreur 403 INTERDIT)',
      "Constat : Lorsque la Direction utilisait la modale « Affectation du Dossier & du Coach » depuis le tableau de bord pour attribuer un chargé de dossier et un coach référent à un bénéficiaire, l'enregistrement échouait avec le message « Erreur lors de la mise à jour de l'affectation ». Diagnostic : La route `PATCH /api/v1/beneficiaries/:id` exigeait la permission `beneficiaries:write` qui n'était pas accordée au rôle `DIRECTION` dans `permissions.ts`, et comportait une restriction bloquant les modifications par la Direction. Résolution : Nous avons enrichi la matrice RBAC du rôle `DIRECTION` avec les permissions `beneficiaries:write`, `pathways:manage` et `training:manage`, levé le blocage sur les routes d'affectation, et ajouté dans `beneficiaries.service.ts` une vérification d'intégrité (`assertReferences`) validant l'existence et le statut actif du coach sélectionné."
    ),
    bullet(
      'Incident 3 : Rejet de validation Zod sur les champs d’affectation vides et robustesse de l’envoi d’e-mail',
      "Constat : Dans le formulaire d'affectation, lorsqu'un sélecteur restait sur sa valeur par défaut (chaîne vide `\"\"`), le schéma de validation `updateBeneficiarySchema` (`uuid.nullable()`) pouvait rejeter la requête. De plus, un échec du service d'envoi d'e-mail ne devait pas annuler l'affectation en base. Résolution : Dans `DashboardPage.tsx`, nous avons normalisé le payload pour convertir systématiquement toute chaîne vide en `null`, isolé l'appel `/notify-coach` dans un bloc `try/catch` indépendant et affiché le message d'erreur exact renvoyé par l'API."
    ),
    bullet(
      'Incident 4 : Interruption inopinée du processus PostgreSQL (Erreur Prisma P1001 sur localhost:5433)',
      "Constat : Lors de tests intensifs, une coupure du démon de base de données sur le port 5433 a provoqué des erreurs `PrismaClientKnownRequestError (P1001: Can't reach database server at localhost:5433)`. Résolution : Nous avons mis en place une procédure de vérification réseau (`Test-NetConnection -Port 5433`) et renforcé l'isolation du démon de base de données pour garantir sa disponibilité continue avant le démarrage de l'API."
    ),
    bullet(
      'Incident 5 : Surcharge visuelle sur certaines interfaces (Tableau des rendez-vous, GED, Footer public et Annuaire)',
      "Constat : Lors des revues d'ergonomie, certaines vues présentaient des éléments redondants ou trop encombrants (liens bruts Jitsi Meet `[https://meet.jit.si/...]` affichés dans le tableau des séances, bordures verticales trop lourdes, boutons superflus dans la modale GED, bloc newsletter volumineux dans le pied de page public, ou onglet secondaire inutile dans l'annuaire des contacts). Résolution : Nous avons épuré la modale GED, remplacé les URL brutes par l'intitulé métier « Entretien d'évaluation & cadrage », allégé les cellules du tableau (`py-2.5 px-3`), compacté le pied de page public de 40 % et dédié la page `/contacts` exclusivement à l'Annuaire & Répertoire d'acteurs."
    ),

    makeTable(
      ['Réf.', 'Composant impacté', 'Anomalie / Incident identifié', 'Action corrective implémentée', 'Statut'],
      [
        ['INC-01', 'Module GED (Backend & Frontend)', 'Temps de rendu élevé à chaque ouverture de fichier Word (.docx)', 'Double cache mémoire `docxPreviewCache` (serveur) et `previewCacheRef` (client)', 'Résolu ✓'],
        ['INC-02', 'RBAC & Affectation (`permissions.ts`)', 'Échec 403 lors de l’affectation d’un coach par le rôle DIRECTION', 'Octroi de `beneficiaries:write` à la Direction et validation `assertReferences` du coach', 'Résolu ✓'],
        ['INC-03', 'Formulaire d’affectation (`DashboardPage`)', 'Chaîne vide `""` incompatible avec `uuid.nullable()` et gestion d’erreur générique', 'Normalisation stricte en `null` et affichage précis des messages API', 'Résolu ✓'],
        ['INC-04', 'SGBD PostgreSQL (Port 5433)', 'Perte de connexion temporaire Prisma `P1001`', 'Supervision du port 5433 et redémarrage contrôlé du service de persistance', 'Résolu ✓'],
        ['INC-05', 'Interfaces UI (RDV, GED, Contacts, Footer)', 'Encombrement visuel (URLs Jitsi brutes, boutons redondants, onglet superflu)', 'Nettoyage des chaînes Jitsi, réduction des paddings et simplification de l’Annuaire', 'Résolu ✓'],
      ],
      [10, 22, 28, 28, 12]
    ),
    tableCaption("Tableau 9 : Registre des incidents techniques et ergonomiques rencontrés et solutions apportées."),
    ...insertFigure(
      'fig_4_1_deploiement_et_cache_ged.png',
      'Figure IV.1',
      "Procédure d'orchestration serveur (start-dev.ps1) et architecture du double cache mémoire GED (docxPreviewCache)."
    ),

    // SECTION 2
    sectionHeading('Section 2 : Tests, recette technique et mesure de performance (KPIs)'),
    p(
      "Afin de valider formellement la conformité de la plateforme « IML Digit » par rapport aux exigences du cahier des charges, nous avons conduit un protocole complet de recette technique et fonctionnelle, suivi d'une évaluation chiffrée des performances."
    ),

    // 2.1
    subSectionHeading('2.1. Protocole de validation et recette opérationnelle'),
    p(
      "Notre stratégie de validation s'est articulée autour de quatre (4) niveaux de tests complémentaires :"
    ),
    bullet(
      '1. Tests de compilation et d’intégrité statique',
      "Exécution systématique du compilateur TypeScript (`npx tsc -b`) sur l'ensemble du projet Frontend et vérification à chaud (`tsx watch`) côté Backend. Aucun fichier n'est validé s'il subsiste la moindre erreur de typage ou variable orpheline (code retour 0 exigé)."
    ),
    bullet(
      '2. Tests unitaires et fonctionnels des routes API',
      "Vérification de chaque point de terminaison REST (`/api/v1/applications`, `/api/v1/beneficiaries`, `/api/v1/pathways`, `/api/v1/appointments`, `/api/v1/documents`, `/api/v1/rooms`, `/api/v1/certificates`) avec des payloads valides et invalides afin de contrôler la robustesse des schémas Zod."
    ),
    bullet(
      '3. Tests de sécurité et de cloisonnement RBAC',
      "Vérification de l'étanchéité des droits d'accès entre les rôles : un Coach connecté ne voit que les bénéficiaires qui lui sont affectés ; un Bénéficiaire accède uniquement à l'état d'avancement de son propre dossier (circuit des 4 jalons, séances et documents) sans pouvoir altérer les paramètres d'administration."
    ),
    bullet(
      '4. Recette opérationnelle de bout en bout (User Acceptance Testing - UAT)',
      "Exécution de scénarios métiers complets simulant le cycle de vie réel d'un dossier au sein de l'IML. Les résultats de cette recette sont consignés dans la grille de validation ci-dessous :"
    ),

    makeTable(
      ['ID Test', 'Scénario fonctionnel testé', 'Résultat attendu', 'Résultat observé', 'Verdict'],
      [
        ['REC-01', 'Soumission d’une candidature publique avec pièces jointes et suivi par code', 'Création en base, génération du code `IML-2026-XXXX` et affichage temps réel sur `/suivi`', 'Code généré instantanément, statut et progression visibles sans erreur', 'CONFORME'],
        ['REC-02', 'Affectation d’un Chargé de dossier et d’un Coach depuis le Cockpit', 'Mise à jour de `assignedAgentId` et `Assignment`, envoi du briefing e-mail et lien WhatsApp', 'Affectation sauvegardée (HTTP 200), toast de confirmation et briefing transmis', 'CONFORME'],
        ['REC-03', 'Ouverture et prévisualisation d’un document Word (.docx) dans la GED', 'Rendu fidèle du document dans la visionneuse intégrée sans téléchargement externe obligatoire', 'Affichage immédiat du contenu formaté grâce au cache mémoire Mammoth', 'CONFORME'],
        ['REC-04', 'Planification d’une séance en visioconférence et rédaction du compte-rendu', 'Création du RDV avec salon Jitsi Meet, affichage épuré dans le tableau et ajout de note coach', 'Ligne de RDV compacte et lisible, compte-rendu consultable en 1 clic', 'CONFORME'],
        ['REC-05', 'Validation séquentielle des 4 jalons du parcours et suivi par le bénéficiaire', 'Incrémentation automatique du taux de progression (25% -> 50% -> 75% -> 100%)', 'Jauge et jalons mis à jour en temps réel côté Agent, Coach et Portail Bénéficiaire', 'CONFORME'],
        ['REC-06', 'Demande de réservation de salle et arbitrage (Confirmation / Refus)', 'Enregistrement avec référence `SAL-2026-XXXXX`, décision Direction et notification e-mail', 'Statut mis à jour dans le planning et notification générée automatiquement', 'CONFORME'],
        ['REC-07', 'Émission d’un certificat de fin de parcours et vérification par QR Code', 'Génération du certificat officiel et validation publique via l’URL du QR Code', 'Certificat authentifié avec succès sur la page de vérification publique', 'CONFORME'],
      ],
      [12, 28, 25, 23, 12]
    ),
    tableCaption("Tableau 10 : Cahier de recette fonctionnelle et résultats des tests de validation de la plateforme IML Digit."),
    ...insertFigure(
      'fig_4_2_capture_ged_dossier.png',
      'Figure IV.2',
      "Interface opérationnelle de l'Espace Documentaire Sécurisé (GED) avec prévisualisation directe d'un fichier Word (.docx)."
    ),
    ...insertFigure(
      'fig_4_4_capture_suivi_parcours.png',
      'Figure IV.3',
      "Interface de suivi longitudinal d'un bénéficiaire : Circuit des 4 jalons, planification des séances et comptes-rendus."
    ),

    // 2.2
    subSectionHeading('2.2. Analyse des résultats et tableaux de bord (SLAs / KPIs)'),
    p(
      "L'évaluation finale du projet repose sur deux catégories de métriques : d'une part, les indicateurs de niveau de service technique (SLAs - Service Level Agreements) qui mesurent la qualité intrinsèque du logiciel, et d'autre part, les indicateurs clés de performance métier (KPIs - Key Performance Indicators) qui quantifient les gains opérationnels apportés à l'Incubateur Multisectoriel de Libreville."
    ),
    subSubHeading('A. Respect des niveaux de service techniques (SLAs)'),
    p(
      "Les mesures effectuées sur la plateforme déployée démontrent le respect strict des objectifs de performance fixés dans le cahier des charges :"
    ),
    bullet('Temps de réponse moyen de l’API REST', "Mesuré entre 15 ms et 65 ms pour les requêtes de lecture et de filtrage multicritères sur PostgreSQL (cible SLA initiale : < 200 ms)."),
    bullet('Temps de prévisualisation documentaire GED (.docx)', "Réduit de ~1 800 ms (lors de la première conversion à froid) à moins de 12 ms lors des consultations suivantes grâce au cache serveur en mémoire vive."),
    bullet('Qualité du code et stabilité de compilation', "0 erreur et 0 avertissement lors de la vérification stricte TypeScript (`npx tsc -b`), garantissant l'absence de régressions."),
    bullet('Sécurité et traçabilité', "100 % des actions d'écriture (création de dossier, affectation de coach, modification de statut, décision sur une salle) sont horodatées et enregistrées dans la table `AuditLog`."),

    subSubHeading('B. Analyse comparative des KPIs opérationnels (Avant vs Après IML Digit)'),
    p(
      "Sur le plan organisationnel et métier, la mise en place de la plateforme « IML Digit » transforme profondément la productivité des équipes de l'incubateur et la qualité de l'expérience offerte aux entrepreneurs accompagnés, comme l'illustre le tableau comparatif ci-dessous :"
    ),

    makeTable(
      ['Indicateur de performance (KPI)', 'Situation initiale (Avant IML Digit)', 'Situation actuelle (Avec IML Digit)', 'Gain opérationnel mesuré'],
      [
        ['Délai d’enregistrement et d’immatriculation d’une candidature', '24 à 48 heures (saisie manuelle sur registre et tableur)', 'Instantané (< 3 secondes avec code `IML-AAAA-XXXX`)', 'Gain de temps de 99 % et zéro saisie manuelle'],
        ['Temps de recherche d’un dossier et de ses pièces justificatives', '15 à 20 minutes (fouille dans les dossiers locaux et e-mails)', '< 5 secondes (recherche unifiée + visionneuse GED intégrée)', 'Réduction de 98 % du temps d’accès à l’information'],
        ['Délai d’affectation d’un coach et transmission du briefing', '1 à 3 jours (appels et transfert manuel de fichiers)', '< 30 secondes (Modale d’affectation + E-mail auto + WhatsApp 1-clic)', 'Fluidification immédiate de la prise en charge'],
        ['Taux de traçabilité des séances de coaching et comptes-rendus', 'Partiel (~40 % des comptes-rendus archivés centralement)', '100 % des séances et comptes-rendus centralisés dans le dossier', 'Mémoire institutionnelle exhaustive et pérenne'],
        ['Conflits de réservation des salles de formation et réunion', 'Fréquents (2 à 3 doublons par mois sur registre papier)', '0 conflit (planning centralisé avec workflow de validation)', 'Élimination totale des chevauchements horaires'],
        ['Délai de production des statistiques et bilans pour la Direction', '2 à 3 jours de consolidation manuelle sous Excel', 'Temps réel (Cockpit Stratégique + export CSV/Excel en 1 clic)', 'Pilotage décisionnel instantané'],
      ],
      [26, 25, 25, 24]
    ),
    tableCaption("Tableau 11 : Synthèse des gains de performance opérationnelle (KPIs) avant et après le déploiement d'IML Digit."),
    ...insertFigure(
      'fig_4_3_kpis_avant_apres.png',
      'Figure IV.4',
      "Tableau de bord comparatif des indicateurs de performance opérationnelle (KPIs & SLAs) Avant / Après IML Digit."
    ),

    subSubHeading('C. Tableaux de bord décisionnels mis à disposition de l’IML'),
    p(
      "La plateforme met à la disposition des utilisateurs trois (3) vues de pilotage adaptées à leurs responsabilités :"
    ),
    bullet(
      '1. Le Cockpit Stratégique de la Direction Générale',
      "Il agrège en temps réel le nombre total de dossiers suivis, la répartition par stade de maturité (Idée, Prototype, Lancement, Croissance, Maturité) et par secteur d'activité, le taux de progression moyen sur les 4 jalons d'incubation, l'état des demandes de réservation d'espaces et le journal d'audit complet."
    ),
    bullet(
      '2. Le Guichet Opérationnel des Chargés de Projets (Agents IML)',
      "Il offre une vue d'action directe permettant d'instruire les nouvelles candidatures, d'affecter les référents et les coachs, de contrôler la conformité des documents déposés dans la GED et de convoquer les porteurs de projets."
    ),
    bullet(
      '3. Le Portail de Suivi des Bénéficiaires et l’Espace Coach',
      "Il permet à chaque entrepreneur de visualiser en toute autonomie sa progression sur les 4 jalons de son parcours, ses prochains rendez-vous d'accompagnement et les recommandations formulées par son coach référent."
    ),
    p(
      "En conclusion de ce quatrième chapitre, le déploiement méthodique de la plateforme « IML Digit », conjugué à la résolution rigoureuse des incidents techniques et à la validation de l'ensemble des scénarios de recette, démontre que la solution répond pleinement aux attentes de l'Incubateur Multisectoriel de Libreville. Les indicateurs de performance mesurés confirment un saut qualitatif et quantitatif majeur dans la digitalisation du suivi des porteurs de projets."
    ),

    // =========================================================================
    // RÉCAPITULATIF : TABLE DES FIGURES ET DES TABLEAUX INTÉGRÉS
    // =========================================================================
    ...chapterHeading('ANNEXE RÉCAPITULATIVE', 'TABLE DES FIGURES ET DES TABLEAUX', true),
    sectionHeading('1. Liste des Figures intégrées (Chapitres II, III et IV)'),
    makeTable(
      ['N° Figure', 'Intitulé de la Figure', 'Chapitre / Section'],
      [
        ['Figure II.1', "Cartographie fonctionnelle du processus manuel initial d'accompagnement et goulots d'étranglement à l'IML", 'Chapitre II — Section 1.1'],
        ['Figure II.2', "Topologie de l'infrastructure Réseau (RSN 192.168.1.0/24) et écosystème MTIC non intégré de l'existant", 'Chapitre II — Section 1.1'],
        ['Figure II.3', "Représentation synthétique de la Matrice diagnostique SWOT (Forces, Faiblesses, Opportunités, Menaces)", 'Chapitre II — Section 2.1'],
        ['Figure II.4', "Diagramme global de Cas d'Utilisation UML (Use Case) et Matrice des Rôles RBAC d'IML Digit", 'Chapitre II — Section 2.2'],
        ['Figure III.1', 'Architecture logicielle 3-Tiers découplée et Topologie IP / Ports de la solution IML Digit', 'Chapitre III — Section 2.1'],
        ['Figure III.2', "Modélisation du Funnel d'Acquisition (5 stades) et du Circuit d'Accompagnement en 4 Jalons de l'IML", 'Chapitre III — Section 2.1'],
        ['Figure III.3', 'Modèle Conceptuel et Relationnel des Données (Schéma Entité-Association Prisma ORM sous PostgreSQL)', 'Chapitre III — Section 2.1'],
        ['Figure IV.1', "Procédure d'orchestration serveur (start-dev.ps1) et architecture du double cache mémoire GED (docxPreviewCache)", 'Chapitre IV — Section 1.2'],
        ['Figure IV.2', "Capture opérationnelle : Espace Documentaire Sécurisé (GED) avec prévisualisation directe d'un fichier Word (.docx)", 'Chapitre IV — Section 2.1'],
        ['Figure IV.3', "Capture opérationnelle : Interface de suivi longitudinal d'un bénéficiaire (Circuit des 4 jalons et séances)", 'Chapitre IV — Section 2.1'],
        ['Figure IV.4', 'Tableau de bord comparatif des indicateurs de performance opérationnelle (KPIs & SLAs) Avant / Après IML Digit', 'Chapitre IV — Section 2.2'],
      ],
      [18, 56, 26]
    ),
    sectionHeading('2. Liste des Tableaux intégrés (Chapitres II, III et IV)'),
    makeTable(
      ['N° Tableau', 'Intitulé du Tableau', 'Chapitre / Section'],
      [
        ['Tableau 1', "Cartographie synthétique de l'existant fonctionnel et technique (RSN / MTIC) à l'IML", 'Chapitre II — Section 1.1'],
        ['Tableau 2', "Synthèse de la campagne d'investigation et de collecte des besoins auprès des parties prenantes", 'Chapitre II — Section 1.2'],
        ['Tableau 3', "Matrice diagnostique SWOT du système d'information et d'accompagnement de l'IML", 'Chapitre II — Section 2.1'],
        ['Tableau 4', 'Spécifications fonctionnelles détaillées des huit modules de la plateforme IML Digit', 'Chapitre II — Section 2.2'],
        ['Tableau 5', 'Analyse multicritères des solutions du marché (Propriétaire vs Open Source vs IML Digit)', 'Chapitre III — Section 1.1'],
        ['Tableau 6', 'Empilement technologique (Stack Full-Stack & MarTech) retenu pour la plateforme IML Digit', 'Chapitre III — Section 1.2'],
        ['Tableau 7', "Topologie logique, plan d'adressage IP et matrice des flux réseaux de la plateforme IML Digit", 'Chapitre III — Section 2.1'],
        ['Tableau 8', 'Dictionnaire des principales entités relationnelles du schéma de base de données (schema.prisma)', 'Chapitre III — Section 2.1'],
        ['Tableau 9', 'Registre des incidents techniques et ergonomiques rencontrés et solutions apportées', 'Chapitre IV — Section 1.2'],
        ['Tableau 10', 'Cahier de recette fonctionnelle et résultats des tests de validation de la plateforme IML Digit', 'Chapitre IV — Section 2.1'],
        ['Tableau 11', "Synthèse des gains de performance opérationnelle (KPIs) avant et après le déploiement d'IML Digit", 'Chapitre IV — Section 2.2'],
      ],
      [18, 56, 26]
    )
  );

  const doc = new Document({
    creator: 'Stagiaire INPTIC - Projet IML Digit',
    title: "Chapitres II, III et IV - Rapport de Stage IML (Outil numérique de suivi et d'accompagnement des porteurs de projets)",
    description: "Diagnostic de l'existant, Cahier des charges, Étude préalable, Conception, Déploiement et Mesure des résultats - Cas de l'IML",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1417, // 2.5 cm
              right: 1417,
              bottom: 1417,
              left: 1417,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: {
                  bottom: { color: BORDER_COLOR, space: 4, style: BorderStyle.SINGLE, size: 6 },
                },
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: "Mise en place d'un outil numérique de suivi et d'accompagnement des porteurs de projets : Cas de l'IML",
                    italics: true,
                    size: 18, // 9pt
                    font: 'Times New Roman',
                    color: SLATE_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: { color: BORDER_COLOR, space: 4, style: BorderStyle.SINGLE, size: 6 },
                },
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: 'Rapport de Stage — Incubateur Multisectoriel de Libreville (IML)   |   Page ',
                    size: 18,
                    font: 'Times New Roman',
                    color: SLATE_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    bold: true,
                    size: 18,
                    font: 'Times New Roman',
                    color: NAVY,
                  }),
                  new TextRun({
                    text: ' sur ',
                    size: 18,
                    font: 'Times New Roman',
                    color: SLATE_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    bold: true,
                    size: 18,
                    font: 'Times New Roman',
                    color: NAVY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const outputPath = path.join(__dirname, 'Chapitres_II_III_IV_Rapport_Stage_IML.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log('Document Word généré avec succès :', outputPath);
}

generateReport().catch((err) => {
  console.error('Erreur lors de la génération du document Word :', err);
  process.exit(1);
});
