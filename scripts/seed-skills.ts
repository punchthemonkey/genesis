/**
 * Seed script to pre-install default skills.
 * Run with: npx ts-node scripts/seed-skills.ts
 */

import 'reflect-metadata';
import { container } from '../src/infrastructure/di/container';
import { InstallSkillUseCase } from '../src/application/usecases/InstallSkillUseCase';
import { IKeychain } from '../src/domain/ports/IKeychain';
import { TOKENS } from '../src/infrastructure/di/tokens';

const defaultSkills = [
  {
    name: 'Calculator Assistant',
    description: 'Helps with mathematical calculations.',
    systemPrompt: 'You are a helpful math assistant. Use the calculator tool when needed.',
    allowedTools: ['calculator'],
    version: '1.0.0',
  },
  {
    name: 'General Assistant',
    description: 'Default helpful assistant.',
    systemPrompt: 'You are a helpful, harmless, and honest assistant.',
    allowedTools: [],
    version: '1.0.0',
  },
];

async function seed() {
  const keychain = container.resolve<IKeychain>(TOKENS.Keychain);
  const initialized = await keychain.isInitialized();
  if (!initialized.ok || !initialized.value) {
    console.log('Initializing vault with temporary password...');
    await keychain.initialize('temp-seed-password');
    await keychain.unlock('temp-seed-password');
  }

  const useCase = container.resolve(InstallSkillUseCase);
  for (const skillData of defaultSkills) {
    const result = await useCase.execute(JSON.stringify(skillData));
    if (result.ok) {
      console.log(`Installed skill: ${result.value.name}`);
    } else {
      console.error(`Failed to install skill: ${result.error.message}`);
    }
  }
  console.log('Seeding complete.');
}

seed().catch(console.error);
