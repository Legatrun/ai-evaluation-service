import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TRAINING_DATASET, VALID_INTENTS } from '../constants';
import { FirestoreService } from '../firebase/firestore.service';
import {
  InteractionLog,
  AttemptDetail,
} from '../interfaces/interaction-log.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly firestoreService: FirestoreService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('FATAL ERROR');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async evaluateMessageWithRetry(message: string, expectedIntent: string) {
    const MAX_ATTEMPTS = 3;
    const incorrectIntents: string[] = [];
    const attemptHistory: AttemptDetail[] = [];

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      this.logger.log(`Intento ${attempt} de ${MAX_ATTEMPTS}`);

      const prompt = this.createRobustPrompt(message, incorrectIntents);

      const aiResponseIntent = await this.callAIModel(prompt);

      const wasCorrect = aiResponseIntent === expectedIntent;

      attemptHistory.push({
        attemptNumber: attempt,
        prompt,
        intentReturned: aiResponseIntent,
        wasCorrect,
      });

      if (wasCorrect) {
        await this.logInteraction({
          message,
          expectedIntent,
          finalResult: 'ok',
          attemptsUsed: attempt,
          timestamp: new Date(),
          attemptHistory,
        });

        return { ok: true, intent: aiResponseIntent, attemptsUsed: attempt };
      }

      incorrectIntents.push(aiResponseIntent);
    }

    await this.logInteraction({
      message,
      expectedIntent,
      finalResult: 'error',
      attemptsUsed: MAX_ATTEMPTS,
      timestamp: new Date(),
      attemptHistory,
    });

    return {
      ok: false,
      error: 'IA did not match expected intent after 3 attempts',
    };
  }

  private async logInteraction(log: InteractionLog): Promise<void> {
    try {
      await this.firestoreService.saveInteractionLog(log);
    } catch (error) {
      this.logger.error('Failed to log interaction to Firestore', error);
    }
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

