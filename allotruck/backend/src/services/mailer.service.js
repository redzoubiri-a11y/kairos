const env = require('../config/env');

// Boite d'envoi en memoire du pilote `log`. Elle sert en developpement — on
// releve le code sans serveur SMTP — et aux tests, qui n'en ont pas non plus.
// Bornee, sinon un long processus de developpement la ferait grossir sans fin.
const OUTBOX_LIMIT = 50;
const outbox = [];

function remember(message) {
  outbox.push(message);
  if (outbox.length > OUTBOX_LIMIT) outbox.shift();
}

const logDriver = {
  async send(message) {
    remember(message);
    // eslint-disable-next-line no-console
    console.log(`[mail:log] a ${message.to} — ${message.subject}\n${message.text}`);
  },
};

// Charge nodemailer a la demande : une installation qui reste sur le pilote
// `log` n'a pas a payer le cout du module.
function createSmtpDriver() {
  if (!env.smtpUrl) {
    throw new Error('MAIL_DRIVER=smtp exige SMTP_URL');
  }
  const nodemailer = require('nodemailer');
  const transport = nodemailer.createTransport(env.smtpUrl);

  return {
    async send(message) {
      await transport.sendMail({
        from: env.mailFrom,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    },
  };
}

let driver = null;

function getDriver() {
  if (!driver) driver = env.mailDriver === 'smtp' ? createSmtpDriver() : logDriver;
  return driver;
}

async function sendPasswordResetCode(user, code) {
  const minutes = env.resetCodeTtlMinutes;
  await getDriver().send({
    to: user.email,
    subject: 'AlloTruck — code de reinitialisation',
    text: [
      `Bonjour ${user.fullName},`,
      '',
      `Votre code de reinitialisation est : ${code}`,
      '',
      `Il expire dans ${minutes} minutes et ne peut servir qu'une fois.`,
      "Si vous n'avez pas demande de reinitialisation, ignorez ce message :",
      "votre mot de passe reste inchange.",
    ].join('\n'),
  });
}

// Utilise par les tests et par le mode developpement pour relire le dernier
// message. Vide des que le pilote SMTP est actif.
function readOutbox() {
  return [...outbox];
}

function clearOutbox() {
  outbox.length = 0;
}

module.exports = { sendPasswordResetCode, readOutbox, clearOutbox };
