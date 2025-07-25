/**
 * Supabase S3文档处理服务
 * 支持直接使用S3 API进行文档上传和管理
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { supabase } from '@/lib/supabase-client';
import { DocumentService } from './document-service';
import crypto from 'crypto';

export interface S3UploadOptions {
  sessionId?: string;
  parseImmediately?: boolean;
  extractMode?: 'general' | 'resume' | 'comprehensive';
  usePresignedUrl?: boolean;
  expiresIn?: number; // 预签名URL过期时间（秒）
}

export interface PresignedUploadResult {
  uploadUrl: string;
  documentId: string;
  fields: Record<string, string>;
  expiresAt: string;
}

export class SupabaseS3DocumentService {
  private s3Client: S3Client;
  private documentService: DocumentService;
  private readonly STORAGE_BUCKET = 'documents';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.documentService = new DocumentService();
    
    // 初始化S3客户端 - 使用Session Token方式（遵循RLS）
    this.s3Client = new S3Client({
      forcePathStyle: true,
      region: process.env.NEXT_PUBLIC_SUPABASE_REGION || 'us-east-1',
      endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/s3`,
      credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || '',
        secretAccessKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        // sessionToken 将在运行时设置
      }
    });
  }

  /**
   * 设置用户会话令牌
   */
  private async setUserSession(userToken?: string): Promise<void> {
    if (userToken) {
      // 使用用户JWT令牌更新S3客户端凭据
      this.s3Client = new S3Client({
        forcePathStyle: true,
        region: process.env.NEXT_PUBLIC_SUPABASE_REGION || 'us-east-1',
        endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/s3`,
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || '',
          secretAccessKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          sessionToken: userToken
        }
      });
    }
  }

  /**
   * 生成预签名上传URL
   */
  async generatePresignedUploadUrl(
    filename: string,
    userId: string,
    userToken: string,
    options: S3UploadOptions = {}
  ): Promise<PresignedUploadResult> {
    try {
      // 设置用户会话
      await this.setUserSession(userToken);

      // 生成文件路径
      const fileExtension = this.getFileExtension(filename);
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const storagePath = `${userId}/${timestamp}-${randomId}.${fileExtension}`;

      // 创建数据库记录
      const documentRecord = {
        user_id: userId,
        session_id: options.sessionId || null,
        original_filename: filename,
        file_type: this.getFileType(filename),
        file_size: 0, // 将在上传完成后更新
        mime_type: this.getMimeType(filename),
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
        throw new Error(`数据库记录创建失败: ${dbError.message}`);
      }

      // 生成预签名URL
      const putCommand = new PutObjectCommand({
        Bucket: this.STORAGE_BUCKET,
        Key: storagePath,
        ContentType: this.getMimeType(filename)
      });

      const expiresIn = options.expiresIn || 3600; // 默认1小时
      const uploadUrl = await getSignedUrl(this.s3Client, putCommand, { 
        expiresIn 
      });

      console.log(`✅ [预签名URL] 生成成功: ${dbData.id}`);

      return {
        uploadUrl,
        documentId: dbData.id,
        fields: {
          'Content-Type': this.getMimeType(filename),
          'x-amz-acl': 'private'
        },
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };

    } catch (error) {
      console.error('❌ [预签名URL] 生成失败:', error);
      throw error;
    }
  }

  /**
   * 直接上传文件到S3
   */
  async uploadFileDirectly(
    file: File,
    userId: string,
    userToken: string,
    options: S3UploadOptions = {}
  ): Promise<string> {
    try {
      // 验证文件
      this.validateFile(file);

      // 设置用户会话
      await this.setUserSession(userToken);

      // 生成文件路径
      const fileExtension = this.getFileExtension(file.name);
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const storagePath = `${userId}/${timestamp}-${randomId}.${fileExtension}`;

      console.log(`📤 [S3上传] 开始上传文件: ${file.name}`);

      // 直接上传到S3
      const putCommand = new PutObjectCommand({
        Bucket: this.STORAGE_BUCKET,
        Key: storagePath,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'original-filename': file.name,
          'user-id': userId,
          'upload-timestamp': timestamp.toString()
        }
      });

      await this.s3Client.send(putCommand);

      console.log(`✅ [S3上传] 文件上传成功: ${storagePath}`);

      // 创建数据库记录
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
        await this.deleteFileFromS3(storagePath, userToken);
        throw new Error(`数据库记录创建失败: ${dbError.message}`);
      }

      // 如果需要立即解析
      if (options.parseImmediately !== false) {
        await this.createParsingJob(dbData.id, {
          extract_mode: options.extractMode || 'general'
        });
      }

      return dbData.id;

    } catch (error) {
      console.error('❌ [S3上传] 上传失败:', error);
      throw error;
    }
  }

  /**
   * 从S3下载文件
   */
  async downloadFileFromS3(
    storagePath: string,
    userToken: string
  ): Promise<Uint8Array> {
    try {
      await this.setUserSession(userToken);

      const getCommand = new GetObjectCommand({
        Bucket: this.STORAGE_BUCKET,
        Key: storagePath
      });

      const response = await this.s3Client.send(getCommand);
      
      if (!response.Body) {
        throw new Error('文件内容为空');
      }

      // 转换为Uint8Array
      const chunks: Uint8Array[] = [];
      const reader = response.Body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // 合并所有chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;

    } catch (error) {
      console.error('❌ [S3下载] 下载失败:', error);
      throw error;
    }
  }

  /**
   * 从S3删除文件
   */
  async deleteFileFromS3(
    storagePath: string,
    userToken: string
  ): Promise<void> {
    try {
      await this.setUserSession(userToken);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.STORAGE_BUCKET,
        Key: storagePath
      });

      await this.s3Client.send(deleteCommand);
      console.log(`✅ [S3删除] 文件删除成功: ${storagePath}`);

    } catch (error) {
      console.error('❌ [S3删除] 删除失败:', error);
      throw error;
    }
  }

  /**
   * 生成文件访问的预签名URL
   */
  async generatePresignedDownloadUrl(
    storagePath: string,
    userToken: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      await this.setUserSession(userToken);

      const getCommand = new GetObjectCommand({
        Bucket: this.STORAGE_BUCKET,
        Key: storagePath
      });

      const downloadUrl = await getSignedUrl(this.s3Client, getCommand, { 
        expiresIn 
      });

      return downloadUrl;

    } catch (error) {
      console.error('❌ [预签名下载URL] 生成失败:', error);
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

  private isTypeAllowed(fileType: string, allowedTypes: string[]): boolean {
    if (allowedTypes.length === 0) {
      return true;
    }

    return allowedTypes.some(allowedType => {
      if (allowedType === fileType) {
        return true;
      }

      if (allowedType.includes('*')) {
        const pattern = allowedType.replace('*', '.*');
        const regex = new RegExp(`^${pattern}$`, 'i');
        return regex.test(fileType);
      }

      return false;
    });
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

  private getMimeType(filename: string): string {
    const extension = this.getFileExtension(filename);
    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return mimeMap[extension] || 'application/octet-stream';
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
}

// 导出单例实例
export const supabaseS3DocumentService = new SupabaseS3DocumentService(); 