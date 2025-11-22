import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { EvaluateMessageDto } from './dto/evaluate-message.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('evaluate')
  async evaluateIntent(@Body() dto: EvaluateMessageDto) {
    return this.aiService.evaluateMessageWithRetry(
      dto.message,
      dto.expectedIntent,
    );
  }
}
