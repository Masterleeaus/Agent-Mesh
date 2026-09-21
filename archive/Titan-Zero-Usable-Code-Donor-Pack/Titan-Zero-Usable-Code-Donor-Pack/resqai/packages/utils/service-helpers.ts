/**
 * Safely parses agent JSON response with optional regex fallback for markdown code blocks
 */
export function parseAgentResponse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        'Agent did not return valid JSON. No JSON object found in response.'
      );
    }
    return JSON.parse(jsonMatch[0]) as T;
  }
}

/**
 * Normalize error to string - eliminates repeated `err instanceof Error ? err.message : String(err)` pattern
 */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
