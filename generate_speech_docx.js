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
  PageNumber
} = require('docx');
const fs = require('fs');
const path = require('path');

// Palette de couleurs IML Digit
const TEAL = '23C3B1';
const DARK_TEAL = '178578';
const CORAL = 'F06553';
const SLATE_DARK = '1E293B';
const SLATE_MUTED = '64748B';
const BG_LIGHT = 'F8FAFC';

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    run: {
      color: DARK_TEAL,
      bold: true,
      size: 32, // 16pt
      font: 'Calibri'
    }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    run: {
      color: CORAL,
      bold: true,
      size: 26, // 13pt
      font: 'Calibri'
    }
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 120, line: 276 }, // 1.15 line spacing
    children: [
      new TextRun({
        text: text,
        size: options.size || 22, // 11pt
        font: 'Calibri',
        color: options.color || SLATE_DARK,
        bold: options.bold || false,
        italics: options.italics || false
      })
    ]
  });
}

function createSpeechChunk(speakerText, instruction = '') {
  const children = [];
  if (instruction) {
    children.push(
      new TextRun({
        text: `[Conseil orateur : ${instruction}]\n`,
        italics: true,
        bold: true,
        color: CORAL,
        size: 19,
        font: 'Calibri'
      })
    );
  }
  children.push(
    new TextRun({
      text: `« ${speakerText} »`,
      size: 23, // 11.5pt
      font: 'Calibri',
      color: SLATE_DARK
    })
  );

  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 100, after: 160, line: 300 },
    indent: { left: 400, right: 400 },
    children: children
  });
}

function createCallout(title, content) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
      left: { style: BorderStyle.SINGLE, size: 24, color: TEAL },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: BG_LIGHT },
            margins: { top: 140, bottom: 140, left: 200, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true, color: DARK_TEAL, size: 22, font: 'Calibri' }),
                ],
                spacing: { after: 60 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: content, size: 20, color: SLATE_DARK, font: 'Calibri', italics: true }),
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

async function generateDoc() {
  const doc = new Document({
    creator: 'IML Digit Project Team',
    title: 'Discours et Script de Soutenance - Plateforme IML Digit',
    description: 'Présentation globale de la plateforme IML Digit pour soutenance de projet.',
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: SLATE_DARK
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'IML DIGIT — Dossier & Discours de Soutenance',
                    size: 18,
                    color: SLATE_MUTED,
                    font: 'Calibri'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 18, color: SLATE_MUTED }),
                  new PageNumber({ size: 18, color: SLATE_MUTED })
                ]
              })
            ]
          })
        },
        children: [
          // Titre principal
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({
                text: 'IML DIGIT',
                bold: true,
                size: 48,
                color: DARK_TEAL,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new TextRun({
                text: 'Plateforme Numérique Intégrée d’Incubation, d’Accompagnement et de Pilotage Stratégique des PME',
                size: 24,
                color: CORAL,
                bold: true,
                font: 'Calibri'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
            children: [
              new TextRun({
                text: 'GUIDE DE SOUTENANCE ORALE & FICHE DE PRÉSENTATION TECHNIQUE',
                size: 20,
                color: SLATE_MUTED,
                font: 'Calibri'
              })
            ]
          }),

          createCallout(
            '🎯 OBJECTIF DU DOCUMENT',
            'Ce support a été rédigé pour vous guider pas à pas lors de votre épreuve orale de soutenance. Il combine le texte mot à mot à prononcer devant le jury, les arguments d\'impact business, et les réponses clés aux questions techniques et fonctionnelles.'
          ),

          new Paragraph({ text: '', spacing: { after: 200 } }),

          // -------------------------------------------------------------
          // PARTIE 1 : PITCH D'INTRODUCTION
          // -------------------------------------------------------------
          createHeading1('1. Introduction : Accroche & Contexte du Projet (Durée : 2 min)'),
          
          createSpeechChunk(
            "Monsieur le Président du jury, Mesdames et Messieurs les membres du jury, bonjour. J'ai l'honneur de vous présenter aujourd'hui le projet IML Digit, la solution numérique conçue pour moderniser, structurer et démultiplier l'impact de l'accompagnement entrepreneurial au Gabon.",
            "Regardez les membres du jury, posez votre voix, tenez-vous droit avec assurance."
          ),

          createSpeechChunk(
            "Dans notre pays, l'entrepreneuriat des jeunes et la croissance des PME sont au cœur de la stratégie de diversification économique. Pourtant, les structures d'incubation et d'accompagnement font face à un défi majeur : le suivi des porteurs de projet reste trop souvent artisanal, éclaté sur des feuilles volantes, des fichiers Excel isolés et des échanges WhatsApp non centralisés. Résultat : une perte d'information constante, un manque de traçabilité des séances de mentorat, et une incapacité à prouver avec précision l'impact réel des programmes auprès des bailleurs de fonds et des partenaires institutionnels.",
            "Insister sur le mot 'artisanal' puis sur la valeur 'traçabilité'."
          ),

          createSpeechChunk(
            "C'est pour répondre à cette fracture qu'est née la plateforme IML Digit : un écosystème web complet et sécurisé qui digitalise l'intégralité du cycle de vie de l'entrepreneur, depuis sa candidature en ligne jusqu'à la certification de son parcours d'incubation.",
            "Transition dynamique vers la solution."
          ),

          // -------------------------------------------------------------
          // PARTIE 2 : LA PROBLÉMATIQUE & LA PROPOSITION DE VALEUR
          // -------------------------------------------------------------
          createHeading1('2. La Problématique Résolue & Les Défis Métiers (Durée : 2 min)'),

          createParagraph("Avant l'implémentation d'IML Digit, l'organisation subissait quatre freins majeurs :"),

          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "L'opacité du suivi de terrain : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Difficulté de savoir si une séance de travail planifiée a effectivement eu lieu, et quels livrables ont été validés." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "La dispersion des dossiers administratifs : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Statuts juridiques, CNI, prévisionnels financiers éparpillés entre l'accueil, les boîtes mail et les coachs." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "La lourdeur du reporting pour les bailleurs : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Des semaines de travail manuel requises pour compiler un bilan d'activité réclamé par un financeur ou un ministère." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 140 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "L'absence d'indicateurs de risque : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Impossibilité de détecter à temps les porteurs de projet qui bloquent sur un jalon et risquent d'abandonner." })
            ]
          }),

          createSpeechChunk(
            "Notre ambition avec IML Digit a été de transformer chaque interaction quotidienne en donnée exploitable. Désormais, rien ne se perd : chaque rendez-vous planifié, chaque compte-rendu déposé par un expert et chaque jalon franchi alimente en temps réel le tableau de bord de la Direction Générale.",
            "Mettre en avant la notion de 'donnée exploitable en temps réel'."
          ),

          // -------------------------------------------------------------
          // PARTIE 3 : L'ARCHITECTURE DU SYSTÈME (LE TRIPTYQUE OPÉRATIONNEL)
          // -------------------------------------------------------------
          createHeading1('3. Le Cœur Fonctionnel : Une Plateforme à 4 Rôles Interconnectés (Durée : 5 min)'),

          createParagraph("Pour garantir une adhésion totale sur le terrain, IML Digit a été conçue autour d'un modèle d'habilitation rigoureux (RBAC) articulé en 4 espaces dédiés :"),

          createHeading2('A. L’Espace Porteur de Projet & Candidat (L’Entrée dans l’Écosystème)'),
          createSpeechChunk(
            "Tout commence par le portail public : un entrepreneur peut postuler en quelques minutes via un formulaire interactif sans rupture. Il peut suivre l'instruction de sa candidature en toute transparence et, à la fin de son accompagnement, il reçoit son certificat numérique d'incubation officiel infalsifiable avec QR code.",
            ""
          ),

          createHeading2('B. L’Espace Agent IML / Planificateur (La Tour de Contrôle Opérationnelle)'),
          createSpeechChunk(
            "L'agent de planification dispose d'un guichet unique : création des fiches bénéficiaires, gestion documentaire, attribution des coachs référents et planification des rendez-vous au calendrier. Dès qu'une étape clé est atteinte (Business Model, immatriculation au greffe, prévisionnel validé), l'agent valide le jalon officiel en un clic.",
            "Montrer que l'agent structure et cadence le parcours sans charge mentale inutile."
          ),

          createHeading2('C. L’Espace Expert & Coach (L’Excellence du Mentorat)'),
          createSpeechChunk(
            "Le coach accède à son carnet de bord de mentorat. Pour chaque séance tenue, il renseigne son compte-rendu officiel : points abordés, devoirs à faire et temps consacré. La plateforme intègre même un module de reconnaissance vocale permettant au coach de dicter son compte-rendu à chaud entre deux rendez-vous. La séance passe automatiquement en 'Terminée', et ses heures sont comptabilisées.",
            "Souligner l'innovation de la dictée vocale intégrée."
          ),

          createHeading2('D. Le Cockpit Direction Générale (Le Pilotage Stratégique & Bailleurs)'),
          createSpeechChunk(
            "C'est la grande force de la solution : la Direction ne demande plus de rapports manuels. En ouvrant son cockpit, elle voit instantanément : le nombre d'heures d'accompagnement cumulées, le taux de progression des cohortes par rapport aux jalons, la répartition par secteur économique (Agrobusiness, Fintech, Santé, BTP...) et l'entonnoir de sélection. Enfin, un bouton d'export génère en un clic un classeur Excel complet multi-onglets, conforme aux exigences des audits institutionnels et des bailleurs internationaux.",
            "C'est l'argument massue de votre présentation. Prenez le temps de bien le marquer."
          ),

          // -------------------------------------------------------------
          // PARTIE 4 : ARCHITECTURE TECHNIQUE & CHOIX TECHNOLOGIQUES
          // -------------------------------------------------------------
          createHeading1('4. Architecture Technique & Justification des Choix (Durée : 3 min)'),

          createParagraph("Pour garantir robustesse, vélocité et évolutivité, nous avons opté pour une stack technique moderne et éprouvée :"),

          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Frontend : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "React avec TypeScript et Vite pour une réactivité instantanée et une maintenance typée sans régression. Interface Tailwind CSS sur-mesure aux couleurs identitaires d'IML (Teal #23c3b1 et Corail #f06553)." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Backend API : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Node.js et Express architecturés en modules découplés (Modular Monolith) assurant séparation des responsabilités et rapidité d'exécution." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Persistance des données : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "PostgreSQL avec l'ORM Prisma, garantissant l'intégrité relationnelle, des requêtes optimisées et des migrations de schéma automatisées." })
            ]
          }),
          new Paragraph({
            spacing: { before: 60, after: 140 },
            bullet: { level: 0 },
            children: [
              new TextRun({ text: "Sécurité & Audit : ", bold: true, color: DARK_TEAL }),
              new TextRun({ text: "Authentification robuste avec hash Argon2, cookies HttpOnly, contrôle des permissions par middleware serveur et journalisation continue (Audit Log) de toutes les opérations sensibles." })
            ]
          }),

          // -------------------------------------------------------------
          // PARTIE 5 : CONCLUSION & OUVERTURE
          // -------------------------------------------------------------
          createHeading1('5. Conclusion & Clôture de l’Exposé (Durée : 1 min)'),

          createSpeechChunk(
            "En conclusion, IML Digit n'est pas un simple outil administratif : c'est un véritable levier de souveraineté économique et de transparence pour l'écosystème entrepreneurial gabonais. Elle permet à l'équipe de terrain de mieux accompagner, aux experts de valoriser leur mentorat, et à la Direction d'apporter la preuve tangible de son impact à chaque franc investi par nos partenaires.",
            "Ralentir le débit, ton solennel et convaincu."
          ),

          createSpeechChunk(
            "Je vous remercie pour votre attention bienveillante et je suis désormais à votre entière disposition pour répondre à vos questions et procéder à la démonstration de la plateforme.",
            "Sourire, se tenir prêt pour la phase de questions."
          ),

          // -------------------------------------------------------------
          // PARTIE 6 : QUESTIONS-RÉPONSES TYPES DU JURY (PRÉPARATION)
          // -------------------------------------------------------------
          createHeading1('6. Anticiper les Questions du Jury (Fiche de Préparation)'),

          createCallout(
            '❓ Question 1 : Pourquoi avoir séparé le rôle de l\'Agent et celui du Coach ?',
            'Réponse à donner : L\'Agent assure la régularité administrative, la conformité légale et la planification neutre du parcours. Le Coach, quant à lui, est focalisé sur l\'expertise métier et le mentorat sans être pollué par la gestion des pièces ou des inscriptions. Cette séparation garantit une rigueur d\'audit et une meilleure qualité d\'accompagnement.'
          ),

          new Paragraph({ text: '', spacing: { after: 100 } }),

          createCallout(
            '❓ Question 2 : Le porteur de projet peut-il voir les remarques du coach ?',
            'Réponse à donner : Non, la fiche individuelle est un espace back-office sécurisé réservé à l\'équipe IML. Cela préserve la liberté d\'appréciation de l\'expert (ex. mentionner un risque d\'endettement ou des tensions entre associés) pour alerter la Direction sans froisser le candidat.'
          ),

          new Paragraph({ text: '', spacing: { after: 100 } }),

          createCallout(
            '❓ Question 3 : Comment la plateforme répond-elle aux exigences des bailleurs internationaux ?',
            'Réponse à donner : Grâce à notre moteur d\'export Excel multi-onglets et notre traçabilité horodatée. Un bailleur comme la BAD, l\'AFD ou une banque partenaire peut exiger l\'historique précis des heures délivrées, la liste nominative des bénéficiaires et le taux de pérennité des projets. IML Digit extrait ces données en 1 clic sans risque d\'erreur humaine.'
          )
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('c:/Users/HP/.gemini/antigravity-ide/scratch/iml-digital', 'Discours_Soutenance_IML_Digit.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Fichier Word généré avec succès à:', outputPath);
}

generateDoc().catch(console.error);
