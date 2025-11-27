export interface AttemptDetail {
    attemptNumber: number;
    prompt: string;
    intentReturned: string;
    wasCorrect: boolean;
}

export interface InteractionLog {
    message: string;
    expectedIntent: string;
    finalResult: 'ok' | 'error';
    attemptsUsed: number;
    timestamp: Date;
    attemptHistory: AttemptDetail[];
}
