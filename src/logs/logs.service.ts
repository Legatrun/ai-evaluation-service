import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';

@Injectable()
export class LogsService {
    private readonly logger = new Logger(LogsService.name);

    constructor(private readonly firestoreService: FirestoreService) { }

    async getLogsByAttempts(attempts: number) {
        this.logger.log(`Querying logs with ${attempts} attempts`);
        return this.firestoreService.getLogsByAttempts(attempts);
    }
}
