import twilio from 'twilio';
import { logger } from '@/config/logger';
import config from '@/config/env';

interface WhatsAppMessage {
  to: string;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class WhatsAppService {
  private client: twilio.Twilio | null = null;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = config.features.whatsappEnabled;
    
    if (this.isEnabled) {
      try {
        this.client = twilio(config.twilio.accountSid!, config.twilio.authToken!);
        logger.info('WhatsApp service initialized successfully');
      } catch (error) {
        logger.error('Error initializing WhatsApp service:', error);
        this.isEnabled = false;
      }
    } else {
      logger.warn('WhatsApp service disabled - missing configuration');
    }
  }

  /**
   * Enviar mensaje de WhatsApp
   */
  async sendMessage(messageData: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!this.isEnabled || !this.client) {
      logger.warn('WhatsApp service not available');
      return {
        success: false,
        error: 'WhatsApp service not available',
      };
    }

    try {
      // Formatear número de teléfono para WhatsApp
      const formattedNumber = this.formatPhoneNumber(messageData.to);
      
      if (!formattedNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const message = await this.client.messages.create({
        from: config.twilio.whatsappNumber!,
        to: `whatsapp:${formattedNumber}`,
        body: messageData.message,
      });

      logger.info(`WhatsApp message sent successfully: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      
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
   * Enviar mensaje usando plantilla
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: string[] = []
  ): Promise<WhatsAppResponse> {
    if (!this.isEnabled || !this.client) {
      logger.warn('WhatsApp service not available');
      return {
        success: false,
        error: 'WhatsApp service not available',
      };
    }

    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      if (!formattedNumber) {
        return {
          success: false,
          error: 'Invalid phone number format',
        };
      }

      const message = await this.client.messages.create({
        from: config.twilio.whatsappNumber!,
        to: `whatsapp:${formattedNumber}`,
        contentSid: templateName,
        contentVariables: JSON.stringify(templateParams.reduce((acc, param, index) => {
          acc[`${index + 1}`] = param;
          return acc;
        }, {} as Record<string, string>)),
      });

      logger.info(`WhatsApp template message sent successfully: ${message.sid}`);
      
      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      logger.error('Error sending WhatsApp template message:', error);
      
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
   * Verificar estado de mensaje
   */
  async getMessageStatus(messageId: string): Promise<{
    status: string;
    errorCode?: string;
    errorMessage?: string;
  } | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        status: message.status,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage || undefined,
      };
    } catch (error) {
      logger.error('Error fetching message status:', error);
      return null;
    }
  }

  /**
   * Formatear número de teléfono para WhatsApp
   */
  private formatPhoneNumber(phoneNumber: string): string | null {
    // Remover espacios, guiones y paréntesis
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, agregar código de país por defecto (Argentina +54)
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('54')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('9')) {
        // Número argentino sin código de país
        cleaned = '+549' + cleaned.substring(1);
      } else {
        // Asumir que es un número argentino
        cleaned = '+54' + cleaned;
      }
    }

    // Validar formato internacional básico
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleaned)) {
      logger.warn(`Invalid phone number format: ${phoneNumber}`);
      return null;
    }

    return cleaned;
  }

  /**
   * Validar si un número puede recibir WhatsApp
   */
  async validateWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return formatted !== null;
  }

  /**
   * Obtener estado del servicio
   */
  getServiceStatus(): {
    enabled: boolean;
    configured: boolean;
    accountSid?: string;
  } {
    return {
      enabled: this.isEnabled,
      configured: !!(config.twilio.accountSid && config.twilio.authToken && config.twilio.whatsappNumber),
      accountSid: config.twilio.accountSid ? config.twilio.accountSid.substring(0, 8) + '...' : undefined,
    };
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;