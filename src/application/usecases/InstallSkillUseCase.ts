/**
 * InstallSkillUseCase.ts
 * Validates and persists a skill manifest.
 *
 * @version 1.0.0 - Added prompt sanitization.
 */

import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@infrastructure/di/tokens';
import { IMemoryStore } from '@domain/ports/IMemoryStore';
import { Skill } from '@domain/skill/Skill';
import { Result, ok, err } from '@shared/types/Result';

export type InstallSkillError =
  | { code: 'INVALID_MANIFEST'; message: string }
  | { code: 'STORAGE_ERROR'; message: string }
  | { code: 'SUSPICIOUS_PROMPT'; message: string };

@injectable()
export class InstallSkillUseCase {
  constructor(@inject(TOKENS.MemoryStore) private memoryStore: IMemoryStore) {}

  /**
   * Sanitizes the system prompt to prevent obvious injection patterns.
   */
  private sanitizePrompt(prompt: string): Result<string, InstallSkillError> {
    const MAX_LENGTH = 4000;
    if (prompt.length > MAX_LENGTH) {
      return err({ code: 'INVALID_MANIFEST', message: `Prompt exceeds ${MAX_LENGTH} characters` });
    }
    const suspicious = [/ignore (all |previous )?instructions/i, /you are now/i];
    for (const pattern of suspicious) {
      if (pattern.test(prompt)) {
        return err({ code: 'SUSPICIOUS_PROMPT', message: 'Prompt contains prohibited patterns' });
      }
    }
    return ok(prompt);
  }

  async execute(manifestJson: string): Promise<Result<Skill, InstallSkillError>> {
    try {
      const data = JSON.parse(manifestJson);
      const sanitizedPrompt = this.sanitizePrompt(data.systemPrompt);
      if (!sanitizedPrompt.ok) return sanitizedPrompt;
      data.systemPrompt = sanitizedPrompt.value;

      const skill = Skill.fromJSON(data);
      if (!skill) {
        return err({ code: 'INVALID_MANIFEST', message: 'Invalid skill manifest' });
      }
      const saveResult = await this.memoryStore.saveSkill(skill);
      if (!saveResult.ok) {
        return err({ code: 'STORAGE_ERROR', message: saveResult.error.message });
      }
      return ok(skill);
    } catch (e) {
      return err({ code: 'INVALID_MANIFEST', message: String(e) });
    }
  }
}
