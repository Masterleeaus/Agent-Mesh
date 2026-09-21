/**
 * AI Text Generation Node
 * Uses Claude API for AI-powered text generation
 * Following POC roadmap Milestone 1.2 specifications
 */

import { ExecutionContext, NodeResult, NodeConfiguration } from '../../types/workflow';
import { BaseNode } from '../BaseNode';
import Anthropic from '@anthropic-ai/sdk';

export class AITextGenerationNode extends BaseNode {
  private anthropic: Anthropic;

  constructor(id: string, nodeDefinition: any) {
    super(id, nodeDefinition);
    
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey
    });
  }

  getConfiguration(): NodeConfiguration {
    return {
      name: 'AI Text Generation',
      description: 'Generates text content using Claude AI',
      category: 'ai',
      inputs: {
        prompt: {
          type: 'string',
          required: true,
          description: 'Text prompt for AI generation'
        },
        context: {
          type: 'object',
          required: false,
          description: 'Additional context data for generation'
        },
        model: {
          type: 'string',
          required: false,
          description: 'AI model to use',
          default: 'claude-3-5-sonnet-20241022'
        },
        max_tokens: {
          type: 'number',
          required: false,
          description: 'Maximum tokens to generate',
          default: 2000
        },
        temperature: {
          type: 'number',
          required: false,
          description: 'Generation temperature (0.0 to 1.0)',
          default: 0.7
        }
      },
      outputs: {
        generated_text: {
          type: 'string',
          description: 'Generated text content'
        },
        usage: {
          type: 'object',
          description: 'Token usage information'
        }
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    try {
      this.validateInputs(context);

      const { 
        prompt, 
        context: additionalContext,
        model = 'claude-3-5-sonnet-20241022',
        max_tokens = 2000,
        temperature = 0.7
      } = context.inputs;

      context.logger.info(`Generating AI text content`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        model,
        promptLength: prompt.length,
        maxTokens: max_tokens
      });

      // Build the full prompt with context if provided
      let fullPrompt = prompt;
      
      if (additionalContext) {
        const contextString = typeof additionalContext === 'string' 
          ? additionalContext 
          : JSON.stringify(additionalContext, null, 2);
        
        fullPrompt = `Context:\n${contextString}\n\nPrompt:\n${prompt}`;
      }

      const response = await this.anthropic.messages.create({
        model,
        max_tokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      });

      const generatedText = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('\n');

      if (!generatedText) {
        return this.createErrorResult(
          'GENERATION_FAILED',
          'AI failed to generate any text content'
        );
      }

      const usage = {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      };

      context.logger.info(`Successfully generated AI text`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        generatedLength: generatedText.length,
        tokenUsage: usage
      });

      return this.createSuccessResult({
        generated_text: generatedText,
        usage
      });

    } catch (error) {
      context.logger.error(`Failed to generate AI text`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        error: error instanceof Error ? error.message : String(error)
      });

      // Handle Anthropic-specific errors
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          return this.createErrorResult(
            'RATE_LIMIT_ERROR',
            'AI API rate limit exceeded, please try again later'
          );
        }

        if (error.message.includes('quota')) {
          return this.createErrorResult(
            'QUOTA_EXCEEDED',
            'AI API quota exceeded'
          );
        }

        if (error.message.includes('authentication')) {
          return this.createErrorResult(
            'AUTH_ERROR',
            'AI API authentication failed - check API key'
          );
        }
      }

      return this.createErrorResult(
        'EXECUTION_ERROR',
        error instanceof Error ? error.message : String(error),
        error
      );
    }
  }
}