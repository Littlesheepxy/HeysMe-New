/**
 * 统一文档处理服务
 * 根据隐私模式决定是否存储文档和解析结果
 */

import { DocumentService } from './document-service';
import { SupabaseDocumentService } from './supabase-document-service';

export interface DocumentProcessingOptions {
  isPrivacyMode: boolean;
  sessionId?: string;
  extractMode?: 'general' | 'resume' | 'comprehensive';
  userId?: string;
}

export interface ProcessedDocument {
  id: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  
  // 解析结果
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  parsedContent?: any;
  metadata?: any;
  
  // 处理信息
  processedAt: string;
  isPrivacyMode: boolean;
  
  // 仅隐私模式使用
  expiresAt?: string;
}

export class UnifiedDocumentService {
  private documentService: DocumentService;
  private supabaseService: SupabaseDocumentService;
  
  // 隐私模式的内存缓存
  private privacyCache: Map<string, ProcessedDocument> = new Map();
  private readonly CACHE_EXPIRY_HOURS = 1;

  constructor() {
    this.documentService = new DocumentService();
    this.supabaseService = new SupabaseDocumentService();
    
    // 启动定期清理
    this.startCleanupInterval();
  }

  /**
   * 统一文档处理入口
   */
  async processDocument(
    file: File, 
    options: DocumentProcessingOptions
  ): Promise<ProcessedDocument> {
    console.log(`📄 [统一处理] 开始处理文档: ${file.name} (隐私模式: ${options.isPrivacyMode})`);

    try {
      // 1. 基础验证
      this.validateFile(file);

      // 2. 生成文档ID
      const documentId = this.generateDocumentId();

      // 3. 创建文档对象
      const document: ProcessedDocument = {
        id: documentId,
        originalFilename: file.name,
        fileType: this.getFileType(file),
        fileSize: file.size,
        mimeType: file.type,
        parsingStatus: 'processing',
        processedAt: new Date().toISOString(),
        isPrivacyMode: options.isPrivacyMode,
        ...(options.isPrivacyMode && {
          expiresAt: new Date(Date.now() + this.CACHE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
        })
      };

      // 4. 文档解析 - 统一使用 DocumentService
      const fileBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(fileBuffer).toString('base64');
      
      const parseResult = await this.documentService.parseDocument(
        base64Data,
        document.fileType,
        { extract_mode: options.extractMode || 'comprehensive' }
      );

      // 5. 更新解析结果
      document.parsingStatus = 'completed';
      document.extractedText = parseResult.extracted_data?.raw_text || '';
      document.parsedContent = parseResult.extracted_data || {};
      document.metadata = parseResult.metadata || {};

      // 6. 根据模式决定存储策略
      if (options.isPrivacyMode) {
        // 隐私模式：仅存储到内存
        this.privacyCache.set(documentId, document);
        console.log(`🔒 [隐私模式] 文档已存储到内存缓存: ${documentId}`);
      } else {
        // 标准模式：存储到 Supabase
        if (!options.userId) {
          throw new Error('标准模式需要提供用户ID');
        }
        
        // 创建 File 对象从 base64 数据
        const fileBlob = new Blob([Buffer.from(base64Data, 'base64')], { type: file.type });
        const fileToUpload = new File([fileBlob], file.name, { type: file.type });
        
        await this.supabaseService.uploadDocument(fileToUpload, options.userId, {
          sessionId: options.sessionId,
          parseImmediately: false, // 我们已经解析了
          extractMode: options.extractMode
        });
        
        // 然后更新解析结果
        // 注意：这里需要获取刚创建的文档ID，暂时跳过这步，因为需要重新设计
        
        console.log(`💾 [标准模式] 文档已存储到 Supabase: ${documentId}`);
      }

      return document;

    } catch (error) {
      console.error('❌ [统一处理] 文档处理失败:', error);
      throw new Error(`文档处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量处理文档
   */
  async processMultipleDocuments(
    files: File[],
    options: DocumentProcessingOptions
  ): Promise<ProcessedDocument[]> {
    console.log(`📄 [批量处理] 开始处理 ${files.length} 个文档 (隐私模式: ${options.isPrivacyMode})`);

    const results: ProcessedDocument[] = [];
    
    // 并发处理，但限制并发数量
    const concurrencyLimit = 3;
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.allSettled(
        batch.map(file => this.processDocument(file, options))
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ 文件 ${batch[index].name} 处理失败:`, result.reason);
        }
      });
    }

    return results;
  }

  /**
   * 获取文档（统一接口）
   */
  async getDocument(documentId: string, isPrivacyMode: boolean): Promise<ProcessedDocument | null> {
    if (isPrivacyMode) {
      // 从内存缓存获取
      const document = this.privacyCache.get(documentId);
      if (document && new Date() < new Date(document.expiresAt!)) {
        return document;
      }
      return null;
    } else {
      // 从 Supabase 获取 - 需要实现或使用现有方法
      const documents = await this.supabaseService.getUserDocuments('', '');
      const found = documents.find(doc => doc.id === documentId);
      return found ? this.mapUploadedDocumentToProcessed(found) : null;
    }
  }

  /**
   * 获取用户的所有文档
   */
  async getUserDocuments(userId: string, isPrivacyMode: boolean): Promise<ProcessedDocument[]> {
    if (isPrivacyMode) {
      // 返回当前会话的隐私文档
      const documents: ProcessedDocument[] = [];
      this.privacyCache.forEach((doc) => {
        if (new Date() < new Date(doc.expiresAt!)) {
          documents.push(doc);
        }
      });
      return documents;
    } else {
      // 从 Supabase 获取并转换格式
      const uploadedDocs = await this.supabaseService.getUserDocuments(userId);
      return uploadedDocs.map(doc => this.mapUploadedDocumentToProcessed(doc));
    }
  }

  /**
   * 清理会话文档（隐私模式）
   */
  clearPrivacyDocuments(): void {
    const count = this.privacyCache.size;
    this.privacyCache.clear();
    console.log(`🧹 [隐私模式] 已清理 ${count} 个临时文档`);
  }

  /**
   * 获取缓存统计
   */
  getPrivacyCacheStats(): { count: number; totalSize: number } {
    let totalSize = 0;
    this.privacyCache.forEach((doc) => {
      totalSize += doc.fileSize;
    });
    
    return {
      count: this.privacyCache.size,
      totalSize
    };
  }

  // 私有方法
  private validateFile(file: File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/csv',
      'application/json',
      'text/markdown',
      'application/rtf',
      // 图片类型（用于OCR和内容分析）
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/tiff',
      'image/tif'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }
  }

  private getFileType(file: File): string {
    const typeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'doc',
      'text/plain': 'txt',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/csv': 'csv',
      'application/json': 'json',
      'text/markdown': 'md',
      'application/rtf': 'rtf',
      // 图片类型映射
      'image/png': 'png',
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/gif': 'gif',
      'image/bmp': 'bmp',
      'image/webp': 'webp',
      'image/tiff': 'tiff',
      'image/tif': 'tiff'
    };

    return typeMap[file.type] || 'unknown';
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanupInterval(): void {
    // 每5分钟清理一次过期的隐私文档
    setInterval(() => {
      const now = new Date();
      const keysToDelete: string[] = [];
      
      this.privacyCache.forEach((doc, id) => {
        if (doc.expiresAt && now > new Date(doc.expiresAt)) {
          keysToDelete.push(id);
        }
      });
      
      keysToDelete.forEach(key => this.privacyCache.delete(key));
      
      if (keysToDelete.length > 0) {
        console.log(`🧹 [自动清理] 清理了 ${keysToDelete.length} 个过期的隐私文档`);
      }
    }, 5 * 60 * 1000); // 5分钟
  }

  private mapUploadedDocumentToProcessed(uploadedDoc: any): ProcessedDocument {
    return {
      id: uploadedDoc.id,
      originalFilename: uploadedDoc.originalFilename,
      fileType: uploadedDoc.fileType,
      fileSize: uploadedDoc.fileSize,
      mimeType: uploadedDoc.mimeType,
      parsingStatus: uploadedDoc.parsingStatus,
      extractedText: uploadedDoc.extractedText,
      parsedContent: uploadedDoc.parsedContent,
      metadata: uploadedDoc.metadata,
      processedAt: uploadedDoc.createdAt,
      isPrivacyMode: false
    };
  }
}

// 单例模式
export const unifiedDocumentService = new UnifiedDocumentService(); 