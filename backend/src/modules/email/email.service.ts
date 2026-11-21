import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  simulated?: boolean;
  message?: string;
}

const VERCEL_RELAY_URL = process.env.EMAIL_RELAY_URL || 'https://iml-digital.vercel.app/api/send-email';
const VERCEL_RELAY_SECRET = 'iml-digit-vercel-smtp-relay-2026-sec';

function getAppBaseUrl(): string {
  const raw = (process.env.FRONTEND_URL || process.env.APP_URL || 'https://iml-digital.vercel.app').trim().replace(/\/+$/, '');
  if (raw.includes('localhost')) {
    return 'https://iml-digital.vercel.app';
  }
  return raw;
}

// Configuration du transporteur Nodemailer (secours local)
function getTransporter() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const pass = rawPass.trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return null;
  }

  if (process.env.SMTP_SERVICE === 'gmail' || user.endsWith('@gmail.com') || host.includes('gmail')) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  return null;
}

function getSender(label: string = 'IML Digit'): string {
  const cleanLabel = label.replace(/"/g, '');
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  if (user) {
    return `"${cleanLabel}" <${user}>`;
  }
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  return `"${cleanLabel}" <no-reply@imldigit.com>`;
}

export function isSmtpConfigured(): boolean {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  return Boolean(user && rawPass.trim());
}

export function getSmtpInfo() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const isConfigured = Boolean(user && rawPass.trim());
  const maskedUser = user ? user.replace(/^(.)(.*)(@.*)$/, (_, a, _b, c) => `${a}***${c}`) : null;
  return {
    isConfigured,
    mode: isConfigured ? 'real' : 'simulation',
    user: maskedUser,
    from: user ? `"IML Digit" <${user}>` : (process.env.SMTP_FROM || 'IML Digit <no-reply@imldigit.com>'),
    relay: VERCEL_RELAY_URL,
  };
}

/**
 * Envoi centralisé d'e-mail :
 * 1) Passe d'abord par le relais HTTPS Vercel (port 443) pour contourner le blocage des ports SMTP 465/587 sur Render Free Tier.
 * 2) Repli sur Nodemailer direct en cas d'exécution locale hors-ligne.
 */
async function deliverMail(opts: {
  fromLabel?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendEmailResult> {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_PASS || '';
  const pass = rawPass.trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return {
      success: true,
      simulated: true,
      message: "Serveur SMTP non configuré (mode simulation).",
    };
  }

  const fromLabel = opts.fromLabel || 'IML Digit';
  const sender = getSender(fromLabel);

  // 1. Tentative prioritaire via le Relais HTTPS Vercel (port 443 jamais bloqué par Render)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    const relayRes = await fetch(VERCEL_RELAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-iml-relay-secret': VERCEL_RELAY_SECRET,
      },
      body: JSON.stringify({
        smtpUser: user,
        smtpPass: pass,
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: 465,
        fromLabel,
        from: sender,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (relayRes.ok) {
      const json: any = await relayRes.json().catch(() => ({}));
      if (json && json.success) {
        console.log(`[EMAIL RELAIS HTTPS VERCEL OK] Expédié avec succès à ${opts.to} (${opts.subject})`);
        return {
          success: true,
          simulated: false,
          message: json.message || `E-mail expédié avec succès à ${opts.to}`,
        };
      }
    } else {
      const errText = await relayRes.text().catch(() => '');
      console.warn(`[EMAIL RELAIS HTTPS AVERTISSEMENT] HTTP ${relayRes.status}: ${errText}`);
    }
  } catch (relayErr: any) {
    console.warn(`[EMAIL RELAIS HTTPS FALLBACK] Passage au SMTP direct:`, relayErr?.message);
  }

  // 2. Secours : connexion SMTP directe (utile en développement local)
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      simulated: true,
      message: 'Transporteur SMTP indisponible',
    };
  }

  try {
    await transporter.sendMail({
      from: sender,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.log(`[EMAIL SMTP DIRECT OK] Expédié avec succès à ${opts.to}`);
    return {
      success: true,
      simulated: false,
      message: `E-mail expédié avec succès à ${opts.to}`,
    };
  } catch (err: any) {
    console.error(`[ERREUR ENVOI EMAIL] Échec à ${opts.to}:`, err?.message);
    return {
      success: false,
      simulated: false,
      message: err?.message || "Erreur lors de l'envoi de l'e-mail",
    };
  }
}

export async function sendTestEmail(toEmail: string): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return {
      success: false,
      simulated: true,
      message: "Serveur SMTP non configuré. Renseignez GMAIL_USER et GMAIL_PASS sur Render pour activer l'envoi réel.",
    };
  }

  return deliverMail({
    fromLabel: 'IML Digit',
    to: toEmail,
    subject: `[TEST RÉEL] Validation de connexion messagerie IML Digit`,
    text: `Félicitations !\n\nLa connexion messagerie de la plateforme IML Digit est parfaitement opérationnelle.\nLes convocations (avec lien vidéo direct ou lieu sur place), validations de documents et décisions d'admission seront désormais expédiées en temps réel sur le téléphone de vos bénéficiaires.\n\nÉquipe IML Digit`,
    html: `
      <div style="font-family:sans-serif; max-width:540px; margin:0 auto; padding:28px; border:1px solid #e2e8f0; border-radius:16px; background:#ffffff;">
        <h2 style="color:#23c3b1; margin-top:0;">iml digit<span style="color:#0f172a;">.</span></h2>
        <h3 style="color:#0f172a;">✓ Connexion e-mail temps réel opérationnelle</h3>
        <p style="color:#475569; font-size:14px; line-height:1.6;">
          Félicitations ! Votre messagerie IML Digit est désormais connectée via le relais sécurisé HTTPS.
          Vos bénéficiaires recevront directement dans leur boîte e-mail sur leur téléphone :
        </p>
        <ul style="color:#334155; font-size:13.5px; line-height:1.7;">
          <li><strong>Leur convocation d'entretien</strong> avec le <strong>lien vidéo cliquable en 1 clic</strong> (ou l'adresse exacte sur place)</li>
          <li><strong>Le statut de leurs documents</strong> et pièces justificatives</li>
          <li><strong>Leur décision officielle d'admission</strong> et numéro de dossier</li>
        </ul>
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; color:#166534; padding:12px 16px; border-radius:10px; font-weight:600; font-size:13px; margin:20px 0;">
          ✓ Délivrance e-mail vérifiée avec succès sur votre boîte de réception
        </div>
        <p style="font-size:12px; color:#94a3b8; text-align:center; border-top:1px solid #f1f5f9; padding-top:14px;">
          Plateforme IML Digit • République Gabonaise
        </p>
      </div>
    `,
  });
}

export function extractVideoUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const match = raw.match(/(https?:\/\/[^\s\]>"')]+)/i);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Envoie un code OTP à 6 chiffres par email
 */
export async function sendOtpEmail(toEmail: string, code: string): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL OTP] Destinataire: ${toEmail} | Code: ${code}`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP non configuré dans .env : code simulé en console.',
    };
  }

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
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
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

  return deliverMail({
    fromLabel: 'iml digit',
    to: toEmail,
    subject: `${code} est votre code de vérification iml digit`,
    text: `Votre code de vérification iml digit est : ${code}. Il expire dans 10 minutes.`,
    html: htmlContent,
  });
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
  const subject = `[Mission IML Digit] Dossier d'accompagnement : ${data.companyName || data.beneficiaryName}`;

  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL MISSION COACH] Destinataire: ${data.coachEmail} | Sujet: ${subject}`);
    return {
      success: true,
      simulated: true,
      message: 'SMTP non configuré : briefing coach simulé avec succès.',
    };
  }

  const loginUrl = `${getAppBaseUrl()}/connexion`;
  const extractedVideo = extractVideoUrl(data.appointmentLocation);

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
            ${data.beneficiaryPhone || data.beneficiaryEmail ? `
            <div class="row">
              <span class="label">Contact bénéficiaire :</span>
              <span class="value">${data.beneficiaryPhone || ''} ${data.beneficiaryEmail ? `• ${data.beneficiaryEmail}` : ''}</span>
            </div>` : ''}
          </div>

          ${data.objectives ? `
          <div class="objectives-box">
            <strong>🎯 Objectifs & Besoins prioritaires :</strong><br/>
            ${data.objectives}
          </div>` : ''}

          ${data.appointmentDatetime ? `
          <div class="appt-box">
            <strong>📅 Séance planifiée :</strong> ${data.appointmentDatetime}<br/>
            ${extractedVideo
              ? `<strong>🎥 Lien Visio Direct :</strong> <a href="${extractedVideo}" style="color:#0f766e; font-weight:700;">${extractedVideo}</a>`
              : `<strong>📍 Lieu :</strong> ${data.appointmentLocation || 'Siège IML Digit - Espace PME, Libreville'}`
            }
          </div>` : ''}

          <p style="font-size:13px; color:#475569;">
            Votre conseiller référent IML est <strong>${data.agentName}</strong>${data.agentEmail ? ` (<a href="mailto:${data.agentEmail}">${data.agentEmail}</a>)` : ''}.
          </p>

          <div style="text-align: center; margin: 26px 0;">
            ${extractedVideo ? `
              <a href="${extractedVideo}" style="display:inline-block; background-color:#f06553; color:#ffffff !important; font-weight:700; font-size:14px; padding:12px 24px; border-radius:10px; text-decoration:none; margin-right:8px; margin-bottom:8px;">
                🎥 Rejoindre la Visioconférence
              </a>
            ` : ''}
            <a href="${loginUrl}" style="display:inline-block; background-color:#23c3b1; color:#ffffff !important; font-weight:700; font-size:14px; padding:12px 24px; border-radius:10px; text-decoration:none;">
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

  return deliverMail({
    fromLabel: 'IML Digit Coordination',
    to: data.coachEmail,
    subject,
    text: `Bonjour ${data.coachName},\n\nVous avez été désigné pour accompagner ${data.companyName || data.beneficiaryName}.\nSéance: ${data.appointmentDatetime || 'À planifier'}\n${extractedVideo ? `Lien vidéo direct: ${extractedVideo}\n` : `Lieu: ${data.appointmentLocation || 'Siège IML Digit'}\n`}Objectifs: ${data.objectives || 'Non renseignés'}\nRéférent: ${data.agentName}\n\nÉquipe IML Digit`,
    html: htmlContent,
  });
}

export interface AppointmentNotificationData {
  recipientEmail: string;
  recipientName: string;
  coachName: string;
  coachEmail?: string;
  datetime: string;
  durationMinutes: number;
  sessionType: 'video' | 'in_person';
  locationOrUrl: string;
  videoUrl?: string;
  notes?: string;
  referenceCode?: string;
  companyName?: string;
  applicationStatus?: string;
  documents?: Array<{ title: string; category?: string; status?: string }>;
}

/**
 * Envoie au bénéficiaire l'E-mail Officiel Complet de A à Z :
 * - Statut d'admission & N° de dossier
 * - État des documents déposés
 * - Convocation au rendez-vous d'entretien
 * - Lien vidéo direct cliquable en 1 clic (si en ligne) OU Adresse physique & pièces à fournir (si sur place)
 */
export async function sendAppointmentNotificationEmail(data: AppointmentNotificationData): Promise<SendEmailResult> {
  const isVideo = data.sessionType === 'video' || Boolean(extractVideoUrl(data.locationOrUrl)) || Boolean(data.videoUrl);
  const extractedUrl = data.videoUrl || extractVideoUrl(data.locationOrUrl);
  const safeRef = (data.referenceCode || 'Session').replace(/[^a-zA-Z0-9-]/g, '');
  const effectiveVideoUrl = isVideo
    ? (extractedUrl || `https://meet.jit.si/IML-Digit-${safeRef}`)
    : null;

  // Nettoyer l'affichage du lieu présentiel (enlever la note si elle a été concaténée avec " - ")
  let cleanInPersonLocation = (data.locationOrUrl || 'Siège IML Digit - Immeuble Espace PME, Quartier Awendjé, Libreville, Gabon').trim();
  if (!isVideo && data.notes && cleanInPersonLocation.endsWith(` - ${data.notes}`)) {
    cleanInPersonLocation = cleanInPersonLocation.slice(0, -(` - ${data.notes}`.length)).trim();
  }

  const refBadge = data.referenceCode ? ` (${data.referenceCode})` : '';
  const subject = isVideo
    ? `🎥 [Convocation & Lien Vidéo] Entretien IML Digit${refBadge} - ${data.datetime}`
    : `📍 [Convocation Sur Place] Entretien IML Digit${refBadge} - ${data.datetime}`;

  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL CONVOCATION COMPLÈTE] Destinataire: ${data.recipientEmail} | Format: ${isVideo ? 'VISIO' : 'SUR PLACE'} | Lien/Lieu: ${effectiveVideoUrl || cleanInPersonLocation}`);
    return { success: true, simulated: true };
  }

  const appBase = getAppBaseUrl();
  const trackUrl = data.referenceCode
    ? `${appBase}/suivi?code=${encodeURIComponent(data.referenceCode)}`
    : `${appBase}/suivi?code=${encodeURIComponent(data.recipientEmail)}`;

  const statusLabel =
    data.applicationStatus === 'ACCEPTEE' || data.applicationStatus === 'ACTIF'
      ? '✅ Dossier Admis en Programme d’Accompagnement'
      : '📋 Dossier Enregistré — Entretien d’Évaluation & Cadrage';

  const docsListHtml =
    data.documents && data.documents.length > 0
      ? data.documents
          .map((d) => {
            const isVal = d.status === 'VALIDE';
            const badge = isVal
              ? `<span style="background:#dcfce7; color:#15803d; font-weight:700; font-size:11px; padding:2px 8px; border-radius:99px;">✓ Validé</span>`
              : `<span style="background:#fef3c7; color:#b45309; font-weight:700; font-size:11px; padding:2px 8px; border-radius:99px;">⏳ Reçu / En revue</span>`;
            return `<li style="margin-bottom:6px; font-size:13px; color:#334155;"><strong>${d.title}</strong> ${d.category ? `<span style="color:#64748b;">(${d.category})</span>` : ''} — ${badge}</li>`;
          })
          .join('')
      : `<li style="font-size:13px; color:#334155;">Dossier administratif et fiche projet enregistrés auprès de la coordination IML Digit — <span style="background:#dcfce7; color:#15803d; font-weight:700; font-size:11px; padding:2px 8px; border-radius:99px;">✓ Enregistré</span></li>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 16px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 18px 0; }
          .detail-row { margin-bottom: 10px; font-size: 13.5px; line-height: 1.5; }
          .label { color: #64748b; font-weight: 600; display: inline-block; width: 155px; }
          .val { color: #0f172a; font-weight: 700; }
          .video-box { background: #f0fdfa; border: 2px solid #14b8a6; border-radius: 14px; padding: 20px; margin: 22px 0; text-align: center; }
          .onsite-box { background: #fff7ed; border: 2px solid #f97316; border-radius: 14px; padding: 20px; margin: 22px 0; }
          .btn-video { display: inline-block; background-color: #f06553; color: #ffffff !important; font-weight: 800; font-size: 15px; padding: 14px 28px; border-radius: 12px; text-decoration: none; margin: 12px 0; box-shadow: 0 4px 12px rgba(240, 101, 83, 0.3); }
          .btn-secondary { display: inline-block; background-color: #0f172a; color: #ffffff !important; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 10px; text-decoration: none; margin-top: 8px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 26px; border-top: 1px solid #f1f5f9; padding-top: 16px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span style="float:right; background:${isVideo ? '#ccfbf1' : '#ffedd5'}; color:${isVideo ? '#0f766e' : '#c2410c'}; font-weight:800; font-size:11px; padding:5px 12px; border-radius:999px; text-transform:uppercase;">
              ${isVideo ? '🎥 Entretien Vidéo en Ligne' : '📍 Entretien Sur Place'}
            </span>
            <div class="logo">iml digit<span style="color:#f06553;">.</span></div>
          </div>

          <h2 style="margin-top:0; color:#0f172a; font-size:20px;">Convocation officielle & Récapitulatif complet de votre dossier</h2>
          <p style="font-size:14px; color:#334155; line-height:1.6;">
            Bonjour <strong>${data.recipientName}</strong>,<br/>
            Vous trouverez ci-dessous <strong>la totalité des informations de votre dossier</strong> (état d'admission, pièces justificatives et convocation à votre entretien) directement dans cet e-mail.
          </p>

          <!-- 1. ENCADRÉ PRINCIPAL : LIEN VIDÉO DIRECT OU ADRESSE SUR PLACE -->
          ${isVideo ? `
            <div class="video-box">
              <div style="font-size:12px; font-weight:800; color:#0f766e; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                🎥 Salon de Visioconférence Direct — Sans mot de passe requis
              </div>
              <div style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:10px;">
                ${data.datetime} (${data.durationMinutes} min)
              </div>
              <a href="${effectiveVideoUrl}" target="_blank" class="btn-video">
                🎥 REJOINDRE L'ENTRETIEN VIDÉO EN DIRECT
              </a>
              <div style="margin-top:12px; font-size:12.5px; color:#334155; word-break:break-all; background:#ffffff; padding:10px 12px; border-radius:8px; border:1px solid #99f6e4;">
                <strong>Lien direct à ouvrir sur votre téléphone ou ordinateur :</strong><br/>
                <a href="${effectiveVideoUrl}" target="_blank" style="color:#0d9488; font-weight:700;">${effectiveVideoUrl}</a>
              </div>
            </div>
          ` : `
            <div class="onsite-box">
              <div style="font-size:12px; font-weight:800; color:#c2410c; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">
                📍 Convocation en Présentiel — Sur Place au Siège IML Digit
              </div>
              <div style="font-size:15px; font-weight:800; color:#0f172a; margin-bottom:10px;">
                📅 ${data.datetime} (${data.durationMinutes} min)
              </div>
              <div style="font-size:13.5px; color:#1e293b; background:#ffffff; padding:12px 14px; border-radius:10px; border:1px solid #fed7aa; margin-bottom:12px;">
                <strong>📍 Lieu exact de l'entretien :</strong><br/>
                ${cleanInPersonLocation}
              </div>
              <div style="font-size:12.5px; color:#7c2d12; line-height:1.6;">
                <strong>📋 Pièces et documents à présenter à l'accueil le jour du rendez-vous :</strong>
                <ul style="margin:6px 0 0 0; padding-left:18px;">
                  <li>Votre pièce d'identité en cours de validité</li>
                  <li>Vos documents de projet (Business Plan, présentation ou statuts si disponibles)</li>
                  <li>Ce courriel de convocation (sur votre téléphone ou imprimé)</li>
                </ul>
              </div>
            </div>
          `}

          <!-- 2. DÉTAILS DU RENDEZ-VOUS & DU COACH -->
          <div class="card">
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#0f766e; letter-spacing:0.5px; margin-bottom:12px;">
              1. Détails de votre entretien
            </div>
            <div class="detail-row">
              <span class="label">📅 Date & Heure :</span>
              <span class="val">${data.datetime}</span>
            </div>
            <div class="detail-row">
              <span class="label">⏱ Durée prévue :</span>
              <span class="val">${data.durationMinutes} minutes</span>
            </div>
            <div class="detail-row">
              <span class="label">👨‍💼 Coach / Expert :</span>
              <span class="val">${data.coachName}${data.coachEmail ? ` (${data.coachEmail})` : ''}</span>
            </div>
            <div class="detail-row">
              <span class="label">${isVideo ? '🌐 Modalité :' : '📍 Lieu sur place :'}</span>
              <span class="val">${isVideo ? 'En ligne par Visioconférence (lien ci-dessus)' : cleanInPersonLocation}</span>
            </div>
            ${data.notes ? `
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1; font-size:13px; color:#334155;">
              <strong>🎯 Ordre du jour & Objectifs de l'entretien :</strong><br/>
              ${data.notes}
            </div>` : ''}
          </div>

          <!-- 3. ÉTAT COMPLET DU DOSSIER : ADMISSION & DOCUMENTS -->
          <div class="card">
            <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#f06553; letter-spacing:0.5px; margin-bottom:12px;">
              2. État de votre dossier & Documents déposés
            </div>
            ${data.referenceCode ? `
            <div class="detail-row">
              <span class="label">📁 N° de Dossier :</span>
              <span class="val">${data.referenceCode}</span>
            </div>` : ''}
            ${data.companyName ? `
            <div class="detail-row">
              <span class="label">🏢 Projet / Structure :</span>
              <span class="val">${data.companyName}</span>
            </div>` : ''}
            <div class="detail-row">
              <span class="label">📌 Statut du dossier :</span>
              <span class="val" style="color:#0f766e;">${statusLabel}</span>
            </div>
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1;">
              <strong style="font-size:12.5px; color:#475569; display:block; margin-bottom:6px;">📄 Pièces & Documents rattachés à votre dossier :</strong>
              <ul style="margin:0; padding-left:18px;">
                ${docsListHtml}
              </ul>
            </div>
          </div>

          <div style="text-align:center; margin-top:20px;">
            <a href="${trackUrl}" target="_blank" class="btn-secondary">
              Consulter l'avancement visuel de mon dossier en ligne →
            </a>
          </div>

          <div class="footer">
            <strong>Incubateur & Accélérateur d'Entreprises IML Digit</strong><br/>
            Immeuble Espace PME, Quartier Awendjé, Libreville, Gabon<br/>
            En cas d'empêchement, répondez directement à cet e-mail pour prévenir votre coach référent.
          </div>
        </div>
      </body>
    </html>
  `;

  const plainText = [
    `Bonjour ${data.recipientName},`,
    ``,
    `Voici la convocation officielle et le récapitulatif complet de votre dossier IML Digit :`,
    data.referenceCode ? `- N° de Dossier : ${data.referenceCode}` : '',
    data.companyName ? `- Projet / Structure : ${data.companyName}` : '',
    `- Statut : ${statusLabel}`,
    `- Date & Heure de l'entretien : ${data.datetime} (${data.durationMinutes} min)`,
    `- Coach référent : ${data.coachName}`,
    isVideo
      ? `- ENTRETIEN VIDÉO EN LIGNE — Cliquez sur ce lien direct à l'heure du RDV : ${effectiveVideoUrl}`
      : `- ENTRETIEN SUR PLACE — Lieu : ${cleanInPersonLocation}`,
    data.notes ? `- Objectifs de la séance : ${data.notes}` : '',
    ``,
    `Suivi en ligne de votre dossier : ${trackUrl}`,
    ``,
    `Équipe IML Digit`,
  ].filter(Boolean).join('\n');

  return deliverMail({
    fromLabel: 'IML Digit Convocations',
    to: data.recipientEmail,
    subject,
    text: plainText,
    html: htmlContent,
  });
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
  const isVideo = data.sessionType === 'video' || Boolean(extractVideoUrl(data.locationOrUrl)) || Boolean(data.videoUrl);
  const effectiveVideoUrl = data.videoUrl || extractVideoUrl(data.locationOrUrl) || (isVideo ? `https://meet.jit.si/IML-Digit-Session` : null);

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

  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL RAPPEL AUTOMATIQUE] Destinataire: ${data.recipientEmail} | Sujet: ${subject}`);
    return { success: true, simulated: true };
  }

  const loginUrl = `${getAppBaseUrl()}/suivi`;

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
              <a href="${effectiveVideoUrl}" target="_blank" class="btn-visio">
                📹 Rejoindre directement la visioconférence →
              </a>
              <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
                Lien direct : <a href="${effectiveVideoUrl}" style="color:#f06553; font-weight:700;">${effectiveVideoUrl}</a>
              </p>
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
            <a href="${loginUrl}" target="_blank" class="btn-portal">Consulter le suivi de mon dossier →</a>
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

  return deliverMail({
    fromLabel: 'IML Digit Rappels',
    to: data.recipientEmail,
    subject,
    text: `Bonjour ${data.recipientName},\n\nRappel : votre entretien avec ${data.partnerName} a lieu ${countdownText} (${data.datetime}).\nModalité: ${isVideo ? 'Visioconférence (' + effectiveVideoUrl + ')' : data.locationOrUrl}\n\nÉquipe IML Digit`,
    html: htmlContent,
  });
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
  const dossierUrl = `${getAppBaseUrl()}/beneficiaires/${data.beneficiaryId}`;
  const subject = `🔔 [Circuit IML] Étape ${data.stepNumber} (${data.stepName}) validée pour ${data.companyName || data.beneficiaryName}`;

  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL ALERTE ÉTAPE AGENT] Destinataire: ${data.agentEmail} | Étape ${data.stepNumber}`);
    return { success: true, simulated: true };
  }

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

  return deliverMail({
    fromLabel: 'IML Digit Coordination',
    to: data.agentEmail,
    subject,
    text: `Bonjour ${data.agentName},\n\nLe coach ${data.coachName} a validé l'étape ${data.stepNumber} (${data.stepName}) pour ${data.beneficiaryName} (${data.companyName || ''}).\nAccéder au dossier: ${dossierUrl}\n\nÉquipe IML Digit`,
    html: htmlContent,
  });
}

export interface ApplicationDecisionEmailData {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  referenceCode: string;
  decision: 'ACCEPTEE' | 'REFUSEE';
  notes?: string;
  coachName?: string;
  appointmentDatetime?: string;
  appointmentLocation?: string;
  documents?: Array<{ title: string; status?: string }>;
}

/**
 * Envoie un email officiel au candidat pour l'informer de l'admission ou du refus de son dossier
 */
export async function sendApplicationDecisionEmail(data: ApplicationDecisionEmailData): Promise<SendEmailResult> {
  const isAccepted = data.decision === 'ACCEPTEE';
  const appBaseUrl = getAppBaseUrl();
  const trackUrl = `${appBaseUrl}/suivi?code=${encodeURIComponent(data.referenceCode)}`;
  const extractedVideo = extractVideoUrl(data.appointmentLocation);

  const subject = isAccepted
    ? `✅ [Admission Officielle IML Digit] Votre dossier (${data.referenceCode}) est retenu !`
    : `[IML Digit] Suite donnée à votre candidature (${data.referenceCode})`;

  if (!isSmtpConfigured()) {
    console.log(`[SIMULATION EMAIL DÉCISION CANDIDATURE] Destinataire: ${data.recipientEmail} | Décision: ${data.decision}`);
    return { success: true, simulated: true };
  }

  const docsHtml =
    data.documents && data.documents.length > 0
      ? `<div style="margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1;">
          <strong style="font-size:12.5px; color:#475569; display:block; margin-bottom:6px;">📄 Pièces & Documents validés au dossier :</strong>
          <ul style="margin:0; padding-left:18px; font-size:13px; color:#334155;">
            ${data.documents.map((d) => `<li><strong>${d.title}</strong> — <span style="color:#15803d; font-weight:700;">✓ Enregistré</span></li>`).join('')}
          </ul>
        </div>`
      : '';

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
          .label { color: #64748b; font-weight: 500; display: inline-block; width: 145px; }
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
              Le <strong>Comité de sélection et la Direction de l'incubateur IML Digit</strong> ont le plaisir de vous annoncer que votre dossier a été officiellement <strong>admis</strong> au sein de notre programme d'incubation et d'accompagnement.
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
              ${data.coachName ? `
              <div class="detail-row">
                <span class="label">Coach Référent :</span>
                <span class="val">${data.coachName}</span>
              </div>` : ''}
              <div class="detail-row">
                <span class="label">Décision finale :</span>
                <span class="val" style="color:#10b981;">✅ Admis en cohorte d'accompagnement</span>
              </div>
              ${docsHtml}
            </div>

            ${data.appointmentDatetime ? `
            <div style="background:#f0fdfa; border:2px solid #14b8a6; border-radius:12px; padding:16px; margin:18px 0;">
              <strong style="color:#0f766e; font-size:13.5px; display:block; margin-bottom:6px;">📅 Votre prochain rendez-vous d'entretien :</strong>
              <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:6px;">${data.appointmentDatetime}</div>
              ${extractedVideo
                ? `<a href="${extractedVideo}" target="_blank" style="display:inline-block; background:#f06553; color:#ffffff !important; font-weight:800; font-size:13px; padding:10px 20px; border-radius:8px; text-decoration:none; margin-top:6px;">🎥 Rejoindre l'entretien vidéo en direct</a>
                   <div style="font-size:12px; color:#0f766e; margin-top:6px;">Lien direct : ${extractedVideo}</div>`
                : `<div style="font-size:13px; color:#334155;">📍 Lieu : ${data.appointmentLocation || 'Siège IML Digit - Espace PME, Libreville'}</div>`
              }
            </div>` : ''}

            <div class="steps-box">
              <strong style="display:block; margin-bottom:6px;">🚀 Vos prochaines étapes d'intégration :</strong>
              1. Toutes vos convocations (avec lien vidéo direct ou lieu sur place) vous sont envoyées directement par e-mail.<br/>
              2. Définition de votre feuille de route avec votre Coach référent.<br/>
              3. Démarrage des séances de diagnostic, mentorat et accès aux ateliers.
            </div>

            <div style="text-align:center; margin: 24px 0;">
              <a href="${trackUrl}" class="btn-primary">Consulter l'état de mon dossier →</a>
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
            Immeuble Espace PME, Quartier Awendjé, Libreville, Gabon<br/>
            Ceci est un message officiel transmis suite aux délibérations du Comité de sélection.
          </div>
        </div>
      </body>
    </html>
  `;

  return deliverMail({
    fromLabel: 'Incubateur IML Digit',
    to: data.recipientEmail,
    subject,
    text: isAccepted
      ? `Félicitations ${data.recipientName} ! Votre candidature ${data.referenceCode} pour ${data.companyName} a été retenue par l'incubateur IML Digit.${extractedVideo ? `\nLien vidéo direct d'entretien : ${extractedVideo}` : ''}\nSuivi: ${trackUrl}`
      : `Bonjour ${data.recipientName}, suite aux délibérations du Comité IML Digit, votre dossier ${data.referenceCode} n'a pas pu être retenu pour cette session. Suivi: ${trackUrl}`,
    html: htmlContent,
  });
}

export interface ApplicationSubmittedEmailData {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  referenceCode: string;
  interviewPreference?: string;
  documents?: Array<{ title: string; category?: string }>;
}

/**
 * Envoie un e-mail immédiat au porteur dès le dépôt de son dossier avec son numéro de référence et la liste de ses documents
 */
export async function sendApplicationSubmittedEmail(data: ApplicationSubmittedEmailData): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return { success: true, simulated: true };
  }

  const appBaseUrl = getAppBaseUrl();
  const trackUrl = `${appBaseUrl}/suivi?code=${encodeURIComponent(data.referenceCode)}`;
  const isVideoPref = data.interviewPreference === 'VIDEO';
  const subject = `📁 [Accusé de réception IML Digit] Dossier ${data.referenceCode} enregistré (${data.companyName})`;

  const docsHtml =
    data.documents && data.documents.length > 0
      ? data.documents.map((d) => `<li style="margin-bottom:4px;"><strong>${d.title}</strong> (${d.category || 'Document projet'}) — <span style="color:#15803d; font-weight:700;">✓ Reçu</span></li>`).join('')
      : `<li>Fiche projet & Formulaire de candidature — <span style="color:#15803d; font-weight:700;">✓ Enregistrés</span></li>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 20px;">
            <span style="float:right; background:#e0f2fe; color:#0369a1; font-weight:800; font-size:11px; padding:4px 10px; border-radius:99px;">DOSSIER ENREGISTRÉ</span>
            <div style="font-size: 22px; font-weight: 900; color: #0f172a;">iml digit<span style="color:#f06553;">.</span></div>
          </div>

          <h2 style="margin-top:0; color:#0f172a;">Accusé de réception officiel de votre dossier</h2>
          <p style="font-size:14px; line-height:1.6; color:#334155;">
            Bonjour <strong>${data.recipientName}</strong>,<br/>
            Votre dossier de candidature pour <strong>${data.companyName}</strong> a bien été réceptionné par l'incubateur IML Digit.
          </p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px; margin:18px 0; font-size:13.5px;">
            <div style="margin-bottom:8px;"><strong>📁 Numéro officiel de dossier :</strong> <span style="color:#f06553; font-weight:800;">${data.referenceCode}</span></div>
            <div style="margin-bottom:8px;"><strong>🏢 Structure / Projet :</strong> ${data.companyName}</div>
            <div style="margin-bottom:8px;"><strong>🎯 Format d'entretien souhaité :</strong> ${isVideoPref ? '🎥 En ligne (Visioconférence)' : '📍 Sur place (Siège IML Digit - Espace PME)'}</div>
            <div style="margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1;">
              <strong>📄 Documents réceptionnés :</strong>
              <ul style="margin:6px 0 0 0; padding-left:18px;">${docsHtml}</ul>
            </div>
          </div>

          <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:14px; border-radius:8px; font-size:13px; color:#065f46; margin:18px 0;">
            <strong>📬 Suite de votre parcours par e-mail :</strong><br/>
            Dès que notre équipe fixe votre entretien d'évaluation ou valide vos documents, vous recevrez <strong>directement par e-mail sur votre téléphone</strong> votre convocation contenant le <strong>lien vidéo direct</strong> (ou l'adresse sur place) ainsi que votre décision d'admission.
          </div>

          <div style="text-align:center; margin:22px 0;">
            <a href="${trackUrl}" style="display:inline-block; background:#0f172a; color:#ffffff !important; font-weight:700; font-size:13.5px; padding:12px 24px; border-radius:10px; text-decoration:none;">
              Consulter le statut de mon dossier (${data.referenceCode}) →
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return deliverMail({
    fromLabel: 'Incubateur IML Digit',
    to: data.recipientEmail,
    subject,
    text: `Bonjour ${data.recipientName},\n\nVotre dossier ${data.referenceCode} pour ${data.companyName} est bien enregistré chez IML Digit.\nVous recevrez directement par e-mail votre convocation d'entretien (avec le lien vidéo ou le lieu sur place) et votre décision d'admission.\nSuivi : ${trackUrl}`,
    html: htmlContent,
  });
}

export interface DocumentStatusEmailData {
  recipientEmail: string;
  recipientName: string;
  companyName?: string;
  referenceCode?: string;
  documentTitle: string;
  documentCategory?: string;
  status: 'VALIDE' | 'REFUSE' | 'EN_ATTENTE';
}

/**
 * Envoie un e-mail au bénéficiaire lorsqu'un document de son dossier est validé ou mis à jour
 */
export async function sendDocumentStatusEmail(data: DocumentStatusEmailData): Promise<SendEmailResult> {
  if (!isSmtpConfigured()) {
    return { success: true, simulated: true };
  }

  const isVal = data.status === 'VALIDE';
  const isRef = data.status === 'REFUSE';
  const subject = isVal
    ? `✅ [Document Validé] "${data.documentTitle}" certifié sur votre dossier IML Digit`
    : isRef
      ? `⚠️ [Action requise] Document "${data.documentTitle}" à mettre à jour - IML Digit`
      : `📄 [Document enregistré] "${data.documentTitle}" ajouté à votre dossier IML Digit`;

  const appBaseUrl = getAppBaseUrl();
  const trackUrl = `${appBaseUrl}/suivi?code=${encodeURIComponent(data.referenceCode || data.recipientEmail)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
      <head><meta charset="utf-8" /></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 30px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 14px; margin-bottom: 18px;">
            <span style="float:right; background:${isVal ? '#dcfce7' : isRef ? '#fee2e2' : '#fef3c7'}; color:${isVal ? '#15803d' : isRef ? '#b91c1c' : '#b45309'}; font-weight:800; font-size:11px; padding:4px 10px; border-radius:99px;">
              ${isVal ? '✓ DOCUMENT VALIDÉ' : isRef ? 'À CORRIGER' : 'EN EXAMEN'}
            </span>
            <div style="font-size: 22px; font-weight: 900; color: #0f172a;">iml digit<span style="color:#23c3b1;">.</span></div>
          </div>

          <h2 style="margin-top:0; color:#0f172a; font-size:19px;">Mise à jour documentaire de votre dossier</h2>
          <p style="font-size:14px; line-height:1.6; color:#334155;">
            Bonjour <strong>${data.recipientName}</strong>,<br/>
            L'équipe d'accompagnement IML Digit vient de mettre à jour le statut d'une pièce justificative de votre dossier :
          </p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin:18px 0; font-size:13.5px;">
            ${data.referenceCode ? `<div style="margin-bottom:6px;"><strong>📁 Dossier :</strong> ${data.referenceCode}</div>` : ''}
            ${data.companyName ? `<div style="margin-bottom:6px;"><strong>🏢 Structure :</strong> ${data.companyName}</div>` : ''}
            <div style="margin-bottom:6px;"><strong>📄 Document :</strong> ${data.documentTitle}</div>
            <div><strong>📌 Nouveau statut :</strong> <strong style="color:${isVal ? '#15803d' : isRef ? '#b91c1c' : '#b45309'};">${isVal ? 'Validé & Conforme ✓' : isRef ? 'Refusé / À remplacer' : 'En attente de revue'}</strong></div>
          </div>

          <div style="text-align:center; margin-top:20px;">
            <a href="${trackUrl}" style="display:inline-block; background:#0f172a; color:#ffffff !important; font-weight:700; font-size:13px; padding:10px 22px; border-radius:10px; text-decoration:none;">
              Consulter le récapitulatif de mon dossier →
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return deliverMail({
    fromLabel: 'IML Digit Documents',
    to: data.recipientEmail,
    subject,
    text: `Bonjour ${data.recipientName},\n\nLe document "${data.documentTitle}" de votre dossier IML Digit est désormais au statut : ${isVal ? 'Validé & Conforme' : isRef ? 'À remplacer' : 'En attente de revue'}.\nSuivi : ${trackUrl}`,
    html: htmlContent,
  });
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

  if (!isSmtpConfigured()) {
    return { success: true, simulated: true };
  }

  return deliverMail({
    fromLabel: 'IML Digit Salles',
    to: data.recipientEmail,
    subject,
    text: `${title} - Réf: ${data.reference}. Date: ${dateStr} de ${timeStr}. Lieu: Hub IML Digit, Awendjé, Libreville.`,
    html: htmlContent,
  });
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
            <a href="${getAppBaseUrl()}/dashboard?tab=salle" class="btn">
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

  if (!isSmtpConfigured()) {
    return { success: true, simulated: true };
  }

  return deliverMail({
    fromLabel: 'IML Digit Salles',
    to: adminEmail,
    subject,
    text: `Nouvelle réservation de salle IML - Réf: ${b.reference}. Organisateur: ${b.organizerName} (${b.phone}). Date: ${dateStr} de ${timeStr}.`,
    html: htmlContent,
  });
}

