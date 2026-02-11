/**
 * Email templates for TAW Delivery
 */

export interface AdminInvitationEmailData {
    inviteeName: string;
    inviterName: string;
    role: string;
    agencyName?: string;
    invitationLink: string;
    expiresInDays: number;
}

/**
 * Generate HTML email for admin invitation
 */
export function generateAdminInvitationEmail(data: AdminInvitationEmailData): string {
    const roleText = data.role === 'SUPER_ADMIN' ? 'Super Administrateur' : data.role === 'admin' ? 'Livreur' : 'Agent';
    const agencyText = data.agencyName ? ` de l'agence <strong>${data.agencyName}</strong>` : '';

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation TAW Delivery</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                TAW Delivery
              </h1>
              <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 14px;">
                Plateforme de gestion de livraison
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1f2937; font-size: 24px; font-weight: 600;">
                Bonjour ${data.inviteeName} 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${data.inviterName}</strong> vous invite à rejoindre TAW Delivery en tant que <strong>${roleText}</strong>${agencyText}.
              </p>

              <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.6;">
                Pour activer votre compte, cliquez sur le bouton ci-dessous et créez votre mot de passe sécurisé.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.invitationLink}" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Accepter l'invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 14px; line-height: 1.6;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${data.invitationLink}" style="color: #667eea; word-break: break-all;">
                  ${data.invitationLink}
                </a>
              </p>

              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      ⚠️ <strong>Important :</strong> Cette invitation expire dans <strong>${data.expiresInDays} jours</strong>. Veuillez l'accepter avant son expiration.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} TAW Delivery. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of admin invitation email
 */
export function generateAdminInvitationTextEmail(data: AdminInvitationEmailData): string {
    const roleText = data.role === 'SUPER_ADMIN' ? 'Super Administrateur' : data.role === 'admin' ? 'Livreur' : 'Agent';
    const agencyText = data.agencyName ? ` de l'agence ${data.agencyName}` : '';

    return `
TAW Delivery - Invitation

Bonjour ${data.inviteeName},

${data.inviterName} vous invite à rejoindre TAW Delivery en tant que ${roleText}${agencyText}.

Pour activer votre compte, veuillez cliquer sur le lien ci-dessous et créer votre mot de passe sécurisé :

${data.invitationLink}

⚠️ Important : Cette invitation expire dans ${data.expiresInDays} jours.

Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email en toute sécurité.

© ${new Date().getFullYear()} TAW Delivery. Tous droits réservés.
  `.trim();
}
