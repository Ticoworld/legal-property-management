"use server";

import { resend, DEFAULT_FROM_EMAIL, isEmailConfigured } from '@/lib/mail';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helper';
import { format } from 'date-fns';

export type EmailResult = {
  success: boolean;
  message: string;
  emailId?: string;
};

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate professional HTML email template for payment receipt
 */
function generatePaymentReceiptHTML(data: {
  tenantName: string;
  amount: string;
  propertyAddress: string;
  date: string;
  paymentType: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Payment Receipt</h1>
              <p style="margin: 8px 0 0 0; color: #bfdbfe; font-size: 14px;">Legal Property Management</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Dear <strong>${data.tenantName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                We acknowledge receipt of your payment. Please find the details below:
              </p>
              
              <!-- Payment Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount</td>
                        <td style="padding: 8px 0; color: #059669; font-size: 20px; font-weight: 700; text-align: right;">${data.amount}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-bottom: 1px solid #e5e7eb;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Type</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${data.paymentType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${data.date}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Property</td>
                        <td style="padding: 8px 0; color: #374151; font-size: 14px; text-align: right;">${data.propertyAddress}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 8px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for your prompt payment.
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions regarding this receipt, please contact our office.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Legal Property Management. All rights reserved.
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 11px; text-align: center;">
                This is an automated email. Please do not reply directly to this message.
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
 * Generate HTML email for tenancy expiry alert
 */
function generateExpiryAlertHTML(data: {
  tenantName: string;
  daysRemaining: number;
  propertyAddress?: string;
}): string {
  const urgencyColor = data.daysRemaining <= 7 ? '#dc2626' : data.daysRemaining <= 30 ? '#ea580c' : '#ca8a04';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tenancy Expiry Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: ${urgencyColor}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">⚠️ Tenancy Expiry Alert</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>Attention Required:</strong> The following tenancy requires immediate attention.
              </p>
              
              <!-- Alert Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
                      <strong>Tenant:</strong> ${data.tenantName}
                    </p>
                    ${data.propertyAddress ? `
                    <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
                      <strong>Property:</strong> ${data.propertyAddress}
                    </p>
                    ` : ''}
                    <p style="margin: 0; color: ${urgencyColor}; font-size: 20px; font-weight: 700;">
                      ${data.daysRemaining} days remaining
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Please take appropriate action to either renew the tenancy or begin the move-out process.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Legal Property Management
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

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

export type PaymentReceiptData = {
  tenantName: string;
  tenantEmail: string;
  amount: string;
  propertyAddress: string;
  date: Date | string;
  paymentType: string;
  paymentId?: string;
};

/**
 * Send payment receipt email to tenant
 * 
 * @param data - Payment receipt data
 * @returns EmailResult with success status
 */
export async function sendPaymentReceiptEmail(data: PaymentReceiptData): Promise<EmailResult> {
  try {
    // Check if email service is configured
    if (!isEmailConfigured() || !resend) {
      console.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        message: 'Email service not configured. RESEND_API environment variable is missing.',
      };
    }

    // Validate email
    if (!data.tenantEmail || !data.tenantEmail.includes('@')) {
      return {
        success: false,
        message: 'Invalid tenant email address.',
      };
    }

    // Format date
    const formattedDate = typeof data.date === 'string' 
      ? format(new Date(data.date), 'MMMM dd, yyyy')
      : format(data.date, 'MMMM dd, yyyy');

    // Generate HTML content
    const html = generatePaymentReceiptHTML({
      tenantName: data.tenantName,
      amount: data.amount,
      propertyAddress: data.propertyAddress,
      date: formattedDate,
      paymentType: data.paymentType,
    });

    // Send email via Resend
    const { data: emailData, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: data.tenantEmail,
      subject: `Payment Receipt - ${data.propertyAddress}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email.',
      };
    }

    return {
      success: true,
      message: 'Payment receipt email sent successfully.',
      emailId: emailData?.id,
    };

  } catch (error) {
    console.error('sendPaymentReceiptEmail error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error sending email.',
    };
  }
}

export type ExpiryAlertData = {
  adminEmail: string;
  tenantName: string;
  daysRemaining: number;
  propertyAddress?: string;
};

/**
 * Send tenancy expiry alert to admin
 * 
 * @param data - Expiry alert data
 * @returns EmailResult with success status
 */
export async function sendExpiryAlert(data: ExpiryAlertData): Promise<EmailResult> {
  try {
    // Check if email service is configured
    if (!isEmailConfigured() || !resend) {
      console.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        message: 'Email service not configured. RESEND_API environment variable is missing.',
      };
    }

    // Validate email
    if (!data.adminEmail || !data.adminEmail.includes('@')) {
      return {
        success: false,
        message: 'Invalid admin email address.',
      };
    }

    // Generate HTML content
    const html = generateExpiryAlertHTML({
      tenantName: data.tenantName,
      daysRemaining: data.daysRemaining,
      propertyAddress: data.propertyAddress,
    });

    // Send email via Resend
    const { data: emailData, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: data.adminEmail,
      subject: `URGENT: Tenancy Expiring - ${data.tenantName}`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send email.',
      };
    }

    return {
      success: true,
      message: 'Expiry alert email sent successfully.',
      emailId: emailData?.id,
    };

  } catch (error) {
    console.error('sendExpiryAlert error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error sending email.',
    };
  }
}

/**
 * Resend payment receipt email (for manual resend via UI)
 * 
 * This function is called from the UI to resend a receipt.
 * It also creates an audit log entry.
 */
export async function resendPaymentReceiptEmail(data: PaymentReceiptData): Promise<EmailResult> {
  try {
    const currentUser = await getCurrentUser();

    // Send the email
    const result = await sendPaymentReceiptEmail(data);

    // Log the attempt (success or failure)
    if (result.success && data.paymentId) {
      await prisma.auditLog.create({
        data: {
          action: 'EMAIL_RESENT_RECEIPT',
          entityType: 'Payment',
          entityId: data.paymentId,
          performedBy: currentUser.id,
          details: {
            tenantEmail: data.tenantEmail,
            tenantName: data.tenantName,
            amount: data.amount,
            emailId: result.emailId,
          },
        },
      });
    }

    return result;

  } catch (error) {
    console.error('resendPaymentReceiptEmail error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unexpected error resending email.',
    };
  }
}

// Import the template (assuming compatibility with server actions)
import { DailyBriefingEmail, type BriefingData } from "@/components/emails/daily-briefing";

/**
 * Send Daily Briefing email
 */
export async function sendDailyBriefing(to: string, data: BriefingData): Promise<EmailResult> {
  try {
     if (!isEmailConfigured() || !resend) {
        console.warn('Email service not configured');
        return { success: false, message: 'Email service not configured' };
     }

     const { data: emailData, error } = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to,
        subject: `Daily Briefing: ${data.date} - ${data.noticesDue.length + data.expiringLeases.length + data.maintenanceCount} Action Items`,
        react: DailyBriefingEmail(data),
     });

     if (error) {
        console.error('Resend error:', error);
         return { success: false, message: error.message };
     }

     return { success: true, message: 'Briefing sent', emailId: emailData?.id };

  } catch (error) {
     console.error('sendDailyBriefing error:', error);
     return { success: false, message: 'Failed to send briefing' };
  }
}
