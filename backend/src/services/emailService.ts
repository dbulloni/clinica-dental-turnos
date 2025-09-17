import nodemailer from 'nodemailer';
import { logger } from '@/config/logger';
import config from '@/config/env';

interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = config.features.emailEnabled;
    
    if (this.isEnabled) {
      try {
        this.transporter = nodemailer.createTransporter({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.port === 465, // true para 465, false para otros puertos
          auth: {
            user: config.email.user,
            pass: config.email.pass,
          },
          tls: {
            rejectUnauthorized: false, // Para desarrollo
          },
        });

        // Verificar configuración
        this.verifyConnection();
        
        logger.info('Email service initialized successfully');
      } catch (error) {
        logger.error('Error initializing email service:', error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('Email service disabled - missing configuration');
    }
  }

  /**
   * Verificar conexión SMTP
   */
  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
    } catch (error) {
      logger.error('SMTP connection verification failed:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Enviar email
   */
  async sendEmail(emailData: EmailMessage): Promise<EmailResponse> {
    if (!this.isEnabled || !this.transporter) {
      logger.warn('Email service not available');
      return {
        success: false,
        error: 'Email service not available',
      };
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Enviar email de confirmación de turno
   */
  async sendAppointmentConfirmation(
    email: string,
    patientName: string,
    appointmentDetails: {
      date: string;
      time: string;
      professional: string;
      treatment: string;
      clinicName: string;
      clinicAddress: string;
      clinicPhone: string;
    }
  ): Promise<EmailResponse> {
    const subject = `Confirmación de Turno - ${appointmentDetails.clinicName}`;
    
    const text = `
Hola ${patientName},

Tu turno ha sido confirmado con los siguientes detalles:

📅 Fecha: ${appointmentDetails.date}
🕐 Hora: ${appointmentDetails.time}
👨‍⚕️ Profesional: ${appointmentDetails.professional}
🦷 Tratamiento: ${appointmentDetails.treatment}

📍 Dirección: ${appointmentDetails.clinicAddress}
📞 Teléfono: ${appointmentDetails.clinicPhone}

Por favor, llega 10 minutos antes de tu cita.

Si necesitas reprogramar o cancelar tu turno, contáctanos con al menos 24 horas de anticipación.

Saludos,
${appointmentDetails.clinicName}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .appointment-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { margin: 10px 0; }
        .icon { margin-right: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirmación de Turno</h1>
        </div>
        <div class="content">
            <p>Hola <strong>${patientName}</strong>,</p>
            <p>Tu turno ha sido confirmado con los siguientes detalles:</p>
            
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="icon">📅</span>
                    <strong>Fecha:</strong> ${appointmentDetails.date}
                </div>
                <div class="detail-row">
                    <span class="icon">🕐</span>
                    <strong>Hora:</strong> ${appointmentDetails.time}
                </div>
                <div class="detail-row">
                    <span class="icon">👨‍⚕️</span>
                    <strong>Profesional:</strong> ${appointmentDetails.professional}
                </div>
                <div class="detail-row">
                    <span class="icon">🦷</span>
                    <strong>Tratamiento:</strong> ${appointmentDetails.treatment}
                </div>
            </div>
            
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="icon">📍</span>
                    <strong>Dirección:</strong> ${appointmentDetails.clinicAddress}
                </div>
                <div class="detail-row">
                    <span class="icon">📞</span>
                    <strong>Teléfono:</strong> ${appointmentDetails.clinicPhone}
                </div>
            </div>
            
            <p><strong>Importante:</strong> Por favor, llega 10 minutos antes de tu cita.</p>
            <p>Si necesitas reprogramar o cancelar tu turno, contáctanos con al menos 24 horas de anticipación.</p>
        </div>
        <div class="footer">
            <p>Saludos,<br><strong>${appointmentDetails.clinicName}</strong></p>
        </div>
    </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Enviar email de recordatorio de turno
   */
  async sendAppointmentReminder(
    email: string,
    patientName: string,
    appointmentDetails: {
      date: string;
      time: string;
      professional: string;
      treatment: string;
      clinicName: string;
      clinicAddress: string;
      clinicPhone: string;
    }
  ): Promise<EmailResponse> {
    const subject = `Recordatorio de Turno - Mañana - ${appointmentDetails.clinicName}`;
    
    const text = `
Hola ${patientName},

Te recordamos que tienes un turno programado para mañana:

📅 Fecha: ${appointmentDetails.date}
🕐 Hora: ${appointmentDetails.time}
👨‍⚕️ Profesional: ${appointmentDetails.professional}
🦷 Tratamiento: ${appointmentDetails.treatment}

📍 Dirección: ${appointmentDetails.clinicAddress}
📞 Teléfono: ${appointmentDetails.clinicPhone}

Por favor, confirma tu asistencia respondiendo a este mensaje o llamando a nuestro consultorio.

Saludos,
${appointmentDetails.clinicName}
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #fffbeb; }
        .appointment-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .detail-row { margin: 10px 0; }
        .icon { margin-right: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .reminder-badge { background-color: #f59e0b; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Recordatorio de Turno</h1>
            <span class="reminder-badge">MAÑANA</span>
        </div>
        <div class="content">
            <p>Hola <strong>${patientName}</strong>,</p>
            <p>Te recordamos que tienes un turno programado para <strong>mañana</strong>:</p>
            
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="icon">📅</span>
                    <strong>Fecha:</strong> ${appointmentDetails.date}
                </div>
                <div class="detail-row">
                    <span class="icon">🕐</span>
                    <strong>Hora:</strong> ${appointmentDetails.time}
                </div>
                <div class="detail-row">
                    <span class="icon">👨‍⚕️</span>
                    <strong>Profesional:</strong> ${appointmentDetails.professional}
                </div>
                <div class="detail-row">
                    <span class="icon">🦷</span>
                    <strong>Tratamiento:</strong> ${appointmentDetails.treatment}
                </div>
            </div>
            
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="icon">📍</span>
                    <strong>Dirección:</strong> ${appointmentDetails.clinicAddress}
                </div>
                <div class="detail-row">
                    <span class="icon">📞</span>
                    <strong>Teléfono:</strong> ${appointmentDetails.clinicPhone}
                </div>
            </div>
            
            <p><strong>Por favor, confirma tu asistencia</strong> respondiendo a este mensaje o llamando a nuestro consultorio.</p>
        </div>
        <div class="footer">
            <p>Saludos,<br><strong>${appointmentDetails.clinicName}</strong></p>
        </div>
    </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Enviar email de cancelación de turno
   */
  async sendAppointmentCancellation(
    email: string,
    patientName: string,
    appointmentDetails: {
      date: string;
      time: string;
      professional: string;
      treatment: string;
      clinicName: string;
      clinicPhone: string;
    }
  ): Promise<EmailResponse> {
    const subject = `Turno Cancelado - ${appointmentDetails.clinicName}`;
    
    const text = `
Hola ${patientName},

Te informamos que tu turno ha sido cancelado:

📅 Fecha: ${appointmentDetails.date}
🕐 Hora: ${appointmentDetails.time}
👨‍⚕️ Profesional: ${appointmentDetails.professional}
🦷 Tratamiento: ${appointmentDetails.treatment}

Si deseas reprogramar tu turno, por favor contáctanos al ${appointmentDetails.clinicPhone}.

Saludos,
${appointmentDetails.clinicName}
    `.trim();

    return this.sendEmail({
      to: email,
      subject,
      text,
    });
  }

  /**
   * Obtener estado del servicio
   */
  getServiceStatus(): {
    enabled: boolean;
    configured: boolean;
    host?: string;
  } {
    return {
      enabled: this.isEnabled,
      configured: !!(config.email.user && config.email.pass),
      host: config.email.host,
    };
  }
}

export const emailService = new EmailService();
export default emailService;