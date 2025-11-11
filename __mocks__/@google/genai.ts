import { vi } from 'vitest';

export const mockGenerateContent = vi.fn();

// Use a proper class for the mock
export class GoogleGenAI {
  constructor() {
    // This structure matches the one used in the service
    return {
      models: {
        generateContent: mockGenerateContent,
      },
    };
  }
}

export const Type = {
  OBJECT: 'OBJECT',
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  ARRAY: 'ARRAY',
};
