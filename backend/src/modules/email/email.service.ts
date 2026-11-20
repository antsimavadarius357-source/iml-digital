import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  message?: string;
}

// Configuration du transporteur Nodemailer
function getTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const pass = rawPass.trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (process.env.SMTP_SERVICE === 'gmail' || user.endsWith('@gmail.com') || host.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

export function isSmtpConfigured(): boolean {
  return getTransporter() !== null;
}

export function getSmtpInfo() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const isConfigured = Boolean(user && rawPass.trim());
  const maskedUser = user ? user.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`) : null;
  return {
    isConfigured,
    mode: isConfigured ? 'real' : 'simulation',
    user: maskedUser,
    from: process.env.SMTP_FROM || 'IML Digit <no-reply@imldigit.com>',
  };
}

export async function sendTestEmail(toEmail: string): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      simulated: true,
      message: "Serveur SMTP non configuré. Renseignez GMAIL_USER et GMAIL_PASS sur Render pour activer l'envoi réel.",
    };
  }

  const sender = process.env.SMTP_FROM || `"IML Digit" <${process.env.SMTP_USER || process.env.GMAIL_USER || 'no-reply@imldigit.com'}>`;
  try {
    await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `[TEST RÉEL] Validation de connexion messagerie IML Digit`,
      text: `Félicitations !\n\nLa connexion SMTP de la plateforme IML Digit est parfaitement opérationnelle.\nLes convocations et notifications seront désormais expédiées en temps réel à vos bénéficiaires.\n\nÉquipe IML Digit`,
      html: `
        <div style="font-family:sans-serif; max-width:520px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:16px;">
          <h2 style="color:#23c3b1; margin-top:0;">iml digit<span style="color:#0f172a;">.</span></h2>
          <h3 style="color:#0f172a;">✓ Connexion e-mail réussie</h3>
          <p style="color:#475569; font-size:14px; line-height:1.6;">
            Félicitations ! Votre serveur SMTP sur Render est correctement configuré avec vos identifiants.
            Les convocations d'experts et rendez-vous d'accompagnement seront désormais expédiés en direct vers les boîtes e-mail de vos bénéficiaires.
          </p>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:12px 16px; border-radius:10px; font-weight:600; font-size:13px; margin:20px 0;">
            ✓ Test de délivrance synchrone validé avec succès
          </div>
          <p style="font-size:12px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:14px;">
            Plateforme IML Digit • République Gabonaise
          </p>
        </div>
      `,
    });
    return { success: true, simulated: false, message: `E-mail de test expédié avec succès à ${toEmail}` };
  } catch (err: any) {
    return {
      success: false,
      simulated: false,
      message: err?.message || "Erreur lors de l'envoi de l'e-mail de test via SMTP",
    };
  }
}

/**
 * Envoie un code OTP à 6 chiffres par email
 */
export async function sendOtpEmail(toEmail: string, code: string): Promise<SendEmailResult> {
  const transporter = getTransporter();

  // Si aucun serveur SMTP n'est encore configuré dans .env
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL] Destinataire: ${toEmail}`);
    console.log(`[SIMULATION EMAIL] Code OTP: ${code}`);
    console.log(`======================================================\n`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP non configuré dans .env : code simulé en console.',
    };
  }

  const sender = process.env.SMTP_FROM || `"iml digit" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Votre code de vérification iml digit</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 24px; }
          .logo span { color: #f06553; }
          h1 { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 0; }
          p { font-size: 14px; line-height: 1.6; color: #475569; }
          .otp-box { background: #162232; color: #ffffff; padding: 20px; border-radius: 16px; text-align: center; margin: 28px 0; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #f06553; font-family: monospace; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; pt: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">iml digit<span>.</span></div>
          <h1>Vérifiez votre adresse e-mail</h1>
          <p>Bonjour,</p>
          <p>Voici votre code de sécurité à 6 chiffres pour accéder à votre espace d'accompagnement sur <strong>iml digit</strong> :</p>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          <p>Ce code est valable pendant <strong>10 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
          <div class="footer">
            © 2026 iml digit. Tous droits réservés.<br/>
            Plateforme de gestion de l'accompagnement d'entrepreneurs.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: toEmail,
      subject: `${code} est votre code de vérification iml digit`,
      text: `Votre code de vérification iml digit est : ${code}. Il expire dans 10 minutes.`,
      html: htmlContent,
    });

    console.log(`[EMAIL ENVOYÉ] Code OTP expédié avec succès à ${toEmail}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR ENVOI EMAIL] Échec d'envoi à ${toEmail}:`, error);
    return {
      success: false,
      message: error?.message || "Erreur lors de l'envoi de l'e-mail",
    };
  }
}

export interface CoachBriefingData {
  coachEmail: string;
  coachName: string;
  beneficiaryName: string;
  companyName?: string;
  sectorName?: string;
  projectStage?: string;
  objectives?: string;
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  agentName: string;
  agentEmail?: string;
  appointmentDatetime?: string;
  appointmentLocation?: string;
}

/**
 * Envoie un dossier de cadrage/briefing complet à un coach ou expert externe
 */
export async function sendCoachBriefingEmail(data: CoachBriefingData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const subject = `[Mission IML Digit] Dossier d'accompagnement : ${data.companyName || data.beneficiaryName}`;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL MISSION COACH] Destinataire: ${data.coachEmail}`);
    console.log(`[SIMULATION EMAIL MISSION COACH] Sujet: ${subject}`);
    console.log(`[SIMULATION EMAIL MISSION COACH] Bénéficiaire: ${data.beneficiaryName} (${data.companyName || 'Projet'})`);
    console.log(`[SIMULATION EMAIL MISSION COACH] Référent: ${data.agentName}`);
    console.log(`======================================================\n`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP non configuré : briefing coach simulé avec succès.',
    };
  }

  const sender = process.env.SMTP_FROM || `"IML Digit Coordination" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connexion`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
          .badge { background: #e6fffa; color: #178578; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; float: right; }
          h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
          .row { margin-bottom: 10px; font-size: 13px; }
          .label { color: #64748b; font-weight: 500; display: inline-block; width: 160px; }
          .value { color: #0f172a; font-weight: 600; }
          .objectives-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; font-size: 13px; color: #92400e; margin: 18px 0; }
          .appt-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; border-radius: 10px; font-size: 13px; color: #166534; margin: 18px 0; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">MISSION EXPERT</span>
            <div class="logo">iml digit<span style="color:#23c3b1;">.</span></div>
          </div>
          <h1>Ordre de mission d'accompagnement</h1>
          <p>Bonjour <strong>${data.coachName}</strong>,</p>
          <p>Vous avez été désigné(e) par la coordination IML Digit pour accompagner le projet suivant :</p>
          
          <div class="card">
            <div class="row">
              <span class="label">Structure / Entreprise :</span>
              <span class="value">${data.companyName || data.beneficiaryName}</span>
            </div>
            <div class="row">
              <span class="label">Porteur de projet :</span>
              <span class="value">${data.beneficiaryName}</span>
            </div>
            ${data.sectorName ? `
            <div class="row">
              <span class="label">Secteur d'activité :</span>
              <span class="value">${data.sectorName}</span>
            </div>` : ''}
            ${data.projectStage ? `
            <div class="row">
              <span class="label">Stade d'avancement :</span>
              <span class="value">${data.projectStage}</span>
            </div>` : ''}
            ${data.beneficiaryPhone ? `
            <div class="row">
              <span class="label">Contact bénéficiaire :</span>
              <span class="value">${data.beneficiaryPhone} ${data.beneficiaryEmail ? `• ${data.beneficiaryEmail}` : ''}</span>
            </div>` : ''}
          </div>

          ${data.objectives ? `
          <div class="objectives-box">
            <strong>🎯 Objectifs & Besoins prioritaires :</strong><br/>
            ${data.objectives}
          </div>` : ''}

          ${data.appointmentDatetime ? `
          <div class="appt-box">
            <strong>📅 Séance planifiée :</strong> ${data.appointmentDatetime} ${data.appointmentLocation ? `(${data.appointmentLocation})` : ''}
          </div>` : ''}

          <p style="font-size:13px; color:#475569;">
            Votre conseiller référent IML est <strong>${data.agentName}</strong>${data.agentEmail ? ` (<a href="mailto:${data.agentEmail}">${data.agentEmail}</a>)` : ''}.
          </p>

          <div style="text-align: center; margin: 26px 0;">
            <a href="${loginUrl}" style="display:inline-block; background-color:#23c3b1; color:#ffffff !important; font-weight:700; font-size:14px; padding:12px 28px; border-radius:10px; text-decoration:none; box-shadow: 0 4px 12px rgba(35, 195, 177, 0.3);">
              Accéder à mon espace Coach
            </a>
          </div>

          <div class="footer">
            Plateforme IML Digit • Coordination de l'incubation et de l'accompagnement d'entreprises.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: data.coachEmail,
      subject,
      text: `Bonjour ${data.coachName},\n\nVous avez été désigné pour accompagner ${data.companyName || data.beneficiaryName}.\nObjectifs: ${data.objectives || 'Non renseignés'}\nRéférent: ${data.agentName}\n\nÉquipe IML Digit`,
      html: htmlContent,
    });
    console.log(`[BRIEFING COACH EXPÉDIÉ] Envoyé à ${data.coachEmail}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR BRIEFING COACH] Échec d'envoi à ${data.coachEmail}:`, error);
    return {
      success: false,
      message: error?.message || "Erreur lors de l'envoi de l'e-mail de briefing",
    };
  }
}

export interface AppointmentNotificationData {
  recipientEmail: string;
  recipientName: string;
  coachName: string;
  datetime: string;
  durationMinutes: number;
  sessionType: 'video' | 'in_person';
  locationOrUrl: string;
  notes?: string;
}

export async function sendAppointmentNotificationEmail(data: AppointmentNotificationData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const subject = `Convocation à votre session d'accompagnement - IML Digit`;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Destinataire: ${data.recipientEmail}`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Bénéficiaire: ${data.recipientName}`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Coach: ${data.coachName}`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Date: ${data.datetime}`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Format: ${data.sessionType === 'video' ? 'Visioconférence' : 'Présentiel'}`);
    console.log(`[SIMULATION EMAIL CONVOCATION] Lieu/Lien: ${data.locationOrUrl}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.SMTP_FROM || `"IML Digit" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;
  const isVideo = data.sessionType === 'video';
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connexion`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .detail-row { margin-bottom: 10px; font-size: 14px; }
          .label { color: #64748b; font-weight: 500; display: inline-block; width: 140px; }
          .val { color: #0f172a; font-weight: 600; }
          .action-btn { display: inline-block; background-color: #23c3b1; color: #ffffff !important; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">iml digit<span style="color:#23c3b1;">.</span></div>
          </div>
          <h2 style="margin-top:0; color:#0f172a;">Confirmation de votre rendez-vous</h2>
          <p>Bonjour <strong>${data.recipientName}</strong>,</p>
          <p>Votre rendez-vous d'accompagnement a été programmé avec votre coach <strong>${data.coachName}</strong> :</p>
          
          <div class="card">
            <div class="detail-row">
              <span class="label">📅 Date & Heure :</span>
              <span class="val">${data.datetime}</span>
            </div>
            <div class="detail-row">
              <span class="label">⏱ Durée :</span>
              <span class="val">${data.durationMinutes} minutes</span>
            </div>
            <div class="detail-row">
              <span class="label">👨‍💼 Coach référent :</span>
              <span class="val">${data.coachName}</span>
            </div>
            <div class="detail-row">
              <span class="label">${isVideo ? '🌐 Format :' : '📍 Lieu :'}</span>
              <span class="val">${isVideo ? 'Visioconférence sécurisée (Espace IML Digit)' : data.locationOrUrl}</span>
            </div>
          </div>

          <div style="margin-top:20px; text-align:center;">
            <a href="${loginUrl}" target="_blank" class="action-btn">Accéder à mon espace IML Digit</a>
            <p style="font-size:12px; color:#64748b; margin-top:10px;">
              ${isVideo ? 'Connectez-vous à votre espace personnel pour préparer votre séance et rejoindre le salon visioconférence en 1 clic.' : 'Connectez-vous pour consulter vos documents d’accompagnement et votre feuille de route.'}
            </p>
          </div>

          ${data.notes ? `<p style="font-size:13px; color:#475569; background:#f1f5f9; padding:12px; border-radius:8px;"><strong>Note de séance :</strong> ${data.notes}</p>` : ''}

          <div class="footer">
            Plateforme IML Digit • Espace d'accompagnement entrepreneurial<br/>
            Si vous avez un empêchement, merci de prévenir votre coach ou conseiller IML.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: data.recipientEmail,
      subject,
      text: `Bonjour ${data.recipientName},\n\nVotre rendez-vous avec ${data.coachName} est fixé le ${data.datetime} (${isVideo ? 'Format: Visioconférence IML Digit' : 'Lieu: ' + data.locationOrUrl}).\n\nPour y accéder, préparer votre séance et consulter vos documents, connectez-vous directement sur votre espace personnel : ${loginUrl}\n\nÉquipe IML Digit`,
      html: htmlContent,
    });
    console.log(`[EMAIL CONVOCATION EXPÉDIÉ] Envoyé à ${data.recipientEmail}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR EMAIL CONVOCATION] Échec d'envoi à ${data.recipientEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

export interface AppointmentReminderData {
  recipientEmail: string;
  recipientName: string;
  isCoach: boolean;
  partnerName: string;
  partnerRole: string; // 'Coach Référent' ou 'Porteur de projet'
  datetime: string;
  formattedDateOnly: string;
  formattedTimeOnly: string;
  durationMinutes: number;
  sessionType: 'video' | 'in_person';
  locationOrUrl: string;
  videoUrl?: string;
  daysRemaining: number; // 0 = Aujourd'hui, 1 = Demain, 2 = Dans 2 jours...
  projectName?: string;
}

/**
 * Envoie un e-mail officiel de rappel automatisé (J-X, J-1 ou Jour J) au porteur de projet ou au coach
 */
export async function sendAppointmentReminderEmail(data: AppointmentReminderData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const isVideo = data.sessionType === 'video';
  const effectiveVideoUrl = data.videoUrl || (data.locationOrUrl.startsWith('http') ? data.locationOrUrl : null);

  let countdownText = `dans ${data.daysRemaining} jours`;
  let countdownBadge = `<span style="background:#e0f2fe; color:#0369a1; font-weight:800; font-size:12px; padding:6px 14px; border-radius:999px;">📅 DANS ${data.daysRemaining} JOURS</span>`;
  let urgencyTitle = `Rappel : votre entretien d'accompagnement IML Digit approche`;

  if (data.daysRemaining === 0) {
    countdownText = `aujourd'hui à ${data.formattedTimeOnly}`;
    countdownBadge = `<span style="background:#fee2e2; color:#b91c1c; font-weight:800; font-size:12px; padding:6px 14px; border-radius:999px;">🚨 C'EST AUJOURD'HUI À ${data.formattedTimeOnly}</span>`;
    urgencyTitle = `🚨 RAPPEL : Votre entretien a lieu AUJOURD'HUI à ${data.formattedTimeOnly}`;
  } else if (data.daysRemaining === 1) {
    countdownText = `demain à ${data.formattedTimeOnly}`;
    countdownBadge = `<span style="background:#fef3c7; color:#b45309; font-weight:800; font-size:12px; padding:6px 14px; border-radius:999px;">⏰ DEMAIN À ${data.formattedTimeOnly}</span>`;
    urgencyTitle = `⏰ RAPPEL : Votre entretien a lieu DEMAIN à ${data.formattedTimeOnly}`;
  }

  const subject = data.daysRemaining === 0
    ? `🚨 [RAPPEL AUJOURD'HUI à ${data.formattedTimeOnly}] Votre entretien d'accompagnement IML Digit`
    : data.daysRemaining === 1
      ? `⏰ [RAPPEL DEMAIN à ${data.formattedTimeOnly}] Votre entretien d'accompagnement IML Digit`
      : `📅 [RAPPEL DANS ${data.daysRemaining} JOURS] Votre entretien IML Digit fixé le ${data.formattedDateOnly}`;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Destinataire: ${data.recipientEmail}`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Sujet: ${subject}`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Pour: ${data.recipientName} (${data.isCoach ? 'Coach' : 'Bénéficiaire'})`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Avec: ${data.partnerName} (${data.partnerRole})`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Date: ${data.datetime} (${countdownText})`);
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Visio: ${isVideo ? (effectiveVideoUrl || 'Visio IML') : 'Présentiel'}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.SMTP_FROM || `"IML Digit Rappels" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/connexion`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
          h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; line-height: 1.35; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin: 22px 0; }
          .detail-row { margin-bottom: 10px; font-size: 14px; display: flex; justify-content: space-between; }
          .label { color: #64748b; font-weight: 500; }
          .val { color: #0f172a; font-weight: 700; text-align: right; }
          .btn-visio { display: inline-block; background-color: #f06553; color: #ffffff !important; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(240, 101, 83, 0.35); }
          .btn-portal { display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 10px; text-decoration: none; margin-top: 10px; }
          .checklist { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; font-size: 13px; color: #065f46; margin: 20px 0; line-height: 1.6; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">iml digit<span style="color:#f06553;">.</span></div>
            <div>${countdownBadge}</div>
          </div>

          <h1>${urgencyTitle}</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Bonjour <strong>${data.recipientName}</strong>,<br/>
            Ceci est un rappel automatique de l'incubateur IML Digit pour vous rappeler la tenue de votre entretien fixé <strong>${countdownText}</strong>.
          </p>

          <div class="card">
            <div class="detail-row">
              <span class="label">📅 Date de l'entretien :</span>
              <span class="val" style="color: #0f172a;">${data.formattedDateOnly}</span>
            </div>
            <div class="detail-row">
              <span class="label">⏰ Heure précise :</span>
              <span class="val" style="color: #f06553; font-size: 16px;">${data.formattedTimeOnly}</span>
            </div>
            <div class="detail-row">
              <span class="label">⏱ Durée prévue :</span>
              <span class="val">${data.durationMinutes} minutes</span>
            </div>
            <div class="detail-row">
              <span class="label">👤 ${data.partnerRole} :</span>
              <span class="val">${data.partnerName}</span>
            </div>
            ${data.projectName ? `
            <div class="detail-row">
              <span class="label">🚀 Projet concerné :</span>
              <span class="val">${data.projectName}</span>
            </div>` : ''}
            <div class="detail-row" style="margin-bottom:0;">
              <span class="label">🌐 Modalité :</span>
              <span class="val">${isVideo ? 'Visioconférence en ligne' : data.locationOrUrl}</span>
            </div>
          </div>

          ${isVideo ? `
            <div style="text-align:center; margin: 26px 0;">
              ${effectiveVideoUrl ? `
                <a href="${effectiveVideoUrl}" target="_blank" class="btn-visio">
                  📹 Rejoindre directement la visioconférence →
                </a>
                <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                  Lien de visio : <a href="${effectiveVideoUrl}" style="color:#f06553;">${effectiveVideoUrl}</a>
                </p>
              ` : `
                <a href="${loginUrl}" target="_blank" class="btn-visio">
                  📹 Rejoindre la visioconférence via mon espace →
                </a>
              `}
            </div>
          ` : `
            <div style="text-align:center; margin: 26px 0;">
              <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:8px;">
                📍 Lieu du rendez-vous : ${data.locationOrUrl}
              </div>
              <p style="font-size:12px; color:#64748b;">
                Merci de vous présenter 10 minutes avant l'heure à l'accueil d'IML Digit.
              </p>
            </div>
          `}

          <div class="checklist">
            <strong>✅ Conseils pour votre entretien :</strong><br/>
            • Connectez-vous 5 minutes avant l'heure prévue pour tester votre caméra et votre micro.<br/>
            • Installez-vous dans un endroit calme avec une bonne connexion internet.<br/>
            • Gardez à portée de main vos documents de projet et de quoi prendre des notes.
          </div>

          <div style="text-align: center; margin-top: 16px;">
            <a href="${loginUrl}" target="_blank" class="btn-portal">Accéder à mon espace plateforme →</a>
          </div>

          <div class="footer">
            <strong>Incubateur & Accélérateur d'Entreprises IML Digit</strong><br/>
            Ceci est une notification automatique de rappel envoyée à toutes les parties prenantes.<br/>
            En cas d'empêchement majeur, prévenez immédiatement votre conseiller IML.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: data.recipientEmail,
      subject,
      text: `Bonjour ${data.recipientName},\n\nRappel : votre entretien avec ${data.partnerName} a lieu ${countdownText} (${data.datetime}).\nModalité: ${isVideo ? 'Visioconférence (' + (effectiveVideoUrl || 'Via votre espace') + ')' : data.locationOrUrl}\n\nÉquipe IML Digit`,
      html: htmlContent,
    });
    console.log(`[EMAIL RAPPEL AUTOMATIQUE EXPÉDIÉ] Envoyé à ${data.recipientEmail} (${countdownText})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR EMAIL RAPPEL AUTOMATIQUE] Échec d'envoi à ${data.recipientEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

export interface StepValidationAlertData {
  agentEmail: string;
  agentName: string;
  coachName: string;
  beneficiaryName: string;
  companyName?: string;
  stepNumber: number;
  stepName: string;
  statusText: string;
  comment?: string;
  beneficiaryId: string;
}

/**
 * Envoie une alerte immédiate à l'agent de planification lorsqu'une étape du circuit d'accompagnement est validée par le coach
 */
export async function sendStepValidationAlertEmail(data: StepValidationAlertData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const dossierUrl = `${process.env.APP_URL || 'http://localhost:5173'}/beneficiaires/${data.beneficiaryId}`;
  const subject = `🔔 [Circuit IML] Étape ${data.stepNumber} (${data.stepName}) validée pour ${data.companyName || data.beneficiaryName}`;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL ALERTE ÉTAPE AGENT]`);
    console.log(`Destinataire (Agent): ${data.agentEmail} (${data.agentName})`);
    console.log(`Coach: ${data.coachName}`);
    console.log(`Bénéficiaire: ${data.beneficiaryName} (${data.companyName || 'Projet'})`);
    console.log(`Étape: ${data.stepNumber}. ${data.stepName} -> ${data.statusText}`);
    console.log(`Lien dossier: ${dossierUrl}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.SMTP_FROM || `"IML Digit Coordination" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
          .badge { background: #ecfdf5; color: #065f46; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 9999px; }
          h1 { font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .detail-row { margin-bottom: 8px; font-size: 13.5px; }
          .label { color: #64748b; font-weight: 500; display: inline-block; width: 150px; }
          .val { color: #0f172a; font-weight: 700; }
          .btn-primary { display: inline-block; background-color: #23c3b1; color: #ffffff !important; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin: 16px 0; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">iml digit<span style="color:#23c3b1;">.</span></div>
            <span class="badge">CIRCUIT D'ACCOMPAGNEMENT</span>
          </div>

          <h1>Progression du dossier : Étape ${data.stepNumber} validée</h1>
          <p style="font-size:14px; color:#334155; line-height:1.6;">
            Bonjour <strong>${data.agentName}</strong>,<br/>
            Le coach <strong>${data.coachName}</strong> vient de valider une étape majeure sur le parcours d'accompagnement de l'entrepreneur :
          </p>

          <div class="card">
            <div class="detail-row">
              <span class="label">Étape validée :</span>
              <span class="val" style="color:#0f766e;">${data.stepNumber}. ${data.stepName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Statut :</span>
              <span class="val" style="color:#16a34a;">${data.statusText} ✓</span>
            </div>
            <div class="detail-row">
              <span class="label">Bénéficiaire :</span>
              <span class="val">${data.beneficiaryName}</span>
            </div>
            ${data.companyName ? `
            <div class="detail-row">
              <span class="label">Structure / Entreprise :</span>
              <span class="val">${data.companyName}</span>
            </div>` : ''}
            <div class="detail-row">
              <span class="label">Coach référent :</span>
              <span class="val">${data.coachName}</span>
            </div>
          </div>

          ${data.stepNumber === 3 ? `
            <div style="background:#ecfdf5; border-left:4px solid #10b981; padding:14px; border-radius:8px; font-size:13px; color:#065f46; margin:16px 0;">
              <strong>🎯 Action attendue de l'Agent de planification / Direction :</strong><br/>
              Les livrables de mentorat sont certifiés par le coach. Le dossier est désormais prêt pour la finalisation de l'<strong>Étape 4 (Bilan & Sortie)</strong> et la délivrance de l'attestation officielle de fin d'accompagnement.
            </div>
          ` : ''}

          <div style="text-align:center; margin: 24px 0;">
            <a href="${dossierUrl}" class="btn-primary">Consulter le dossier d'accompagnement →</a>
          </div>

          <div class="footer">
            Plateforme IML Digit • Coordination & Planification de l'accompagnement
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: data.agentEmail,
      subject,
      text: `Bonjour ${data.agentName},\n\nLe coach ${data.coachName} a validé l'étape ${data.stepNumber} (${data.stepName}) pour ${data.beneficiaryName} (${data.companyName || ''}).\nAccéder au dossier: ${dossierUrl}\n\nÉquipe IML Digit`,
      html: htmlContent,
    });
    console.log(`[ALERTE ÉTAPE EXPÉDIÉE] Envoyée à ${data.agentEmail} (Étape ${data.stepNumber})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR ALERTE ÉTAPE] Échec d'envoi à ${data.agentEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

export interface ApplicationDecisionEmailData {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  referenceCode: string;
  decision: 'ACCEPTEE' | 'REFUSEE';
  notes?: string;
}

/**
 * Envoie un email officiel au candidat pour l'informer de l'admission ou du refus de son dossier
 */
export async function sendApplicationDecisionEmail(data: ApplicationDecisionEmailData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const isAccepted = data.decision === 'ACCEPTEE';
  const appBaseUrl = process.env.APP_URL || 'http://localhost:5173';
  const trackUrl = `${appBaseUrl}/suivi-candidature?code=${encodeURIComponent(data.referenceCode)}`;

  const subject = isAccepted
    ? `[IML Digit] Félicitations ! Votre candidature (${data.referenceCode}) est retenue`
    : `[IML Digit] Suite donnée à votre candidature (${data.referenceCode})`;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL DÉCISION CANDIDATURE]`);
    console.log(`Destinataire: ${data.recipientEmail}`);
    console.log(`Bénéficiaire: ${data.recipientName} (${data.companyName})`);
    console.log(`Référence: ${data.referenceCode}`);
    console.log(`Décision: ${isAccepted ? '✅ ADMISE (Comité & Direction)' : '❌ NON RETENUE'}`);
    console.log(`Sujet: ${subject}`);
    console.log(`Lien de suivi: ${trackUrl}`);
    if (data.notes) console.log(`Notes comité: ${data.notes}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.SMTP_FROM || `"Incubateur IML Digit" <${process.env.SMTP_USER || 'no-reply@imldigit.com'}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 22px; font-weight: 900; color: #0f172a; }
          .badge-accepted { background: #dcfce7; color: #15803d; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; }
          .badge-rejected { background: #f1f5f9; color: #64748b; font-weight: 800; font-size: 11px; padding: 5px 12px; border-radius: 9999px; text-transform: uppercase; }
          h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; line-height: 1.3; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .detail-row { margin-bottom: 8px; font-size: 13.5px; }
          .label { color: #64748b; font-weight: 500; display: inline-block; width: 140px; }
          .val { color: #0f172a; font-weight: 700; }
          .btn-primary { display: inline-block; background-color: ${isAccepted ? '#10b981' : '#0f172a'}; color: #ffffff !important; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; margin: 16px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .steps-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; font-size: 13px; color: #065f46; margin: 18px 0; }
          .rejected-box { background: #f8fafc; border-left: 4px solid #94a3b8; padding: 16px; border-radius: 8px; font-size: 13px; color: #475569; margin: 18px 0; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">iml digit<span style="color:#f06553;">.</span></div>
            <span class="${isAccepted ? 'badge-accepted' : 'badge-rejected'}">
              ${isAccepted ? 'Candidature Retenue' : 'Décision du Comité'}
            </span>
          </div>

          ${isAccepted ? `
            <h1>Félicitations ${data.recipientName} !</h1>
            <p style="font-size:14px; line-height:1.6; color:#334155;">
              Le <strong>Comité de sélection et la Direction de l'incubateur IML Digit</strong> ont le plaisir de vous annoncer que votre projet a été officiellement <strong>admis</strong> au sein de notre programme d'incubation et d'accélération.
            </p>

            <div class="card">
              <div class="detail-row">
                <span class="label">N° de Dossier :</span>
                <span class="val">${data.referenceCode}</span>
              </div>
              <div class="detail-row">
                <span class="label">Structure / Projet :</span>
                <span class="val">${data.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Bénéficiaire :</span>
                <span class="val">${data.recipientName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Décision finale :</span>
                <span class="val" style="color:#10b981;">Admis en cohorte d'accompagnement</span>
              </div>
            </div>

            <div class="steps-box">
              <strong style="display:block; margin-bottom:6px;">🚀 Vos prochaines étapes d'intégration :</strong>
              1. Un Coach référent de l'incubateur prendra contact avec vous sous 48h.<br/>
              2. Signature de votre convention d'accompagnement et définition de votre feuille de route.<br/>
              3. Démarrage des séances de diagnostic, mentorat et accès aux ateliers.
            </div>

            <div style="text-align:center; margin: 24px 0;">
              <a href="${trackUrl}" class="btn-primary">Consulter mon dossier d'admission →</a>
            </div>
          ` : `
            <h1>Information concernant votre candidature</h1>
            <p style="font-size:14px; line-height:1.6; color:#334155;">
              Bonjour <strong>${data.recipientName}</strong>,<br/><br/>
              Nous tenons à vous remercier sincèrement pour l'intérêt que vous portez à l'incubateur <strong>IML Digit</strong> et pour le temps consacré à la présentation de votre projet <strong>${data.companyName}</strong>.
            </p>

            <div class="card">
              <div class="detail-row">
                <span class="label">N° de Dossier :</span>
                <span class="val">${data.referenceCode}</span>
              </div>
              <div class="detail-row">
                <span class="label">Projet :</span>
                <span class="val">${data.companyName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Statut :</span>
                <span class="val" style="color:#64748b;">Non retenu pour cette cohorte</span>
              </div>
            </div>

            <div class="rejected-box">
              Après examen attentif de l'ensemble des candidatures et compte tenu du nombre limité de places disponibles pour cette session, le Comité de sélection n'a malheureusement pas pu retenir votre dossier pour cette cohorte.<br/><br/>
              Cette décision ne remet nullement en question la valeur de votre initiative. Nous vous encourageons chaleureusement à poursuivre la maturation de votre projet et à <strong>repostuler lors de notre prochain appel à candidatures</strong>.
            </div>

            <div style="text-align:center; margin: 24px 0;">
              <a href="${trackUrl}" class="btn-primary">Consulter mon espace de suivi →</a>
            </div>
          `}

          ${data.notes ? `
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; font-size:12.5px; color:#475569; margin-top:16px;">
              <strong>Observation du Comité :</strong><br/>
              ${data.notes}
            </div>
          ` : ''}

          <div class="footer">
            <strong>Incubateur & Accélérateur d'Entreprises IML Digit</strong><br/>
            Immeuble Espace PME, Quartier Awendjé, Libreville, Gabon • imlGabon2@gmail.com<br/>
            Ceci est un message officiel transmis suite aux délibérations du Comité de sélection.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: sender,
      to: data.recipientEmail,
      subject,
      text: isAccepted
        ? `Félicitations ${data.recipientName} ! Votre candidature ${data.referenceCode} pour ${data.companyName} a été retenue par l'incubateur IML Digit. Suivi: ${trackUrl}`
        : `Bonjour ${data.recipientName}, suite aux délibérations du Comité IML Digit, votre dossier ${data.referenceCode} n'a pas pu être retenu pour cette session. Suivi: ${trackUrl}`,
      html: htmlContent,
    });
    console.log(`[EMAIL DÉCISION CANDIDATURE EXPÉDIÉ] Envoyé à ${data.recipientEmail} (${data.decision})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR EMAIL DÉCISION CANDIDATURE] Échec d'envoi à ${data.recipientEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

export interface RoomBookingNotificationData {
  recipientEmail: string;
  recipientName: string;
  organization?: string | null;
  reference: string;
  action: 'CONFIRMED' | 'RESCHEDULED' | 'REJECTED';
  startAt: Date;
  endAt: Date;
  eventType: string;
  attendees: number;
  notes?: string | null;
  reason?: string | null;
}

/**
 * Envoie un email officiel de confirmation, report ou refus d'une réservation de salle
 */
export async function sendRoomBookingNotificationEmail(data: RoomBookingNotificationData): Promise<SendEmailResult> {
  const transporter = getTransporter();

  const isConfirmed = data.action === 'CONFIRMED';
  const isRescheduled = data.action === 'RESCHEDULED';
  const isRejected = data.action === 'REJECTED';

  const dateStr = data.startAt.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = `${String(data.startAt.getHours()).padStart(2, '0')}:${String(data.startAt.getMinutes()).padStart(2, '0')} à ${String(data.endAt.getHours()).padStart(2, '0')}:${String(data.endAt.getMinutes()).padStart(2, '0')}`;
  const durationHours = Math.max(1, Math.round((data.endAt.getTime() - data.startAt.getTime()) / 3600_000));

  let subject = `[IML Digit] Confirmation de votre réservation de salle (${data.reference})`;
  let statusBadge = `<span style="background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; padding:6px 14px; border-radius:999px; font-weight:700; font-size:13px;">Salle Verrouillée & Confirmée ✓</span>`;
  let title = `Votre réservation de salle est confirmée !`;
  let intro = `Bonjour <strong>${data.recipientName}</strong>,<br/><br/>Nous avons le plaisir de vous informer que votre demande de réservation de la salle de formation IML Digit a été <strong>validée avec succès</strong>. La salle est désormais verrouillée pour votre événement aux dates et horaires convenus.`;

  if (isRescheduled) {
    subject = `[IML Digit] Mise à jour de votre réservation (${data.reference}) - Nouveau créneau`;
    statusBadge = `<span style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; padding:6px 14px; border-radius:999px; font-weight:700; font-size:13px;">Créneau Reprogrammé 📅</span>`;
    title = `Votre réservation a été décalée / reprogrammée`;
    intro = `Bonjour <strong>${data.recipientName}</strong>,<br/><br/>Suite aux impératifs d'organisation, votre réservation de salle IML Digit a été <strong>reprogrammée sur un nouveau créneau</strong> comme convenu.`;
  } else if (isRejected) {
    subject = `[IML Digit] Information concernant votre demande de réservation (${data.reference})`;
    statusBadge = `<span style="background:#fef2f2; color:#991b1b; border:1px solid #fecaca; padding:6px 14px; border-radius:999px; font-weight:700; font-size:13px;">Demande Non Retenue</span>`;
    title = `Demande de réservation non retenue`;
    intro = `Bonjour <strong>${data.recipientName}</strong>,<br/><br/>Nous vous remercions pour votre intérêt. Nous sommes au regret de vous informer que la salle n'est pas disponible pour le créneau sollicité ou que votre demande n'a pas pu être retenue.`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .logo { font-size: 24px; font-weight: 800; color: #1e3a5f; margin-bottom: 24px; }
          .logo span { color: #f06553; }
          h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 16px 0 12px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13.5px; }
          .field:last-child { border-bottom: none; }
          .field-label { color: #64748b; font-weight: 500; }
          .field-value { color: #0f172a; font-weight: 700; text-align: right; }
          .equipment-list { margin: 12px 0 0 0; padding-left: 20px; font-size: 13px; color: #475569; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 36px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <div class="logo">iml digit<span>.</span></div>
            <div>${statusBadge}</div>
          </div>

          <h1>${title}</h1>
          <p style="font-size: 14.5px; color: #334155;">${intro}</p>

          <div class="card">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #f06553; letter-spacing: 0.5px; margin-bottom: 12px;">
              Récapitulatif de la réservation
            </div>
            <div class="field">
              <span class="field-label">Référence officielle</span>
              <span class="field-value">${data.reference}</span>
            </div>
            <div class="field">
              <span class="field-label">Organisateur</span>
              <span class="field-value">${data.recipientName} ${data.organization ? `(${data.organization})` : ''}</span>
            </div>
            <div class="field">
              <span class="field-label">Date de l'événement</span>
              <span class="field-value" style="color:#0f172a;">${dateStr}</span>
            </div>
            <div class="field">
              <span class="field-label">Créneau horaire</span>
              <span class="field-value">${timeStr} (${durationHours}h)</span>
            </div>
            <div class="field">
              <span class="field-label">Type d'événement</span>
              <span class="field-value">${data.eventType}</span>
            </div>
            <div class="field">
              <span class="field-label">Nombre de participants</span>
              <span class="field-value">${data.attendees} personnes</span>
            </div>
            <div class="field">
              <span class="field-label">Lieu & Adresse</span>
              <span class="field-value" style="color:#0f172a;">Hub IML Digit - Awendjé, Libreville</span>
            </div>
          </div>

          ${data.reason ? `
            <div style="background:#fffbeb; border:1px solid #fef3c7; border-radius:10px; padding:14px; font-size:13px; color:#92400e; margin-bottom:18px;">
              <strong>Note de l'équipe IML Digit :</strong><br/>
              ${data.reason}
            </div>
          ` : ''}

          ${!isRejected ? `
            <div style="background:#f1f5f9; border-radius:10px; padding:16px; margin-bottom:20px;">
              <strong style="font-size:13px; color:#1e293b;">Équipements inclus sans supplément :</strong>
              <ul class="equipment-list">
                <li>Vidéoprojecteur HD & connexion sans-fil / HDMI</li>
                <li>Système de visioconférence HD (Zoom, Meet, Teams)</li>
                <li>Wifi fibre optique très haut débit dédié</li>
                <li>Climatisation silencieuse réversible</li>
                <li>Paperboard, marqueurs et multiprises pour tous les participants</li>
              </ul>
            </div>

            <p style="font-size:13px; color:#64748b;">
              Pour toute question ou aménagement spécifique, vous pouvez joindre la conciergerie IML Digit au <strong>+241 077 00 00 00</strong> ou répondre directement à ce message.
            </p>
          ` : ''}

          <div class="footer">
            <strong>IML Digit - Espace Entrepreneuriat & Formations</strong><br/>
            Awendjé, Libreville, Gabon • contact@imldigit.com<br/>
            Ceci est un document officiel de réservation de salle.
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SIMULATION EMAIL RÉSERVATION SALLE] Destinataire: ${data.recipientEmail}`);
    console.log(`[SIMULATION EMAIL RÉSERVATION SALLE] Sujet: ${subject}`);
    console.log(`[SIMULATION EMAIL RÉSERVATION SALLE] Action: ${data.action} (Réf: ${data.reference})`);
    console.log(`[SIMULATION EMAIL RÉSERVATION SALLE] Date: ${dateStr} (${timeStr})`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.EMAIL_FROM || 'IML Digit <no-reply@imldigit.ga>';
  try {
    await transporter.sendMail({
      from: sender,
      to: data.recipientEmail,
      subject,
      text: `${title} - Réf: ${data.reference}. Date: ${dateStr} de ${timeStr}. Lieu: Hub IML Digit, Awendjé, Libreville.`,
      html: htmlContent,
    });
    console.log(`[EMAIL RÉSERVATION SALLE ENVOYÉ] Envoyé à ${data.recipientEmail} (${data.action} - ${data.reference})`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR EMAIL RÉSERVATION SALLE] Échec d'envoi à ${data.recipientEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

export interface RoomBookingAdminAlertData {
  booking: {
    id: string;
    reference: string;
    organizerName: string;
    organization?: string | null;
    email: string;
    phone: string;
    eventType: string;
    attendees: number;
    startAt: Date;
    endAt: Date;
    notes?: string | null;
    source?: string;
  };
}

/**
 * Alerte immédiatement la direction par e-mail lorsqu'une nouvelle réservation de salle est soumise
 */
export async function sendRoomBookingAdminAlertEmail(data: RoomBookingAdminAlertData): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const b = data.booking;
  const adminEmail = process.env.DIRECTION_EMAIL || process.env.ADMIN_EMAIL || 'direction@imldigit.ga';

  const dateStr = new Date(b.startAt).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = `${String(new Date(b.startAt).getHours()).padStart(2, '0')}:${String(new Date(b.startAt).getMinutes()).padStart(2, '0')} à ${String(new Date(b.endAt).getHours()).padStart(2, '0')}:${String(new Date(b.endAt).getMinutes()).padStart(2, '0')}`;

  const subject = `🚨 [Direction IML] Nouvelle demande de réservation de salle (${b.reference}) - ${b.organizerName}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 24px; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .badge { display: inline-block; background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 8px 0 16px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .field { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13.5px; }
          .field:last-child { border-bottom: none; }
          .btn { display: inline-block; background: #FF5B37; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 20px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">🚨 Alerte Direction IML Digit</div>
          <h1>Nouvelle réservation de salle à traiter</h1>
          <p>Une nouvelle demande de réservation de la salle de formation vient d'être enregistrée et nécessite le suivi de la direction.</p>

          <div class="card">
            <div class="field"><span>Référence :</span> <strong>${b.reference}</strong></div>
            <div class="field"><span>Organisateur :</span> <strong>${b.organizerName} ${b.organization ? `(${b.organization})` : ''}</strong></div>
            <div class="field"><span>Téléphone :</span> <strong>${b.phone}</strong></div>
            <div class="field"><span>Email :</span> <strong>${b.email}</strong></div>
            <div class="field"><span>Type d'activité :</span> <strong>${b.eventType}</strong></div>
            <div class="field"><span>Date & Horaires :</span> <strong>${dateStr} (${timeStr})</strong></div>
            <div class="field"><span>Nombre de participants :</span> <strong>${b.attendees} personnes</strong></div>
            <div class="field"><span>Canal de réservation :</span> <strong>${b.source || 'Formulaire web public'}</strong></div>
            ${b.notes ? `<div style="padding-top:10px; font-size:12.5px; color:#475569;"><strong>Notes / Besoins :</strong> ${b.notes}</div>` : ''}
          </div>

          <p style="font-size:13px; color:#64748b;">
            Veuillez vous connecter à la plateforme pour valider et verrouiller la salle ou contacter l'organisateur.
          </p>

          <div style="text-align:center;">
            <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard?tab=salle" class="btn">
              Accéder au suivi dans le tableau de bord →
            </a>
          </div>

          <div class="footer">
            <strong>Plateforme IML Digit - Direction & Administration</strong><br/>
            Notification automatique instantanée
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[ALERTE DIRECTION NOUVELLE RÉSERVATION] Destinataire: ${adminEmail}`);
    console.log(`[ALERTE DIRECTION NOUVELLE RÉSERVATION] Organisateur: ${b.organizerName} (${b.phone})`);
    console.log(`[ALERTE DIRECTION NOUVELLE RÉSERVATION] Date: ${dateStr} (${timeStr})`);
    console.log(`[ALERTE DIRECTION NOUVELLE RÉSERVATION] Réf: ${b.reference}`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  const sender = process.env.EMAIL_FROM || 'IML Digit <no-reply@imldigit.ga>';
  try {
    await transporter.sendMail({
      from: sender,
      to: adminEmail,
      subject,
      text: `Nouvelle réservation de salle IML - Réf: ${b.reference}. Organisateur: ${b.organizerName} (${b.phone}). Date: ${dateStr} de ${timeStr}.`,
      html: htmlContent,
    });
    console.log(`[ALERTE DIRECTION SALLE ENVOYÉE] Réf ${b.reference} transmise à ${adminEmail}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR ALERTE DIRECTION SALLE] Échec d'envoi à ${adminEmail}:`, error);
    return { success: false, message: error?.message };
  }
}

