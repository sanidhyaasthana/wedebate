 





// Sample debate prompts for the application

export const sampleDebateTopics = [
  "Social media harms teenage mental health.",
  "AI should be regulated by international laws.",
  "Remote work is more productive than office work.",
  "Cryptocurrency will eventually replace traditional banking.",
  "Climate change should be the top priority for all governments.",
  "Universal basic income should be implemented globally.",
  "Space exploration is a waste of resources.",
  "Genetic engineering of humans should be banned.",
  "Nuclear energy is the best solution to climate change.",
  "The four-day work week should become the standard."
];

// Debate formats
export const debateFormats = [
  {
    id: 'standard',
    name: 'Standard Debate',
    description: 'Opening statements, rebuttals, and closing arguments',
    structure: [
      { name: 'Opening Statement', duration: 180 }, // 3 minutes
      { name: 'Rebuttal', duration: 120 }, // 2 minutes
      { name: 'Conclusion', duration: 60 }, // 1 minute
    ],
  },
  {
    id: 'quick',
    name: 'Quick Debate',
    description: 'Shorter format for quick debates',
    structure: [
      { name: 'Opening', duration: 90 }, // 1.5 minutes
      { name: 'Rebuttal', duration: 60 }, // 1 minute
      { name: 'Conclusion', duration: 30 }, // 30 seconds
    ],
  },
  {
    id: 'extended',
    name: 'Extended Debate',
    description: 'Longer format with cross-examination',
    structure: [
      { name: 'Opening Statement', duration: 240 }, // 4 minutes
      { name: 'Cross-Examination', duration: 180 }, // 3 minutes
      { name: 'Rebuttal', duration: 180 }, // 3 minutes
      { name: 'Conclusion', duration: 120 }, // 2 minutes
    ],
  },
];

// AI feedback prompt template
export const getFeedbackPrompt = (topic: string, userArguments: string, opponentArguments: string) => {
  return `
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
};

// AI solo practice prompt template
export const getSoloPracticePrompt = (topic: string, stance: 'for' | 'against', userArguments: string) => {
  return `
    You are participating in a debate on the topic: "${topic}".
    
    You are arguing ${stance === 'for' ? 'against' : 'for'} the motion.
    
    The other debater has made the following arguments:
    ${userArguments}
    
    Please provide a thoughtful rebuttal to these arguments, highlighting any logical fallacies, 
    presenting counter-evidence, and making your own case for your position.
    
    Your response should be structured, persuasive, and focused on the key points.
  `;
};
