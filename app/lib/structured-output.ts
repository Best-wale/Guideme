import { z } from 'zod';

export const StepSchema = z.object({
  instruction: z.string().describe('Clear instruction for the user'),
  targetText: z.string().describe('Text content of the element to interact with'),
  action: z.enum(['highlight', 'move-cursor', 'input', 'click']).describe('Type of action to perform'),
  selectorHint: z.string().describe('CSS selector or text hint to find the element'),
});

export const GuidanceSchema = z.object({
  response: z.string().describe('Text response to the user query'),
  steps: z.array(StepSchema).optional().describe('Optional step-by-step guidance'),
});

export type Step = z.infer<typeof StepSchema>;
export type Guidance = z.infer<typeof GuidanceSchema>;

export function parseGuidanceResponse(response: string, aiResponse: string): Guidance {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        response,
        steps: parsed.steps?.map((s: any) => StepSchema.parse(s)),
      };
    }
  } catch (error) {
    console.error('[Backend] Failed to parse guidance steps:', error);
  }

  return {
    response,
    steps: [],
  };
}

export function validatePageContext(context: any) {
  return {
    url: String(context.url || ''),
    title: String(context.title || ''),
    buttons: Array.isArray(context.buttons) ? context.buttons.slice(0, 15) : [],
    formInputs: Array.isArray(context.formInputs) ? context.formInputs.slice(0, 10) : [],
    headings: Array.isArray(context.headings) ? context.headings.slice(0, 20) : [],
    visibleText: String(context.visibleText || '').substring(0, 1000),
  };
}
