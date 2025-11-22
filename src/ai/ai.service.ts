import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRAINING_DATASET, VALID_INTENTS } from '../constants';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('FATAL ERROR');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async evaluateMessageWithRetry(message: string, expectedIntent: string) {
    const MAX_ATTEMPTS = 3;
    const incorrectIntents: string[] = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      this.logger.log(`Intento ${attempt} de ${MAX_ATTEMPTS}`);

      const prompt = this.createRobustPrompt(message, incorrectIntents);

      const aiResponseIntent = await this.callAIModel(prompt);

      if (aiResponseIntent === expectedIntent) {
        return { ok: true, intent: aiResponseIntent, attemptsUsed: attempt };
      }

      incorrectIntents.push(aiResponseIntent);
    }

    return {
      ok: false,
      error: 'IA did not match expected intent after 3 attempts',
    };
  }

  private createRobustPrompt(
    message: string,
    forbiddenIntents: string[],
  ): string {
    return `Clasifica el siguiente mensaje en uno de los intents: ${VALID_INTENTS.join(', ')}.
    Ejemplos de entrenamiento: ${JSON.stringify(TRAINING_DATASET)}.
    Mensaje: "${message}".
    ${forbiddenIntents.length > 0 ? `IMPORTANTE: NO DEBES USAR los siguientes intents: ${forbiddenIntents.join(', ')}.` : ''}
    Tu respuesta debe ser solo el nombre del intent.`;
  }

  private async callAIModel(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  }
}
