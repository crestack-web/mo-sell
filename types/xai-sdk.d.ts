declare module 'xai-sdk' {
  export interface ClientOptions {
    apiKey: string;
    baseURL?: string;
  }

  export class Client {
    constructor(options: ClientOptions);
    chat: Chat;
  }

  export interface Chat {
    completions: Completions;
  }

  export interface Completions {
    create(params: CompletionParams): Promise<CompletionResponse>;
  }

  export interface CompletionParams {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    temperature?: number;
    max_tokens?: number;
  }

  export interface CompletionResponse {
    choices: Array<{
      message?: {
        content?: string;
      };
    }>;
  }

  export const xai: {
    Client: typeof Client;
  };
}
