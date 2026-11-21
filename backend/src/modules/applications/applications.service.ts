import { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import type { AuthContext } from '../../middleware/auth';
import type { z } from 'zod';
import type { createApplicationSchema, listApplicationsSchema, updateApplicationSchema } from './applications.schemas';
import { AppError } from '../../middleware/error';
import {
  sendApplicationDecisionEmail,
  sendApplicationSubmittedEmail,
  sendAppointmentNotificationEmail,
} from '../email/email.service';

// Helper pour filtrer les candidatures selon le rôle (l'agent ne voit que ce qui lui est assigné s'il n'est pas DIRECTION/ADMIN)
function scopeWhere(auth: AuthContext): Prisma.ApplicationWhereInput {
  const global = auth.permissions.includes('dashboard:global') || auth.permissions.includes('users:manage');
  if (global) return {};
  // Sinon, l'agent voit ce qui lui est assigné ainsi que les nouvelles candidatures non encore assignées
  return { OR: [{ assignedAgentId: auth.userId }, { assignedAgentId: null }] };
}

export async function listApplications(query: z.infer<typeof listApplicationsSchema>, auth: AuthContext) {
  const { page, pageSize, search, status } = query;

  const where: Prisma.ApplicationWhereInput = {
    AND: [
      scopeWhere(auth),
      status ? { status } : {},
      search ? {
        // En supposant que le champ JSON applicantData contient un 'email' ou 'lastName' pour chercher
        // Mais Prisma ne permet pas de filtrer facilement avec OR sur des champs JSON en SQLite/PostgreSQL directement via string contains
        // On fait une recherche simple sur l'ID (ou l'agent peut l'ignorer pour l'instant)
      } : {}
    ],
  };

  if (search) {
      // Dans PostgreSQL on pourrait utiliser des path JSON, ici on fait simple
      (where.AND as any[]).push({
          OR: [
              { evaluationNotes: { contains: search, mode: 'insensitive' } },
              { applicantData: { path: ['lastName'], string_contains: search } } // syntaxe Prisma Postgres JSON
          ]
      });
  }

  const [total, items] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize };
}

export async function getApplication(id: string, auth: AuthContext) {
  const app = await prisma.application.findFirst({
    where: { id, ...scopeWhere(auth) },
    include: {
      assignedAgent: { select: { id: true, firstName: true, lastName: true } },
      beneficiary: {
        include: {
          program: { select: { id: true, name: true } },
          pathway: true,
          appointments: {
            orderBy: { datetime: 'desc' },
            take: 10,
            include: {
              user: { select: { id: true, firstName: true, lastName: true, role: true } },
              session: true,
            }
          },
          followUpNotes: {
            orderBy: { createdAt: 'desc' },
            include: {
              author: { select: { id: true, firstName: true, lastName: true, role: true } }
            }
          }
        }
      }
    }
  });
  if (!app) throw new AppError(404, 'NON_TROUVE', 'Candidature introuvable ou accès refusé');
  return app;
}

export async function createApplication(data: z.infer<typeof createApplicationSchema>, _ip?: string) {
  const applicant = (data.applicantData as any) || {};
  const project = (data.projectData as any) || {};

  // Créer automatiquement le dossier bénéficiaire avec statut EN_ATTENTE
  let beneficiaryId: string | null = null;
  const email = applicant.email?.trim()?.toLowerCase();

  if (email) {
    try {
      const existingBen = await prisma.beneficiary.findUnique({ where: { email } });
      if (existingBen) {
        beneficiaryId = existingBen.id;
      } else {
        const typeMap: Record<string, any> = {
          PORTEUR_IDEE: 'PORTEUR_IDEE',
          STARTUP: 'STARTUP',
          PME: 'ENTREPRISE',
          ORGANISATION: 'ENTREPRISE'
        };
        const benType = typeMap[applicant.structureType] || 'PORTEUR_IDEE';

        const newBen = await prisma.beneficiary.create({
          data: {
            firstName: applicant.firstName?.trim() || 'Porteur',
            lastName: applicant.lastName?.trim() || 'Candidat',
            email,
            phone: applicant.phone?.trim() || null,
            city: applicant.city?.trim() || 'Libreville',
            type: benType,
            status: 'EN_ATTENTE',
            priority: 'NORMALE',
            projects: {
              create: {
                name: applicant.companyName?.trim() || project.title?.trim() || 'Nouveau projet',
                description: project.description?.trim() || null,
                stage: project.stage === 'COMMERCIAL' ? 'LANCEMENT' : (['IDEE', 'PROTOTYPE', 'LANCEMENT', 'CROISSANCE', 'MATURITE'].includes(project.stage) ? project.stage : 'IDEE'),
              }
            }
          }
        });
        beneficiaryId = newBen.id;
      }

      // Si le candidat a téléversé des documents pour son suivi, les rattacher automatiquement
      const docs = Array.isArray(project.documents) ? project.documents : Array.isArray(applicant.documents) ? applicant.documents : [];
      if (beneficiaryId && docs.length > 0) {
        const sysUser = await prisma.user.findFirst({ select: { id: true } });
        if (sysUser) {
          for (const doc of docs) {
            if (doc?.fileId) {
              await prisma.document.create({
                data: {
                  title: doc.originalName || 'Document justificatif',
                  category: doc.category || 'PROJET',
                  filePath: doc.fileId,
                  fileName: doc.originalName || null,
                  mimeType: doc.mimeType || null,
                  sizeBytes: doc.size || null,
                  ownerId: beneficiaryId,
                  ownerType: 'BENEFICIARY',
                  status: 'EN_ATTENTE',
                  uploadedById: sysUser.id,
                }
              }).catch((e) => console.error('Erreur attachement document:', e));
            }
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors de la création automatique du bénéficiaire:', err);
    }
  }

  const app = await prisma.application.create({
    data: {
      status: 'SOUMISE',
      applicantData: data.applicantData,
      projectData: data.projectData,
      submittedAt: new Date(),
      beneficiaryId
    }
  });

  // Envoyer immédiatement l'accusé de réception complet par e-mail au candidat
  if (email && email.includes('@') && !email.endsWith('.local')) {
    const referenceCode = `IML-2026-${String(app.seqNumber).padStart(4, '0')}`;
    const rawDocs = Array.isArray(project?.documents) ? project.documents : [];
    sendApplicationSubmittedEmail({
      recipientEmail: email,
      recipientName: `${applicant?.firstName || ''} ${applicant?.lastName || ''}`.trim() || 'Porteur de projet',
      companyName: applicant?.companyName?.trim() || project?.title?.trim() || 'Nouveau projet',
      referenceCode,
      interviewPreference: applicant?.interviewPreference || 'PRESENTIEL',
      documents: rawDocs.map((d: any) => ({ title: d?.originalName || 'Document justificatif', category: d?.category || 'PROJET' })),
    }).catch((err) => console.error('[EMAIL SOUMISSION CANDIDATURE ERROR]', err));
  }

  return app;
}

export async function updateApplication(id: string, data: z.infer<typeof updateApplicationSchema>, auth: AuthContext, _ip?: string) {
  const app = await getApplication(id, auth); // Vérifie l'existence et l'accès
  const previousStatus = app.status;

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: data.status,
      evaluationNotes: data.evaluationNotes,
      assignedAgentId: data.assignedAgentId,
      ...(data.applicantData !== undefined ? { applicantData: data.applicantData } : {}),
      ...(data.projectData !== undefined ? { projectData: data.projectData } : {}),
    },
    include: {
      assignedAgent: { select: { id: true, firstName: true, lastName: true } },
    }
  });

  // Déclencher automatiquement la notification email au candidat si le statut passe à ACCEPTEE ou REFUSEE
  if (data.status && data.status !== previousStatus && (data.status === 'ACCEPTEE' || data.status === 'REFUSEE')) {
    const applicant = (updated.applicantData as any) || (app.applicantData as any) || {};
    const project = (updated.projectData as any) || (app.projectData as any) || {};
    const recipientEmail = applicant.email?.trim();

    if (recipientEmail && recipientEmail.includes('@') && !recipientEmail.endsWith('.local')) {
      const recipientName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Porteur de projet';
      const companyName = applicant.companyName?.trim() || project.title?.trim() || 'Votre projet';
      const year = updated.createdAt ? new Date(updated.createdAt).getUTCFullYear() : 2026;
      const referenceCode = `IML-${year}-${String(updated.seqNumber).padStart(4, '0')}`;

      let docs: Array<{ title: string; status?: string }> = [];
      let apptDatetime: string | undefined;
      let apptLocation: string | undefined;
      let coachName: string | undefined;

      if (updated.beneficiaryId) {
        const [benDocs, latestAppt] = await Promise.all([
          prisma.document.findMany({
            where: { ownerId: updated.beneficiaryId, ownerType: 'BENEFICIARY' },
            select: { title: true, status: true },
          }).catch(() => []),
          prisma.appointment.findFirst({
            where: { beneficiaryId: updated.beneficiaryId },
            orderBy: { datetime: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } },
          }).catch(() => null),
        ]);
        docs = benDocs;
        if (latestAppt) {
          apptDatetime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(latestAppt.datetime));
          apptLocation = latestAppt.location || undefined;
          coachName = latestAppt.user ? `${latestAppt.user.firstName} ${latestAppt.user.lastName}` : undefined;
        }
      }

      // Envoi de l'e-mail officiel de décision complet (avec documents et RDV éventuel)
      sendApplicationDecisionEmail({
        recipientEmail,
        recipientName,
        companyName,
        referenceCode,
        decision: data.status as 'ACCEPTEE' | 'REFUSEE',
        notes: data.evaluationNotes,
        coachName,
        appointmentDatetime: apptDatetime,
        appointmentLocation: apptLocation,
        documents: docs,
      }).catch(err => console.error('[EMAIL DECISION ERROR]', err));
    }

    // Si ACCEPTEE, activer également le dossier bénéficiaire s'il existe
    if (data.status === 'ACCEPTEE' && updated.beneficiaryId) {
      await prisma.beneficiary.update({
        where: { id: updated.beneficiaryId },
        data: { status: 'ACTIF' }
      }).catch(err => console.error('[ACTIVATE BENEFICIARY ERROR]', err));
    }
  }

  return updated;
}

export async function trackApplicationPublic(searchQuery: string) {
  const clean = searchQuery.trim();
  if (!clean) {
    throw new AppError(400, 'PARAMETRE_MANQUANT', 'Veuillez saisir votre numéro de dossier ou adresse email');
  }

  let app: any = null;

  // 1. Recherche par numéro de référence ou séquence (ex: "IML-2026-0004", "CAND-0004", "#4", "4")
  let seqNumber: number | null = null;
  const imlMatch = clean.match(/(?:IML|CAND)?-?\d{4}-(\d+)/i);
  if (imlMatch && imlMatch[1]) {
    seqNumber = parseInt(imlMatch[1], 10);
  } else if (/^\d+$/.test(clean)) {
    seqNumber = parseInt(clean, 10);
  } else {
    const trailingDigitsMatch = clean.match(/[-#\s](\d+)$/);
    if (trailingDigitsMatch && trailingDigitsMatch[1]) {
      seqNumber = parseInt(trailingDigitsMatch[1], 10);
    }
  }

  if (seqNumber !== null && !isNaN(seqNumber)) {
    app = await prisma.application.findUnique({
      where: { seqNumber }
    });
  }

  // 2. Recherche par UUID direct
  if (!app && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    app = await prisma.application.findUnique({
      where: { id: clean }
    });
  }

  // 3. Recherche par email ou téléphone dans applicantData
  const cleanDigits = clean.replace(/\D/g, '');
  if (!app) {
    const apps = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    app = apps.find(a => {
      const applicant = a.applicantData as any;
      if (!applicant) return false;
      if (applicant.email && clean.includes('@') && applicant.email.toLowerCase().trim() === clean.toLowerCase().trim()) {
        return true;
      }
      if (cleanDigits.length >= 6 && applicant.phone) {
        const appPhoneDigits = String(applicant.phone).replace(/\D/g, '');
        if (appPhoneDigits.includes(cleanDigits) || cleanDigits.includes(appPhoneDigits)) {
          return true;
        }
      }
      return false;
    }) || null;
  }

  // 4. Si non trouvé dans les candidatures, vérifier dans les dossiers bénéficiaires
  if (!app) {
    let ben: any = null;
    if (seqNumber !== null && !isNaN(seqNumber)) {
      ben = await prisma.beneficiary.findFirst({
        where: { fileSeq: seqNumber, archivedAt: null },
        include: { projects: true }
      });
    }
    if (!ben && clean.includes('@')) {
      ben = await prisma.beneficiary.findFirst({
        where: { email: { equals: clean.trim(), mode: 'insensitive' }, archivedAt: null },
        include: { projects: true }
      });
    }
    if (!ben && cleanDigits.length >= 6) {
      const allBens = await prisma.beneficiary.findMany({
        where: { archivedAt: null, phone: { not: null } },
        include: { projects: true },
        take: 100
      });
      ben = allBens.find(b => {
        if (!b.phone) return false;
        const bDigits = b.phone.replace(/\D/g, '');
        return bDigits.includes(cleanDigits) || cleanDigits.includes(bDigits);
      }) || null;
    }

    if (ben) {
      const project = ben.projects?.[0] || {};
      const year = ben.createdAt ? new Date(ben.createdAt).getUTCFullYear() : 2026;
      
      const [appt, benDocs] = await Promise.all([
        prisma.appointment.findFirst({
          where: { beneficiaryId: ben.id },
          orderBy: { datetime: 'desc' },
          include: { user: { select: { firstName: true, lastName: true, email: true } } }
        }),
        prisma.document.findMany({
          where: { ownerId: ben.id, ownerType: 'BENEFICIARY' },
          select: { id: true, title: true, category: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' }
        }).catch(() => []),
      ]);

      let appointmentInfo: any = null;
      if (appt) {
        const loc = appt.location || '';
        const isVisio = loc.toLowerCase().includes('visio') || loc.includes('http') || loc.toLowerCase().includes('meet');
        const match = loc.match(/https?:\/\/[^\s\]]+/);
        appointmentInfo = {
          id: appt.id,
          datetime: appt.datetime,
          duration: appt.duration,
          location: loc,
          isVisio,
          videoUrl: match ? match[0] : (isVisio ? `https://meet.jit.si/imldigit-entretien-${appt.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}` : null),
          coachName: appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : 'Coach Référent IML',
          coachEmail: appt.user?.email || null,
        };
      }

      let status = ben.status === 'EN_ATTENTE' ? 'SOUMISE' : ben.status === 'ACTIF' ? 'ACCEPTEE' : 'EN_COURS_EXAMEN';
      if (status !== 'ACCEPTEE' && status !== 'REFUSEE') {
        if (appointmentInfo) {
          status = 'ENTRETIEN';
        } else if (ben.assignedAgentId) {
          status = 'EN_COURS_EXAMEN';
        }
      }

      return {
        id: ben.id,
        seqNumber: ben.fileSeq,
        referenceCode: `IML-${year}-${String(ben.fileSeq).padStart(4, '0')}`,
        status,
        submittedAt: ben.createdAt,
        applicantName: `${ben.firstName || ''} ${ben.lastName || ''}`.trim() || 'Porteur / Entreprise',
        applicantEmail: ben.email || null,
        structureType: ben.type || 'PORTEUR_IDEE',
        companyName: ben.companyName || project.name || 'Projet / Entreprise',
        rccm: ben.rccm,
        nif: ben.nif,
        interviewPreference: appointmentInfo?.isVisio ? 'VIDEO' : 'PRESENTIEL',
        hasVideoEquipment: false,
        needs: [],
        stage: project.stage || 'IDEE',
        documents: benDocs,
        appointment: appointmentInfo
      };
    }
  }

  if (!app) {
    throw new AppError(404, 'NON_TROUVE', 'Aucun dossier correspondant à ce numéro ou cet email');
  }

  const applicant = (app.applicantData as any) || {};
  const project = (app.projectData as any) || {};

  let appointmentInfo: any = null;
  let benDocs: any[] = [];
  const targetBenId = app.beneficiaryId;
  if (targetBenId) {
    const [appt, docs] = await Promise.all([
      prisma.appointment.findFirst({
        where: { beneficiaryId: targetBenId },
        orderBy: { datetime: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } }
      }),
      prisma.document.findMany({
        where: { ownerId: targetBenId, ownerType: 'BENEFICIARY' },
        select: { id: true, title: true, category: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      }).catch(() => []),
    ]);
    benDocs = docs;
    if (appt) {
      const loc = appt.location || '';
      const isVisio = loc.toLowerCase().includes('visio') || loc.includes('http') || loc.toLowerCase().includes('meet');
      const match = loc.match(/https?:\/\/[^\s\]]+/);
      appointmentInfo = {
        id: appt.id,
        datetime: appt.datetime,
        duration: appt.duration,
        location: loc,
        isVisio,
        videoUrl: match ? match[0] : (isVisio ? `https://meet.jit.si/imldigit-entretien-${appt.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}` : null),
        coachName: appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : 'Coach Référent IML',
        coachEmail: appt.user?.email || null,
      };
    }
  }

  if (benDocs.length === 0 && Array.isArray(project.documents)) {
    benDocs = project.documents.map((d: any, idx: number) => ({
      id: d.fileId || `doc-${idx}`,
      title: d.originalName || 'Document justificatif',
      category: d.category || 'PROJET',
      status: 'EN_ATTENTE',
      createdAt: app.submittedAt || app.createdAt,
    }));
  }

  let status = app.status;
  if (status !== 'ACCEPTEE' && status !== 'REFUSEE') {
    if (appointmentInfo) {
      status = 'ENTRETIEN';
    } else if (app.assignedAgentId || status === 'EN_COURS_EXAMEN') {
      status = 'EN_COURS_EXAMEN';
    }
  }

  return {
    id: app.id,
    seqNumber: app.seqNumber,
    referenceCode: `IML-2026-${String(app.seqNumber).padStart(4, '0')}`,
    status,
    submittedAt: app.submittedAt,
    applicantName: `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Porteur / Entreprise',
    applicantEmail: applicant.email || null,
    structureType: applicant.structureType || 'PORTEUR_IDEE',
    companyName: applicant.companyName || project.title || 'Projet / Entreprise',
    rccm: applicant.rccm,
    nif: applicant.nif,
    interviewPreference: applicant.interviewPreference || (appointmentInfo?.isVisio ? 'VIDEO' : 'PRESENTIEL'),
    hasVideoEquipment: applicant.hasVideoEquipment,
    needs: project.needs || [],
    stage: project.stage || 'IDEE',
    documents: benDocs,
    appointment: appointmentInfo
  };
}

/**
 * Renvoie à la demande par e-mail le récapitulatif complet du dossier (Admission + Documents + Rendez-vous + Lien Vidéo ou Lieu sur place)
 */
export async function resendDossierSummaryEmail(searchQuery: string, overrideEmail?: string) {
  const tracked = await trackApplicationPublic(searchQuery);
  const targetEmail = (overrideEmail || tracked.applicantEmail || '').trim();

  if (!targetEmail || !targetEmail.includes('@') || targetEmail.endsWith('.local')) {
    throw new AppError(400, 'EMAIL_MANQUANT', "Aucune adresse e-mail valide associée à ce dossier. Veuillez saisir votre adresse e-mail.");
  }

  if (tracked.appointment) {
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(tracked.appointment.datetime));

    const mailRes = await sendAppointmentNotificationEmail({
      recipientEmail: targetEmail,
      recipientName: tracked.applicantName,
      coachName: tracked.appointment.coachName,
      coachEmail: tracked.appointment.coachEmail || undefined,
      datetime: formattedDate,
      durationMinutes: tracked.appointment.duration || 60,
      sessionType: tracked.appointment.isVisio ? 'video' : 'in_person',
      locationOrUrl: tracked.appointment.location || 'Siège IML Digit - Espace PME, Libreville',
      videoUrl: tracked.appointment.videoUrl || undefined,
      referenceCode: tracked.referenceCode,
      companyName: tracked.companyName,
      applicationStatus: tracked.status,
      documents: tracked.documents,
    });

    return {
      success: mailRes.success,
      email: targetEmail,
      message: mailRes.success
        ? `Le récapitulatif complet de votre dossier et votre lien d'entretien ont été envoyés à ${targetEmail}.`
        : (mailRes.message || "Erreur lors de l'envoi de l'e-mail"),
    };
  }

  if (tracked.status === 'ACCEPTEE' || tracked.status === 'REFUSEE') {
    const mailRes = await sendApplicationDecisionEmail({
      recipientEmail: targetEmail,
      recipientName: tracked.applicantName,
      companyName: tracked.companyName,
      referenceCode: tracked.referenceCode,
      decision: tracked.status as 'ACCEPTEE' | 'REFUSEE',
      documents: tracked.documents,
    });
    return {
      success: mailRes.success,
      email: targetEmail,
      message: mailRes.success
        ? `Le récapitulatif de décision et des documents de votre dossier a été envoyé à ${targetEmail}.`
        : (mailRes.message || "Erreur lors de l'envoi de l'e-mail"),
    };
  }

  const mailRes = await sendApplicationSubmittedEmail({
    recipientEmail: targetEmail,
    recipientName: tracked.applicantName,
    companyName: tracked.companyName,
    referenceCode: tracked.referenceCode,
    interviewPreference: tracked.interviewPreference,
    documents: tracked.documents,
  });

  return {
    success: mailRes.success,
    email: targetEmail,
    message: mailRes.success
      ? `L'accusé de réception complet de votre dossier (${tracked.referenceCode}) a été envoyé à ${targetEmail}.`
      : (mailRes.message || "Erreur lors de l'envoi de l'e-mail"),
  };
}
