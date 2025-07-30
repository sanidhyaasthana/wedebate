import { z } from 'zod';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Define the schema for the feedback response
export const FeedbackSchema = z.object({
  clarity: z.number().min(1).max(10),
  logic: z.number().min(1).max(10),
  persuasiveness: z.number().min(1).max(10),
  weakSpots: z.array(z.string()),
  suggestions: z.array(z.string()),
  summary: z.string(),
});

export type DebateFeedback = z.infer<typeof FeedbackSchema>;

// Function to generate feedback for debate arguments
export async function generateDebateFeedback(
  creatorArguments: string,
  opponentArguments: string,
  topic: string
): Promise<DebateFeedback> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const prompt = `
    You are an expert debate judge. Your task is to analyze a debate and provide structured feedback.
    
    Topic: "${topic}"

    First debater's arguments:
    ${creatorArguments}
    
    Second debater's arguments:
    ${opponentArguments}
    
    Respond with a JSON object in this EXACT format (replace text in parentheses with actual values):
    {
      "clarity": 8,
      "logic": 7,
      "persuasiveness": 8,
      "weakSpots": ["point 1", "point 2"],
      "suggestions": ["suggestion 1", "suggestion 2"],
      "summary": "overall assessment here"
    }

    Rules:
    1. Numbers must be between 1-10
    2. Arrays must have at least one item
    3. Use proper JSON syntax with double quotes
    4. No additional text or explanations outside the JSON
    5. Ensure the response is valid parseable JSON
    6. Alittle more descriptive in the feedback, but keep it concise
  `;

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'WeDebate App',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3-0324:free',
          messages: [
            {
              role: 'system',
              content: 'You are an expert debate judge. Always respond with valid, parseable JSON objects only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5, // Lower temperature for more consistent JSON
          max_tokens: 1000,
        }),
      });    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    try {
      // Parse the JSON response
      let feedbackJson;
      try {
        // Try to clean up the response if it's not valid JSON
        let cleanContent = content.trim();
        
        // Remove any markdown code block markers
        cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Try to find a JSON object in the content
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }

        // Try to parse the cleaned content
        try {
          feedbackJson = JSON.parse(cleanContent);
        } catch (firstError) {
          // If direct parsing fails, try to fix common JSON issues
          cleanContent = cleanContent
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":') // Fix unquoted or single-quoted property names
            .replace(/:\s*(['"])([^'"\[\{].*?)(['"])\s*(,|})/g, ':"$2"$4'); // Fix unquoted string values
          
          feedbackJson = JSON.parse(cleanContent);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response. Content:', content);
        console.error('Parse error:', parseError);
        
        // Create a fallback response
        feedbackJson = {
          clarity: 7,
          logic: 7,
          persuasiveness: 7,
          weakSpots: ["The argument could be more structured"],
          suggestions: ["Consider organizing your points more clearly"],
          summary: "The argument shows potential but needs better structure and clarity"
        };
      }

      // Pre-validate the structure before schema validation
      if (typeof feedbackJson !== 'object' || feedbackJson === null) {
        throw new Error('AI response was not a JSON object');
      }

      // Check for missing required fields
      const requiredFields = ['clarity', 'logic', 'persuasiveness', 'weakSpots', 'suggestions', 'summary'];
      const missingFields = requiredFields.filter(field => !(field in feedbackJson));
      if (missingFields.length > 0) {
        throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate number ranges before schema validation
      ['clarity', 'logic', 'persuasiveness'].forEach(field => {
        const score = feedbackJson[field];
        if (typeof score !== 'number' || score < 1 || score > 10) {
          throw new Error(`Invalid score for ${field}: must be a number between 1 and 10`);
        }
      });

      // Validate arrays have content
      ['weakSpots', 'suggestions'].forEach(field => {
        const arr = feedbackJson[field];
        if (!Array.isArray(arr) || arr.length === 0) {
          throw new Error(`${field} must be a non-empty array`);
        }
      });

      // Final schema validation
      try {
        return FeedbackSchema.parse(feedbackJson);
      } catch (zodError) {
        console.error('Schema validation error:', zodError);
        throw new Error('AI response failed schema validation');
      }
    } catch (error) {
      console.error('Error processing AI response:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error generating debate feedback:', error);
    throw error;
  }
};
 
// Function to generate AI argument in response to user's argument
export async function generateAIArgument(
  userArgument: string,
  topic: string,
  position: 'for' | 'against',
  debateSegment: 'opening' | 'rebuttal' | 'closing'
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('Error: OpenRouter API key is not configured');
    throw new Error('OpenRouter API key is not configured');
  }

  const prompt = `
    You are an expert debater participating in a formal debate on the topic: "${topic}".
    
    Your opponent has just made the following argument:
    ${userArgument}
    
    You are arguing ${position === 'for' ? 'against' : 'for'} the topic.
    This is the "${debateSegment}" segment of the debate.
    
    Provide a strong, logical counter-argument that directly addresses your opponent's points.
    Keep your response concise, focused, and persuasive. Use evidence and reasoning to support your position.
    Do not use any formatting or include any labels - just provide the argument text itself.
  `;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'WeDebate App',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: 'You are an expert debater who provides clear, logical, and persuasive arguments.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('Error: No content in OpenRouter response', data);
      throw new Error('No content in OpenRouter response');
    }

    return content.trim();
  } catch (error) {
    console.error('Error generating AI argument:', error);
    throw error;
  }
}

// Function to generate debate topics
export async function generateDebateTopics(count: number = 3): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const prompt = `
    Generate ${count} interesting and balanced debate topics that would be suitable for a formal debate.
    The topics should be controversial enough to have strong arguments on both sides.
    Return only the list of topics in JSON format as an array of strings.
  `;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000', 
        'X-Title': 'WeDebate App',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free', 
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    // Parse the JSON response
    const topicsJson = JSON.parse(content);
    
    // Ensure we have an array of strings
    if (!Array.isArray(topicsJson)) {
      throw new Error('Expected an array of topics');
    }
    
    return topicsJson.slice(0, count).map(String);
  } catch (error) {
    console.error('Error generating debate topics:', error);
    throw error;
  }
}