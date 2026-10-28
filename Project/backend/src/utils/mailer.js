const invitationHtml = ({ name, inviterName, inviteUrl, expiresAt }) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#252525">
    <h1 style="color:#675000">Welcome to WorkBuddy</h1>
    <p>Hello ${name},</p>
    <p>${inviterName} invited you to your company workspace.</p>
    <p><a href="${inviteUrl}" style="display:inline-block;background:#f4c430;color:#1c1b1b;padding:12px 20px;text-decoration:none;border-radius:6px;font-weight:bold">Set up your password</a></p>
    <p>This single-use link expires on ${expiresAt.toLocaleString()}.</p>
  </div>`;

export const sendInvitationEmail = async ({ to, name, inviterName, inviteUrl, expiresAt }) => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[invite:development] ${to}: ${inviteUrl}`);
    return { delivered: false, developmentUrl: inviteUrl };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'WorkBuddy <onboarding@resend.dev>',
      to: [to],
      subject: 'You are invited to WorkBuddy',
      html: invitationHtml({ name, inviterName, inviteUrl, expiresAt })
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Invitation email could not be sent');
  return { delivered: true, id: data.id };
};
