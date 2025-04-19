import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * Processes natural language query and returns an SQL query using the specified AI provider
 * @param {AiModelSelection} aiSelection - AI model selection details
 * @param {string} prompt - Natural language prompt
 * @param {string} dbSchema - Database schema information (optional)
 * @returns {Promise<SqlGenerationResponse>} AI-generated SQL query and explanation
 */
export async function generateSql(
  aiSelection: AiModelSelection,
  apiKey: string,
  prompt: string,
  dbSchema?: string,
): Promise<SqlGenerationResponse> {
  try {
    if (!apiKey) {
      return {
        sqlQuery: "",
        error: "AI model configuration is missing",
      };
    }

    switch (aiSelection.selectedProvider) {
      case "openai":
        return await generateWithOpenAI(
          apiKey,
          aiSelection.selectedModel as OpenAiModel,
          prompt,
          dbSchema,
        );

      case "anthropic":
        return await generateWithAnthropic(
          apiKey,
          aiSelection.selectedModel as AnthropicModel,
          prompt,
          dbSchema,
        );

      default:
        throw new Error(
          `Unsupported AI provider: ${aiSelection.selectedProvider ?? "none"}`,
        );
    }
  } catch (error) {
    console.error("AI query generation error:", error);
    return {
      sqlQuery: "",
      error:
        error instanceof Error ? error.message : "Unknown error generating SQL",
    };
  }
}

/**
 * Generates SQL query using OpenAI API
 */
async function generateWithOpenAI(
  apiKey: string,
  model: OpenAiModel,
  prompt: string,
  dbSchema?: string,
): Promise<SqlGenerationResponse> {
  if (!apiKey) {
    return {
      sqlQuery: "",
      error: "OpenAI API key is missing. Please provide a valid API key.",
    };
  }

  try {
    const openai = new OpenAI({
      apiKey,
    });

    const systemPrompt = `You are an expert SQL query generator. 
Your task is to translate natural language questions into valid SQL queries.
${dbSchema ? `Use the following database schema information: ${dbSchema}` : ""}
Return only the SQL query without any explanations. Return pure SQL code without any markdown code blocks.`;

    console.log(`Sending request to OpenAI with model: ${model}`);

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const sqlQuery = response.choices[0]?.message.content?.trim() || "";

    if (!sqlQuery) {
      return {
        sqlQuery: "",
        error: "The AI model did not generate any SQL query. Please try again.",
      };
    }

    console.log("Successfully generated SQL query from OpenAI");

    return {
      sqlQuery,
    };
  } catch (err) {
    console.error("OpenAI API error:", err);

    // Handle specific OpenAI errors
    if (err instanceof Error) {
      const errorMessage = err.message;

      if (errorMessage.includes("API key")) {
        return {
          sqlQuery: "",
          error:
            "Invalid OpenAI API key. Please check your API key and try again.",
        };
      }

      if (errorMessage.includes("rate limit")) {
        return {
          sqlQuery: "",
          error: "OpenAI rate limit exceeded. Please try again later.",
        };
      }
    }

    return {
      sqlQuery: "",
      error:
        err instanceof Error
          ? err.message
          : "Unknown error occurred when calling OpenAI API",
    };
  }
}

/**
 * Generates SQL query using Anthropic API
 */
async function generateWithAnthropic(
  aiConfig: AiModelConfig,
  model: AnthropicModel,
  prompt: string,
  dbSchema?: string,
): Promise<SqlGenerationResponse> {
  if (!aiConfig.anthropic?.apiKey) {
    return {
      sqlQuery: "",
      error: "Anthropic API key is missing. Please provide a valid API key.",
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: aiConfig.anthropic.apiKey,
    });

    const systemPrompt = `You are an expert SQL query generator. 
Your task is to translate natural language questions into valid SQL queries.
${dbSchema ? `Use the following database schema information: ${dbSchema}` : ""}
Return only the SQL query without any explanations. Make sure the SQL is valid and properly formatted.`;

    console.log(`Sending request to Anthropic with model: ${model}`);

    const response = await anthropic.messages.create({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const sqlQuery = response.content[0]?.text?.trim() || "";

    if (!sqlQuery) {
      return {
        sqlQuery: "",
        error: "The AI model did not generate any SQL query. Please try again.",
      };
    }

    console.log("Successfully generated SQL query from Anthropic");

    return {
      sqlQuery,
    };
  } catch (err) {
    console.error("Anthropic API error:", err);

    // Handle specific Anthropic errors
    if (err instanceof Error) {
      const errorMessage = err.message;

      if (errorMessage.includes("API key")) {
        return {
          sqlQuery: "",
          error:
            "Invalid Anthropic API key. Please check your API key and try again.",
        };
      }

      if (errorMessage.includes("rate limit")) {
        return {
          sqlQuery: "",
          error: "Anthropic rate limit exceeded. Please try again later.",
        };
      }
    }

    return {
      sqlQuery: "",
      error:
        err instanceof Error
          ? err.message
          : "Unknown error occurred when calling Anthropic API",
    };
  }
}
