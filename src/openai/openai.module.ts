import { Global, Module } from '@nestjs/common';
import { OpenAiService} from "./openai.service";
import { OpenaiController} from "./openai.controller";

@Global()
@Module({
  imports: [],
  controllers: [OpenaiController],
  providers: [OpenAiService],
  exports: [OpenAiService]
})

export class OpenaiModule {}
