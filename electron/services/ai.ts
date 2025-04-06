import OpenAI from 'openai';

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
    console.log(`Generating SQL with provider: ${config.provider}, model: ${config.model}`);

    // Only support OpenAI for now
    if (config.provider === 'openai') {
      return await generateWithOpenAI(config, prompt, dbSchema);
    } else {
      throw new Error('Only OpenAI provider is currently supported');
    }
  } catch (error) {
    console.error('AI query generation error:', error);
    return {
      sqlQuery: '',
      error: error instanceof Error ? error.message : 'Unknown error generating SQL'
    };
  }
}

async function generateWithOpenAI(
  config: AiModelConfig,
  prompt: string,
  dbSchema?: string
): Promise<AiResponse> {
  if (!config.apiKey) {
    return {
      sqlQuery: '',
      error: 'OpenAI API key is missing. Please provide a valid API key.'
    };
  }

  try {
    const openai = new OpenAI({
      apiKey: config.apiKey
    });

    const systemPrompt = `You are an expert SQL query generator. 
Your task is to translate natural language questions into valid SQL queries.
${dbSchema ? `Use the following database schema information: ${dbSchema}` : ''}
Return only the SQL query without any explanations. Make sure the SQL is valid and properly formatted.`;

    console.log(`Sending request to OpenAI with model: ${config.model}`);

    const response = await openai.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    });

    const sqlQuery = response.choices[0]?.message.content?.trim() || '';

    if (!sqlQuery) {
      return {
        sqlQuery: '',
        error: 'The AI model did not generate any SQL query. Please try again.'
      };
    }

    console.log('Successfully generated SQL query from OpenAI');

    return {
      sqlQuery,
      explanation: response.choices[0]?.message.content || ''
    };
  } catch (err) {
    console.error('OpenAI API error:', err);

    // Handle specific OpenAI errors
    if (err instanceof Error) {
      const errorMessage = err.message;

      if (errorMessage.includes('API key')) {
        return {
          sqlQuery: '',
          error: 'Invalid OpenAI API key. Please check your API key and try again.'
        };
      }

      if (errorMessage.includes('rate limit')) {
        return {
          sqlQuery: '',
          error: 'OpenAI rate limit exceeded. Please try again later.'
        };
      }
    }

    return {
      sqlQuery: '',
      error: err instanceof Error ? err.message : 'Unknown error occurred when calling OpenAI API'
    };
  }
} 