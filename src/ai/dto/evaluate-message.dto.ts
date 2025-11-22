import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { VALID_INTENTS } from '../../constants';

export class EvaluateMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsIn(VALID_INTENTS)
  expectedIntent: string;
}
