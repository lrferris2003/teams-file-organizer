
import { FileCategory, CategorizationResult } from './types';

interface CategoryRule {
  category: FileCategory;
  keywords: string[];
  extensions: string[];
  pathPatterns: string[];
  priority: number;
}

const CATEGORIZATION_RULES: CategoryRule[] = [
  {
    category: FileCategory.ESTIMATING,
    keywords: ['estimate', 'bid', 'quote', 'proposal', 'cost', 'pricing', 'takeoff', 'quantity'],
    extensions: ['.xlsx', '.xls', '.csv'],
    pathPatterns: ['estimat', 'bid', 'quote', 'proposal'],
    priority: 10,
  },
  {
    category: FileCategory.OPERATIONS,
    keywords: ['operation', 'project', 'schedule', 'timeline', 'workflow', 'process', 'procedure'],
    extensions: ['.pdf', '.docx', '.doc'],
    pathPatterns: ['operation', 'project', 'schedule', 'workflow'],
    priority: 9,
  },
  {
    category: FileCategory.ACCOUNTING,
    keywords: ['invoice', 'receipt', 'expense', 'payment', 'billing', 'account', 'ledger', 'journal'],
    extensions: ['.pdf', '.xlsx', '.xls'],
    pathPatterns: ['accounting', 'invoice', 'billing', 'expense'],
    priority: 10,
  },
  {
    category: FileCategory.FINANCE,
    keywords: ['budget', 'financial', 'profit', 'loss', 'revenue', 'cash', 'flow', 'statement'],
    extensions: ['.xlsx', '.xls', '.pdf'],
    pathPatterns: ['finance', 'budget', 'financial'],
    priority: 9,
  },
  {
    category: FileCategory.MARKETING,
    keywords: ['marketing', 'advertisement', 'promotion', 'brochure', 'flyer', 'campaign', 'brand'],
    extensions: ['.pdf', '.jpg', '.png', '.psd', '.ai'],
    pathPatterns: ['marketing', 'promo', 'brand', 'campaign'],
    priority: 8,
  },
  {
    category: FileCategory.OFFICE,
    keywords: ['memo', 'policy', 'procedure', 'handbook', 'manual', 'template', 'form'],
    extensions: ['.docx', '.doc', '.pdf', '.txt'],
    pathPatterns: ['office', 'admin', 'policy', 'template'],
    priority: 7,
  },
];

export class CategorizationEngine {
  categorizeFile(fileName: string, filePath: string, mimeType: string): CategorizationResult {
    const normalizedName = fileName.toLowerCase();
    const normalizedPath = filePath.toLowerCase();
    const extension = this.getFileExtension(fileName);

    let bestMatch: CategorizationResult = {
      category: FileCategory.UNCATEGORIZED,
      confidence: 0,
      reason: 'No matching rules found',
    };

    for (const rule of CATEGORIZATION_RULES) {
      const score = this.calculateRuleScore(rule, normalizedName, normalizedPath, extension);
      
      if (score > bestMatch.confidence) {
        bestMatch = {
          category: rule.category,
          confidence: score,
          reason: this.generateReason(rule, normalizedName, normalizedPath, extension),
        };
      }
    }

    // Ensure confidence is between 0 and 1
    bestMatch.confidence = Math.min(bestMatch.confidence, 1.0);

    return bestMatch;
  }

  private calculateRuleScore(
    rule: CategoryRule,
    fileName: string,
    filePath: string,
    extension: string
  ): number {
    let score = 0;
    const maxScore = 100;

    // Check keywords in filename (40% weight)
    const keywordMatches = rule.keywords.filter(keyword => 
      fileName.includes(keyword.toLowerCase())
    ).length;
    if (keywordMatches > 0) {
      score += (keywordMatches / rule.keywords.length) * 40;
    }

    // Check keywords in path (30% weight)
    const pathKeywordMatches = rule.keywords.filter(keyword => 
      filePath.includes(keyword.toLowerCase())
    ).length;
    if (pathKeywordMatches > 0) {
      score += (pathKeywordMatches / rule.keywords.length) * 30;
    }

    // Check path patterns (20% weight)
    const pathPatternMatches = rule.pathPatterns.filter(pattern => 
      filePath.includes(pattern.toLowerCase())
    ).length;
    if (pathPatternMatches > 0) {
      score += (pathPatternMatches / rule.pathPatterns.length) * 20;
    }

    // Check file extension (10% weight)
    if (rule.extensions.includes(extension.toLowerCase())) {
      score += 10;
    }

    // Apply priority multiplier
    score = (score / maxScore) * (rule.priority / 10);

    return score;
  }

  private generateReason(
    rule: CategoryRule,
    fileName: string,
    filePath: string,
    extension: string
  ): string {
    const reasons: string[] = [];

    // Check what matched
    const keywordMatches = rule.keywords.filter(keyword => 
      fileName.includes(keyword.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      reasons.push(`filename contains: ${keywordMatches.join(', ')}`);
    }

    const pathKeywordMatches = rule.keywords.filter(keyword => 
      filePath.includes(keyword.toLowerCase())
    );
    if (pathKeywordMatches.length > 0) {
      reasons.push(`path contains: ${pathKeywordMatches.join(', ')}`);
    }

    const pathPatternMatches = rule.pathPatterns.filter(pattern => 
      filePath.includes(pattern.toLowerCase())
    );
    if (pathPatternMatches.length > 0) {
      reasons.push(`path pattern: ${pathPatternMatches.join(', ')}`);
    }

    if (rule.extensions.includes(extension.toLowerCase())) {
      reasons.push(`file type: ${extension}`);
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Rule matched';
  }

  private getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  }

  // Learn from user corrections
  async learnFromCorrection(
    fileName: string,
    filePath: string,
    mimeType: string,
    oldCategory: FileCategory,
    newCategory: FileCategory
  ): Promise<void> {
    // This would be implemented to update ML models or rules
    // For now, we'll just log the correction
    console.log('Learning from correction:', {
      fileName,
      filePath,
      mimeType,
      oldCategory,
      newCategory,
    });

    // In a production system, this would:
    // 1. Store the correction in the database
    // 2. Update rule weights or create new rules
    // 3. Retrain ML models if applicable
  }

  // Get category statistics for learning
  getCategoryKeywords(category: FileCategory): string[] {
    const rule = CATEGORIZATION_RULES.find(r => r.category === category);
    return rule ? rule.keywords : [];
  }

  // Suggest improvements based on manual corrections
  async suggestRuleImprovements(): Promise<string[]> {
    // This would analyze categorization history and suggest rule improvements
    return [
      'Consider adding more keywords for better accuracy',
      'Review path patterns for common folder structures',
      'Analyze file extensions for category-specific types',
    ];
  }
}

export const categorizationEngine = new CategorizationEngine();
