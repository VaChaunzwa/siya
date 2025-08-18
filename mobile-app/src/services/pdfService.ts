/**
 * PDF Service for Mobile App
 * Adapted from web DeliveryNotePDF.js for React Native/Expo
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Delivery, DeliveryStop } from './deliveryService';
import API_BASE_URL from './apiConfig';

export interface PDFGenerationOptions {
  stop: DeliveryStop;
  delivery: Delivery;
  client?: any;
  company?: any;
  stopNumber: number;
}

export class MobilePDFService {
  /**
   * Extract date from various date formats (adapted from web version)
   */
  private extractDateFromProxy(dateObj: any): Date | null {
    if (!dateObj) return null;

    try {
      // For Firestore timestamps
      if (dateObj.seconds || dateObj._seconds) {
        const seconds = dateObj.seconds || dateObj._seconds;
        return new Date(seconds * 1000);
      }

      // Try to access proxy target directly
      if (typeof dateObj === 'object' && dateObj.constructor.name === 'Object') {
        const keys = Object.keys(dateObj);
        for (const key of keys) {
          if (key === 'seconds' || key === '_seconds') {
            return new Date(dateObj[key] * 1000);
          }
        }

        // Try common timestamp properties
        if (dateObj.toDate && typeof dateObj.toDate === 'function') {
          return dateObj.toDate();
        }
      }

      // If it's already a Date object
      if (dateObj instanceof Date) {
        return dateObj;
      }

      // Try to convert string to date
      const dateStr = String(dateObj);
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.warn('Error extracting date from proxy:', error);
    }

    return null;
  }

  /**
   * Get the delivery date with fallback logic (adapted from web version)
   */
  private getDeliveryDate(stop: DeliveryStop, delivery: Delivery): string {
    let deliveryDate = '_______________';

    // Extract actual values from Proxy objects
    const stopUpdatedAt = this.extractDateFromProxy((stop as any)?.updatedAt);
    const stopCompletedAt = this.extractDateFromProxy((stop as any)?.completedAt);

    console.log('Date debugging - stop.completedAt:', (stop as any)?.completedAt);
    console.log('Date debugging - stop.updatedAt:', (stop as any)?.updatedAt);
    console.log('Date debugging - extracted updatedAt:', stopUpdatedAt);
    console.log('Date debugging - extracted completedAt:', stopCompletedAt);
    console.log('Date debugging - delivery.scheduledDate:', delivery?.scheduledDate);

    if (stopUpdatedAt && !isNaN(stopUpdatedAt.getTime())) {
      try {
        deliveryDate = stopUpdatedAt.toLocaleDateString('en-GB') + ' ' + 
                      stopUpdatedAt.toLocaleTimeString('en-GB', { hour12: false });
        console.log('Using updatedAt as complete date:', deliveryDate);
      } catch (error) {
        console.warn('Invalid updatedAt date:', stopUpdatedAt);
      }
    } else if (stopCompletedAt && !isNaN(stopCompletedAt.getTime())) {
      try {
        deliveryDate = stopCompletedAt.toLocaleDateString('en-GB') + ' ' + 
                      stopCompletedAt.toLocaleTimeString('en-GB', { hour12: false });
        console.log('Using completedAt as fallback date:', deliveryDate);
      } catch (error) {
        console.warn('Invalid completedAt date:', stopCompletedAt);
      }
    } else if (delivery?.scheduledDate) {
      try {
        const scheduledDate = new Date(delivery.scheduledDate);
        if (!isNaN(scheduledDate.getTime())) {
          deliveryDate = scheduledDate.toLocaleDateString('en-GB') + ' ' + 
                        scheduledDate.toLocaleTimeString('en-GB', { hour12: false });
          console.log('Using scheduledDate:', deliveryDate);
        }
      } catch (error) {
        console.warn('Invalid scheduledDate:', delivery.scheduledDate);
      }
    }

    // Ensure deliveryDate has a value, use current date/time as fallback
    if (!deliveryDate || deliveryDate.trim() === '' || deliveryDate === '_______________') {
      const now = new Date();
      deliveryDate = now.toLocaleDateString('en-GB') + ' ' + 
                    now.toLocaleTimeString('en-GB', { hour12: false });
      console.log('Using current date/time as fallback:', deliveryDate);
    }

    console.log('Final deliveryDate:', deliveryDate);
    return deliveryDate;
  }

  /**
   * Format address for display (adapted from web version)
   */
  private formatAddress(address: any): string {
    if (!address) return '';
    if (typeof address === 'string') return address;

    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.addressLine1) parts.push(address.addressLine1);
    if (address.addressLine2) parts.push(address.addressLine2);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.province || address.state) parts.push(address.province || address.state);
    if (address.postalCode || address.zipCode) parts.push(address.postalCode || address.zipCode);

    return parts.join(', ');
  }

  /**
   * Generate stop code based on delivery and stop number
   */
  private getStopCode(delivery: Delivery, stopNumber: number): string {
    if (!delivery) {
      console.warn('No delivery data provided for stop code generation');
      return '';
    }
    
    // Try multiple fields to get a valid delivery identifier
    const deliveryId = delivery.deliveryNumber || 
                      delivery.id || 
                      (delivery as any).deliveryId || 
                      (delivery as any).number ||
                      (delivery as any).reference;
    
    if (!deliveryId) {
      console.warn('No valid delivery identifier found in delivery data:', Object.keys(delivery));
      return '';
    }
    
    // Ensure stopNumber is valid
    if (typeof stopNumber !== 'number' || stopNumber < 1) {
      console.warn('Invalid stop number provided:', stopNumber);
      return '';
    }
    
    const deliveryCode = String(deliveryId);
    const numericDeliveryPart = deliveryCode.replace(/^DEL/i, '').padStart(5, '0');
    const stopNum = String(stopNumber).padStart(2, '0');
    const stopCode = `DEL${numericDeliveryPart}-${stopNum}`;
    console.log('Generated stop code:', stopCode, 'from delivery ID:', deliveryId, 'and stop number:', stopNumber);
    return stopCode;
  }

  /**
   * Load image via base64 conversion for PDF embedding
   */
  private async loadImageAsBase64(url: string): Promise<string | null> {
    try {
      if (!url) return null;

      console.log('Attempting to load image from:', url);

      // Handle data URLs directly
      if (url.startsWith('data:')) {
        console.log('Found data URL, using directly');
        return url;
      }

      // Validate URL format
      const validatedUrl = url.trim();
      if (!validatedUrl.startsWith('http://') && 
          !validatedUrl.startsWith('https://') && 
          !validatedUrl.startsWith('data:')) {
        console.warn('Invalid URL format:', validatedUrl);
        return null;
      }

      let fetchUrl = url;
      if (url.includes('storage.googleapis.com') || 
          url.includes('firebasestorage.googleapis.com') || 
          url.includes('firebasestorage.app')) {
        // Use the proxy for Firebase Storage URLs with double encoding
        const doubleEncodedUrl = encodeURIComponent(encodeURIComponent(validatedUrl));
        fetchUrl = `${API_BASE_URL.replace(/\/api$/, '')}/proxy-image?url=${doubleEncodedUrl}`;
        console.log('Using proxy for Firebase Storage URL:', fetchUrl);
      } else if (url.startsWith('/uploads')) {
        // Handle legacy local uploads
        fetchUrl = `${API_BASE_URL.replace(/\/api$/, '')}${url}`;
        console.log('Using full URL for legacy upload:', fetchUrl);
      }

      // For other URLs, fetch and convert to base64
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        console.warn('Failed to fetch image:', response.status);
        return null;
      }

      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Error loading image:', error);
      return null;
    }
  }

  /**
   * Generate HTML content for the PDF (enhanced version based on web DeliveryNotePDF.js)
   */
  private async generateHTMLContent(options: PDFGenerationOptions): Promise<string> {
    const { stop, delivery, client, company, stopNumber } = options;
    
    try {
      const stopCode = this.getStopCode(delivery, stopNumber);
      const currentDate = new Date().toLocaleDateString('en-GB');
      const deliveryDate = this.getDeliveryDate(stop, delivery);
      
      // Get recipient and signature information with better error handling
      const recipientName = (stop as any)?.completionData?.recipientName || 
                           (stop as any)?.recipientName || 
                           '_____________________';
      
      const formattedAddress = this.formatAddress(stop.address);
      
      // Check multiple possible signature properties
      const signatureUrl = (stop as any)?.signature || 
                           (stop as any)?.signatureUrl || 
                           (stop as any)?.signatureData ||
                           (stop as any)?.completionData?.signature ||
                           (stop as any)?.completionData?.signatureUrl;
      
      console.log('PDF Content Generation:', {
        stopCode,
        hasStop: !!stop,
        hasDelivery: !!delivery,
        hasItems: !!(stop?.items && stop.items.length > 0),
        hasSignature: !!signatureUrl,
        recipientName,
        deliveryDate
      });
    
    // Company logo section with better error handling
    let companyLogoSection = '';
    if (company?.logoUrl) {
      try {
        const logoBase64 = await this.loadImageAsBase64(company.logoUrl);
        companyLogoSection = logoBase64 ? `
          <img src="${logoBase64}" alt="Company Logo" style="max-width: 120px; max-height: 60px; object-fit: contain;" />
        ` : `
          <div class="company-logo">${company?.name || 'COMPANY'}</div>
        `;
      } catch (error) {
        console.warn('Failed to load company logo:', error);
        companyLogoSection = `
          <div class="company-logo">${company?.name || 'COMPANY'}</div>
        `;
      }
    } else {
      companyLogoSection = `
        <div class="company-logo">${company?.name || 'SIYA DELIVERIES'}</div>
      `;
    }

    // Generate items table
    const items = (stop as any)?.items?.length 
      ? (stop as any).items.map((item: any) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${item.description || item.name || 'N/A'}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">ITEM 1</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">19</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">ITEM 2</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">4</td>
        </tr>
      `;

    // Load signature if available with better error handling
    let signatureSection = '';
    if (signatureUrl) {
      try {
        const signatureBase64 = await this.loadImageAsBase64(signatureUrl);
        signatureSection = signatureBase64 ? `
          <img src="${signatureBase64}" alt="Recipient Signature" style="max-width: 100px; max-height: 30px; border: 1px solid #ccc; display: block;" />
        ` : `
          <div style="border-bottom: 1px solid #333; height: 15px; width: 100px; display: block;"></div>
        `;
      } catch (error) {
        console.warn('Failed to load signature image:', error);
        signatureSection = `
          <div style="border-bottom: 1px solid #333; height: 15px; width: 100px; display: block;"></div>
        `;
      }
    } else {
      signatureSection = `
        <div style="border-bottom: 1px solid #333; height: 15px; width: 100px; display: block;"></div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Delivery Note - ${stopCode}</title>
        <style>
          body {
            font-family: 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 10px;
            line-height: 1.2;
            color: #000;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            min-height: 60px;
          }
          .header-left {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }
          .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .delivery-title {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
          }
          .info-table {
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
          }
          .info-table td {
            padding: 2px 6px;
            border: 1px solid #333;
            font-size: 9px;
          }
          .info-table .label {
            font-weight: bold;
            width: 60px;
            background-color: #f5f5f5;
          }
          .section {
            margin-bottom: 15px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 9px;
            text-transform: uppercase;
          }
          .two-column {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .column {
            width: 48%;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .items-table th {
            background-color: #f0f0f0;
            padding: 8px;
            border: 1px solid #ddd;
            font-weight: bold;
            text-align: left;
          }
          .items-table td {
            padding: 8px;
            border: 1px solid #ddd;
          }
          .signature-section {
            margin-top: 30px;
            padding-top: 15px;
            page-break-inside: avoid;
          }
          .signature-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 15px;
          }
          .signature-field {
            width: 30%;
            text-align: left;
          }
          .field-label {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .signature-value {
            font-weight: bold;
            margin-top: 5px;
            min-height: 20px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            ${companyLogoSection}
            <div class="delivery-title">DELIVERY NOTE</div>
          </div>
          <table class="info-table">
            <tr>
              <td class="label">NUMBER:</td>
              <td>${stopCode}</td>
            </tr>
            <tr>
              <td class="label">DATE:</td>
              <td>${currentDate}</td>
            </tr>
            <tr>
              <td class="label">PAGE:</td>
              <td>1/1</td>
            </tr>
          </table>
        </div>

        <!-- FROM and CLIENT sections -->
        <div class="two-column">
          <div class="column">
            <div class="section-title">FROM</div>
            <div><strong>${company?.name || 'SIYA DELIVERIES'}</strong></div>
            <div style="margin-top: 8px;">
              <div class="section-title">PHYSICAL ADDRESS:</div>
              ${company?.address ? `
                ${company.address.street || company.address.addressLine1 ? `<div>${company.address.street || company.address.addressLine1}</div>` : ''}
                ${company.address.addressLine2 ? `<div>${company.address.addressLine2}</div>` : ''}
                ${company.address.suburb ? `<div>${company.address.suburb}</div>` : ''}
                ${company.address.city ? `<div>${company.address.city}</div>` : ''}
                ${company.address.province || company.address.state ? `<div>${company.address.province || company.address.state}</div>` : ''}
                ${company.address.postalCode || company.address.zipCode ? `<div>${company.address.postalCode || company.address.zipCode}</div>` : ''}
              ` : `
                <div>Nyalu House</div>
                <div>44 Siemert Road</div>
                <div>Doornfontein</div>
                <div>Johannesburg</div>
                <div>2094</div>
              `}
            </div>
          </div>
          
          <div class="column">
            <div class="section-title">CLIENT:</div>
            <div><strong>${client?.name || 'BPSA'}</strong></div>
            
            <div style="margin-top: 8px;">
              <div class="section-title">DELIVERED TO:</div>
              <div>${stop?.customerName || (stop as any)?.stopName || 'SITE NAME'}</div>
            </div>
            
            <div style="margin-top: 8px;">
              <div class="section-title">CONTACT PERSON:</div>
              <div>${(stop as any)?.contactName || stop?.customerPhone || stop?.customerName || 'CONTACT PERSON'}</div>
            </div>
            
            <div style="margin-top: 8px;">
              <div class="section-title">ADDRESS:</div>
              <div>${formattedAddress || 'SITE ADDRESS'}</div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style="width: 100px;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${items}
          </tbody>
        </table>

        <!-- Signature Section -->
        <div class="signature-section">
          <div style="font-weight: bold; margin-bottom: 10px;">DELIVERY CONFIRMATION</div>
          <div style="margin-bottom: 20px;">
            I confirm that the above items have been received in good order and condition.
          </div>
          
          <div class="signature-row">
            <div class="signature-field">
              <div class="field-label">Recipient:</div>
              <div class="signature-value">${recipientName}</div>
            </div>
            
            <div class="signature-field">
              <div class="field-label">Signature:</div>
              <div class="signature-value">${signatureSection}</div>
            </div>
            
            <div class="signature-field">
              <div class="field-label">Date:</div>
              <div class="signature-value">${deliveryDate}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    } catch (error) {
      console.error('Error generating HTML content:', error);
      // Return a basic HTML template if content generation fails
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Delivery Note - Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .error { color: red; text-align: center; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Error Generating Delivery Note</h2>
            <p>Unable to generate delivery note content. Please try again.</p>
            <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </body>
        </html>
      `;
    }
  }

  /**
   * Generate and download/share the delivery note PDF
   */
  async generatePDF(options: PDFGenerationOptions): Promise<{ success: boolean; message: string; uri?: string }> {
    try {
      const { stop, delivery, stopNumber } = options;
      
      console.log('Generating PDF for stop...');
      console.log('PDF Generation - Company data received:', options.company);
      console.log('PDF Generation - Stop data:', stop);
      console.log('PDF Generation - Delivery data:', delivery);
      console.log('PDF Generation - Stop number received:', stopNumber, 'Type:', typeof stopNumber);
      
      // Validate required data with better error handling
      if (!delivery) {
        throw new Error('Delivery data is required for PDF generation');
      }
      
      if (!stop) {
        throw new Error('Stop data is required for PDF generation');
      }
      
      // More robust stopNumber validation
      let validStopNumber = stopNumber;
      if (typeof stopNumber !== 'number') {
        // Try to convert to number
        const parsed = parseInt(String(stopNumber), 10);
        if (!isNaN(parsed) && parsed > 0) {
          validStopNumber = parsed;
          console.log('Converted stopNumber to:', validStopNumber);
        } else {
          // Default to 1 if we can't parse it
          validStopNumber = 1;
          console.log('Using default stopNumber: 1');
        }
      }
      
      if (validStopNumber < 1) {
        validStopNumber = 1;
        console.log('Adjusted stopNumber to minimum value: 1');
      }
      
      const stopCode = this.getStopCode(delivery, validStopNumber);
      console.log('Generated stop code:', stopCode);
      
      if (!stopCode || stopCode === 'DEL-') {
        throw new Error('Unable to generate valid stop code from delivery data');
      }
      
      // Generate HTML content with validated stopNumber
      const htmlContent = await this.generateHTMLContent({
        ...options,
        stopNumber: validStopNumber
      });
      
      // Create PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      console.log('PDF generated at:', uri);
      
      // Create a permanent file in the document directory
      const fileName = `delivery-note-${stopCode}.pdf`;
      const documentDirectory = FileSystem.documentDirectory;
      const fileUri = `${documentDirectory}${fileName}`;
      
      // Copy the temporary file to a permanent location
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri,
      });
      
      console.log('PDF saved to:', fileUri);
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Delivery Note - ${stopCode}`,
        });
        
        return {
          success: true,
          message: `Delivery note ${stopCode} downloaded successfully`,
          uri: fileUri,
        };
      } else {
        return {
          success: true,
          message: `Delivery note ${stopCode} generated successfully`,
          uri: fileUri,
        };
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to generate delivery note PDF';
      if (error instanceof Error) {
        if (error.message.includes('Stop code')) {
          errorMessage = 'Missing delivery information. Please ensure all required data is available.';
        } else if (error.message.includes('save')) {
          errorMessage = 'PDF generated but failed to download. Please try again.';
        } else if (error.message.includes('HTML')) {
          errorMessage = 'PDF library failed to load. Please refresh the page and try again.';
        }
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const pdfService = new MobilePDFService();
export default pdfService;