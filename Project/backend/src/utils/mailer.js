const DEVELOPMENT_SENDER = 'WorkBuddy <onboarding@resend.dev>';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const formatDate = (date) => new Intl.DateTimeFormat('en', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
}).format(date);

const getMailFrom = () => {
  const configuredSender = process.env.MAIL_FROM?.trim();
  if (!configuredSender || configuredSender.includes('your-verified-domain.com')) return DEVELOPMENT_SENDER;
  return configuredSender;
};

const invitationHtml = ({ name, companyName, employeeRole, inviterName, inviterDesignation, contactEmail, inviteUrl, expiresAt }) => {
  const employee = escapeHtml(name);
  const company = escapeHtml(companyName);
  const role = escapeHtml(employeeRole);
  const sender = escapeHtml(inviterName);
  const designation = escapeHtml(inviterDesignation);
  const contact = escapeHtml(contactEmail);
  const link = escapeHtml(inviteUrl);
  const expiry = escapeHtml(formatDate(expiresAt));

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>You're invited to join ${company}</title></head>
<body style="margin:0;padding:0;background:#f7f5ee;font-family:Arial,Helvetica,sans-serif;color:#182238">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f5ee"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fffdf6;border:1px solid #eee7d2;border-radius:18px;overflow:hidden">
  <tr><td style="padding:28px;border-bottom:2px solid #ffda4a">
    <div style="font-size:24px;font-weight:700"><span style="color:#e8b900">✦</span>&nbsp; ${company}</div>
    <div style="font-size:13px;color:#656b62;padding-top:8px">Build &nbsp; • &nbsp; Collaborate &nbsp; • &nbsp; Grow</div>
  </td></tr>
  <tr><td style="padding:34px 28px 12px">
    <p style="font-size:23px;font-weight:700;margin:0 0 20px">Hi ${employee}! 👋</p>
    <h1 style="font-size:30px;line-height:1.3;margin:0 0 22px">You're invited to join <span style="background:#ffdf57;padding:2px 7px">${company}</span> on WorkBuddy!</h1>
    <p style="font-size:15px;line-height:1.8;color:#42483f;margin:0 0 16px">We're excited to have you on board! <strong>${sender}</strong>, ${designation} at ${company}, has invited you to join the team as a <strong style="background:#ffed9b;padding:2px 5px">${role}</strong>.</p>
    <p style="font-size:15px;line-height:1.8;color:#42483f;margin:0">WorkBuddy helps you collaborate with your team, manage projects, track tasks, and stay updated — all in one place. Your next chapter starts here!</p>
  </td></tr>
  <tr><td style="padding:22px 24px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff8d9;border-radius:14px">
      <tr><td colspan="2" style="padding:22px 22px 8px;font-size:19px;font-weight:700">✨ With WorkBuddy, you'll be able to:</td></tr>
      <tr>
        <td width="50%" valign="top" style="padding:12px 22px;font-size:14px;line-height:1.6">📁 &nbsp;<strong>Access your work</strong><br><span style="color:#62675e">View assigned projects and tasks.</span></td>
        <td width="50%" valign="top" style="padding:12px 22px;font-size:14px;line-height:1.6">👥 &nbsp;<strong>Collaborate</strong><br><span style="color:#62675e">Stay connected with your team.</span></td>
      </tr>
      <tr>
        <td width="50%" valign="top" style="padding:12px 22px 22px;font-size:14px;line-height:1.6">📅 &nbsp;<strong>Track progress</strong><br><span style="color:#62675e">Follow deadlines and updates.</span></td>
        <td width="50%" valign="top" style="padding:12px 22px 22px;font-size:14px;line-height:1.6">✅ &nbsp;<strong>Stay organized</strong><br><span style="color:#62675e">Keep your work in one place.</span></td>
      </tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:12px 24px 30px">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#ffda4a" style="border-radius:30px"><a href="${link}" style="display:inline-block;padding:17px 34px;font-size:16px;font-weight:700;color:#20251f;text-decoration:none;border-radius:30px">Accept Your Invitation &nbsp; →</a></td></tr></table>
    <p style="font-size:12px;line-height:1.7;color:#74796d;margin:18px 0 4px">This invitation expires on <strong>${expiry}</strong>.</p>
    <p style="font-size:12px;line-height:1.7;color:#74796d;margin:0">If you weren't expecting this invitation, you can safely ignore this email.</p>
  </td></tr>
  <tr><td style="padding:26px 28px;border-top:1px solid #eee7d2">
    <p style="font-size:14px;margin:0 0 8px">Best regards,</p>
    <p style="font-size:18px;font-weight:700;margin:0 0 5px">${sender}</p>
    <p style="font-size:13px;color:#646a5d;line-height:1.7;margin:0">${designation}<br>${company}</p>
    <p style="font-size:13px;line-height:1.7;margin:14px 0 0">✉ Contact: <a href="mailto:${contact}" style="color:#735c00">${contact}</a></p>
  </td></tr>
  <tr><td align="center" style="padding:18px 24px;background:#fff8df">
    <p style="font-size:12px;color:#646a5d;margin:0">✦ Powered by WorkBuddy</p>
    <p style="font-size:11px;color:#8a8e82;margin:7px 0 0">This message was sent on behalf of ${company}.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
};

const invitationText = ({ name, companyName, employeeRole, inviterName, inviterDesignation, contactEmail, inviteUrl, expiresAt }) => `
Hi ${name}!

You're invited to join ${companyName} on WorkBuddy.

${inviterName}, ${inviterDesignation} at ${companyName}, invited you to join as ${employeeRole}.

Accept your invitation: ${inviteUrl}

This invitation expires on ${formatDate(expiresAt)}. If you weren't expecting it, you can safely ignore this email.

Best regards,
${inviterName}
${inviterDesignation}, ${companyName}
Contact: ${contactEmail}
`.trim();

export const sendInvitationEmail = async (details) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[invite:development] ${details.to}: ${details.inviteUrl}`);
    return { delivered: false, developmentUrl: details.inviteUrl };
  }

  const replyTo = process.env.MAIL_REPLY_TO || details.contactEmail || 'teamworkbuddy@proton.me';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: getMailFrom(), reply_to: replyTo, to: [details.to],
      subject: `You're invited to join ${details.companyName}!`,
      html: invitationHtml(details), text: invitationText(details)
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invitation email could not be sent');
  return { delivered: true, id: data.id };
};
