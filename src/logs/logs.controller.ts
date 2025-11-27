import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    @Get('by-attempts/:attempts')
    async getLogsByAttempts(@Param('attempts', ParseIntPipe) attempts: number) {
        if (attempts < 1 || attempts > 3) {
            throw new HttpException(
                'Attempts must be between 1 and 3',
                HttpStatus.BAD_REQUEST,
            );
        }

        return this.logsService.getLogsByAttempts(attempts);
    }
}
