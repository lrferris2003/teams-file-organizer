
import { FileCategory, CategorizationResult, AICategorizationResult, Department } from './types';

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
    keywords: ['estimate', 'bid', 'quote', 'proposal', 'cost', 'pricing', 'takeoff', 'quantity', 'measure', 'scope', 'materials', 'labor', 'overhead', 'markup', 'tender'],
    extensions: ['.xlsx', '.xls', '.csv', '.ods', '.xlsm'],
    pathPatterns: ['estimat', 'bid', 'quote', 'proposal', 'pricing', 'tender'],
    priority: 10,
  },
  {
    category: FileCategory.OPERATIONS,
    keywords: ['operation', 'project', 'schedule', 'timeline', 'workflow', 'process', 'procedure', 'execution', 'implementation', 'deployment', 'construction', 'field', 'site', 'progress'],
    extensions: ['.pdf', '.docx', '.doc', '.ppt', '.pptx'],
    pathPatterns: ['operation', 'project', 'schedule', 'workflow', 'execution', 'field', 'site'],
    priority: 9,
  },
  {
    category: FileCategory.ACCOUNTING,
    keywords: ['invoice', 'receipt', 'expense', 'payment', 'billing', 'account', 'ledger', 'journal', 'accounts', 'payable', 'receivable', 'reconciliation', 'bookkeeping', 'transaction'],
    extensions: ['.pdf', '.xlsx', '.xls', '.csv'],
    pathPatterns: ['accounting', 'invoice', 'billing', 'expense', 'payable', 'receivable'],
    priority: 10,
  },
  {
    category: FileCategory.FINANCE,
    keywords: ['budget', 'financial', 'profit', 'loss', 'revenue', 'cash', 'flow', 'statement', 'forecast', 'analysis', 'report', 'investment', 'capital', 'funding'],
    extensions: ['.xlsx', '.xls', '.pdf', '.csv'],
    pathPatterns: ['finance', 'budget', 'financial', 'forecast', 'investment'],
    priority: 9,
  },
  {
    category: FileCategory.COMPANY_LAYOUT,
    keywords: ['layout', 'blueprint', 'design', 'plan', 'drawing', 'schematic', 'diagram', 'architecture', 'structure', 'building', 'floor', 'elevation', 'section', 'detail'],
    extensions: ['.dwg', '.dxf', '.pdf', '.jpg', '.png', '.tiff', '.bmp'],
    pathPatterns: ['layout', 'blueprint', 'design', 'drawing', 'plan', 'architecture'],
    priority: 9,
  },
  {
    category: FileCategory.OFFICE,
    keywords: ['memo', 'policy', 'procedure', 'handbook', 'manual', 'template', 'form', 'admin', 'hr', 'human', 'resources', 'employee', 'staff', 'meeting', 'minutes'],
    extensions: ['.docx', '.doc', '.pdf', '.txt', '.rtf'],
    pathPatterns: ['office', 'admin', 'policy', 'template', 'hr', 'human', 'employee'],
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

  // Enhanced AI-powered categorization
  async categorizeFileWithAI(
    fileName: string, 
    filePath: string, 
    mimeType: string,
    fileContent?: string
  ): Promise<AICategorizationResult> {
    try {
      // First try rule-based categorization
      const ruleBasedResult = this.categorizeFile(fileName, filePath, mimeType);
      
      // If we have file content, use AI for enhanced analysis
      if (fileContent && fileContent.trim().length > 50) {
        const aiResult = await this.analyzeContentWithAI(fileName, filePath, fileContent);
        
        // Combine rule-based and AI results
        return this.combineResults(ruleBasedResult, aiResult);
      }
      
      // Convert rule-based result to AI result format
      return {
        category: ruleBasedResult.category,
        confidence: ruleBasedResult.confidence,
        reason: ruleBasedResult.reason,
        keywords: this.extractKeywordsFromReason(ruleBasedResult.reason),
        summary: undefined,
        entities: undefined
      };
    } catch (error) {
      console.error('AI categorization failed:', error);
      // Fallback to rule-based
      const ruleBasedResult = this.categorizeFile(fileName, filePath, mimeType);
      return {
        category: ruleBasedResult.category,
        confidence: ruleBasedResult.confidence,
        reason: ruleBasedResult.reason + ' (AI analysis failed, used rule-based)',
        keywords: this.extractKeywordsFromReason(ruleBasedResult.reason),
        summary: undefined,
        entities: undefined
      };
    }
  }

  // AI content analysis using LLM API
  private async analyzeContentWithAI(
    fileName: string, 
    filePath: string, 
    content: string
  ): Promise<AICategorizationResult> {
    const prompt = `Analyze this document and categorize it into one of these departments:
    
DEPARTMENTS:
- OPERATIONS: Project management, workflows, construction, field operations, procedures
- ESTIMATING: Cost estimates, bids, quotes, proposals, pricing, takeoffs
- ACCOUNTING: Invoices, receipts, expenses, billing, bookkeeping, transactions
- FINANCE: Budgets, financial statements, cash flow, forecasts, investments
- OFFICE: Policies, HR, employee documents, administrative materials
- COMPANY_LAYOUT: Blueprints, drawings, architectural plans, layouts, designs
- UNCATEGORIZED: If it doesn't fit any department

DOCUMENT INFO:
Filename: ${fileName}
Path: ${filePath}
Content: ${content.substring(0, 2000)}...

Respond with JSON only:
{
  "category": "DEPARTMENT_NAME",
  "confidence": 0.85,
  "reason": "Brief explanation why this category was chosen",
  "keywords": ["key", "words", "found"],
  "summary": "Brief 1-2 sentence summary of document content",
  "entities": ["important", "entities", "found"]
}`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = JSON.parse(result.choices[0].message.content);

    return {
      category: aiResponse.category as FileCategory,
      confidence: Math.min(Math.max(aiResponse.confidence || 0.5, 0), 1),
      reason: aiResponse.reason || 'AI categorization',
      keywords: aiResponse.keywords || [],
      summary: aiResponse.summary,
      entities: aiResponse.entities
    };
  }

  // Combine rule-based and AI results
  private combineResults(
    ruleResult: CategorizationResult, 
    aiResult: AICategorizationResult
  ): AICategorizationResult {
    // If AI confidence is high and different from rule-based, prefer AI
    if (aiResult.confidence > 0.8 && aiResult.category !== ruleResult.category) {
      return {
        ...aiResult,
        reason: `AI: ${aiResult.reason} (Rule-based suggested: ${ruleResult.category})`
      };
    }
    
    // If rule-based confidence is high, prefer rule-based but enhance with AI data
    if (ruleResult.confidence > 0.7) {
      return {
        category: ruleResult.category,
        confidence: Math.max(ruleResult.confidence, aiResult.confidence),
        reason: `Rule-based: ${ruleResult.reason}${aiResult.summary ? ` | AI Summary: ${aiResult.summary}` : ''}`,
        keywords: [...this.extractKeywordsFromReason(ruleResult.reason), ...(aiResult.keywords || [])],
        summary: aiResult.summary,
        entities: aiResult.entities
      };
    }
    
    // Use weighted average
    const weightedConfidence = (ruleResult.confidence * 0.4) + (aiResult.confidence * 0.6);
    
    return {
      category: aiResult.confidence > ruleResult.confidence ? aiResult.category : ruleResult.category,
      confidence: weightedConfidence,
      reason: `Combined: ${aiResult.reason} | ${ruleResult.reason}`,
      keywords: [...this.extractKeywordsFromReason(ruleResult.reason), ...(aiResult.keywords || [])],
      summary: aiResult.summary,
      entities: aiResult.entities
    };
  }

  // Extract keywords from rule-based reason
  private extractKeywordsFromReason(reason: string): string[] {
    const keywordMatches = reason.match(/contains: ([^;]+)/g);
    if (!keywordMatches) return [];
    
    return keywordMatches
      .map(match => match.replace('contains: ', '').split(', '))
      .flat()
      .filter(keyword => keyword.length > 2);
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

  // Content extraction for different file types
  async extractFileContent(downloadUrl: string, mimeType: string, fileName: string): Promise<string | null> {
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) return null;

      const extension = this.getFileExtension(fileName).toLowerCase();

      // Handle text files
      if (mimeType.startsWith('text/') || extension === '.txt') {
        return await response.text();
      }

      // Handle PDF files (use base64 encoding for AI analysis)
      if (mimeType === 'application/pdf' || extension === '.pdf') {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        return await this.extractPDFContentWithAI(base64, fileName);
      }

      // Handle Word documents
      if (mimeType.includes('wordprocessingml') || extension === '.docx' || extension === '.doc') {
        const buffer = await response.arrayBuffer();
        return await this.extractWordContent(buffer);
      }

      // Handle Excel files
      if (mimeType.includes('spreadsheetml') || extension === '.xlsx' || extension === '.xls') {
        // For Excel files, we'll extract basic structure info
        return `Excel spreadsheet: ${fileName}. Contains data tables and calculations.`;
      }

      // Handle PowerPoint files
      if (mimeType.includes('presentationml') || extension === '.pptx' || extension === '.ppt') {
        return `PowerPoint presentation: ${fileName}. Contains slides and presentation content.`;
      }

      return null;
    } catch (error) {
      console.error('Content extraction failed:', error);
      return null;
    }
  }

  // Extract PDF content using AI
  private async extractPDFContentWithAI(base64Content: string, fileName: string): Promise<string> {
    try {
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract and summarize the key text content from this PDF document. Focus on important information that would help categorize the document.'
                },
                {
                  type: 'file',
                  file: {
                    filename: fileName,
                    file_data: `data:application/pdf;base64,${base64Content}`
                  }
                }
              ]
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        }),
      });

      if (!response.ok) {
        throw new Error(`PDF extraction failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.choices[0].message.content || '';
    } catch (error) {
      console.error('PDF AI extraction failed:', error);
      return `PDF document: ${fileName}. Content extraction failed.`;
    }
  }

  // Extract Word document content (basic implementation)
  private async extractWordContent(buffer: ArrayBuffer): Promise<string> {
    // This is a simplified implementation
    // In a real system, you'd use a library like mammoth.js
    const decoder = new TextDecoder();
    const text = decoder.decode(buffer);
    
    // Extract readable text (very basic)
    const cleanText = text.replace(/[^\x20-\x7E\n\r]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanText.substring(0, 2000);
  }

  // Enhanced learning from user corrections
  async learnFromCorrection(
    fileName: string,
    filePath: string,
    mimeType: string,
    oldCategory: FileCategory,
    newCategory: FileCategory,
    fileContent?: string
  ): Promise<void> {
    console.log('Learning from correction:', {
      fileName,
      filePath,
      mimeType,
      oldCategory,
      newCategory,
    });

    // Extract keywords from filename and path for the correct category
    const extractedKeywords = this.extractSmartKeywords(fileName, filePath, fileContent);
    
    // Store learned keywords in database (this would be implemented with Prisma)
    await this.storeLearningData(newCategory, extractedKeywords, fileName, filePath);
    
    // Update internal rules if applicable
    this.updateRuleWeights(fileName, filePath, newCategory);
  }

  // Smart keyword extraction
  private extractSmartKeywords(fileName: string, filePath: string, content?: string): string[] {
    const keywords = new Set<string>();
    
    // Extract from filename
    const fileWords = fileName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    fileWords.forEach(word => keywords.add(word));
    
    // Extract from path
    const pathWords = filePath.toLowerCase()
      .split(/[/\\]/)
      .join(' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    pathWords.forEach(word => keywords.add(word));
    
    // Extract from content if available
    if (content) {
      const contentKeywords = this.extractKeywordsFromContent(content);
      contentKeywords.forEach(keyword => keywords.add(keyword));
    }
    
    return Array.from(keywords).slice(0, 20); // Limit to top 20 keywords
  }

  // Extract keywords from document content
  private extractKeywordsFromContent(content: string): string[] {
    // Common business document keywords
    const businessTerms = [
      'invoice', 'receipt', 'payment', 'budget', 'cost', 'estimate', 
      'project', 'schedule', 'timeline', 'proposal', 'contract',
      'drawing', 'blueprint', 'design', 'layout', 'plan',
      'policy', 'procedure', 'manual', 'handbook', 'memo'
    ];
    
    const keywords = new Set<string>();
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    
    // Add business terms found in content
    businessTerms.forEach(term => {
      if (content.toLowerCase().includes(term)) {
        keywords.add(term);
      }
    });
    
    // Add frequent meaningful words
    const wordFreq = words.reduce((freq: {[key: string]: number}, word) => {
      if (word.length > 3 && !this.isCommonWord(word)) {
        freq[word] = (freq[word] || 0) + 1;
      }
      return freq;
    }, {});
    
    // Get top frequent words
    Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([word]) => keywords.add(word));
    
    return Array.from(keywords);
  }

  // Check if word is too common to be useful
  private isCommonWord(word: string): boolean {
    const commonWords = [
      'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know',
      'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when',
      'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over',
      'such', 'take', 'than', 'them', 'well', 'were', 'what'
    ];
    return commonWords.includes(word);
  }

  // Store learning data (placeholder - would use Prisma in real implementation)
  private async storeLearningData(
    category: FileCategory, 
    keywords: string[], 
    fileName: string, 
    filePath: string
  ): Promise<void> {
    // This would store keywords in the DepartmentKeyword table
    console.log('Storing learning data:', { category, keywords, fileName, filePath });
  }

  // Update rule weights based on corrections
  private updateRuleWeights(fileName: string, filePath: string, correctCategory: FileCategory): void {
    // This would update rule priorities based on learning
    console.log('Updating rule weights for:', { fileName, filePath, correctCategory });
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
