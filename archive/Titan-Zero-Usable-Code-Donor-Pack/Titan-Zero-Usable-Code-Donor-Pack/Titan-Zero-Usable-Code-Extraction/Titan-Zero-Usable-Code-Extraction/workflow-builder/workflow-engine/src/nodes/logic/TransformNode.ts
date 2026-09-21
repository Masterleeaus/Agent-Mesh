/**
 * Transform Logic Node
 * Transforms and manipulates data between workflow nodes
 * Following POC roadmap Milestone 1.2 specifications
 */

import { ExecutionContext, NodeResult, NodeConfiguration } from '../../types/workflow';
import { BaseNode } from '../BaseNode';

export class TransformNode extends BaseNode {
  getConfiguration(): NodeConfiguration {
    return {
      name: 'Transform Data',
      description: 'Transforms and manipulates data using simple operations',
      category: 'logic',
      inputs: {
        input_data: {
          type: 'object',
          required: true,
          description: 'Data to transform'
        },
        transformation_type: {
          type: 'string',
          required: true,
          description: 'Type of transformation (extract, merge, format, filter)'
        },
        transformation_config: {
          type: 'object',
          required: false,
          description: 'Configuration for the transformation'
        }
      },
      outputs: {
        transformed_data: {
          type: 'object',
          description: 'Transformed data'
        },
        original_data: {
          type: 'object',
          description: 'Original input data (for reference)'
        }
      }
    };
  }

  async execute(context: ExecutionContext): Promise<NodeResult> {
    try {
      this.validateInputs(context);

      const { 
        input_data, 
        transformation_type, 
        transformation_config = {} 
      } = context.inputs;

      context.logger.info(`Transforming data`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        transformationType: transformation_type,
        inputType: typeof input_data
      });

      let transformedData;

      switch (transformation_type) {
        case 'extract':
          transformedData = this.extractFields(input_data, transformation_config);
          break;
        
        case 'merge':
          transformedData = this.mergeData(input_data, transformation_config, context);
          break;
        
        case 'format':
          transformedData = this.formatData(input_data, transformation_config);
          break;
        
        case 'filter':
          transformedData = this.filterData(input_data, transformation_config);
          break;

        case 'map':
          transformedData = this.mapData(input_data, transformation_config);
          break;

        default:
          return this.createErrorResult(
            'UNSUPPORTED_TRANSFORMATION',
            `Unsupported transformation type: ${transformation_type}`
          );
      }

      context.logger.info(`Data transformation completed`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        transformationType: transformation_type,
        outputType: typeof transformedData
      });

      return this.createSuccessResult({
        transformed_data: transformedData,
        original_data: input_data
      });

    } catch (error) {
      context.logger.error(`Failed to transform data`, {
        executionId: context.executionId,
        nodeId: context.nodeId,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createErrorResult(
        'TRANSFORMATION_ERROR',
        error instanceof Error ? error.message : String(error),
        error
      );
    }
  }

  private extractFields(data: any, config: any): any {
    const { fields } = config;
    
    if (!fields || !Array.isArray(fields)) {
      throw new Error('Extract transformation requires "fields" array in config');
    }

    const extracted: any = {};
    
    for (const field of fields) {
      if (typeof field === 'string') {
        // Simple field extraction
        extracted[field] = this.getNestedProperty(data, field);
      } else if (typeof field === 'object') {
        // Field with alias: { from: 'source.field', to: 'target_field' }
        extracted[field.to] = this.getNestedProperty(data, field.from);
      }
    }

    return extracted;
  }

  private mergeData(data: any, config: any, context: ExecutionContext): any {
    const { merge_with, strategy = 'shallow' } = config;
    
    let mergeSource;
    
    if (typeof merge_with === 'string' && merge_with.startsWith('nodeOutputs.')) {
      // Merge with output from another node
      const nodePath = merge_with.replace('nodeOutputs.', '');
      mergeSource = this.getNestedProperty(context.nodeOutputs, nodePath);
    } else {
      mergeSource = merge_with;
    }

    if (strategy === 'deep') {
      return this.deepMerge(data, mergeSource);
    } else {
      // Shallow merge
      return { ...data, ...mergeSource };
    }
  }

  private formatData(data: any, config: any): any {
    const { format_type, template } = config;

    switch (format_type) {
      case 'template':
        return this.applyTemplate(data, template);
      
      case 'string':
        return String(data);
      
      case 'number':
        return Number(data);
      
      case 'date':
        return new Date(data).toISOString();
      
      case 'json':
        return JSON.stringify(data, null, 2);

      default:
        throw new Error(`Unsupported format type: ${format_type}`);
    }
  }

  private filterData(data: any, config: any): any {
    const { condition, keep_matching = true } = config;

    if (Array.isArray(data)) {
      return data.filter(item => {
        const matches = this.evaluateSimpleCondition(item, condition);
        return keep_matching ? matches : !matches;
      });
    } else if (typeof data === 'object') {
      const filtered: any = {};
      for (const [key, value] of Object.entries(data)) {
        const matches = this.evaluateSimpleCondition({ key, value }, condition);
        if (keep_matching ? matches : !matches) {
          filtered[key] = value;
        }
      }
      return filtered;
    }

    return data;
  }

  private mapData(data: any, config: any): any {
    const { mapping } = config;

    if (!mapping) {
      throw new Error('Map transformation requires "mapping" configuration');
    }

    if (Array.isArray(data)) {
      return data.map(item => this.applyMapping(item, mapping));
    } else {
      return this.applyMapping(data, mapping);
    }
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private applyTemplate(data: any, template: string): string {
    let result = template;
    
    // Simple template replacement: {{field}} or {{nested.field}}
    const templatePattern = /\{\{([^}]+)\}\}/g;
    
    result = result.replace(templatePattern, (match, path) => {
      const value = this.getNestedProperty(data, path.trim());
      return value !== undefined ? String(value) : match;
    });
    
    return result;
  }

  private applyMapping(item: any, mapping: any): any {
    const mapped: any = {};
    
    for (const [targetField, sourceField] of Object.entries(mapping)) {
      if (typeof sourceField === 'string') {
        mapped[targetField] = this.getNestedProperty(item, sourceField);
      } else {
        mapped[targetField] = sourceField;
      }
    }
    
    return mapped;
  }

  private evaluateSimpleCondition(item: any, condition: string): boolean {
    // Simple condition evaluation for filtering
    try {
      // Pattern: field operator value
      const match = condition.match(/(\w+(?:\.\w+)*)\s*([><=!]+)\s*(.+)/);
      if (match) {
        const field = match[1];
        const operator = match[2];
        const value = match[3].replace(/['"]/g, ''); // Remove quotes

        const itemValue = this.getNestedProperty(item, field);
        
        switch (operator) {
          case '>': return Number(itemValue) > Number(value);
          case '<': return Number(itemValue) < Number(value);
          case '>=': return Number(itemValue) >= Number(value);
          case '<=': return Number(itemValue) <= Number(value);
          case '==': return itemValue == value;
          case '!=': return itemValue != value;
          case '===': return itemValue === value;
          case '!==': return itemValue !== value;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}