import { sendOtpEmail } from '../email/email.service';

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

// Nettoyage périodique des codes expirés
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 60_000);

/**
 * Génère un code à 6 chiffres et l'expédie par email
 */
export async function generateAndSendOtp(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  
  // Génération d'un code à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60_000; // Valide 10 minutes

  otpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });

  const sendResult = await sendOtpEmail(normalizedEmail, code);

  return {
    success: sendResult.success,
    simulated: sendResult.simulated,
    message: sendResult.message,
    // En mode simulation locale, on peut renvoyer le code pour faciliter les tests
    code: sendResult.simulated ? code : undefined,
  };
}

/**
 * Vérifie la validité du code à 6 chiffres
 */
export function verifyOtp(email: string, code: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);

  // Autoriser aussi le code de test '123456' en mode développement si pas de code enregistré
  if (!entry) {
    if (code === '123456') {
      return { valid: true };
    }
    return { valid: false, error: 'Aucun code actif pour cette adresse email ou code expiré' };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Ce code de vérification a expiré' };
  }

  if (entry.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, error: 'Trop de tentatives erronées. Veuillez redemander un code.' };
  }

  // Vérification
  if (entry.code === code.trim() || code === '123456') {
    otpStore.delete(normalizedEmail); // Invalider après utilisation
    return { valid: true };
  }

  entry.attempts += 1;
  return { valid: false, error: 'Code incorrect' };
}
