/**
 * 文档处理服务 - 专门处理各类文档的解析和信息提取
 * 完全使用真实的 npm 解析库，不降级到模拟数据
 */

// @ts-nocheck
// 运行时检查 - 确保只在服务端使用
if (typeof window !== 'undefined') {
  throw new Error('DocumentService 只能在服务端使用');
}

// 动态导入避免构建时问题
let pdfParse: any;
let mammoth: any;
let XLSX: any;

// 延迟加载依赖
const loadDependencies = async () => {
  if (!pdfParse) {
    const [
      pdfParseModule,
      mammothModule,
      xlsxModule,
    ] = await Promise.all([
      import('pdf-parse'),
      import('mammoth'),
      import('xlsx'),
    ]);

    pdfParse = pdfParseModule.default;
    mammoth = mammothModule;
    XLSX = xlsxModule;
  }
};

export class DocumentService {
  private initialized = false;

  /**
   * 初始化依赖库
   */
  async initialize() {
    if (!this.initialized) {
      await loadDependencies();
      this.initialized = true;
      console.log('📚 [DocumentService] 解析库初始化完成');
    }
  }
  
  /**
   * 解析文档 - 仅使用真实解析库，不降级
   */
  async parseDocument(fileData: string, fileType: string, options: any = {}): Promise<any> {
    try {
      // 确保依赖已加载
      await this.initialize();
      
      console.log(`📄 [文档解析] 类型: ${fileType}`);

      const extractMode = options.extract_mode || 'general';

      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.parsePDF(fileData, extractMode);
        case 'doc':
        case 'docx':
          return await this.parseDocx(fileData, extractMode);
        case 'xls':
        case 'xlsx':
          return await this.parseXlsx(fileData, extractMode);
        case 'txt':
        case 'markdown':
        case 'md':
          return await this.parseText(fileData, extractMode);
        case 'json':
          return await this.parseJSON(fileData, extractMode);
        case 'csv':
          return await this.parseCSV(fileData, extractMode);
        case 'image':
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
          return await this.parseImage(fileData, extractMode);
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }

    } catch (error: any) {
      console.error('❌ [文档解析] 解析失败:', error);
      throw new Error(`文档解析失败: ${error.message}`);
    }
  }

  // =============== 真实解析方法 - 不降级 ===============

  /**
   * PDF 解析 - 使用 pdf-parse
   */
  private async parsePDF(fileData: string, extractMode: string): Promise<any> {
    console.log('📄 [PDF] 开始解析...');
    
    const buffer = Buffer.from(fileData, 'base64');
    const pdfData = await pdfParse(buffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('PDF 文件为空或无法提取文本内容');
    }
    
    // 分析PDF文本内容
    const analysisData = this.analyzeTextContent(pdfData.text, extractMode);
    
    console.log(`✅ [PDF] 解析完成: ${pdfData.numpages} 页, ${pdfData.text.length} 字符`);
    
    return {
      type: 'pdf',
      extract_mode: extractMode,
      extracted_data: {
        raw_text: pdfData.text,
        ...analysisData,
        pdf_info: {
          pages: pdfData.numpages,
          info: pdfData.info,
          metadata: pdfData.metadata,
        }
      },
      metadata: {
        pages: pdfData.numpages,
        text_length: pdfData.text.length,
        extraction_method: 'pdf-parse',
        confidence: 1.0,
        processed_at: new Date().toISOString()
      },
      extraction_confidence: 1.0,
      suggestions: this.generateDocumentSuggestions('pdf', analysisData),
    };
  }

  /**
   * Word 文档解析 - 使用 mammoth
   */
  private async parseDocx(fileData: string, extractMode: string): Promise<any> {
    console.log('📝 [Word] 开始解析...');
    
    const buffer = Buffer.from(fileData, 'base64');
    const result = await mammoth.extractRawText({buffer});
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Word 文档为空或无法提取文本内容');
    }
    
    // 分析Word文档内容
    const analysisData = this.analyzeTextContent(result.value, extractMode);
    
    console.log(`✅ [Word] 解析完成: ${result.value.length} 字符`);
    
    return {
      type: 'docx',
      extract_mode: extractMode,
      extracted_data: {
        raw_text: result.value,
        ...analysisData,
        messages: result.messages, // mammoth的警告信息
      },
      metadata: {
        word_count: result.value.split(/\s+/).length,
        character_count: result.value.length,
        extraction_method: 'mammoth',
        confidence: 1.0,
        processed_at: new Date().toISOString(),
        warnings: result.messages
      },
      extraction_confidence: 1.0,
      suggestions: this.generateDocumentSuggestions('docx', analysisData),
    };
  }

  /**
   * Excel 解析 - 使用 xlsx
   */
  private async parseXlsx(fileData: string, extractMode: string): Promise<any> {
    console.log('📊 [Excel] 开始解析...');
    
    const buffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(buffer, {type: 'buffer'});
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel 文件为空或无有效工作表');
    }
    
    // 提取Excel数据
    const extractedData = this.extractExcelData(workbook, extractMode);
    
    console.log(`✅ [Excel] 解析完成: ${workbook.SheetNames.length} 个工作表`);
    
    return {
      type: 'xlsx',
      extract_mode: extractMode,
      extracted_data: extractedData,
      metadata: {
        sheets: workbook.SheetNames.length,
        sheet_names: workbook.SheetNames,
        extraction_method: 'xlsx',
        confidence: 1.0,
        processed_at: new Date().toISOString()
      },
      extraction_confidence: 1.0,
      suggestions: this.generateDocumentSuggestions('xlsx', extractedData),
    };
  }

  /**
   * 文本文件解析
   */
  private async parseText(fileData: string, extractMode: string): Promise<any> {
    console.log('📄 [文本] 开始解析...');
    
    const text = Buffer.from(fileData, 'base64').toString('utf-8');
    
    if (!text || text.trim().length === 0) {
      throw new Error('文本文件为空');
    }
    
    const analysis = this.analyzeTextContent(text, extractMode);
    
    console.log(`✅ [文本] 解析完成: ${text.length} 字符`);
    
    return {
      type: 'txt',
      extract_mode: extractMode,
      extracted_data: {
        raw_text: text,
        ...analysis
      },
      metadata: {
        character_count: text.length,
        word_count: text.split(/\s+/).length,
        line_count: text.split('\n').length,
        extraction_method: 'direct',
        confidence: 1.0,
        processed_at: new Date().toISOString()
      },
      extraction_confidence: 1.0,
      suggestions: this.generateDocumentSuggestions('txt', analysis),
    };
  }

  /**
   * JSON 文件解析
   */
  private async parseJSON(fileData: string, extractMode: string): Promise<any> {
    console.log('🔧 [JSON] 开始解析...');
    
    const jsonText = Buffer.from(fileData, 'base64').toString('utf-8');
    
    try {
      const jsonData = JSON.parse(jsonText);
      const textContent = this.extractTextFromJSON(jsonData);
      
      if (!textContent || textContent.trim().length === 0) {
        throw new Error('JSON 文件中没有可提取的文本内容');
      }
      
      const analysis = this.analyzeTextContent(textContent, extractMode);
      
      console.log(`✅ [JSON] 解析完成: ${textContent.length} 字符`);
      
      return {
        type: 'json',
        extract_mode: extractMode,
        extracted_data: {
          raw_text: textContent,
          structured_data: jsonData,
          ...analysis
        },
        metadata: {
          json_keys: Object.keys(jsonData).length,
          extraction_method: 'json-parse',
          confidence: 1.0,
          processed_at: new Date().toISOString()
        },
        extraction_confidence: 1.0,
        suggestions: this.generateDocumentSuggestions('json', analysis),
      };
    } catch (error) {
      throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : '格式错误'}`);
    }
  }

  /**
   * CSV 文件解析
   */
  private async parseCSV(fileData: string, extractMode: string): Promise<any> {
    console.log('📈 [CSV] 开始解析...');
    
    const csvText = Buffer.from(fileData, 'base64').toString('utf-8');
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('CSV 文件为空');
    }
    
    // 简单的CSV解析
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));
    
    const textContent = `${headers.join(' ')}\n${rows.map(row => row.join(' ')).join('\n')}`;
    const analysis = this.analyzeTextContent(textContent, extractMode);
    
    console.log(`✅ [CSV] 解析完成: ${lines.length} 行, ${headers.length} 列`);
    
    return {
      type: 'csv',
      extract_mode: extractMode,
      extracted_data: {
        raw_text: textContent,
        headers,
        rows,
        ...analysis
      },
      metadata: {
        row_count: rows.length,
        column_count: headers.length,
        extraction_method: 'csv-parse',
        confidence: 1.0,
        processed_at: new Date().toISOString()
      },
      extraction_confidence: 1.0,
      suggestions: this.generateDocumentSuggestions('csv', analysis),
    };
  }

  /**
   * 图片解析 - 返回待大模型处理的信息
   */
  private async parseImage(fileData: string, extractMode: string): Promise<any> {
    console.log('🖼️ [图片] 准备大模型处理...');
    
    // 获取图片基本信息
    const buffer = Buffer.from(fileData, 'base64');
    const imageSize = buffer.length;
    
    console.log(`✅ [图片] 准备完成: ${imageSize} 字节`);
    
    return {
      type: 'image',
      extract_mode: extractMode,
      extracted_data: {
        raw_text: '', // 图片需要大模型处理
        image_data: fileData, // base64 图片数据
        requires_llm_processing: true,
        processing_note: '图片内容需要通过大模型进行分析和文本提取'
      },
      metadata: {
        file_size: imageSize,
        extraction_method: 'image-preparation',
        confidence: 0.0, // 需要大模型处理后才有置信度
        processed_at: new Date().toISOString(),
        requires_llm: true
      },
      extraction_confidence: 0.0,
      suggestions: {
        iframe_display: false,
        reason: '图片内容需要大模型分析',
        alternative_actions: [
          '使用大模型分析图片内容',
          '提取图片中的文字信息',
          '分析图片的主要元素',
          '生成图片描述'
        ]
      },
    };
  }

  // =============== 辅助方法 ===============

  /**
   * 从JSON中提取文本内容
   */
  private extractTextFromJSON(obj: any, depth = 0): string {
    if (depth > 10) return ''; // 防止无限递归
    
    let text = '';
    
    if (typeof obj === 'string') {
      text += obj + ' ';
    } else if (typeof obj === 'number') {
      text += obj.toString() + ' ';
    } else if (Array.isArray(obj)) {
      obj.forEach(item => {
        text += this.extractTextFromJSON(item, depth + 1);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => {
        text += this.extractTextFromJSON(value, depth + 1);
      });
    }
    
    return text;
  }

  /**
   * 提取Excel数据
   */
  private extractExcelData(workbook: any, extractMode: string): any {
    const allData: any = {
      raw_text: '',
      sheets: {},
      summary: {
        total_sheets: workbook.SheetNames.length,
        sheet_names: workbook.SheetNames
      }
    };

    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // 转换为JSON格式
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // 提取文本内容
      const sheetText = jsonData
        .map((row: any[]) => row.join(' '))
        .join('\n');
      
      allData.sheets[sheetName] = {
        data: jsonData,
        text: sheetText,
        rows: jsonData.length,
        columns: Math.max(...jsonData.map((row: any[]) => row.length))
      };
      
      allData.raw_text += `${sheetName}:\n${sheetText}\n\n`;
    });

    // 分析合并后的文本
    const analysis = this.analyzeTextContent(allData.raw_text, extractMode);
    
    return {
      ...allData,
      ...analysis
    };
  }

  /**
   * 分析文本内容
   */
  private analyzeTextContent(text: string, extractMode: string): any {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    const analysis = {
      word_count: words.length,
      sentence_count: sentences.length,
      paragraph_count: paragraphs.length,
      character_count: text.length,
      average_word_length: words.length > 0 ? words.reduce((sum, word) => sum + word.length, 0) / words.length : 0,
      reading_time_minutes: Math.ceil(words.length / 200), // 假设每分钟200词
    };

    if (extractMode === 'comprehensive') {
      // 添加更详细的分析
      analysis.top_words = this.getTopWords(words);
      analysis.language_detection = this.detectLanguage(text);
      analysis.content_structure = this.analyzeDocumentStructure(text);
    }

    return analysis;
  }

  /**
   * 获取高频词汇
   */
  private getTopWords(words: string[]): Array<{word: string, count: number}> {
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 2) { // 忽略太短的词
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({word, count}));
  }

  /**
   * 语言检测
   */
  private detectLanguage(text: string): string {
    // 简单的语言检测
    const chineseChars = text.match(/[\u4e00-\u9fff]/g);
    const englishWords = text.match(/[a-zA-Z]+/g);
    
    if (chineseChars && chineseChars.length > (englishWords?.length || 0)) {
      return 'zh-CN';
    } else if (englishWords && englishWords.length > 0) {
      return 'en';
    }
    
    return 'unknown';
  }

  /**
   * 文档结构分析
   */
  private analyzeDocumentStructure(text: string): any {
    const lines = text.split('\n');
    
    return {
      has_title: lines[0] && lines[0].trim().length < 100,
      has_paragraphs: text.includes('\n\n'),
      has_lists: /^[\s]*[-*•]\s/.test(text),
      has_numbers: /\d+/.test(text),
      estimated_sections: text.split(/\n\s*\n/).length
    };
  }

  /**
   * 生成文档建议
   */
  private generateDocumentSuggestions(fileType: string, analysisData: any): any {
    const suggestions = {
      iframe_display: false,
      reason: '文档内容适合在聊天中展示',
      alternative_actions: [
        '在聊天中展示文档内容',
        '生成文档摘要',
        '提取关键信息',
        '分析文档结构'
      ]
    };

    // 根据文档类型和内容调整建议
    if (fileType === 'pdf' && analysisData.word_count > 1000) {
      suggestions.alternative_actions.unshift('生成长文档摘要');
    }

    if (fileType === 'xlsx') {
      suggestions.alternative_actions = [
        '展示表格数据',
        '生成数据分析',
        '提取数值信息',
        '创建图表展示'
      ];
    }

    return suggestions;
  }

  /**
   * 获取支持的文件类型
   */
  getSupportedFileTypes(): string[] {
    return ['pdf', 'doc', 'docx', 'txt', 'md', 'json', 'csv', 'xlsx', 'xls', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  }

  /**
   * 验证文件类型
   */
  validateFileType(fileName: string): { valid: boolean; type?: string; reason?: string } {
    if (!fileName) {
      return { valid: false, reason: '文件名不能为空' };
    }
    
    const extension = fileName.toLowerCase().split('.').pop();
    if (!extension) {
      return { valid: false, reason: '无法识别文件类型' };
    }
    
    const supportedTypes = this.getSupportedFileTypes();
    if (!supportedTypes.includes(extension)) {
      return { 
        valid: false, 
        reason: `不支持的文件类型：${extension}。支持的类型：${supportedTypes.join(', ')}` 
      };
    }
    
    return { valid: true, type: extension };
  }

  /**
   * 估算处理时间
   */
  estimateProcessingTime(fileType: string, fileSize?: number): number {
    const baseTime = {
      pdf: 15000,
      docx: 8000,
      xlsx: 10000,
      txt: 2000,
      json: 3000,
      csv: 5000,
      image: 1000, // 图片准备时间很短，主要时间在大模型处理
    };
    
    let time = baseTime[fileType as keyof typeof baseTime] || 10000;
    
    // 根据文件大小调整时间
    if (fileSize) {
      const sizeMB = fileSize / (1024 * 1024);
      if (sizeMB > 5) {
        time *= 1.5; // 大文件增加50%时间
      } else if (sizeMB > 10) {
        time *= 2; // 超大文件翻倍时间
      }
    }
    
    return Math.round(time);
  }
}

export const documentService = new DocumentService(); 