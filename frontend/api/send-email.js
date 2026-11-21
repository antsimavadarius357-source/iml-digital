import tls from 'node:tls';
import crypto from 'node:crypto';

const RELAY_SECRET = 'iml-digit-vercel-smtp-relay-2026-sec';

function encodeMimeWord(text) {
  return `=?UTF-8?B?${Buffer.from(String(text || ''), 'utf8').toString('base64')}?=`;
}

function wrapBase64(str) {
  const b64 = Buffer.from(String(str || ''), 'utf8').toString('base64');
  return b64.replace(/(.{76})/g, '$1\r\n');
}

function extractAddress(raw) {
  const str = String(raw || '').trim();
  const m = str.match(/<([^>]+)>/);
  return (m ? m[1] : str).trim();
}

function sendSmtpTls({ host, port, user, pass, fromLabel, fromEmail, toEmail, subject, text, html }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: host || 'smtp.gmail.com',
        port: Number(port) || 465,
        servername: host || 'smtp.gmail.com',
        rejectUnauthorized: true,
      },
      () => {}
    );

    socket.setTimeout(12000);

    let buffer = '';
    let currentWaiter = null;

    const fail = (err) => {
      try { socket.destroy(); } catch {}
      reject(err instanceof Error ? err : new Error(String(err)));
    };

    socket.on('timeout', () => fail(new Error('SMTP TLS socket timeout')));
    socket.on('error', (err) => fail(err));

    const processBuffer = () => {
      if (!currentWaiter) return;
      const lines = buffer.split('\r\n');
      // On garde la dernière portion incomplète dans le buffer
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        // Une ligne finale SMTP commence par 3 chiffres suivis d'un espace (ex: "250 OK")
        const match = line.match(/^(\d{3}) (.*)$/);
        if (match) {
          const code = Number(match[1]);
          const fullResponse = lines.slice(0, i + 1).join('\n');
          buffer = lines.slice(i + 1).join('\r\n');
          const waiter = currentWaiter;
          currentWaiter = null;
          waiter({ code, fullResponse });
          return;
        }
      }
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      processBuffer();
    });

    const waitResponse = (expectedPrefix) =>
      new Promise((res, rej) => {
        currentWaiter = ({ code, fullResponse }) => {
          if (String(code).startsWith(String(expectedPrefix))) {
            res({ code, fullResponse });
          } else {
            rej(new Error(`SMTP Error ${code}: ${fullResponse}`));
          }
        };
        processBuffer();
      });

    const writeCmd = (cmd, expectedPrefix) => {
      const p = waitResponse(expectedPrefix);
      socket.write(cmd + '\r\n');
      return p;
    };

    (async () => {
      try {
        await waitResponse(2); // 220 Greeting
        await writeCmd('EHLO imldigit.com', 2);
        await writeCmd('AUTH LOGIN', 3);
        await writeCmd(Buffer.from(user, 'utf8').toString('base64'), 3);
        await writeCmd(Buffer.from(pass, 'utf8').toString('base64'), 2);

        const cleanFrom = extractAddress(fromEmail || user);
        const cleanTo = extractAddress(toEmail);

        await writeCmd(`MAIL FROM:<${cleanFrom}>`, 2);
        await writeCmd(`RCPT TO:<${cleanTo}>`, 2);
        await writeCmd('DATA', 3);

        const boundary = `----=_Part_${crypto.randomBytes(12).toString('hex')}`;
        const msgId = `<${crypto.randomBytes(16).toString('hex')}@imldigit.com>`;
        const dateHeader = new Date().toUTCString();
        const encodedFromName = encodeMimeWord(fromLabel || 'IML Digit');
        const encodedSubject = encodeMimeWord(subject);

        const mimeParts = [
          `From: ${encodedFromName} <${cleanFrom}>`,
          `To: <${cleanTo}>`,
          `Subject: ${encodedSubject}`,
          `Date: ${dateHeader}`,
          `Message-ID: ${msgId}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          ``,
          wrapBase64(text || subject),
          ``,
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          ``,
          wrapBase64(html || `<p>${text || subject}</p>`),
          ``,
          `--${boundary}--`,
          `.`,
        ];

        const dataResp = await writeCmd(mimeParts.join('\r\n'), 2);
        try {
          socket.write('QUIT\r\n');
          socket.end();
        } catch {}

        resolve({ messageId: msgId, response: dataResp.fullResponse });
      } catch (err) {
        fail(err);
      }
    })();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-iml-relay-secret'] || req.body?.relaySecret;
  if (secret !== RELAY_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const {
    smtpUser,
    smtpPass,
    smtpHost,
    smtpPort,
    fromLabel,
    to,
    subject,
    text,
    html,
  } = req.body || {};

  const user = String(smtpUser || process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = String(smtpPass || process.env.SMTP_PASS || process.env.GMAIL_PASS || '');
  const pass = rawPass.trim().replace(/\s+/g, '');

  if (!user || !pass) {
    return res.status(400).json({ success: false, message: 'Identifiants SMTP manquants' });
  }

  if (!to || !subject) {
    return res.status(400).json({ success: false, message: 'Destinataire ou sujet manquant' });
  }

  try {
    const info = await sendSmtpTls({
      host: smtpHost || 'smtp.gmail.com',
      port: Number(smtpPort) || 465,
      user,
      pass,
      fromLabel: fromLabel || 'IML Digit',
      fromEmail: user,
      toEmail: to,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      simulated: false,
      messageId: info.messageId,
      message: `E-mail expédié avec succès à ${to}`,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      simulated: false,
      message: err?.message || 'Erreur SMTP lors de l’envoi via le relais Vercel',
    });
  }
}
