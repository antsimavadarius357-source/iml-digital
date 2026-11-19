const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  HeadingLevel,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} = require('docx');

// Dimensions et marges (en twips : 1 cm ≈ 567 twips)
const MARGIN_TOP = 1418;    // 2.5 cm
const MARGIN_BOTTOM = 1418; // 2.5 cm
const MARGIN_RIGHT = 1418;  // 2.5 cm
const MARGIN_LEFT = 1701;   // 3.0 cm (reliure)

const FONT_BODY = 'Times New Roman';
const FONT_CODE = 'Consolas';

const COLOR_PRIMARY = '101F2E';   // Bleu sombre institutionnel
const COLOR_SECONDARY = '23C3B1'; // Turquoise IML
const COLOR_ACCENT = 'F06553';    // Terracotta IML
const COLOR_TEXT = '1E293B';      // Slate 800
const COLOR_MUTED = '64748B';     // Slate 500
const COLOR_BG_LIGHT = 'F8FAFC';  // Fond très clair
const COLOR_BORDER = 'CBD5E1';    // Bordure tableau gris clair

// Helper pour paragraphe de corps de texte (sans aucun caractère \n dans TextRun)
function pBody(text, options = {}) {
  // Si le texte contient des retours à la ligne, on le découpe en plusieurs paragraphes
  if (typeof text === 'string' && text.includes('\n')) {
    const lines = text.split('\n');
    return lines.map((line) => pBody(line, options));
  }

  const cleanText = typeof text === 'string' ? text.trim() : '';
  const runs = [
    new TextRun({
      text: cleanText,
      font: FONT_BODY,
      size: options.size || 24, // 12pt par défaut
      color: options.color || COLOR_TEXT,
      bold: options.bold || false,
      italics: options.italics || false,
    }),
  ];

  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: {
      line: 360, // 1.5 interligne
      after: options.after !== undefined ? options.after : 120, // 6pt après
      before: options.before || 0,
    },
    indent: options.firstLine ? { firstLine: 567 } : undefined, // 1 cm
    children: runs,
  });
}

// Titre de PARTIE (18pt, Gras, Majuscules, Centré, Couleur Sombre, Avant 12pt, Après 18pt)
function pPartie(title) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 360, line: 360 },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: FONT_BODY,
        size: 36, // 18pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

// Titre de CHAPITRE (16pt, Gras, Majuscules, Aligné à gauche, Avant 12pt, Après 12pt)
function pChapitre(title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 240, line: 360 },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: FONT_BODY,
        size: 32, // 16pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

// Titre de SECTION (14pt, Gras, Casse de phrase, Aligné à gauche, Avant 6pt, Après 6pt)
function pSection(title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 120, line: 360 },
    children: [
      new TextRun({
        text: title,
        font: FONT_BODY,
        size: 28, // 14pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

// Titre de SOUS-SECTION (12pt, Gras / Italique, Aligné à gauche, Avant 6pt, Après 4pt)
function pSubSection(title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 120, after: 80, line: 360 },
    children: [
      new TextRun({
        text: title,
        font: FONT_BODY,
        size: 24, // 12pt
        bold: true,
        italics: true,
        color: COLOR_TEXT,
      }),
    ],
  });
}

// Légende de tableau (AU-DESSUS du tableau, Centré, Gras, 11pt)
function pTableLegend(id, title) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: `Tableau ${id} : `,
        font: FONT_BODY,
        size: 22, // 11pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
      new TextRun({
        text: title,
        font: FONT_BODY,
        size: 22,
        bold: true,
        italics: true,
        color: COLOR_TEXT,
      }),
    ],
  });
}

// Légende de figure (SOUS la figure, Centré, Italique, 10.5pt)
function pFigureLegend(id, title) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 200 },
    children: [
      new TextRun({
        text: `Figure ${id} : `,
        font: FONT_BODY,
        size: 21,
        bold: true,
        color: COLOR_PRIMARY,
      }),
      new TextRun({
        text: title,
        font: FONT_BODY,
        size: 21,
        italics: true,
        color: COLOR_MUTED,
      }),
    ],
  });
}

// Encadré technique illustrant un schéma ou diagramme
function pFigureBox(diagramTitle, diagramDescription) {
  const descParagraphs = diagramDescription.split('\n').map((line) => {
    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: 280, before: 30, after: 30 },
      children: [
        new TextRun({
          text: line.trim(),
          font: FONT_BODY,
          size: 20,
          color: COLOR_TEXT,
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_SECONDARY },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { line: 260, before: 40, after: 80 },
                children: [
                  new TextRun({
                    text: `[ REPRÉSENTATION TECHNIQUE : ${diagramTitle.toUpperCase()} ]`,
                    font: FONT_BODY,
                    size: 20,
                    bold: true,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
              ...descParagraphs,
            ],
          }),
        ],
      }),
    ],
  });
}

// Bloc de code technique sans \n dans les TextRun
function pCodeBlock(codeText) {
  const rows = codeText.split('\n').map((line) => {
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 240, before: 10, after: 10 },
      children: [
        new TextRun({
          text: line.length > 0 ? line : ' ',
          font: FONT_CODE,
          size: 19, // 9.5pt
          color: '0F172A',
        }),
      ],
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 8, color: COLOR_PRIMARY },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: rows,
          }),
        ],
      }),
    ],
  });
}

// Tableau institutionnel (Bleu foncé en-tête, zébré, texte propre sans retour chariot malformé)
function buildTable(headers, data, colWidths = []) {
  const headerRow = new TableRow({
    isHeader: true,
    children: headers.map((h, i) => {
      return new TableCell({
        width: colWidths[i] ? { size: colWidths[i], type: WidthType.DXA } : undefined,
        shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: COLOR_SECONDARY },
          left: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
          right: { style: BorderStyle.SINGLE, size: 4, color: '334155' },
        },
        margins: { top: 120, bottom: 120, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 260, before: 20, after: 20 },
            children: [
              new TextRun({
                text: h,
                font: FONT_BODY,
                size: 20, // 10pt
                bold: true,
                color: 'FFFFFF',
              }),
            ],
          }),
        ],
      });
    }),
  });

  const bodyRows = data.map((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    return new TableRow({
      children: row.map((cellText, cIdx) => {
        // Découpe propre si plusieurs lignes dans une cellule
        const cellLines = String(cellText).split('\n');
        const paragraphs = cellLines.map((line) => {
          return new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { line: 260, before: 20, after: 20 },
            children: [
              new TextRun({
                text: line.trim(),
                font: FONT_BODY,
                size: 20, // 10pt
                color: COLOR_TEXT,
              }),
            ],
          });
        });

        return new TableCell({
          width: colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.DXA } : undefined,
          shading: { type: ShadingType.CLEAR, fill: isEven ? 'FFFFFF' : COLOR_BG_LIGHT },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
          },
          margins: { top: 90, bottom: 90, left: 110, right: 110 },
          children: paragraphs,
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [headerRow, ...bodyRows],
  });
}

async function generateReport() {
  console.log('Génération robuste du document Word INPTIC...');

  // =========================================================================
  // 1. PAGE DE COUVERTURE (Normée INPTIC, aucun \n dans TextRun)
  // =========================================================================
  const coverElements = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: 'RÉPUBLIQUE GABONAISE',
          font: FONT_BODY,
          size: 24,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [
        new TextRun({
          text: 'Union — Travail — Justice',
          font: FONT_BODY,
          size: 20,
          italics: true,
          color: COLOR_MUTED,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 40 },
      children: [
        new TextRun({
          text: 'MINISTÈRE DE LA COMMUNICATION ET DE L’ÉCONOMIE NUMÉRIQUE',
          font: FONT_BODY,
          size: 22,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 120 },
      children: [
        new TextRun({
          text: 'INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L’INFORMATION ET DE LA COMMUNICATION (INPTIC)',
          font: FONT_BODY,
          size: 24,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 20 },
      children: [
        new TextRun({
          text: 'DÉPARTEMENT GÉNIE LOGICIEL & SYSTÈMES NUMÉRIQUES',
          font: FONT_BODY,
          size: 21,
          bold: true,
          color: COLOR_SECONDARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 180 },
      children: [
        new TextRun({
          text: 'FILIÈRE : RÉSEAUX ET SYSTÈMES NUMÉRIQUES (RSN) / MÉTIERS DES TIC (MTIC)',
          font: FONT_BODY,
          size: 21,
          bold: true,
          color: COLOR_SECONDARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 40 },
      children: [
        new TextRun({
          text: 'RAPPORT DE STAGE DE FIN DE CYCLE',
          font: FONT_BODY,
          size: 26,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [
        new TextRun({
          text: 'En vue de l’obtention de la Licence Professionnelle en Technologies Numériques',
          font: FONT_BODY,
          size: 22,
          italics: true,
          color: COLOR_MUTED,
        }),
      ],
    }),
    // Cadre du Titre du Rapport
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_PRIMARY },
                left: { style: BorderStyle.SINGLE, size: 14, color: COLOR_SECONDARY },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              },
              margins: { top: 220, bottom: 220, left: 240, right: 240 },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 60 },
                  children: [
                    new TextRun({
                      text: 'THÈME DU RAPPORT DE STAGE :',
                      font: FONT_BODY,
                      size: 22,
                      bold: true,
                      color: COLOR_SECONDARY,
                    }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 60 },
                  children: [
                    new TextRun({
                      text: '« MISE EN PLACE D’UN OUTIL NUMÉRIQUE DE SUIVI ET D’ACCOMPAGNEMENT DES PORTEURS DE PROJETS À L’INCUBATEUR MULTISECTORIEL DE LIBREVILLE (IML DIGIT) »',
                      font: FONT_BODY,
                      size: 28, // 14pt
                      bold: true,
                      color: COLOR_PRIMARY,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 260, after: 120 },
      children: [
        new TextRun({
          text: 'Période de stage : ',
          font: FONT_BODY,
          size: 22,
          bold: true,
          color: COLOR_PRIMARY,
        }),
        new TextRun({
          text: 'Du 1er Août 2026 au 30 Octobre 2026',
          font: FONT_BODY,
          size: 22,
          color: COLOR_TEXT,
        }),
      ],
    }),
    // Encadrement et Candidat
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'Présenté et soutenu par :', font: FONT_BODY, size: 22, bold: true, color: COLOR_PRIMARY }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'L’Étudiant Stagiaire', font: FONT_BODY, size: 22, bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'Promotion 2025 - 2026 (INPTIC)', font: FONT_BODY, size: 20, color: COLOR_MUTED }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'Sous l’encadrement de :', font: FONT_BODY, size: 22, bold: true, color: COLOR_PRIMARY }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'Tuteur Professionnel (IML) : ', font: FONT_BODY, size: 20, bold: true }),
                    new TextRun({ text: 'Responsable SI', font: FONT_BODY, size: 20 }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 20, after: 20 },
                  children: [
                    new TextRun({ text: 'Tuteur Pédagogique (INPTIC) : ', font: FONT_BODY, size: 20, bold: true }),
                    new TextRun({ text: 'Enseignant-Chercheur', font: FONT_BODY, size: 20 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 280, after: 0 },
      children: [
        new TextRun({
          text: 'Année Académique : 2025 — 2026',
          font: FONT_BODY,
          size: 22,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // =========================================================================
  // 2. ÉLÉMENTS LIMINAIRES (Chiffres romains)
  // =========================================================================
  const prelimElements = [
    // --- DÉDICACES ---
    pPartie('DÉDICACES'),
    ...[
      'Je dédie ce travail universitaire et professionnel :',
      'À mes très chers parents, pour leurs sacrifices constants, leur soutien indéfectible, leurs prières et la confiance absolue qu’ils n’ont jamais cessé de m’accorder tout au long de mon cursus.',
      'À l’ensemble de ma famille, mes frères, sœurs et proches, pour leurs encouragements continus dans les moments d’effort comme d’accomplissement.',
      'À tous mes enseignants et formateurs de l’Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC), qui m’ont transmis la rigueur intellectuelle et l’éthique de l’ingénieur.',
      'À tous les jeunes entrepreneurs gabonais, qui œuvrent chaque jour avec passion et détermination pour diversifier l’économie nationale.',
    ].map((t, idx) => pBody(t, { firstLine: idx > 0, bold: idx === 0, after: 180 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- REMERCIEMENTS ---
    pPartie('REMERCIEMENTS'),
    ...[
      'L’aboutissement de ce stage et la rédaction de ce rapport n’auraient pu se concrétiser sans le concours bienveillant et la disponibilité de nombreuses personnes auxquelles je tiens à témoigner ma profonde gratitude.',
      'J’adresse mes remerciements les plus sincères à la Direction Générale de l’Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC), ainsi qu’à l’ensemble du corps professoral du département Génie Logiciel & Réseaux pour la haute qualité de la formation dispensée.',
      'Mes remerciements s’adressent tout particulièrement à mon encadrant pédagogique de l’INPTIC, pour sa rigueur intellectuelle, ses conseils avisés et sa disponibilité constante durant la phase d’élaboration de ce document.',
      'J’exprime ma vive reconnaissance à la Direction Générale de l’Incubateur Multisectoriel de Libreville (IML) pour m’avoir accueilli au sein de leur structure et m’avoir accordé la confiance nécessaire pour aborder ce projet névralgique de digitalisation.',
      'Je tiens à remercier chaleureusement mon maître de stage et tuteur professionnel à l’IML, qui m’a guidé au quotidien, partagé sa maîtrise des processus d’incubation et offert une autonomie technique formatrice.',
      'Enfin, mes remerciements vont à l’ensemble des agents d’accompagnement, des mentors et des experts-coachs de l’IML pour leur accueil fraternel, leurs retours d’expérience précieux et leur collaboration active lors de la phase de recette opérationnelle de la plateforme IML Digit.',
    ].map((t) => pBody(t, { firstLine: true, after: 160 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- RÉSUMÉ & ABSTRACT SUR LA MÊME PAGE (Norme INPTIC) ---
    pPartie('RÉSUMÉ / ABSTRACT'),
    pSection('RÉSUMÉ'),
    pBody(
      'L’Incubateur Multisectoriel de Libreville (IML) joue un rôle moteur dans l’écosystème entrepreneurial gabonais en accompagnant les porteurs d’idées, les start-ups et les PME vers la viabilité économique. Cependant, le processus traditionnel de suivi reposait sur des outils disparates (formulaires papier, classeurs physiques et feuilles de calcul non synchronisées), provoquant des retards d’instruction, des ruptures de traçabilité entre les séances de mentorat et un manque de visibilité stratégique en temps réel pour la direction générale. Ce stage de fin de cycle avait pour finalité la conception et le déploiement d’une plateforme web intégrée, baptisée « IML Digit », dédiée à la centralisation et à l’automatisation du cycle d’accompagnement. Développée selon une architecture Fullstack moderne et sécurisée (React, TypeScript, TailwindCSS, Node.js, Express, Prisma ORM et PostgreSQL), la solution intègre la gestion dématérialisée des candidatures, un diagnostic multidimensionnel 360°, un parcours d’incubation jalonné et un cockpit décisionnel en lecture seule pour la gouvernance. Les tests de recette ont validé une réduction de 75% des délais d’instruction et une traçabilité intégrale des interactions.',
      { firstLine: true, after: 100 }
    ),
    pBody(
      'Mots-clés : Incubation entrepreneuriale, Transformation numérique, Suivi-évaluation, Architecture Fullstack, IML Digit, PostgreSQL, Cockpit décisionnel.',
      { bold: true, italics: true, after: 180 }
    ),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: '— — — — — — — — — — — — — — — — — — — — — — — — —', font: FONT_BODY, color: COLOR_MUTED })],
    }),
    pSection('ABSTRACT'),
    pBody(
      'The Multisectoral Incubator of Libreville (IML) plays a pivotal role in the Gabonese entrepreneurial ecosystem by supporting innovators, startups, and established SMEs toward economic sustainability. Nevertheless, the traditional monitoring process was hindered by fragmented workflows, relying on paper dossiers, physical folders, and unsynchronized spreadsheets. This caused application backlogs, loss of mentorship tracking data, and an absence of real-time operational visibility for executive leadership. The objective of this capstone internship was to design and deploy an integrated web application, titled "IML Digit", centralizing the complete entrepreneurial accompaniment lifecycle. Leveraging a modern and robust Fullstack architecture (React, TypeScript, TailwindCSS, Node.js, Express, Prisma ORM, and PostgreSQL), the system automates online applications, conducts a 360° business diagnostic, monitors milestone-driven pathways, and provides an executive strategic dashboard with role-based access control. Deployment and user acceptance testing demonstrated a 75% decrease in application processing times and comprehensive traceability of coaching engagements.',
      { firstLine: true, after: 100 }
    ),
    pBody(
      'Keywords: Business Incubation, Digital Transformation, Progress Monitoring, Fullstack Architecture, IML Digit, PostgreSQL, Executive Dashboard.',
      { bold: true, italics: true, after: 200 }
    ),
    new Paragraph({ children: [new PageBreak()] }),

    // --- SOMMAIRE ---
    pPartie('SOMMAIRE'),
    ...[
      'DÉDICACES ............................................................................................................................................ i',
      'REMERCIEMENTS ............................................................................................................................... ii',
      'RÉSUMÉ / ABSTRACT ..................................................................................................................... iii',
      'LISTE DES TABLEAUX ....................................................................................................................... v',
      'LISTE DES FIGURES ........................................................................................................................... vi',
      'LISTE DES SIGLES ET ABRÉVIATIONS ..................................................................................... vii',
      ' ',
      'INTRODUCTION GÉNÉRALE ......................................................................................................... 1',
      ' ',
      'PREMIÈRE PARTIE : PRÉSENTATION DE LA STRUCTURE D’ACCUEIL ET ÉTAT DE L’EXISTANT ..... 4',
      '  CHAPITRE I : ORGANISATION ET ENVIRONNEMENT DU SERVICE D’ACCUEIL ................. 5',
      '    Section 1 : Présentation générale et activités de l’entreprise ........................................................ 5',
      '    Section 2 : Environnement opérationnel et cadre d’immersion .................................................... 9',
      '  CHAPITRE II : DIAGNOSTIC DE L’EXISTANT ET CAHIER DES CHARGES ............................. 12',
      '    Section 1 : Audit et analyse de l’existant ....................................................................................... 12',
      '    Section 2 : Critique de l’existant et formalisation du besoin ....................................................... 15',
      ' ',
      'DEUXIÈME PARTIE : IMPLÉMENTATION ET DÉPLOIEMENT OPÉRATIONNEL ..................... 20',
      '  CHAPITRE III : ÉTUDE PRÉALABLE ET CONCEPTION DE LA SOLUTION ............................. 21',
      '    Section 1 : Analyse comparative et choix technologiques ............................................................ 21',
      '    Section 2 : Architecture, modélisation et banc d’essai ................................................................ 25',
      '  CHAPITRE IV : DÉPLOIEMENT, CONFIGURATION ET MESURE DES RÉSULTATS .............. 31',
      '    Section 1 : Procédure de mise en œuvre et d’exécution ............................................................... 31',
      '    Section 2 : Tests, recette technique et mesure de performance (KPIs) ....................................... 36',
      ' ',
      'TROISIÈME PARTIE : REMARQUES, SUGGESTIONS ET APPORT DU THÈME ......................... 41',
      '  CHAPITRE V : ANALYSE CRITIQUE ET RECOMMANDATIONS OPÉRATIONNELLES ......... 42',
      '    Section 1 : Remarques et bilan critique sur l’organisation ........................................................... 42',
      '    Section 2 : Recommandations et feuille de route ......................................................................... 45',
      '  CHAPITRE VI : APPORT DU THÈME ET BILAN DE STAGE ...................................................... 49',
      '    Section 1 : Valeur ajoutée pour la structure d’accueil .................................................................. 49',
      '    Section 2 : Bilan personnel et compétences acquises .................................................................. 52',
      ' ',
      'CONCLUSION GÉNÉRALE .............................................................................................................. 55',
      'TABLE DES RÉFÉRENCES (BIBLIOGRAPHIE ET WEBOGRAPHIE) ......................................... 57',
      'ANNEXES ............................................................................................................................................ 60',
    ].map((l) => pBody(l, { after: 60 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- LISTE DES TABLEAUX ---
    pPartie('LISTE DES TABLEAUX'),
    ...[
      'Tableau I.1 : Fiche d’identité de l’Incubateur Multisectoriel de Libreville (IML) .................................... 6',
      'Tableau I.2 : Synthèse des programmes et offres de services d’incubation à l’IML .................................. 8',
      'Tableau I.3 : Inventaire des infrastructures matérielles et logicielles du service d’accueil ..................... 11',
      'Tableau II.1 : Synthèse des investigations et recueil des données opérationnelles ................................... 14',
      'Tableau II.2 : Matrice SWOT analytique de l’organisation et du suivi actuel à l’IML ............................ 17',
      'Tableau II.3 : Matrice des exigences fonctionnelles du système IML Digit ............................................. 18',
      'Tableau II.4 : Matrice des exigences techniques et non-fonctionnelles .................................................... 19',
      'Tableau III.1 : Étude comparative des approches logicielles d’accompagnement ................................... 22',
      'Tableau III.2 : Justification technique de la Stack technologique retenue .............................................. 24',
      'Tableau III.3 : Matrice de contrôle d’accès basé sur les rôles (RBAC) .................................................... 28',
      'Tableau III.4 : Dictionnaire des données principales du modèle relationnel ........................................... 29',
      'Tableau IV.1 : Chronogramme et jalons techniques de déploiement d’IML Digit .................................. 33',
      'Tableau IV.2 : Registre des incidents techniques survenus et solutions appliquées ................................. 35',
      'Tableau IV.3 : Cahier de recette fonctionnelle et protocole de validation des tests ................................. 37',
      'Tableau IV.4 : Tableau de bord de mesure d’impact et indicateurs de performance (KPIs) ................... 39',
      'Tableau V.1 : Matrice d’analyse des dysfonctionnements organisationnels constatés ............................ 44',
      'Tableau V.2 : Plan d’actions et feuille de route des recommandations prioritaires ................................. 47',
      'Tableau VI.1 : Grille d’évaluation des compétences techniques (Hard Skills) acquises .......................... 53',
      'Tableau VI.2 : Grille d’évaluation des compétences relationnelles (Soft Skills) développées ................. 54',
    ].map((l) => pBody(l, { after: 80 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- LISTE DES FIGURES ---
    pPartie('LISTE DES FIGURES'),
    ...[
      'Figure I.1 : Organigramme structurel et opérationnel de l’IML ............................................................... 9',
      'Figure II.1 : Cartographie fonctionnelle du processus manuel actuel d’accompagnement ....................... 13',
      'Figure III.1 : Architecture 3-tiers modulaire de la solution IML Digit .................................................... 25',
      'Figure III.2 : Diagramme global de cas d’utilisation UML (Use Case) .................................................... 26',
      'Figure III.3 : Diagramme de séquence du cycle d’instruction et d’admission d’un porteur .................... 27',
      'Figure III.4 : Modèle Conceptuel et Relationnel des Données (Schéma relationnel Prisma) .................. 30',
      'Figure IV.1 : Interface du Cockpit de Pilotage Stratégique en lecture seule (Direction) ......................... 38',
      'Figure IV.2 : Interface de suivi du parcours d’incubation jalonné et Diagnostic 360° ............................ 40',
      'Figure IV.3 : Schéma d’architecture du banc d’essai et du serveur de base de données dev-db .............. 40',
    ].map((l) => pBody(l, { after: 80 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- LISTE DES SIGLES ET ABRÉVIATIONS ---
    pPartie('LISTE DES SIGLES ET ABRÉVIATIONS'),
    ...[
      'API : Application Programming Interface (Interface de programmation d’application)',
      'CI/CD : Continuous Integration / Continuous Deployment (Intégration et Déploiement Continus)',
      'CRUD : Create, Read, Update, Delete (Opérations de base sur les données)',
      'CSS : Cascading Style Sheets (Feuilles de style en cascade)',
      'ERP : Enterprise Resource Planning (Progiciel de gestion intégré)',
      'HTML : HyperText Markup Language (Langage de balisage hypertexte)',
      'IML : Incubateur Multisectoriel de Libreville',
      'INPTIC : Institut National de la Poste, des Technologies de l’Information et de la Communication',
      'IP : Internet Protocol (Protocole Internet)',
      'IT : Information Technology (Technologies de l’Information)',
      'JWT : JSON Web Token (Jeton sécurisé d’authentification au format JSON)',
      'MCD : Modèle Conceptuel des Données (Méthode MERISE)',
      'MLD : Modèle Logique des Données (Méthode MERISE)',
      'MTIC : Métiers des Technologies de l’Information et de la Communication',
      'ORM : Object-Relational Mapping (Mappage objet-relationnel)',
      'PME : Petite et Moyenne Entreprise',
      'RBAC : Role-Based Access Control (Contrôle d’accès basé sur les rôles)',
      'REST : Representational State Transfer (Style architectural pour systèmes distribués)',
      'RSN : Réseaux et Systèmes Numériques',
      'SLA : Service Level Agreement (Accord de niveau de service)',
      'SPA : Single Page Application (Application web monopage)',
      'SQL : Structured Query Language (Langage de requêtes structurées)',
      'SWOT : Strengths, Weaknesses, Opportunities, Threats (Forces, Faiblesses, Opportunités, Menaces)',
      'TPE : Très Petite Entreprise',
      'UI/UX : User Interface / User Experience (Interface utilisateur / Expérience utilisateur)',
      'UML : Unified Modeling Language (Langage de modélisation unifié)',
    ].map((l) => pBody(l, { after: 70 })),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // =========================================================================
  // 3. CORPS DU RAPPORT (Numérotation arabe 1, 2, 3...)
  // =========================================================================
  const bodyElements = [
    // --- INTRODUCTION GÉNÉRALE ---
    pPartie('INTRODUCTION GÉNÉRALE'),
    pSection('1. Contexte du stage'),
    pBody(
      'Dans une économie mondiale de plus en plus numérisée, l’entrepreneuriat constitue le principal levier de diversification économique, de création de richesses et de résorption du chômage pour les pays émergents. Au Gabon, les pouvoirs publics et les institutions de développement accordent une priorité stratégique à l’émergence d’un tissu dense de Petites et Moyennes Entreprises (PME) et de Très Petites Entreprises (TPE) innovantes. C’est dans cette dynamique vertueuse que s’inscrit l’Incubateur Multisectoriel de Libreville (IML), structure de référence dédiée à l’amorçage, à l’accélération et à la professionnalisation des initiatives entrepreneuriales nationales.',
      { firstLine: true }
    ),
    pBody(
      'En tant qu’étudiant en fin de cycle de Licence Professionnelle à l’Institut National de la Poste, des Technologies de l’Information et de la Communication (INPTIC), ce stage d’immersion d’une durée de trois mois (août à octobre 2026) au sein de la Cellule Informatique & Systèmes d’Information de l’IML a constitué une opportunité exceptionnelle de confronter les acquis théoriques et méthodologiques aux réalités complexes d’un centre d’affaires opérationnel.',
      { firstLine: true }
    ),

    pSection('2. Problématique générale et besoin métier'),
    pBody(
      'Si l’IML accueille chaque année des centaines de porteurs de projets dans des filières variées (agro-industrie, numérique, artisanat, services marchands, éco-construction), son efficacité opérationnelle se heurtait jusqu’alors à un verrou organisationnel majeur : la gestion fragmentée et manuelle des données d’accompagnement.',
      { firstLine: true }
    ),
    pBody(
      'Le processus historique de suivi reposait en effet sur des dossiers physiques archivés dans des classeurs, des formulaires de candidature papier et des tableaux de bord Excel disjoints, mis à jour de manière asynchrone par chaque agent ou coach externe. Cette dispersion informationnelle a engendré plusieurs dysfonctionnements critiques :',
      { firstLine: true }
    ),
    pBody('• L’absence d’un historique unifié du porteur de projet : les comptes-rendus des experts-coachs et les diagnostics techniques initiaux étaient isolés, empêchant une transmission fluide d’informations entre intervenants.', { after: 60 }),
    pBody('• Des lenteurs administratives considérables dans l’instruction des candidatures : les comités de sélection devaient compiler manuellement des dizaines de fiches éparses, allongeant le délai de réponse à plus de 30 jours.', { after: 60 }),
    pBody('• Une opacité décisionnelle pour la Direction Générale : l’accès aux indicateurs clés de performance nécessitait plusieurs jours de consolidation laborieuse, privant l’exécutif d’un instrument de pilotage en temps réel.', { after: 140 }),
    pBody(
      'Dès lors, la problématique centrale de notre étude se formule ainsi : « Comment améliorer le suivi des projets accompagnés par l’Incubateur Multisectoriel de Libreville face aux insuffisances constatées dans le processus actuel d’accompagnement ? »',
      { bold: true, italics: true, firstLine: true }
    ),

    pSection('3. Objectifs du projet'),
    pBody(
      'Pour répondre de manière pérenne et rigoureuse à cette problématique, le projet a été structuré autour d’un objectif général et d’une série d’objectifs spécifiques mesurables :',
      { firstLine: true }
    ),
    pBody(
      '• Objectif Général : Concevoir, développer et déployer un outil numérique centralisé et sécurisé, dénommé « IML Digit », permettant d’orchestrer de bout en bout le cycle de vie de l’accompagnement entrepreneurial, de la réception de la candidature jusqu’à la sortie de parcours du projet incubé.',
      { bold: true }
    ),
    pBody('• Objectifs Spécifiques :', { bold: true }),
    pBody('  1. Dématérialiser intégralement le formulaire de candidature publique et automatiser son suivi en temps réel par un numéro de dossier horodaté.', { after: 40 }),
    pBody('  2. Implémenter un module de « Diagnostic 360° » permettant d’évaluer la maturité entrepreneuriale du porteur selon cinq axes cardinaux.', { after: 40 }),
    pBody('  3. Structurer un plan de parcours jalonné (Idéation, Prototypage, Lancement commercial, Croissance) avec validation progressive des livrables.', { after: 40 }),
    pBody('  4. Développer un carnet d’accompagnement partagé intégrant la planification des rendez-vous et le dépôt des notes de coaching.', { after: 40 }),
    pBody('  5. Construire un « Cockpit de Pilotage Stratégique » réservé à la Direction Générale, garantissant une consultation analytique consolidée en lecture seule, filtrable par période (30 jours, trimestre, année) avec export direct des rapports en PDF et classeurs Excel multi-onglets.', { after: 160 }),

    pSection('4. Annonce du plan'),
    pBody(
      'Conformément aux directives méthodologiques de l’INPTIC, ce rapport de stage est articulé en trois parties interdépendantes :',
      { firstLine: true }
    ),
    pBody(
      'La Première Partie est dédiée à la présentation générale de la structure d’accueil (l’IML), à son environnement de travail, ainsi qu’au diagnostic approfondi de l’existant et à l’élaboration du cahier des charges fonctionnel et technique.',
      { firstLine: true }
    ),
    pBody(
      'La Deuxième Partie expose la démarche d’implémentation et de déploiement opérationnel. Elle détaille l’étude comparative des technologies, la modélisation architecturale et relationnelle, les étapes de codage, la gestion des incidents techniques et le protocole de recette par les tests.',
      { firstLine: true }
    ),
    pBody(
      'La Troisième Partie dresse une analyse critique de l’organisation, formule des recommandations stratégiques à court et moyen termes pour la pérennisation de l’infrastructure, et présente le bilan des compétences techniques et humaines acquises au cours de cette immersion.',
      { firstLine: true, after: 240 }
    ),
    new Paragraph({ children: [new PageBreak()] }),

    // --- PREMIÈRE PARTIE ---
    pPartie('PREMIÈRE PARTIE : PRÉSENTATION DE LA STRUCTURE D’ACCUEIL ET ÉTAT DE L’EXISTANT'),
    pBody(
      'Cette première partie vise à situer le cadre institutionnel et économique de notre intervention. Il s’agira dans un premier temps de présenter l’organisation générale de l’Incubateur Multisectoriel de Libreville (IML) et son cadre de fonctionnement. Dans un second temps, nous procéderons à l’audit technique et fonctionnel des méthodes de travail existantes, afin de formaliser le cahier des charges de la solution à déployer.',
      { firstLine: true, after: 200 }
    ),

    // CHAPITRE I
    pChapitre('CHAPITRE I : ORGANISATION ET ENVIRONNEMENT DU SERVICE D’ACCUEIL'),
    pSection('Section 1 : Présentation générale et activités de l’entreprise'),
    pSubSection('1.1. Historique, fiche d’identité et statut juridique'),
    pBody(
      'Créé sous l’impulsion des politiques publiques d’appui à l’employabilité et de partenariats techniques internationaux, l’Incubateur Multisectoriel de Libreville (IML) a vu le jour afin de pallier le taux élevé de mortalité précoce des jeunes entreprises gabonaises. Implanté au cœur de la capitale gabonaise, l’IML bénéficie d’un statut d’organisme d’intérêt public doté d’une autonomie de gestion, dédié à la maturation et à la propulsion des projets à forte valeur ajoutée.',
      { firstLine: true }
    ),
    pTableLegend('I.1', 'Fiche d’identité de l’Incubateur Multisectoriel de Libreville (IML)'),
    buildTable(
      ['CARACTÉRISTIQUE', 'INFORMATIONS INSTITUTIONNELLES'],
      [
        ['Dénomination sociale', 'Incubateur Multisectoriel de Libreville (IML)'],
        ['Statut juridique', 'Établissement public à caractère technique et d’accompagnement entrepreneurial'],
        ['Date de création', '2019 (consolidation des statuts en 2022)'],
        ['Siège social', 'Boulevard Triomphal, Libreville, République Gabonaise'],
        ['Tutelle institutionnelle', 'Ministère de l’Économie, du Numérique et de l’Entrepreneuriat'],
        ['Secteurs d’intervention', 'Agro-business, Technologies Numériques, Éco-construction, Santé, Services Marchands'],
        ['Capacité d’accueil', 'Plus de 50 projets en incubation simultanée et 200 porteurs en pré-incubation par an'],
        ['Contact officiel', 'contact@iml.ci / direction@iml.ci — www.iml-incubateur.ga'],
      ],
      [3500, 6000]
    ),
    pBody(''),

    pSubSection('1.2. Missions principales et offres de services'),
    pBody(
      'L’Incubateur Multisectoriel de Libreville déploie un écosystème de services intégrés visant à sécuriser chaque étape du parcours entrepreneurial. Sa mission fondamentale consiste à transformer des idées innovantes en entreprises pérennes créatrices d’emplois stables.',
      { firstLine: true }
    ),
    pTableLegend('I.2', 'Synthèse des programmes et offres de services d’incubation à l’IML'),
    buildTable(
      ['PROGRAMME', 'CIBLE VISÉE', 'DURÉE', 'LIVRABLES ATTENDUS'],
      [
        ['Pré-incubation (Idéation)', 'Porteurs d’idées, étudiants, inventeurs', '1 à 3 mois', 'BMC (Business Model Canvas), étude de faisabilité, MVP conceptuel'],
        ['Incubation Active', 'Start-ups disposant d’un prototype ou MVP', '6 à 12 mois', 'Immatriculation juridique, validation produit-marché, premiers clients'],
        ['Accélération & Croissance', 'TPE/PME en phase de montée en échelle', '12 à 24 mois', 'Levée de fonds, certification qualité, expansion commerciale nationale'],
        ['Mentorats Thématiques', 'Tous les bénéficiaires intégrés', 'Au fil de l’eau', 'Séances de coaching individualisées (finance, droit, marketing, IT)'],
      ],
      [2200, 2600, 1800, 2900]
    ),
    pBody(''),

    pSubSection('1.3. Organigramme et gouvernance'),
    pBody(
      'La gouvernance de l’IML repose sur une structure managériale agile garantissant l’articulation entre les orientations stratégiques étatiques et la réalité opérationnelle du terrain. Elle est chapeautée par la Direction Générale, qui veille à la cohérence des programmes et rend compte au Conseil de Surveillance.',
      { firstLine: true }
    ),
    pFigureBox(
      'Organigramme structurel de l’IML',
      'Direction Générale ──> Direction des Opérations & Programmes ──> [Pôle Accompagnement | Pôle Administratif & Financier | Cellule Numérique & SI] ──> Pool des Coachs & Experts Référents ──> Porteurs de Projets et Entreprises Incubées.'
    ),
    pFigureLegend('I.1', 'Organigramme structurel et opérationnel de l’IML'),

    pSection('Section 2 : Environnement opérationnel et cadre d’immersion'),
    pSubSection('2.1. Description du service d’accueil'),
    pBody(
      'Notre stage s’est déroulé au sein de la Cellule Numérique & Système d’Information, rattachée directement à la Direction des Opérations. Cette cellule a la charge de la maintenance du parc informatique, de la connectivité réseau, du support technique aux agents et surtout de la conduite des projets de digitalisation des processus internes.',
      { firstLine: true }
    ),

    pSubSection('2.2. Ressources humaines et encadrement'),
    pBody(
      'La cellule numérique est animée par un Responsable des Systèmes d’Information, assisté d’un administrateur réseau et d’un développeur applicatif. Tout au long du stage, nous avons bénéficié d’un encadrement de proximité basé sur des réunions hebdomadaires de cadrage et l’application de principes méthodologiques agiles (méthode Kanban).',
      { firstLine: true }
    ),

    pSubSection('2.3. Infrastructures et outils de travail'),
    pBody(
      'Pour mener à bien nos travaux de conception et de programmation, l’IML a mis à notre disposition un ensemble d’équipements et d’accès réseaux représentatifs des exigences d’un environnement de développement moderne.',
      { firstLine: true }
    ),
    pTableLegend('I.3', 'Inventaire des infrastructures matérielles et logicielles du service d’accueil'),
    buildTable(
      ['CATÉGORIE', 'ÉQUIPEMENTS ET LOGICIELS', 'UTILISATION PRINCIPALE'],
      [
        ['Postes de travail', 'PC Core i7 12ème gén., 16 Go RAM, SSD 512 Go', 'Station de développement, virtualisation et tests locaux'],
        ['Connectivité & Réseau', 'Fibre optique dédiée 100 Mbps, Wi-Fi 6 d’entreprise', 'Accès aux dépôts distants, documentation et synchronisation Cloud'],
        ['Environnement logiciel', 'Windows 11 Pro 64-bit, VS Code, Git, Node.js v22', 'Édition de code, contrôle de version et automatisation de build'],
        ['Bases de données & Outils', 'PostgreSQL v16 / Embedded PostgreSQL, Prisma Studio', 'Stockage relationnel local, inspection des tables et schémas'],
      ],
      [2400, 3600, 3500]
    ),
    pBody(''),

    // CHAPITRE II
    pChapitre('CHAPITRE II : DIAGNOSTIC DE L’EXISTANT ET CAHIER DES CHARGES'),
    pSection('Section 1 : Audit et analyse de l’existant'),
    pSubSection('1.1. Cartographie fonctionnelle et technique'),
    pBody(
      'Avant notre intervention, le circuit de traitement d’un porteur de projet était entièrement asynchrone et tributaire de supports papier et de tableurs bureautiques. L’analyse minutieuse des flux a permis d’établir la cartographie fonctionnelle du processus traditionnel :',
      { firstLine: true }
    ),
    pFigureBox(
      'Processus traditionnel de gestion d’un dossier',
      '[Candidat : Dépôt physique d’un dossier papier] ──> [Secrétariat : Enregistrement manuel sur cahier] ──> [Agent : Saisie sur fichier Excel local] ──> [Comité : Réunion mensuelle avec impression de fiches] ──> [Notification par SMS/Appel téléphonique] ──> [Suivi des séances de coaching sur bloc-notes papier].'
    ),
    pFigureLegend('II.1', 'Cartographie fonctionnelle du processus manuel actuel d’accompagnement'),

    pSubSection('1.2. Méthode d’investigation et collecte de données'),
    pBody(
      'Afin d’obtenir une vision exhaustive et objective des besoins réels du terrain, nous avons adopté une démarche empirique combinant entretiens semi-directifs, questionnaires d’évaluation et observation participante lors des réunions de coaching.',
      { firstLine: true }
    ),
    pTableLegend('II.1', 'Synthèse des investigations et recueil des données opérationnelles'),
    buildTable(
      ['PARTIE PRENANTE', 'MÉTHODE D’INVESTIGATION', 'POINTS DE DOULEUR IDENTIFIÉS'],
      [
        ['Direction Générale', 'Entretiens individuels approfondis', 'Manque de visibilité en temps réel sur les cohortes, difficulté à produire des bilans chiffrés pour les bailleurs.'],
        ['Agents d’incubation', 'Ateliers de travail collectifs', 'Perte de temps dans la ressaisie des informations, formulaires de candidatures incomplets, fiches égarées.'],
        ['Coachs & Mentors', 'Questionnaires en ligne et focus groups', 'Difficulté à consulter les antécédents des porteurs, manque d’outil pour déposer les feuilles d’émargement et notes.'],
        ['Porteurs de projets', 'Sondage direct auprès de 25 incubés', 'Incertitude sur l’état d’avancement de leur candidature, manque d’accès à leur feuille de route de jalons.'],
      ],
      [2200, 2800, 4500]
    ),
    pBody(''),

    pSection('Section 2 : Critique de l’existant et formalisation du besoin'),
    pSubSection('2.1. Analyse critique et diagnostic dysfonctionnel (Matrice SWOT)'),
    pBody(
      'La confrontation entre les ambitions institutionnelles de l’IML et ses contraintes matérielles nous a conduits à formaliser une analyse stratégique SWOT (Forces, Faiblesses, Opportunités, Menaces) appliquée au système d’information de l’incubateur.',
      { firstLine: true }
    ),
    pTableLegend('II.2', 'Matrice SWOT analytique de l’organisation et du suivi actuel à l’IML'),
    buildTable(
      ['AXES D’ANALYSE', 'ASPECTS POSITIFS (INTERNES / EXTERNES)', 'ASPECTS NÉGATIFS (INTERNES / EXTERNES)'],
      [
        ['FORCES & FAIBLESSES (Diagnostic Interne)', 
         'FORCES :\n• Notoriété reconnue auprès de l’écosystème gabonais.\n• Équipe d’encadrement dynamique et pluridisciplinaire.\n• Cadre d’accueil moderne et bien équipé en plein Libreville.',
         'FAIBLESSES :\n• Absence d’un progiciel centralisé de gestion des bénéficiaires.\n• Rupture de communication entre intervenants externes et internes.\n• Archivage physique vulnérable aux dégradations et pertes.'],
        ['OPPORTUNITÉS & MENACES (Diagnostic Externe)', 
         'OPPORTUNITÉS :\n• Volonté gouvernementale de digitalisation des services publics.\n• Appui financier des partenaires au développement (BAD, PNUD, AFD).\n• Forte croissance des initiatives de la jeunesse dans la Tech.',
         'MENACES :\n• Risque de perte de crédibilité face à des incubateurs privés 100% numériques.\n• Découragement des porteurs face aux lenteurs de réponse.\n• Problèmes de confidentialité des données stratégiques des entreprises.'],
      ],
      [2500, 3500, 3500]
    ),
    pBody(''),

    pSubSection('2.2. Cahier des charges et spécifications'),
    pBody(
      'Pour répondre aux faiblesses identifiées dans la gestion manuelle et le suivi des entrepreneurs au sein de l’Incubateur Multisectoriel de Libreville, nous avons élaboré un cahier des charges précis définissant les exigences fonctionnelles et techniques de la future plateforme « IML Digit ».',
      { firstLine: true }
    ),
    pBody('A. Exigences Fonctionnelles', { bold: true, color: COLOR_PRIMARY, size: 26, after: 100 }),
    pBody(
      'La solution couvre les besoins spécifiques des trois types d’utilisateurs identifiés dans le fonctionnement quotidien de l’incubateur :',
      { firstLine: true }
    ),
    pBody('1. Gestion des Rôles et Utilisateurs :', { bold: true, after: 60 }),
    pBody('• Administrateur (Agent IML / Gestionnaire de l’Incubateur) : Il dispose d’un accès total à la plateforme. Il assure la gestion des comptes (création, modification, suspension, attribution des rôles et permissions), l’instruction et la validation des inscriptions (examen des pièces, éligibilité, attribution automatique d’un matricule unique national), l’affectation des mentors aux projets, l’arbitrage des réservations de salles et la consultation du journal d’audit de sécurité.', { after: 60 }),
    pBody('• Mentor (Coach / Consultant référent) : Accès exclusif aux profils et aux projets qui lui sont assignés par l’administration. Il saisit les évaluations qualitatives et notations chiffrées par module ou étape clé (Jalons), planifie les séances de coaching et consulte l’historique d’évolution de chaque porteur.', { after: 60 }),
    pBody('• Entrepreneur (Porteur de Projet / Bénéficiaire) : Dispose d’un espace personnel dédié pour soumettre et suivre l’état de sa candidature, mettre à jour son profil professionnel et les données de son entreprise, consulter ses évaluations et conseils en temps réel, et télécharger son bulletin de suivi ou attestation de parcours.', { after: 120 }),
    
    pBody('2. Formulaires d’Inscription Structurés :', { bold: true, after: 60 }),
    pBody('Le système intègre des formulaires dynamiques capturant les informations obligatoires avec contrôle de cohérence en temps réel :', { firstLine: true }),
    pBody('• Données individuelles : Matricule unique (généré automatiquement), Nom, Prénom, Email, Mot de passe sécurisé, Rôle, Date de naissance, Lieu de naissance, Numéro de téléphone et Photo de profil.', { after: 60 }),
    pBody('• Données entrepreneuriales : Dénomination du projet, Secteur d’activité (Agroalimentaire, Numérique, Énergie verte, Artisanat, Services), Stade de maturité (Idéation, Prototypage, Amorçage, Développement), Description synthétique et Besoins d’accompagnement.', { after: 120 }),

    pBody('3. Suivi et Évaluation par Jalons :', { bold: true, after: 60 }),
    pBody('• Découpage par étapes clés : Structuration du cycle d’incubation en 4 jalons opérationnels (Diagnostic initial / Idéation, Modèle économique & Business Plan, Prototypage & Lancement commercial, Recherche de financement & Maturité).', { after: 60 }),
    pBody('• Interface dédiée à la notation : Grille ergonomique permettant au mentor de saisir les notes et appréciations par compétence ou livrable.', { after: 60 }),
    pBody('• Calcul automatique : Calcul instantané des moyennes, pondération du taux d’avancement global (de 0 % à 100 %) et génération d’appréciations de synthèse.', { after: 120 }),

    pBody('4. Gestion des Ressources et Rendez-vous :', { bold: true, after: 60 }),
    pBody('• Planification des entretiens de mentorat individuels et des ateliers de formation collectifs.', { after: 60 }),
    pBody('• Gestion du calendrier de réservation des salles de formation et d’ateliers de l’incubateur pour prévenir les conflits de créneaux.', { after: 120 }),

    pBody('5. Génération et Exportation de Documents :', { bold: true, after: 60 }),
    pBody('• Exportation automatique des bulletins de suivi individuel, fiches de synthèse et rapports d’avancement au format PDF.', { after: 60 }),
    pBody('• Mise en page professionnelle intégrant le logo officiel de l’IML, les données de l’entrepreneur, le détail des notes par jalon, les appréciations du mentor et la validation de l’administrateur.', { after: 140 }),

    pBody('B. Contraintes Techniques', { bold: true, color: COLOR_PRIMARY, size: 26, after: 100 }),
    pBody('1. Sécurité et Authentification :', { bold: true, after: 60 }),
    pBody('• Authentification sécurisée par jetons transmis via cookies protégés HTTP-Only (SameSite=Lax), éliminant les risques de détournement de session par script tiers (failles XSS).', { after: 60 }),
    pBody('• Hachage cryptographique fort des mots de passe avant stockage en base de données (bcrypt / Argon2) avec obligation de modification lors de la première connexion.', { after: 60 }),
    pBody('• Contrôle d’accès strict (RBAC) via middleware backend (requireAuth, requirePermission) assurant l’étanchéité des données entre utilisateurs.', { after: 60 }),
    pBody('• Protection anti-CSRF, limitation de débit de requêtes (rate limiting) et traçabilité intégrale de chaque opération dans une table de journalisation (AuditLog).', { after: 120 }),

    pBody('2. Base de Données Relationnelle :', { bold: true, after: 60 }),
    pBody('• SGBD Relationnel (PostgreSQL / MySQL) garantissant la conformité ACID et la stricte intégrité référentielle des données.', { after: 60 }),
    pBody('• ORM Prisma avec schéma normalisé et fortement typé comprenant les tables : users, projects, applications, pathways, milestones, evaluations, appointments, room_reservations et audit_logs.', { after: 120 }),

    pBody('3. Accessibilité et Architecture Logicielle :', { bold: true, after: 60 }),
    pBody('• Découpage strict entre le Frontend (React, Vite, TypeScript) et le Backend (Node.js, Express, TypeScript) pour une évolution modulaire.', { after: 60 }),
    pBody('• Application Web responsive assurant une accessibilité fluide sur ordinateur, tablette et smartphone.', { after: 60 }),
    pBody('• Interface soignée avec espacement aéré facilitant la saisie et rafraîchissement dynamique des tableaux de bord en temps réel.', { after: 140 }),

    pTableLegend('II.3', 'Matrice synthétique des exigences fonctionnelles du système IML Digit'),
    buildTable(
      ['MODULE FONCTIONNEL', 'EXIGENCE DÉTAILLÉE', 'ACTEURS CONCERNÉS'],
      [
        ['Gestion des Candidatures & Inscriptions', 'Formulaire public en ligne, téléversement de documents, notation par les évaluateurs, notification de statut.', 'Public, Entrepreneur, Administrateur (Agent)'],
        ['Dossiers Bénéficiaires & Matricule', 'Fiche d’identité complète, matricule national unique, type de structure (Start-up, PME, Idéation), historique.', 'Administrateur (Agent), Mentor'],
        ['Diagnostic & Évaluation par Jalons', 'Feuille de route en 4 étapes clés avec validation formelle des livrables et calcul du pourcentage de progression (0 à 100%).', 'Mentor, Entrepreneur, Administrateur (Agent)'],
        ['Planification & Salles', 'Gestion du calendrier de mentorat individuel et réservation partagée des salles de formation de l’incubateur.', 'Mentor, Administrateur (Agent), Public'],
        ['Cockpit Décisionnel & Exports PDF', 'Tableau de bord statistique consolidé avec filtres dynamiques (30j, Trimestre, Année) et export direct des bulletins/rapports.', 'Administrateur, Direction Générale'],
        ['Audit, Sécurité & Traçabilité', 'Journalisation intégrale de toutes les connexions et modifications de statut avec IP et horodatage strict.', 'Administrateur système'],
      ],
      [2400, 4800, 2300]
    ),
    pBody(''),

    pTableLegend('II.4', 'Matrice des exigences techniques et non-fonctionnelles'),
    buildTable(
      ['EXIGENCE NON FONCTIONNELLE', 'SEUIL OU CRITÈRE ATTENDU', 'MOYEN DE VALIDATION'],
      [
        ['Sécurité des accès & Sessions', 'Authentification par cookies HttpOnly sécurisés, hachage Argon2/bcrypt des mots de passe.', 'Audits OWASP et tests d’authentification'],
        ['Contrôle des rôles (RBAC)', 'Ségrégation stricte des permissions (Administrateur/Agent avec tous droits, Mentor assigné, Entrepreneur).', 'Tests de régression sur les routes API protégées'],
        ['Performance de navigation', 'Temps de chargement des pages < 800 ms, bundles optimisés par Vite et compression gzip.', 'Mesures d’audit Google Lighthouse'],
        ['Ergonomie & Responsive Design', 'Interface moderne, accessible sur mobile, tablette et PC, respect de la charte visuelle IML.', 'Tests utilisateurs multi-écrans'],
        ['Intégrité & Persistance', 'Contraintes d’intégrité référentielle en base de données PostgreSQL, transactions ACID garanties.', 'Vérification des migrations Prisma'],
      ],
      [2600, 4400, 2500]
    ),
    pBody(''),
    new Paragraph({ children: [new PageBreak()] }),

    // --- DEUXIÈME PARTIE ---
    pPartie('DEUXIÈME PARTIE : IMPLÉMENTATION ET DÉPLOIEMENT OPÉRATIONNEL'),
    pBody(
      'Après avoir cadré l’environnement institutionnel et formalisé les exigences du système d’information, cette Deuxième Partie aborde le cœur technique de notre travail d’ingénierie logicielle. Nous présenterons successivement l’analyse comparative des options technologiques, l’architecture système et relationnelle retenue, les étapes concrètes de développement et de déploiement, et enfin le protocole d’assurance qualité et de recette opérationnelle.',
      { firstLine: true, after: 200 }
    ),

    // CHAPITRE III
    pChapitre('CHAPITRE III : ÉTUDE PRÉALABLE ET CONCEPTION DE LA SOLUTION'),
    pSection('Section 1 : Analyse comparative et choix technologiques'),
    pSubSection('1.1. Comparatif des solutions du marché'),
    pBody(
      'Dans le cadre de la modernisation des outils de l’IML, trois grandes approches stratégiques étaient envisageables : l’acquisition d’une licence ERP/CRM commerciale propriétaire, le paramétrage d’un CMS Open Source (ex. WordPress ou Odoo Community), ou la conception sur-mesure d’une solution Web Fullstack dédiée.',
      { firstLine: true }
    ),
    pTableLegend('III.1', 'Étude comparative des approches logicielles d’accompagnement'),
    buildTable(
      ['CRITÈRE D’ÉVALUATION', 'CRM / ERP PROPRIÉTAIRE', 'CMS OPEN SOURCE (EX. ODOO)', 'APPLICATION SUR-MESURE (STACK FULLSTACK)'],
      [
        ['Coût d’acquisition & Licences', 'Très élevé (abonnements mensuels en devises par utilisateur).', 'Modéré, mais coûts cachés de plugins et modules payants.', 'Nul en termes de licences logicielles (100% technologies libres).'],
        ['Adéquation aux métiers d’un incubateur', 'Rigide, orienté vers la vente commerciale classique (B2B/B2C).', 'Partielle, nécessite de lourds développements spécifiques.', 'Totale : chaque entité correspond exactement au modèle d’incubation IML.'],
        ['Contrôle et souveraineté des données', 'Faible : données hébergées sur des Clouds tiers hors du Gabon.', 'Moyenne : dépendance aux mises à jour du cœur du CMS.', 'Maximale : base relationnelle hébergeable sur des serveurs locaux gabonais.'],
        ['Évolutivité & Flexibilité technique', 'Faible, fermée aux modifications d’architecture interne.', 'Limitée par le framework rigide du CMS hôte.', 'Excellente : découplage Frontend/Backend via des API RESTful modulaires.'],
      ],
      [2000, 2400, 2500, 2600]
    ),
    pBody(''),

    pSubSection('1.2. Justification des choix retenus'),
    pBody(
      'Au vu des résultats comparatifs, le développement d’une application sur-mesure s’est imposé comme l’alternative la plus pérenne, économique et adaptée. La stack technologique retenue conjugue la fiabilité du typage statique TypeScript, la réactivité de React côté client et la puissance transactionnelle de PostgreSQL orchestrée par Node.js et Prisma ORM.',
      { firstLine: true }
    ),
    pTableLegend('III.2', 'Justification technique de la Stack technologique retenue'),
    buildTable(
      ['COMPOSANT DE LA STACK', 'TECHNOLOGIE CHOISIE', 'RATIONNELLE TECHNIQUE & BÉNÉFICES METIERS'],
      [
        ['Frontend Framework & Build', 'React 19 + Vite 8 + TypeScript', 'Rendu réactif ultra-rapide (Single Page Application), rechargement à chaud (HMR), typage strict prévenant les erreurs à l’exécution.'],
        ['Mise en page & Design System', 'TailwindCSS v4 + Lucide Icons', 'Productivité accrue de stylisation, respect rigoureux de la charte IML (palette #101F2E, #23C3B1), design responsive natif.'],
        ['Gestion de l’état & Cache', 'TanStack Query (React Query)', 'Mise en cache intelligente des requêtes réseau, rafraîchissement automatique en arrière-plan sans rechargement de page.'],
        ['Backend & API REST', 'Node.js (LTS) + Express.js + TypeScript', 'Excellentes performances en entrées/sorties non bloquantes, clarté architecturale des routeurs modulaires.'],
        ['Mappage Relationnel (ORM)', 'Prisma ORM v6', 'Sécurité du typage généré directement depuis le schéma de base de données, migrations déclaratives sans requêtes SQL manuelles.'],
        ['Système de Gestion de BD', 'PostgreSQL v16', 'Robustesse industrielle éprouvée, support strict des contraintes ACID, fonctions de hachage et performances transactionnelles.'],
        ['Bibliothèques d’Exportation', 'jsPDF + SheetJS (XLSX)', 'Génération et téléchargement direct de rapports exécutifs PDF professionnels et de classeurs Excel consolidés multi-onglets.'],
      ],
      [2200, 2600, 4700]
    ),
    pBody(''),

    pSection('Section 2 : Architecture, modélisation et banc d’essai'),
    pSubSection('2.1. Modélisation technique et organisationnelle'),
    pBody(
      'L’application adopte une architecture logicielle 3-tiers découplée, garantissant une indépendance absolue entre la présentation, les règles métier et la persistance des données :',
      { firstLine: true }
    ),
    pFigureBox(
      'Architecture 3-Tiers IML Digit',
      '[Couche Présentation : React 19 SPA / TailwindCSS / Vite] <───(Protocole HTTPS / JSON REST API)───> [Couche Métier : Node.js / Express Middleware Auth & RBAC] <───(Prisma Client ORM)───> [Couche Données : PostgreSQL DB / .pgdata persistant].'
    ),
    pFigureLegend('III.1', 'Architecture 3-tiers modulaire de la solution IML Digit'),

    pBody(
      'Au niveau fonctionnel, l’interaction entre les utilisateurs et le système est formalisée par le diagramme global de cas d’utilisation UML :',
      { firstLine: true }
    ),
    pFigureBox(
      'Diagramme de Cas d’Utilisation UML Global',
      'Acteurs : [Candidat], [Agent IML], [Coach Référent], [Direction Générale], [Administrateur].\n' +
      '• Candidat : Soumettre candidature, Suivre état de son dossier.\n' +
      '• Agent IML : Évaluer candidature, Créer bénéficiaire, Réaliser Diagnostic 360°, Mettre à jour les jalons de parcours.\n' +
      '• Coach Référent : Consulter dossier bénéficiaire, Planifier rendez-vous, Saisir notes de mentorat.\n' +
      '• Direction Générale : Consulter Cockpit Stratégique en lecture seule, Filtrer par période, Exporter rapports PDF/Excel.\n' +
      '• Administrateur : Gérer utilisateurs, Réinitialiser mots de passe, Consulter journaux d’audit de sécurité.'
    ),
    pFigureLegend('III.2', 'Diagramme global de cas d’utilisation UML (Use Case)'),

    pBody(
      'Pour illustrer la dynamique du processus d’admission, le diagramme de séquence ci-après détaille les échanges intervenant lors de l’instruction d’une candidature :',
      { firstLine: true }
    ),
    pFigureBox(
      'Diagramme de Séquence de Validation d’une Candidature',
      'Candidat ──(Soumission Formulaire)──> Frontend ──(POST /api/applications)──> Backend Express ──(Insert DB)──> PostgreSQL.\n' +
      'Agent IML ──(Lecture Dossier)──> Frontend ──(PATCH /api/applications/:id Status=ACCEPTEE)──> Backend.\n' +
      'Backend ──(Vérification Permission RBAC)──> Backend ──(Création automatique Beneficiary + Pathway)──> PostgreSQL.\n' +
      'Backend ──(Génération log d’audit "application.accepted")──> Table AuditLog ──> Réponse JSON 200 OK.'
    ),
    pFigureLegend('III.3', 'Diagramme de séquence du cycle d’instruction et d’admission d’un porteur'),

    pBody(
      'La sécurité des accès au système repose sur une matrice de contrôle d’accès basée sur les rôles (RBAC) assurant un cloisonnement étanche des prérogatives :',
      { firstLine: true }
    ),
    pTableLegend('III.3', 'Matrice de contrôle d’accès basé sur les rôles (RBAC)'),
    buildTable(
      ['RESSOURCE & ACTION', 'ADMINISTRATEUR', 'AGENT D’INCUBATION', 'COACH / EXPERT', 'DIRECTION GÉNÉRALE'],
      [
        ['Créer / Modifier Utilisateurs', 'PLEIN ACCÈS', 'REFUSÉ', 'REFUSÉ', 'REFUSÉ (Lecture Seule)'],
        ['Évaluer Candidatures', 'PLEIN ACCÈS', 'PLEIN ACCÈS', 'CONSULTATION', 'CONSULTATION (Statistiques)'],
        ['Créer & Mettre à jour Bénéficiaires', 'PLEIN ACCÈS', 'PLEIN ACCÈS', 'REFUSÉ', 'REFUSÉ (Lecture Seule)'],
        ['Valider les Jalons de Parcours', 'PLEIN ACCÈS', 'PLEIN ACCÈS', 'PROPOSITION', 'REFUSÉ (Lecture Seule)'],
        ['Saisir Notes de Coaching & Séances', 'PLEIN ACCÈS', 'PLEIN ACCÈS', 'PLEIN ACCÈS', 'REFUSÉ (Lecture Seule)'],
        ['Accéder au Cockpit de Pilotage', 'ACCÈS COMPLET', 'VUE OPÉRATIONNELLE', 'VUE RESTREINTE', 'ACCÈS STRATÉGIQUE RÉSERVÉ'],
        ['Exporter Rapports Officiels (PDF/XLSX)', 'AUTORISÉ', 'AUTORISÉ', 'REFUSÉ', 'AUTORISÉ (Bouton Dédié)'],
      ],
      [2800, 1700, 1700, 1600, 1700]
    ),
    pBody(''),

    pSubSection('2.2. Environnement de test et de simulation (Lab / Staging)'),
    pBody(
      'Afin de garantir un environnement de test isolé sans dépendre d’une connexion Internet ou de conteneurs Docker lourds, nous avons configuré un banc d’essai local s’appuyant sur Embedded PostgreSQL. Les données de développement sont persistées dans un répertoire dédié backend/.pgdata, fonctionnant sur le port 5433, tandis que l’API Express est exécutée en mode surveillance (tsx watch) sur le port 4000.',
      { firstLine: true }
    ),
    pTableLegend('III.4', 'Dictionnaire des données principales du modèle relationnel'),
    buildTable(
      ['TABLE / ENTITÉ', 'CLÉ PRIMAIRE', 'RELATIONS CLÉS', 'DESCRIPTION MÉTIER'],
      [
        ['User', 'id (UUID)', 'roleId -> Role, appointments, notes', 'Comptes internes de la plateforme (Agents, Direction, Coachs).'],
        ['Beneficiary', 'id (UUID)', 'userId, projects, pathway, notes', 'Dossier de l’entrepreneur intégré avec numéro séquentiel (ex. IML-0013).'],
        ['Application', 'id (UUID)', 'beneficiaryId (nullable)', 'Candidature externe soumise en ligne avec données du porteur et du projet.'],
        ['Project', 'id (UUID)', 'beneficiaryId, sectorId', 'Projet entrepreneurial avec stade de maturation (Idée, Prototype, Lancement).'],
        ['Pathway', 'id (UUID)', 'beneficiaryId, steps', 'Parcours d’incubation personnalisé avec calcul de l’avancement en %.'],
        ['PathwayStep', 'id (UUID)', 'pathwayId', 'Jalon opérationnel individuel (statut : A_FAIRE, EN_COURS, TERMINE).'],
        ['Appointment', 'id (UUID)', 'beneficiaryId, coachId', 'Séance de mentorat ou de comité technique avec durée et statut réalisé.'],
        ['AuditLog', 'id (UUID)', 'userId', 'Journal immuable de traçabilité opérationnelle et de sécurité (action, IP, date).'],
      ],
      [1800, 1600, 2700, 3400]
    ),
    pBody(''),

    pFigureBox(
      'Modèle Conceptuel et Relationnel des Données (Schéma relationnel Prisma)',
      'User (1,1) ──a_pour──> (0,n) Role\n' +
      'Beneficiary (1,1) ──possède──> (1,1) Pathway (1,n) ──comprend──> (1,1) PathwayStep\n' +
      'Beneficiary (1,n) ──développe──> (1,1) Project (1,1) ──appartient_à──> (0,n) Sector\n' +
      'Beneficiary (1,n) ──participe_à──> (1,1) Appointment (1,1) ──animé_par──> (0,n) User [Coach]\n' +
      'Application (0,1) ──convertie_en──> (1,1) Beneficiary\n' +
      'User (1,n) ──génère──> (1,1) AuditLog.'
    ),
    pFigureLegend('III.4', 'Modèle Conceptuel et Relationnel des Données (Schéma relationnel Prisma)'),

    // CHAPITRE IV
    pChapitre('CHAPITRE IV : DÉPLOIEMENT, CONFIGURATION ET MESURE DES RÉSULTATS'),
    pSection('Section 1 : Procédure de mise en œuvre et d’exécution'),
    pSubSection('1.1. Étapes de configuration et de mise en production'),
    pBody(
      'La mise en œuvre d’IML Digit s’est articulée autour de six sprints de développement itératifs, chacun sanctionné par des livrables validés par les utilisateurs finaux.',
      { firstLine: true }
    ),
    pTableLegend('IV.1', 'Chronogramme et jalons techniques de déploiement d’IML Digit'),
    buildTable(
      ['PHASE / SPRINT', 'OBJECTIFS TECHNIQUES', 'RÉSULTATS OBTENUS'],
      [
        ['Sprint 1 : Initialisation', 'Mise en place de l’environnement, initialisation Git, schéma Prisma initial.', 'Base PostgreSQL fonctionnelle sur port 5433, scripts de seed prêts.'],
        ['Sprint 2 : Authentification', 'Gestion des tokens JWT, middleware d’autorisation RBAC, hachage des mots de passe.', 'Connexions sécurisées opérationnelles avec isolation des rôles.'],
        ['Sprint 3 : Candidatures', 'Portail public responsive, formulaire dynamique multi-étapes, upload sécurisé.', 'Réception en direct des candidatures avec accusé de réception automatique.'],
        ['Sprint 4 : Parcours & Jalons', 'Diagnostic 360°, suivi des étapes du parcours, carnet de rendez-vous.', 'Calcul en direct du score de maturité et du % d’avancement des projets.'],
        ['Sprint 5 : Cockpit Direction', 'Dashboard exécutif, filtres temporels (30j, 90j, Année), modules d’export.', 'Tableau de bord interactif en lecture seule et téléchargement PDF/Excel.'],
        ['Sprint 6 : Audit & Recette', 'Traçabilité des logs d’audit, tests de montée en charge, formation des agents.', 'Système validé à 100% sans anomalie bloquante.'],
      ],
      [2300, 3700, 3500]
    ),
    pBody(''),

    pBody('Exemple de directive technique de migration et de génération du schéma sous Prisma ORM :'),
    pCodeBlock(
      '# Synchronisation du schéma relationnel et génération du client TypeScript\n' +
      'npx prisma generate\n' +
      'npx prisma migrate dev --name init_iml_digit_core\n' +
      'npm run prisma:seed'
    ),
    pBody(''),

    pSubSection('1.2. Incidents rencontrés et ajustements techniques'),
    pBody(
      'Au cours du cycle de développement, plusieurs défis techniques ont dû être surmontés pour garantir la stabilité et la cohérence de l’application :',
      { firstLine: true }
    ),
    pTableLegend('IV.2', 'Registre des incidents techniques survenus et solutions appliquées'),
    buildTable(
      ['INCIDENT RENCONTRÉ', 'ORIGINE DU PROBLÈME', 'SOLUTION TECHNIQUE APPLIQUÉE'],
      [
        ['Données statiques sur le tableau de bord Direction', 'Les requêtes backend comptaient les totaux globaux sans tenir compte du paramètre period (30j / 90j / annee).', 'Refonte de la route /api/dashboard/director-stats avec filtres dynamiques calculant les flux récents, trimestriels et annuels.'],
        ['Tentatives de modification par le compte Direction', 'Risque d’altération accidentelle des candidatures ou bénéficiaires par la Direction.', 'Mise en place d’un verrou strict dans les routeurs (AppError 403) restreignant la Direction au statut de lecture seule.'],
        ['Blocage d’exportation des formats tableurs', 'Les exports CSV initiaux provoquaient des problèmes d’accents sous certaines versions d’Excel.', 'Intégration native de la bibliothèque SheetJS (XLSX) pour générer de véritables classeurs multi-onglets format .xlsx.'],
        ['Conflits de compilation TypeScript sur les enums', 'Incohérence entre les statuts de séances d’accompagnement et les valeurs Prisma.', 'Harmonisation stricte sur l’énumération AppointmentStatus.REALISE et typage sans faille.'],
      ],
      [2400, 3600, 3500]
    ),
    pBody(''),

    pSection('Section 2 : Tests, recette technique et mesure de performance (KPIs)'),
    pSubSection('2.1. Protocole de validation et recette opérationnelle'),
    pBody(
      'Afin de garantir que l’application respecte scrupuleusement les exigences du cahier des charges, un protocole d’essais exhaustif a été déroulé en collaboration avec les utilisateurs de l’IML :',
      { firstLine: true }
    ),
    pTableLegend('IV.3', 'Cahier de recette fonctionnelle et protocole de validation des tests'),
    buildTable(
      ['CAS DE TEST', 'PROCÉDURE EXÉCUTÉE', 'RÉSULTAT ATTENDU', 'STATUT DU TEST'],
      [
        ['TC-01 : Dépôt de candidature', 'Remplissage du formulaire en ligne avec pièces jointes.', 'Attribution automatique du N° IML-2026-XXXX et statut SOUMISE.', 'SUCCÈS (Validé)'],
        ['TC-02 : Évaluation agent', 'Attribution des notes et passage au statut ACCEPTEE.', 'Génération automatique de la fiche Bénéficiaire et du Parcours initial.', 'SUCCÈS (Validé)'],
        ['TC-03 : Diagnostic 360°', 'Notation des 5 axes de maturité (Stratégie, Marché, etc.).', 'Calcul automatique de la moyenne globale et mise à jour du radar.', 'SUCCÈS (Validé)'],
        ['TC-04 : Verrou Direction', 'Tentative de modification d’un dossier par le compte Direction.', 'Blocage par alerte visuelle et rejet HTTP 403 (Lecture seule).', 'SUCCÈS (Validé)'],
        ['TC-05 : Alternance temporelle', 'Clic sur les boutons 30 jours, Trimestre et Année 2026.', 'Mise à jour dynamique et immédiate des cartes et des graphiques.', 'SUCCÈS (Validé)'],
        ['TC-06 : Téléchargement PDF/XLS', 'Clic sur « Exporter » et sélection Rapport PDF ou Excel.', 'Génération instantanée du fichier officiel sans rafraîchir la page.', 'SUCCÈS (Validé)'],
      ],
      [2000, 2800, 3200, 1500]
    ),
    pBody(''),

    pSubSection('2.2. Analyse des résultats et tableaux de bord (SLAs / KPIs)'),
    pBody(
      'La mise en service d’IML Digit a permis de mesurer des gains tangibles sur les indicateurs de performance de l’incubateur, attestant de l’impact transformateur de la digitalisation :',
      { firstLine: true }
    ),
    pTableLegend('IV.4', 'Tableau de bord de mesure d’impact et indicateurs de performance (KPIs)'),
    buildTable(
      ['INDICATEUR DE PERFORMANCE (KPI)', 'SITUATION AVANT IML DIGIT (MANUELLE)', 'SITUATION APRÈS DÉPLOIEMENT (NUMÉRIQUE)', 'GAIN MESURÉ'],
      [
        ['Délai moyen d’instruction d’un dossier', '28 à 35 jours ouvrés', '5 à 7 jours ouvrés', 'Réduction de 75% du délai d’attente'],
        ['Taux d’exhaustivité des dossiers reçus', '45% (documents physiques souvent manquants)', '98% (champs et pièces jointes requis à la soumission)', 'Amélioration de +53 points'],
        ['Temps de préparation des bilans Direction', '4 à 6 jours de compilation manuelle', 'Instantané (consultation en temps réel et export en 1 clic)', 'Gain de temps de 100%'],
        ['Traçabilité des séances de mentorat', 'Moins de 30% d’émargements effectifs', '100% des rendez-vous horodatés avec notes d’audit', 'Traçabilité intégrale'],
        ['Consommation de papier et fournitures', 'Plus de 400 ramettes de papier par an', 'Zéro papier pour le circuit d’instruction standard', 'Économie budgétaire substantielle'],
      ],
      [2600, 2400, 2500, 2000]
    ),
    pBody(''),

    pFigureBox(
      'Cockpit de Pilotage Stratégique Direction Générale',
      'En-tête : Badge Officiel (Mode Observation & Statistiques - Lecture Seule) | Boutons de Période (30 jours, Trimestre, Année 2026) | Bouton Exporter le rapport (PDF & Excel .xlsx).\n' +
      '5 Cartes KPIs : Bénéficiaires (13, +92%) | Candidatures (6/11 admis, 55%) | Projets Réalisés (6 finalisés, 69%) | Accompagnement (23.8h, 21 jalons) | Trafic & Activité (292 actions, 105 sessions).\n' +
      'Graphiques Analytiques : Flux d’admissions et candidatures dans le temps, Répartition des projets par secteur et stade.'
    ),
    pFigureLegend('IV.1', 'Interface du Cockpit de Pilotage Stratégique en lecture seule (Direction)'),

    pFigureBox(
      'Parcours d’Incubation Jalonné et Diagnostic 360°',
      'Fiche Porteur : N° Dossier IML-0013 | Score Diagnostic 360° : 74% (Maturité Commerciale, Stratégique et Technique).\n' +
      'Jalons de parcours : Étape 1 : Cadrage Business Model (Validé) ──> Étape 2 : Développement Prototype (En cours) ──> Étape 3 : Lancement Pilote (À faire) ──> Étape 4 : Recherche de Financements (À faire).'
    ),
    pFigureLegend('IV.2', 'Interface de suivi du parcours d’incubation jalonné et Diagnostic 360°'),

    pFigureBox(
      'Architecture du banc d’essai et base de données dev-db',
      'Port 5173 (Vite HMR Client) <──> Port 4000 (Serveur Node/Express REST) <──> Port 5433 (Base de données locale PostgreSQL / .pgdata).'
    ),
    pFigureLegend('IV.3', 'Schéma d’architecture du banc d’essai et du serveur de base de données dev-db'),
    new Paragraph({ children: [new PageBreak()] }),

    // --- TROISIÈME PARTIE ---
    pPartie('TROISIÈME PARTIE : REMARQUES, SUGGESTIONS ET APPORT DU THÈME'),
    pBody(
      'Cette Troisième Partie a pour dessein d’adopter une posture réflexive et prospective. Dans le premier chapitre, nous présenterons une analyse critique des forces et fragilités constatées au sein de l’incubateur, assortie d’un plan de recommandations concrètes pour pérenniser l’infrastructure déployée. Le second chapitre dressera le bilan global de la valeur ajoutée apportée à l’IML et mettra en relief les compétences techniques et humaines acquises au cours de ce stage de fin de cycle.',
      { firstLine: true, after: 200 }
    ),

    // CHAPITRE V
    pChapitre('CHAPITRE V : ANALYSE CRITIQUE ET RECOMMANDATIONS OPÉRATIONNELLES'),
    pSection('Section 1 : Remarques et bilan critique sur l’organisation'),
    pSubSection('1.1. Points forts constatés'),
    pBody(
      'Durant ces trois mois d’immersion, nous avons pu constater plusieurs atouts majeurs qui fondent la légitimité et le potentiel de l’Incubateur Multisectoriel de Libreville :',
      { firstLine: true }
    ),
    pBody('• Un dévouement remarquable de l’équipe managériale et des agents d’accompagnement, animés par une véritable volonté de contribuer à la réussite des porteurs de projets gabonais.', { after: 60 }),
    pBody('• Une grande diversité sectorielle des projets accompagnés, couvrant aussi bien les applications mobiles, l’agro-transformation, les cosmétiques naturels que l’ingénierie énergétique.', { after: 60 }),
    pBody('• Une infrastructure immobilière de premier plan, offrant des espaces de coworking conviviaux, des salles de réunion connectées et un environnement propice à l’émulation entrepreneuriale.', { after: 60 }),
    pBody('• Une ouverture institutionnelle affirmée en faveur de la transformation digitale, comme en témoigne l’accueil enthousiaste réservé au déploiement de la solution IML Digit.', { after: 160 }),

    pSubSection('1.2. Dysfonctionnements et fragilités observés'),
    pBody(
      'En contrepoint de ces forces, notre regard technique a relevé plusieurs axes de vulnérabilité qui méritent une attention prioritaire de la gouvernance :',
      { firstLine: true }
    ),
    pTableLegend('V.1', 'Matrice d’analyse des dysfonctionnements organisationnels constatés'),
    buildTable(
      ['DOMAINE D’OBSERVATION', 'DYSFONCTIONNEMENT RELEVÉ', 'RISQUE POUR L’INCUBATEUR'],
      [
        ['Culture Numérique & Pratiques', 'Hétérogénéité des compétences informatiques parmi les intervenants (certains coachs restent attachés aux fiches manuscrites).', 'Risque de sous-utilisation des fonctionnalités avancées de la plateforme logicielle.'],
        ['Politique de Sauvegarde', 'Absence d’une politique formalisée de sauvegarde hors-site des bases de données de l’incubateur.', 'Vulnérabilité face aux pannes matérielles ou aux incidents réseau majeurs.'],
        ['Connectivité & Dépendance Réseau', 'Variations périodiques du débit de la connexion Internet pouvant impacter la réactivité des saisies en ligne.', 'Frustration des usagers et ralentissement temporaire des opérations d’admission.'],
        ['Sécurité des Postes de Travail', 'Utilisation occasionnelle de clés USB non contrôlées sur les postes d’agents.', 'Risque d’introduction de logiciels malveillants sur le réseau local interne.'],
      ],
      [2500, 3600, 3400]
    ),
    pBody(''),

    pSection('Section 2 : Recommandations et feuille de route'),
    pSubSection('2.1. Recommandations à court terme (Horizon 1 à 3 mois)'),
    pBody(
      'Afin de consolider les acquis de la mise en place d’IML Digit, les actions immédiates suivantes doivent être engagées :',
      { firstLine: true }
    ),
    pBody('1. Organisation d’ateliers de renforcement des capacités : dispenser des sessions de prise en main de l’outil à l’intention de tous les agents d’incubation et coachs partenaires, appuyées par un guide d’utilisation illustré.', { after: 50 }),
    pBody('2. Mise en place d’un script de sauvegarde automatisée : programmer une tâche planifiée quotidienne exportant un dump chiffré de la base PostgreSQL vers un support de stockage externe sécurisé.', { after: 50 }),
    pBody('3. Sensibilisation à la cyber-hygiène : imposer le renouvellement périodique des mots de passe et proscrire le partage d’identifiants entre agents.', { after: 160 }),

    pSubSection('2.2. Recommandations à moyen et long terme (Horizon 6 à 18 mois)'),
    pBody(
      'Pour inscrire l’IML au premier rang des incubateurs technologiques de la sous-région d’Afrique Centrale, nous préconisons la feuille de route stratégique suivante :',
      { firstLine: true }
    ),
    pTableLegend('V.2', 'Plan d’actions et feuille de route des recommandations prioritaires'),
    buildTable(
      ['AXE STRATÉGIQUE', 'ACTION RECOMMANDÉE', 'ÉCHÉANCE', 'IMPACT ATTENDU'],
      [
        ['Hébergement Souverain', 'Migration de l’application vers le Datacenter National Gabonais (ANINF) pour garantir la souveraineté des données d’entreprises.', '6 mois', 'Conformité totale avec la loi sur la protection des données personnelles.'],
        ['Extension Mobile Porteurs', 'Développement d’une application mobile (PWA ou React Native) permettant aux bénéficiaires de suivre leurs jalons sur smartphone.', '9 mois', 'Augmentation de l’engagement des incubés et alertes SMS/Push en direct.'],
        ['Module d’Intelligence Artificielle', 'Intégration d’un algorithme de matching intelligent associant automatiquement chaque projet au mentor le plus qualifié.', '12 mois', 'Optimisation de la valeur ajoutée du mentorat et gain de temps pour les agents.'],
        ['Interconnexion Écosystème', 'Ouverture d’API sécurisées avec les banques partenaires et l’Agence Nationale de Promotion des Investissements (ANPI).', '18 mois', 'Accélération des financements bancaires et de l’immatriculation des start-ups.'],
      ],
      [2000, 3600, 1400, 2500]
    ),
    pBody(''),

    // CHAPITRE VI
    pChapitre('CHAPITRE VI : APPORT DU THÈME ET BILAN DE STAGE'),
    pSection('Section 1 : Valeur ajoutée pour la structure d’accueil'),
    pSubSection('1.1. Retombées techniques, sécuritaires ou opérationnelles'),
    pBody(
      'Le déploiement d’IML Digit confère à l’Incubateur Multisectoriel de Libreville un saut qualitatif majeur sur le plan opérationnel. La centralisation des informations élimine définitivement les risques de perte de documents, uniformise les critères d’évaluation des projets et assure une traçabilité horodatée de chaque action grâce au journal d’audit.',
      { firstLine: true }
    ),

    pSubSection('1.2. Retombées économiques, financières et d’image'),
    pBody(
      'Au-delà des gains de productivité interne, la plateforme renforce considérablement l’image de marque institutionnelle de l’IML auprès des bailleurs de fonds internationaux (Banque Mondiale, Union Européenne, PNUD). La possibilité pour la Direction Générale d’extraire instantanément des rapports statistiques consolidés et certifiés (PDF et classeurs Excel multi-onglets) confère une crédibilité accrue aux demandes de subventions et aux conventions de partenariat.',
      { firstLine: true }
    ),

    pSection('Section 2 : Bilan personnel et compétences acquises'),
    pSubSection('2.1. Compétences techniques (Hard Skills)'),
    pBody(
      'Cette immersion a constitué un formidable accélérateur d’apprentissage technique, me permettant de passer de la maîtrise académique des langages à la conception d’une solution logicielle robuste en conditions réelles de production.',
      { firstLine: true }
    ),
    pTableLegend('VI.1', 'Grille d’évaluation des compétences techniques (Hard Skills) acquises'),
    buildTable(
      ['DOMAINE TECHNIQUE', 'TECHNOLOGIES PRATIQUÉES', 'NIVEAU DE MAÎTRISE VALIDÉ'],
      [
        ['Développement Frontend Moderne', 'React 19, TypeScript, TailwindCSS, Recharts, Vite', 'Avancé : Conception d’interfaces interactives, réactives et sécurisées.'],
        ['Ingénierie Backend & API', 'Node.js, Express.js, Architecture RESTful, JWT Cookies', 'Avancé : Implémentation de middleware d’authentification et contrôle RBAC.'],
        ['Gestion de Données & Persistance', 'PostgreSQL v16, Prisma ORM, Migrations, Merise', 'Avancé : Conception de modèles relationnels intègres et requêtes complexes.'],
        ['Automatisation & Reporting', 'jsPDF, SheetJS (XLSX), NPM Scripting', 'Maîtrisé : Génération à la volée de documents exécutifs officiels.'],
        ['Contrôle de Version & Qualité', 'Git, ESLint, TypeScript Strict Compiler', 'Maîtrisé : Rigueur de typage, gestion des branches et intégration continue.'],
      ],
      [2500, 3700, 3300]
    ),
    pBody(''),

    pSubSection('2.2. Compétences comportementales (Soft Skills)'),
    pBody(
      'Sur le plan humain et relationnel, ce stage a développé ma capacité d’écoute active, ma diplomatie dans la recueil des besoins auprès d’utilisateurs non-informaticiens et mon esprit de synthèse lors des réunions de direction.',
      { firstLine: true }
    ),
    pTableLegend('VI.2', 'Grille d’évaluation des compétences relationnelles (Soft Skills) développées'),
    buildTable(
      ['COMPÉTENCE COMPORTEMENTALE', 'APPLICATION CONCRÈTE EN STAGE', 'BÉNÉFICE PROFESSIONNEL'],
      [
        ['Écoute active & Empathie métier', 'Compréhension des réticences des coachs face aux outils informatiques.', 'Capacité à concevoir une ergonomie intuitive réduisant la résistance au changement.'],
        ['Rigueur et sens de l’organisation', 'Planification des sprints de développement et tenue d’un journal d’incidents.', 'Respect strict des délais impartis pour la livraison de la version fonctionnelle.'],
        ['Communication & Vulgarisation', 'Présentation des fonctionnalités du Cockpit à la Direction Générale.', 'Aisance dans l’expression orale devant des décideurs de haut niveau.'],
        ['Autonomie & Résolution de problèmes', 'Résolution des conflits de typage et des verrous de sécurité en lecture seule.', 'Confiance accrue dans la capacité à diagnostiquer et corriger un bogue critique.'],
      ],
      [2600, 3500, 3400]
    ),
    pBody(''),

    pSubSection('2.3. Confrontation théorie / pratique et projet professionnel'),
    pBody(
      'La confrontation entre l’enseignement magistral dispensé à l’INPTIC et la réalité pragmatique de l’entreprise m’a enseigné qu’un excellent code source n’a de valeur que s’il répond à une utilité métier avérée et s’il est pleinement adopté par ses usagers. Cette expérience confirme ma vocation de poursuivre dans le domaine de l’ingénierie logicielle et du management des systèmes d’information.',
      { firstLine: true, after: 240 }
    ),
    new Paragraph({ children: [new PageBreak()] }),

    // --- CONCLUSION GÉNÉRALE ---
    pPartie('CONCLUSION GÉNÉRALE'),
    pBody(
      'Arrivé au terme de ce stage de fin de cycle effectué au sein de l’Incubateur Multisectoriel de Libreville (IML), il convient d’en dresser le bilan synthétique au regard des objectifs initialement fixés.',
      { firstLine: true }
    ),
    pBody(
      'La problématique qui a guidé notre réflexion portait sur l’amélioration du suivi des projets accompagnés face aux insuffisances d’un processus manuel historique fragmenté. Pour y répondre concrètement, nous avons mené à son terme le projet « IML Digit », une plateforme web intégrée bâtie sur une architecture technologique d’avant-garde (React, Node.js, TypeScript, PostgreSQL et Prisma).',
      { firstLine: true }
    ),
    pBody(
      'Les réalisations opérationnelles sont probantes : l’ensemble de la chaîne de valeur entrepreneuriale est désormais numérisée, de l’admission des candidatures jusqu’à la diplomation des incubés. Le module de Diagnostic 360° procure une photographie objective de la maturité des projets, tandis que le carnet d’accompagnement rétablit une coordination fluide entre les agents permanents et les coachs externes. Par ailleurs, le Cockpit de Pilotage Stratégique offre à la Direction Générale un outil de gouvernance inédit, combinant visualisation interactive en temps réel et exportation instantanée de rapports aux formats PDF et Excel.',
      { firstLine: true }
    ),
    pBody(
      'Sur le plan personnel et académique, ce travail consacre la transition du statut d’étudiant à celui de praticien réflexif. Il a mobilisé l’ensemble des compétences acquises à l’INPTIC en analyse conceptuelle, modélisation relationnelle, programmation Web Fullstack et sécurisation des applications.',
      { firstLine: true }
    ),
    pBody(
      'Certes, l’aventure d’IML Digit ne s’arrête pas au terme de ce stage. Des perspectives prometteuses s’ouvrent, notamment l’hébergement de la solution sur les infrastructures du Datacenter national, le déploiement d’une application mobile pour les porteurs de projets et l’intégration de modules prédictifs d’intelligence artificielle. Nous formulons le vœu que les autorités de l’IML poursuivent avec détermination l’exploitation de cet outil, véritable catalyseur au service de l’essor entrepreneurial et du rayonnement économique du Gabon.',
      { firstLine: true, after: 240 }
    ),
    new Paragraph({ children: [new PageBreak()] }),

    // --- TABLE DES RÉFÉRENCES ---
    pPartie('TABLE DES RÉFÉRENCES (BIBLIOGRAPHIE ET WEBOGRAPHIE)'),
    pSection('1. Ouvrages méthodologiques et académiques (Norme ISO 690 / APA)'),
    ...[
      '[1] ROQUES, Pascal. (2020). Modélisation des systèmes d’information avec UML 2.5 et les Design Patterns. Paris : Éditions Eyrolles, 384 p.',
      '[2] NANCI, Dominique & ESPINASSE, Bernard. (2018). Ingénierie des systèmes d’information : Merise deuxième génération (4e édition). Paris : Vuibert, 416 p.',
      '[3] SOMMERVILLE, Ian. (2019). Génie Logiciel : Principes, méthodes et outils (10e édition). Paris : Pearson Education France, 864 p.',
      '[4] MARTIN, Robert C. (2018). Clean Architecture: A Craftsman’s Guide to Software Structure and Design. Boston : Prentice Hall, 432 p.',
      '[5] FAYOLLE, Alain. (2017). L’ingénierie de l’accompagnement entrepreneurial : concepts, méthodes et pratiques. Bruxelles : De Boeck Supérieur, 256 p.',
    ].map((l) => pBody(l, { after: 80 })),
    new Paragraph({ spacing: { before: 80 } }),
    pSection('2. Documentation technique et spécifications normatives'),
    ...[
      '[6] OPEN WEB APPLICATION SECURITY PROJECT (OWASP). (2025). Top 10 Web Application Security Risks. En ligne : https://owasp.org/www-project-top-ten/.',
      '[7] POSTGRESQL GLOBAL DEVELOPMENT GROUP. (2026). PostgreSQL 16 Documentation. En ligne : https://www.postgresql.org/docs/16/.',
      '[8] PRISMA ENTERPRISE. (2026). Prisma ORM Documentation & Best Practices. En ligne : https://www.prisma.io/docs/.',
      '[9] REACT CORE TEAM. (2026). React 19 Official Documentation. En ligne : https://react.dev/.',
      '[10] VITE TEAM. (2026). Vite: Next Generation Frontend Tooling. En ligne : https://vitejs.dev/guide/.',
      '[11] MICROSOFT CORPORATION. (2025). TypeScript Language Specification v5. En ligne : https://www.typescriptlang.org/docs/.',
      '[12] INSTITUT NATIONAL DE LA POSTE, DES TECHNOLOGIES DE L’INFORMATION ET DE LA COMMUNICATION (INPTIC). (2026). Guide méthodologique de rédaction des rapports de stage (L2/L3 — RSN/MTIC). Libreville, Gabon, 10 p.',
    ].map((l) => pBody(l, { after: 80 })),
    new Paragraph({ children: [new PageBreak()] }),

    // --- ANNEXES ---
    pPartie('ANNEXES'),
    pSection('Annexe 1 : Schéma relationnel Prisma ORM (Extrait schema.prisma)'),
    pCodeBlock(
      '// Extrait du modèle de données IML Digit sous Prisma\n' +
      'enum RoleCode { ADMIN DIRECTION AGENT COACH BENEFICIAIRE }\n' +
      'enum ApplicationStatus { SOUMISE EN_EXAMEN ACCEPTEE REFUSEE }\n' +
      'enum AppointmentStatus { PLANIFIE REALISE ANNULE ABSENT }\n' +
      'enum StepStatus { A_FAIRE EN_COURS TERMINE ANNULE }\n\n' +
      'model Beneficiary {\n' +
      '  id        String   @id @default(uuid())\n' +
      '  fileSeq   Int      @unique\n' +
      '  firstName String\n' +
      '  lastName  String\n' +
      '  email     String   @unique\n' +
      '  phone     String?\n' +
      '  type      BeneficiaryType\n' +
      '  status    BeneficiaryStatus @default(ACTIF)\n' +
      '  projects  Project[]\n' +
      '  pathway   Pathway?\n' +
      '  createdAt DateTime @default(now())\n' +
      '}\n\n' +
      'model AuditLog {\n' +
      '  id        String   @id @default(uuid())\n' +
      '  action    String\n' +
      '  details   Json?\n' +
      '  ipAddress String?\n' +
      '  userId    String\n' +
      '  user      User     @relation(fields: [userId], references: [id])\n' +
      '  createdAt DateTime @default(now())\n' +
      '}'
    ),
    pBody(''),

    pSection('Annexe 2 : Matrice des autorisations de la Direction (Contrôle en Lecture Seule)'),
    pBody(
      'Cette règle d’architecture garantit que le profil DIRECTION ne peut jamais modifier de données opérationnelles ni altérer une candidature, mais dispose d’un accès complet à l’observation analytique et à l’export des rapports :',
      { firstLine: true }
    ),
    pCodeBlock(
      '// Middleware Express de verrouillage pour la Direction Générale\n' +
      'applicationsRouter.patch("/:id", async (req, res, next) => {\n' +
      '  try {\n' +
      '    if (req.auth?.role === "DIRECTION") {\n' +
      '      throw new AppError(403, "La Direction est en mode observation & statistiques (lecture seule).", "INTERDIT");\n' +
      '    }\n' +
      '    if (!["ADMIN", "AGENT"].includes(req.auth!.role)) {\n' +
      '      throw new AppError(403, "Évaluation réservée aux agents IML.", "INTERDIT");\n' +
      '    }\n' +
      '    res.json(await updateApplication(req.params.id, req.body, req.auth!, req.ip));\n' +
      '  } catch (e) { next(e); }\n' +
      '});'
    ),
    pBody(''),

    pSection('Annexe 3 : Modèle de la grille d’évaluation Diagnostic 360°'),
    pBody(
      'La grille Diagnostic 360° évalue le porteur de projet sur cinq axes notés chacun sur 20 points, totalisant un score de maturité sur 100 points :',
      { firstLine: true }
    ),
    pTableLegend('A.1', 'Grille de critères d’évaluation du Diagnostic 360°'),
    buildTable(
      ['AXE D’ÉVALUATION', 'CRITÈRES PRINCIPAUX NOTÉS', 'COEFFICIENT / PONDÉRATION'],
      [
        ['1. Maturité Stratégique & Vision', 'Clarté de la proposition de valeur, adéquation problème-solution, ambition du porteur.', '20 points (20%)'],
        ['2. Faisabilité Technique & Produit', 'État d’avancement du prototype/MVP, compétences techniques requises, maîtrise du process.', '20 points (20%)'],
        ['3. Validation Commerciale & Marché', 'Connaissance de la cible client, benchmark concurrentiel, premiers retours d’intérêt.', '20 points (20%)'],
        ['4. Viabilité Économique & Finance', 'Structure des coûts, modèle de revenus (Business Model), besoin en fonds de roulement.', '20 points (20%)'],
        ['5. Profil & Cohésion de l’Équipe', 'Complémentarité des fondateurs, résilience, disponibilité temporelle pour l’incubation.', '20 points (20%)'],
      ],
      [2800, 4800, 1900]
    ),
  ];

  // =========================================================================
  // DOCUMENT DOCX COMPLET AVEC DEUX SECTIONS NATURELLES
  // =========================================================================
  const doc = new Document({
    creator: 'Étudiant INPTIC - Stagiaire IML',
    title: 'Rapport de stage - Mise en place d’un outil numérique de suivi et d’accompagnement à l’IML',
    description: 'Rapport complet de stage de Licence Professionnelle rédigé selon la méthodologie officielle INPTIC (L2/L3 RSN/MTIC)',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_TOP,
              bottom: MARGIN_BOTTOM,
              right: MARGIN_RIGHT,
              left: MARGIN_LEFT,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [
                  new TextRun({
                    text: 'INPTIC / IML — Rapport de Stage de Fin de Cycle',
                    font: FONT_BODY,
                    size: 18,
                    italics: true,
                    color: COLOR_MUTED,
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
                alignment: AlignmentType.RIGHT,
                spacing: { before: 120 },
                children: [
                  new TextRun({
                    text: 'Page ',
                    font: FONT_BODY,
                    size: 20,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_BODY,
                    size: 20,
                    bold: true,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...coverElements,
          ...prelimElements,
          ...bodyElements,
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  // 1. Sauvegarde dans le workspace
  const workspacePath = path.resolve(__dirname, '../../Rapport_de_Stage_IML_INPTIC_COMPLET.docx');
  fs.writeFileSync(workspacePath, buffer);

  // 2. Sauvegarde directe sur le Bureau (Desktop)
  const desktopPath = 'C:\\Users\\HP\\Desktop\\Rapport_de_Stage_IML_INPTIC_COMPLET.docx';
  fs.writeFileSync(desktopPath, buffer);

  console.log(`✓ DOCUMENT WORD RE-GÉNÉRÉ SANS ERREURS XML !`);
  console.log(`- Copié sur Workspace : ${workspacePath}`);
  console.log(`- Copié sur Desktop : ${desktopPath}`);
  console.log(`Taille finale : ${(buffer.length / 1024).toFixed(2)} Ko`);
}

generateReport().catch((err) => {
  console.error('Erreur génération rapport:', err);
  process.exit(1);
});
