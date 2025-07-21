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
 
// Function to generate AI argument in response to user's argument
export async function generateAIArgument(
  userArgument: string,
  topic: string,
  position: 'for' | 'against',
  debateSegment: 'opening' | 'rebuttal' | 'closing'
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
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
            role: 'user',
            content: prompt,
          },
        ],
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

    return content.trim();
  } catch (error) {
    console.error('Error generating AI argument:', error);
    throw error;
  }
}

// Function to generate debate feedback using OpenRouter API
export async function generateDebateFeedback(
  userArguments: string,
  opponentArguments: string,
  topic: string
): Promise<DebateFeedback> {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not configured');
  }

  const prompt = `
    You are an expert debate coach analyzing a debate on the topic: "${topic}".
    
    First debater's arguments:
    ${userArguments}
    
    Second debater's arguments:
    ${opponentArguments}
    
    Please provide structured feedback in the following JSON format:
    {
      "clarity": [1-10 score],
      "logic": [1-10 score],
      "persuasiveness": [1-10 score],
      "weakSpots": ["list of weak points in the arguments"],
      "suggestions": ["list of suggestions to improve"],
      "summary": "overall assessment of the debate"
    }
  `;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000', // Replace with your actual domain
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
    const feedbackJson = JSON.parse(content);
    
    // Validate against our schema
    return FeedbackSchema.parse(feedbackJson);
  } catch (error) {
    console.error('Error generating debate feedback:', error);
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