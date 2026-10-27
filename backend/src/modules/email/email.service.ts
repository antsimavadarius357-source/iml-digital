import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  message?: string;
}

// Configuration du transporteur Nodemailer
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (process.env.SMTP_SERVICE === 'gmail' || (user && user.endsWith('@gmail.com'))) {
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
              <span class="val">${isVideo ? 'Visioconférence' : data.locationOrUrl}</span>
            </div>
            ${isVideo ? `
              <div style="margin-top:14px; text-align:center;">
                <a href="${data.locationOrUrl}" target="_blank" class="action-btn">Rejoindre la visioconférence</a>
                <p style="font-size:12px; color:#64748b; margin-top:8px;">Lien direct : <a href="${data.locationOrUrl}">${data.locationOrUrl}</a></p>
              </div>
            ` : ''}
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
      text: `Bonjour ${data.recipientName},\n\nVotre rendez-vous avec ${data.coachName} est fixé le ${data.datetime} (${isVideo ? 'Visioconférence: ' + data.locationOrUrl : 'Lieu: ' + data.locationOrUrl}).\n\nÉquipe IML Digit`,
      html: htmlContent,
    });
    console.log(`[EMAIL CONVOCATION EXPÉDIÉ] Envoyé à ${data.recipientEmail}`);
    return { success: true, simulated: false };
  } catch (error: any) {
    console.error(`[ERREUR EMAIL CONVOCATION] Échec d'envoi à ${data.recipientEmail}:`, error);
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
            Quartier B2, Libreville, Gabon • contact@imldigit.ga<br/>
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
