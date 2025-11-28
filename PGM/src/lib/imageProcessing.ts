/**
 * Image Processing Service for Electricity Meter Reading Extraction
 * 
 * This service handles the extraction of meter readings from uploaded images
 * using OCR (Optical Character Recognition) and image processing techniques.
 */

export interface MeterReadingResult {
  success: boolean;
  reading?: number;
  confidence?: number;
  error?: string;
  processedImageUrl?: string;
}

export interface ImageProcessingOptions {
  enablePreprocessing?: boolean;
  enableOCR?: boolean;
  enableValidation?: boolean;
  confidenceThreshold?: number;
}

class ImageProcessingService {
  private readonly DEFAULT_OPTIONS: ImageProcessingOptions = {
    enablePreprocessing: true,
    enableOCR: true,
    enableValidation: true,
    confidenceThreshold: 0.8
  };

  /**
   * Extract meter reading from an image
   * @param imageFile - The image file to process
   * @param options - Processing options
   * @returns Promise<MeterReadingResult>
   */
  async extractMeterReading(
    imageFile: File,
    options: ImageProcessingOptions = {}
  ): Promise<MeterReadingResult> {
    try {
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Step 1: Validate image
      if (!this.validateImage(imageFile)) {
        return {
          success: false,
          error: 'Invalid image format or size'
        };
      }

      // Step 2: Preprocess image if enabled
      let processedImage: string;
      if (opts.enablePreprocessing) {
        processedImage = await this.preprocessImage(imageFile);
      } else {
        processedImage = await this.fileToDataUrl(imageFile);
      }

      // Step 3: Extract text using OCR
      let extractedText: string;
      if (opts.enableOCR) {
        extractedText = await this.performOCR(processedImage);
      } else {
        // Fallback to manual input
        return {
          success: false,
          error: 'OCR is disabled'
        };
      }

      // Step 4: Parse meter reading from text
      const reading = this.parseMeterReading(extractedText);
      
      if (!reading) {
        return {
          success: false,
          error: 'Could not extract valid meter reading from image'
        };
      }

      // Step 5: Validate reading if enabled
      if (opts.enableValidation) {
        const isValid = this.validateMeterReading(reading);
        if (!isValid) {
          return {
            success: false,
            error: 'Extracted reading appears to be invalid'
          };
        }
      }

      return {
        success: true,
        reading,
        confidence: 0.9, // Mock confidence score
        processedImageUrl: processedImage
      };

    } catch (error) {
      console.error('Error processing image:', error);
      return {
        success: false,
        error: 'Failed to process image'
      };
    }
  }

  /**
   * Validate image file
   */
  private validateImage(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  /**
   * Preprocess image for better OCR results
   */
  private async preprocessImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image
        ctx?.drawImage(img, 0, 0);

        // Apply preprocessing filters
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          // Convert to grayscale
          this.convertToGrayscale(imageData);
          
          // Enhance contrast
          this.enhanceContrast(imageData);
          
          // Apply noise reduction
          this.reduceNoise(imageData);

          ctx?.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert image to grayscale
   */
  private convertToGrayscale(imageData: ImageData): void {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;     // Red
      data[i + 1] = gray; // Green
      data[i + 2] = gray; // Blue
    }
  }

  /**
   * Enhance image contrast
   */
  private enhanceContrast(imageData: ImageData): void {
    const data = imageData.data;
    const factor = 1.5; // Contrast factor

    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    }
  }

  /**
   * Reduce image noise
   */
  private reduceNoise(imageData: ImageData): void {
    // Simple median filter implementation
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const neighbors = [
          tempData[idx - 4], tempData[idx], tempData[idx + 4],
          tempData[idx - width * 4], tempData[idx + width * 4],
          tempData[idx - width * 4 - 4], tempData[idx - width * 4 + 4],
          tempData[idx + width * 4 - 4], tempData[idx + width * 4 + 4]
        ];
        
        neighbors.sort((a, b) => a - b);
        data[idx] = neighbors[4]; // Median value
        data[idx + 1] = neighbors[4];
        data[idx + 2] = neighbors[4];
      }
    }
  }

  /**
   * Perform OCR on processed image with retries and fallback
   * Note: In a real implementation, this would use Tesseract.js or cloud OCR service
   */
  private async performOCR(imageDataUrl: string, retries: number = 3): Promise<string> {
    // Try OCR with retries
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // In a real implementation, use Tesseract.js:
        // const { createWorker } = await import('tesseract.js');
        // const worker = await createWorker('eng');
        // const { data: { text } } = await worker.recognize(imageDataUrl);
        // await worker.terminate();
        // return text;
        
        // Mock OCR implementation with retry logic
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate OCR processing with occasional failures
            if (Math.random() > 0.1) { // 90% success rate
              const mockReadings = ['1234', '1456', '1678', '1890', '2012'];
              const randomReading = mockReadings[Math.floor(Math.random() * mockReadings.length)];
              resolve(`Meter Reading: ${randomReading} kWh`);
            } else if (attempt < retries) {
              reject(new Error(`OCR attempt ${attempt} failed, retrying...`));
            } else {
              reject(new Error('OCR failed after all retries'));
            }
          }, 1000);
        });
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }
    throw new Error('OCR failed after all retries');
  }

  /**
   * Parse meter reading from OCR text with improved heuristics
   */
  private parseMeterReading(text: string): number | null {
    // Whitelist allowed characters: digits, decimal point, spaces
    const cleanedText = text.replace(/[^\d.\s]/g, '');
    
    // Extract numbers from text (support decimals)
    const numbers = cleanedText.match(/\d+\.?\d*/g);
    if (!numbers || numbers.length === 0) {
      return null;
    }

    // Find the largest number (likely the meter reading)
    const readings = numbers.map(Number);
    const maxReading = Math.max(...readings);

    // Validate reading range (typical meter readings are 0-99999)
    if (maxReading >= 0 && maxReading <= 99999) {
      return maxReading;
    }

    return null;
  }

  /**
   * Validate extracted meter reading
   */
  private validateMeterReading(reading: number): boolean {
    // Basic validation rules
    if (reading < 0 || reading > 99999) {
      return false;
    }

    // Check for reasonable reading (not too high or too low)
    if (reading < 0 || reading > 50000) {
      return false;
    }

    return true;
  }

  /**
   * Convert file to data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calculate electricity bill amount
   */
  calculateBillAmount(
    previousReading: number,
    currentReading: number,
    ratePerUnit: number
  ): number {
    const units = currentReading - previousReading;
    if (units < 0) {
      throw new Error('Current reading cannot be less than previous reading');
    }
    return units * ratePerUnit;
  }

  /**
   * Validate meter readings
   */
  validateReadings(previousReading: number, currentReading: number): boolean {
    if (previousReading < 0 || currentReading < 0) {
      return false;
    }
    if (currentReading < previousReading) {
      return false;
    }
    if (currentReading - previousReading > 1000) {
      return false; // Unusually high consumption
    }
    return true;
  }
}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService();
export default imageProcessingService;

