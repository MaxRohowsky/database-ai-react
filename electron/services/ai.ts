import OpenAI from 'openai';
import  ApiRequestOptions  from '@anthropic-ai/sdk';
import Anthropic from '@anthropic-ai/sdk';

export interface AiModelConfig {
  provider: 'openai' | 'claude';
  apiKey: string;
  model: string;
}

export interface AiResponse {
  sqlQuery: string;
  explanation?: string;
  error?: string;
}

/**
 * Processes natural language query and returns an SQL query using the specified AI provider
 * @param {AiModelConfig} config - AI configuration details
 * @param {string} prompt - Natural language prompt
 * @param {string} dbSchema - Database schema information (optional)
 * @returns {Promise<AiResponse>} AI-generated SQL query and explanation
 */
export async function generateSqlQuery(
  config: AiModelConfig, 
  prompt: string,
  dbSchema?: string
): Promise<AiResponse> {
  try {
    if (config.provider === 'openai') {
      return await generateWithOpenAI(config, prompt, dbSchema);
    } else if (config.provider === 'claude') {
      return await generateWithClaude(config, prompt, dbSchema);
    } else {
      throw new Error('Unsupported AI provider');
    }
  } catch (error) {
    console.error('AI query generation error:', error);
    return {
      sqlQuery: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function generateWithOpenAI(
  config: AiModelConfig, 
  prompt: string,
  dbSchema?: string
): Promise<AiResponse> {
  const openai = new OpenAI({
    apiKey: config.apiKey
  });

  const systemPrompt = `You are an expert SQL query generator. 
Your task is to translate natural language questions into valid SQL queries.
${dbSchema ? `Use the following database schema information: ${dbSchema}` : ''}
Return only the SQL query without any explanations. Make sure the SQL is valid and properly formatted.`;

  const response = await openai.chat.completions.create({
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
  });

  const sqlQuery = response.choices[0]?.message.content?.trim() || '';
  
  return {
    sqlQuery,
    explanation: response.choices[0]?.message.content || ''
  };
}

async function generateWithClaude(){

  return null;
} 