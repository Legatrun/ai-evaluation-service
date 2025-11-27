import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreService implements OnModuleInit {
    private readonly logger = new Logger(FirestoreService.name);
    private firestore: Firestore;

    onModuleInit() {
        try {
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
                /\\n/g,
                '\n',
            );

            if (!projectId || !clientEmail || !privateKey) {
                throw new Error(
                    'Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
                );
            }

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });

            this.firestore = admin.firestore();
            this.logger.log('Firebase initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Firebase', error);
            throw error;
        }
    }

    getFirestore(): Firestore {
        return this.firestore;
    }

    async saveInteractionLog(log: any): Promise<string> {
        try {
            const docRef = await this.firestore.collection('interactions').add({
                ...log,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            this.logger.log(`Interaction log saved with ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            this.logger.error('Error saving interaction log', error);
            throw error;
        }
    }

    async getLogsByAttempts(attempts: number): Promise<any[]> {
        try {
            const snapshot = await this.firestore
                .collection('interactions')
                .where('attemptsUsed', '==', attempts)
                .orderBy('timestamp', 'desc')
                .get();

            const logs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            this.logger.log(
                `Retrieved ${logs.length} logs with ${attempts} attempts`,
            );
            return logs;
        } catch (error) {
            this.logger.error('Error retrieving logs by attempts', error);
            throw error;
        }
    }
}
