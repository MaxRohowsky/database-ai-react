// AI service for generating SQL from natural language

interface ModelConfig {
  apiKey: string;
  model: string;
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

interface Schema {
  [tableName: string]: SchemaColumn[];
}

// Update AI model configuration
export const updateModelConfig = async (provider: string, config: ModelConfig): Promise<boolean> => {
  try {
    return await window.api.updateModelConfig(provider, config);
  } catch (error) {
    console.error(`Error updating ${provider} model configuration:`, error);
    throw error;
  }
};

// Get current AI model configurations
export const getModelConfigs = async () => {
  try {
    return await window.api.getModelConfigs();
  } catch (error) {
    console.error('Error getting model configurations:', error);
    throw error;
  }
};

// Generate SQL from natural language query
export const generateSqlQuery = async (
  naturalLanguageQuery: string, 
  databaseSchema: Schema, 
  provider: string = 'openai'
): Promise<string> => {
  try {
    return await window.api.generateSql(naturalLanguageQuery, databaseSchema, provider);
  } catch (error) {
    console.error('Error generating SQL query:', error);
    throw error;
  }
}; 