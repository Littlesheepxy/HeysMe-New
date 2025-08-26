/**
 * Supabase文档处理服务
 * 负责文档上传、存储、解析和管理
 */

import { supabase } from '@/lib/supabase-client';
import { DocumentService } from './document-service';
import crypto from 'crypto';

export interface UploadedDocument {
  id: string;
  userId: string;
  sessionId?: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  parsingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  parsedContent?: any;
  createdAt: string;
}

export interface DocumentUploadOptions {
  sessionId?: string;
  parseImmediately?: boolean;
  extractMode?: 'general' | 'resume' | 'comprehensive';
}

export class SupabaseDocumentService {
  private documentService: DocumentService;
  private readonly STORAGE_BUCKET = 'documents';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.documentService = new DocumentService();
  }

  /**
   * 上传文档到Supabase Storage并创建数据库记录
   */
  async uploadDocument(
    file: File,
    userId: string,
    options: DocumentUploadOptions = {}
  ): Promise<UploadedDocument> {
    try {
      // 1. 文件验证
      this.validateFile(file);

      // 2. 生成文件路径和哈希
      const fileExtension = this.getFileExtension(file.name);
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const storagePath = `${userId}/${timestamp}-${randomId}.${fileExtension}`;

      // 3. 上传到Supabase Storage
      console.log(`📤 [文档上传] 开始上传文件: ${file.name}`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log(`✅ [文档上传] 文件上传成功: ${uploadData.path}`);

      // 4. 创建数据库记录
      const documentRecord = {
        user_id: userId,
        session_id: options.sessionId || null,
        original_filename: file.name,
        file_type: this.getFileType(file.name),
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        storage_bucket: this.STORAGE_BUCKET,
        parsing_status: 'pending' as const
      };

      const { data: dbData, error: dbError } = await supabase
        .from('user_documents')
        .insert(documentRecord)
        .select()
        .single();

      if (dbError) {
        // 如果数据库插入失败，清理已上传的文件
        await this.cleanupUploadedFile(storagePath);
        throw new Error(`数据库记录创建失败: ${dbError.message}`);
      }

      console.log(`✅ [文档记录] 数据库记录创建成功: ${dbData.id}`);

      // 5. 如果需要立即解析，创建解析任务
      if (options.parseImmediately !== false) {
        await this.createParsingJob(dbData.id, {
          extract_mode: options.extractMode || 'general'
        });
      }

      return this.mapDatabaseRecordToDocument(dbData);

    } catch (error) {
      console.error('❌ [文档上传] 上传失败:', error);
      throw error;
    }
  }

  /**
   * 解析文档内容
   */
  async parseDocument(documentId: string): Promise<any> {
    try {
      console.log(`🔍 [文档解析] 开始解析文档: ${documentId}`);

      // 1. 获取文档记录
      const { data: document, error: fetchError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        throw new Error(`文档不存在: ${documentId}`);
      }

      // 2. 检查是否已经解析过
      if (document.parsing_status === 'completed' && document.extracted_text) {
        console.log(`✅ [文档解析] 文档已解析，返回缓存结果`);
        return {
          success: true,
          extractedText: document.extracted_text,
          parsedContent: document.parsed_content,
          fromCache: true
        };
      }

      // 3. 更新解析状态
      await this.updateDocumentStatus(documentId, 'processing');

      // 4. 从Storage下载文件
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .download(document.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`文件下载失败: ${downloadError?.message}`);
      }

      // 5. 转换为base64进行解析
      const arrayBuffer = await fileData.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      // 6. 调用文档解析服务
      const parseResult = await this.documentService.parseDocument(
        base64Data,
        document.file_type,
        { extract_mode: 'comprehensive' }
      );

      // 7. 保存解析结果
      const updateData = {
        parsing_status: 'completed' as const,
        parsing_completed_at: new Date().toISOString(),
        extracted_text: parseResult.extracted_data?.raw_text || '',
        extracted_metadata: parseResult.metadata || {},
        parsed_content: parseResult.extracted_data || {}
      };

      await supabase
        .from('user_documents')
        .update(updateData)
        .eq('id', documentId);

      console.log(`✅ [文档解析] 解析完成: ${documentId}`);

      return {
        success: true,
        extractedText: updateData.extracted_text,
        parsedContent: updateData.parsed_content,
        metadata: updateData.extracted_metadata,
        fromCache: false
      };

    } catch (error) {
      console.error('❌ [文档解析] 解析失败:', error);
      
      // 更新失败状态
      await this.updateDocumentStatus(documentId, 'failed', error instanceof Error ? error.message : String(error));
      
      throw error;
    }
  }

  /**
   * 获取用户的文档列表
   */
  async getUserDocuments(userId: string, sessionId?: string): Promise<UploadedDocument[]> {
    let query = supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`获取文档列表失败: ${error.message}`);
    }

    return (data || []).map(this.mapDatabaseRecordToDocument);
  }

  /**
   * 获取文档内容（用于前端显示）
   */
  async getDocumentContent(documentId: string): Promise<{
    extractedText: string;
    parsedContent: any;
    isReady: boolean;
  }> {
    const { data: document, error } = await supabase
      .from('user_documents')
      .select('parsing_status, extracted_text, parsed_content')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      throw new Error(`文档不存在: ${documentId}`);
    }

    return {
      extractedText: document.extracted_text || '',
      parsedContent: document.parsed_content || {},
      isReady: document.parsing_status === 'completed'
    };
  }

  /**
   * 删除文档
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // 1. 获取文档信息
      const { data: document, error: fetchError } = await supabase
        .from('user_documents')
        .select('storage_path')
        .eq('id', documentId)
        .single();

      if (fetchError || !document) {
        throw new Error(`文档不存在: ${documentId}`);
      }

      // 2. 删除Storage中的文件
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([document.storage_path]);

      if (storageError) {
        console.warn(`⚠️ [文档删除] Storage删除失败: ${storageError.message}`);
      }

      // 3. 删除数据库记录
      const { error: dbError } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        throw new Error(`数据库删除失败: ${dbError.message}`);
      }

      console.log(`✅ [文档删除] 文档删除成功: ${documentId}`);

    } catch (error) {
      console.error('❌ [文档删除] 删除失败:', error);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  private validateFile(file: File): void {
    // 支持的MIME类型（支持通配符）
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/*',           // 支持所有文本类型
      'application/json',
      'image/*'           // 支持所有图片类型（用于OCR处理）
    ];

    // 检查文件类型
    if (allowedTypes.length > 0 && !this.isTypeAllowed(file.type, allowedTypes)) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }

    // 检查文件大小
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // 检查文件名
    if (!file.name || file.name.trim() === '') {
      throw new Error('文件名不能为空');
    }
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'unknown';
  }

  private getFileType(filename: string): string {
    const extension = this.getFileExtension(filename);
    const typeMap: Record<string, string> = {
      // 文档类型
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'docx',
      'rtf': 'rtf',
      'odt': 'odt',
      
      // 文本类型
      'txt': 'txt',
      'md': 'markdown',
      'markdown': 'markdown',
      'csv': 'csv',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'htm': 'html',
      
      // 表格类型
      'xlsx': 'xlsx',
      'xls': 'xls',
      'ods': 'ods',
      
      // 图片类型（用于OCR）
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'bmp': 'image',
      'tiff': 'image',
      'tif': 'image',
      'webp': 'image',
      
      // 演示文稿类型
      'ppt': 'ppt',
      'pptx': 'pptx',
      'odp': 'odp'
    };
    return typeMap[extension] || 'unknown';
  }

  private async createParsingJob(documentId: string, options: any = {}): Promise<void> {
    const { error } = await supabase
      .from('document_parsing_jobs')
      .insert({
        document_id: documentId,
        job_type: 'parse_document',
        parsing_options: options,
        priority: 5
      });

    if (error) {
      console.warn(`⚠️ [解析任务] 创建解析任务失败: ${error.message}`);
    }
  }

  private async updateDocumentStatus(
    documentId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      parsing_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'processing') {
      updateData.parsing_started_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.parsing_completed_at = new Date().toISOString();
    } else if (status === 'failed' && errorMessage) {
      updateData.parsing_error = errorMessage;
    }

    await supabase
      .from('user_documents')
      .update(updateData)
      .eq('id', documentId);
  }

  private async cleanupUploadedFile(storagePath: string): Promise<void> {
    try {
      await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([storagePath]);
    } catch (error) {
      console.warn(`⚠️ [清理] 清理上传文件失败: ${error}`);
    }
  }

  /**
   * 检查MIME类型是否被允许（支持通配符）
   */
  private isTypeAllowed(fileType: string, allowedTypes: string[]): boolean {
    // 如果允许类型列表为空，则允许所有类型
    if (allowedTypes.length === 0) {
      return true;
    }

    return allowedTypes.some(allowedType => {
      // 精确匹配
      if (allowedType === fileType) {
        return true;
      }

      // 通配符匹配
      if (allowedType.includes('*')) {
        const pattern = allowedType.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(fileType);
      }

      return false;
    });
  }

  private mapDatabaseRecordToDocument(record: any): UploadedDocument {
    return {
      id: record.id,
      userId: record.user_id,
      sessionId: record.session_id,
      originalFilename: record.original_filename,
      fileType: record.file_type,
      fileSize: record.file_size,
      mimeType: record.mime_type,
      storagePath: record.storage_path,
      parsingStatus: record.parsing_status,
      extractedText: record.extracted_text,
      parsedContent: record.parsed_content,
      createdAt: record.created_at
    };
  }
}

// 导出单例实例
export const supabaseDocumentService = new SupabaseDocumentService(); 