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
