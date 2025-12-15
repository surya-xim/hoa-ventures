const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  try {
    const payload = (req.body && typeof req.body === 'object') ? req.body : {};
    const { to, subject, body, filename, pdfDataUrl } = payload;
    if (!to || !pdfDataUrl) {
      res.status(400).send('Missing to or pdfDataUrl');
      return;
    }

    let b64 = null;
    if (typeof pdfDataUrl === 'string') {
      const match = pdfDataUrl.match(/data:application\/pdf;?base64,(.+)$/i);
      if (match) b64 = match[1];
      if (!b64) {
        const generic = pdfDataUrl.match(/^data:.*;base64,(.+)$/i);
        if (generic) b64 = generic[1];
      }
    }
    if (!b64) {
      res.status(400).send('Invalid PDF data URL');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    const from = process.env.MAIL_FROM || 'invoice@hoaventures.com';
    await transporter.sendMail({
      from,
      to,
      subject: subject || 'Invoice',
      text: body || '',
      attachments: [
        { filename: filename || 'invoice.pdf', content: Buffer.from(b64, 'base64') },
      ],
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).send('Server error: ' + (err.message || String(err)));
  }
};

