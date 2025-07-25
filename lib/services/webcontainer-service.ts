/**
 * WebContainer 服务类
 * 统一管理 WebContainer 的生命周期和操作
 */

import { WebContainer, type FileSystemTree, auth } from '@webcontainer/api';
import { CodeFile } from '@/lib/agents/coding/types';
import WebContainerCleanupManager from './webcontainer-cleanup';

export interface WebContainerConfig {
  clientId: string;
  scope?: string;
  workdirName?: string;
  coep?: 'require-corp' | 'credentialless' | 'none';
  forwardPreviewErrors?: boolean;
}

export type ContainerStatus = 'initializing' | 'installing' | 'building' | 'running' | 'error' | 'ready';

// ============== 全局单例实例管理 ==============
class GlobalWebContainer {
  private static instance: WebContainer | null = null;
  private static bootPromise: Promise<WebContainer> | null = null;
  private static isBooting: boolean = false;
  private static initializationCounter = 0;

  static async getInstance(config: WebContainerConfig): Promise<WebContainer> {
    // 检查全局是否已有实例（防止热重载等情况下的重复创建）
    if (typeof window !== 'undefined') {
      const globalInstance = (window as any).__webcontainer_singleton__;
      if (globalInstance && typeof globalInstance.spawn === 'function') {
        console.log('🔄 复用已存在的全局WebContainer实例');
        this.instance = globalInstance;
        return globalInstance;
      }
    }

    // 如果已有实例，直接返回
    if (this.instance) {
      console.log('🔄 复用当前WebContainer实例');
      return this.instance;
    }

    // 如果正在启动，等待启动完成
    if (this.isBooting && this.bootPromise) {
      console.log('⏳ 等待WebContainer启动完成...');
      return this.bootPromise;
    }

    // 增加初始化计数器，防止并发问题
    this.initializationCounter++;
    const currentAttempt = this.initializationCounter;
    
    console.log(`🚀 开始WebContainer初始化 (尝试 #${currentAttempt})`);

    // 开始启动
    this.isBooting = true;
    this.bootPromise = this.createInstance(config, currentAttempt);
    
    try {
      this.instance = await this.bootPromise;
      this.isBooting = false;
      
      // 保存到全局，防止热重载丢失
      if (typeof window !== 'undefined') {
        (window as any).__webcontainer_singleton__ = this.instance;
      }
      
      console.log('✅ WebContainer实例创建成功');
      return this.instance;
    } catch (error) {
      this.isBooting = false;
      this.bootPromise = null;
      
      console.error('❌ WebContainer启动失败:', error);
      
      // 如果是实例冲突错误，检查是否有全局实例可用
      if (error instanceof Error && error.message.includes('Only a single WebContainer instance can be booted')) {
        console.log('🔍 检测到实例冲突，查找现有实例...');
        
        // 尝试从全局获取现有实例
        if (typeof window !== 'undefined') {
          const existingInstance = (window as any).__webcontainer_singleton__;
          if (existingInstance && typeof existingInstance.spawn === 'function') {
            console.log('✅ 找到现有全局实例，复用中...');
            this.instance = existingInstance;
            return existingInstance;
          }
        }
        
        // 如果找不到现有实例，说明可能需要清理
        console.log('🧹 尝试清理并重新初始化...');
        await this.forceDestroy();
        
        // 等待一段时间确保清理完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 最后一次尝试
        this.isBooting = true;
        this.bootPromise = this.createInstance(config, currentAttempt);
        try {
          this.instance = await this.bootPromise;
          this.isBooting = false;
          
          if (typeof window !== 'undefined') {
            (window as any).__webcontainer_singleton__ = this.instance;
          }
          
          console.log('✅ 重新初始化成功');
          return this.instance;
        } catch (retryError) {
          this.isBooting = false;
          this.bootPromise = null;
          console.error('❌ 重新初始化也失败:', retryError);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  private static async createInstance(config: WebContainerConfig, attempt: number): Promise<WebContainer> {
    console.log(`🔧 正在创建WebContainer实例 (尝试 #${attempt})...`);
    
    const instance = await WebContainer.boot({
      coep: config.coep || 'credentialless',
      workdirName: config.workdirName || 'heysme-project',
      forwardPreviewErrors: config.forwardPreviewErrors ?? true
    });

    // 添加错误监听
    instance.on('error', (error) => {
      console.error('WebContainer运行时错误:', error);
    });

    return instance;
  }

  static async forceDestroy(): Promise<void> {
    console.log('🧹 强制清理WebContainer实例...');
    
    if (this.instance) {
      try {
        await this.instance.teardown();
        console.log('✅ 实例teardown完成');
      } catch (error) {
        console.warn('⚠️ teardown失败:', error);
      }
    }
    
    this.instance = null;
    this.isBooting = false;
    this.bootPromise = null;
    
    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__webcontainer_singleton__ = null;
      delete (window as any).__webcontainer_singleton__;
    }
    
    console.log('✅ 全局实例已清理');
  }

  static hasInstance(): boolean {
    // 同时检查内部实例和全局实例
    const hasInternal = this.instance !== null;
    const hasGlobal = typeof window !== 'undefined' && 
                     (window as any).__webcontainer_singleton__ !== null &&
                     (window as any).__webcontainer_singleton__ !== undefined;
    
    return hasInternal || hasGlobal;
  }

  static getExistingInstance(): WebContainer | null {
    // 优先返回内部实例
    if (this.instance) {
      return this.instance;
    }
    
    // 然后检查全局实例
    if (typeof window !== 'undefined') {
      const globalInstance = (window as any).__webcontainer_singleton__;
      if (globalInstance && typeof globalInstance.spawn === 'function') {
        this.instance = globalInstance; // 同步到内部
        return globalInstance;
      }
    }
    
    return null;
  }
}

// ============== 主要服务类 ==============
export class WebContainerService {
  private instance: WebContainer | null = null;
  private config: WebContainerConfig;
  private statusListeners: ((status: ContainerStatus) => void)[] = [];
  private logListeners: ((log: string) => void)[] = [];
  private serverReadyListeners: ((port: number, url: string) => void)[] = [];
  private dependenciesReadyListeners: (() => void)[] = [];
  private currentServerUrl: string | null = null;
  private runningProcesses: Map<string, any> = new Map();
  private isReady: boolean = false;
  private packageJsonMounted: boolean = false;
  private dependenciesInstalled: boolean = false;
  private mountedFiles: Set<string> = new Set();

  constructor(config: WebContainerConfig) {
    this.config = {
      scope: '',
      workdirName: 'heysme-project',
      coep: 'credentialless',
      forwardPreviewErrors: true,
      ...config
    };
    
    // 注册到清理管理器
    WebContainerCleanupManager.registerService(this);
  }

  // ============== 核心方法 ==============

  /**
   * 检查浏览器支持
   */
  static isSupported(): boolean {
    return typeof SharedArrayBuffer !== 'undefined' && 
           typeof WebAssembly !== 'undefined' &&
           window.crossOriginIsolated;
  }

  /**
   * 预启动 - 立即初始化WebContainer并安装基础依赖
   */
  async prestart(): Promise<void> {
    // 检查是否已有可用的实例
    const existingInstance = GlobalWebContainer.getExistingInstance();
    if (existingInstance && this.isReady) {
      this.log('✅ WebContainer已就绪，复用现有实例');
      this.instance = existingInstance;
      return;
    }

    try {
      this.updateStatus('initializing');
      this.log('🚀 开始预启动WebContainer...');

      if (!WebContainerService.isSupported()) {
        throw new Error('浏览器不支持WebContainer - 请确保启用了SharedArrayBuffer和跨域隔离');
      }

      // 获取或创建全局实例
      this.instance = await GlobalWebContainer.getInstance(this.config);
      this.log('✅ WebContainer实例获取成功');

      // 设置事件监听器
      this.setupEventListeners();

      // 安装基础依赖（仅在新实例时）
      if (!existingInstance) {
        await this.installBasicDependencies();
      } else {
        this.log('🔄 复用现有实例，跳过基础依赖安装');
      }

      this.isReady = true;
      this.updateStatus('ready');
      this.log('✅ WebContainer预启动完成');
    } catch (error) {
      this.updateStatus('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`❌ WebContainer预启动失败: ${errorMessage}`);
      
      // 如果是实例冲突错误，尝试复用现有实例
      if (errorMessage.includes('Only a single WebContainer instance can be booted')) {
        const existingInstance = GlobalWebContainer.getExistingInstance();
        if (existingInstance) {
          this.log('🔄 检测到冲突，尝试复用现有实例...');
          this.instance = existingInstance;
          this.setupEventListeners();
          this.isReady = true;
          this.updateStatus('ready');
          this.log('✅ 成功复用现有WebContainer实例');
          return;
        }
      }
      
      throw error;
    }
  }

  /**
   * 渐进式挂载 - 先挂载package.json并安装依赖
   */
  async mountPackageJson(packageJsonFile: CodeFile): Promise<void> {
    if (!this.instance) {
      this.log('❌ WebContainer未初始化，开始初始化...');
      await this.prestart();
    }

    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    try {
      this.updateStatus('installing');
      this.log('📦 挂载package.json并安装依赖...');

      // 挂载package.json
      await this.instance.mount({
        'package.json': {
          file: { contents: packageJsonFile.content }
        }
      });

      this.packageJsonMounted = true;
      this.mountedFiles.add('package.json');
      this.log('✅ package.json已挂载');

      // 立即开始安装依赖
      await this.installProjectDependencies();
      this.dependenciesInstalled = true;
      
      // 更新状态为ready，表示可以进行下一步
      this.updateStatus('ready');
      this.log('✅ package.json挂载和依赖安装完成');
      
      // 通知依赖就绪
      this.dependenciesReadyListeners.forEach(listener => listener());

    } catch (error) {
      this.log(`❌ package.json挂载失败: ${error}`);
      throw error;
    }
  }

  /**
   * 挂载其他文件并启动服务器
   */
  async mountOtherFilesAndStart(otherFiles: CodeFile[]): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    if (!this.packageJsonMounted) {
      this.log('⚠️ package.json未挂载，执行完整启动流程');
      return this.smartStart([...otherFiles]);
    }

    try {
      this.log('📁 挂载其他项目文件...');

      // 过滤掉已挂载的文件
      const filesToMount = otherFiles.filter(f => !this.mountedFiles.has(f.filename));
      
      if (filesToMount.length > 0) {
        const fileSystemTree = this.createFileSystemTree(filesToMount);
        await this.instance.mount(fileSystemTree);
        
        // 记录已挂载的文件
        filesToMount.forEach(f => this.mountedFiles.add(f.filename));
        this.log(`✅ 已挂载 ${filesToMount.length} 个文件`);
      }

      // 启动开发服务器
      await this.startDevServer();
      
    } catch (error) {
      this.log(`❌ 文件挂载或服务启动失败: ${error}`);
      throw error;
    }
  }

  /**
   * 智能启动 - 根据文件内容启动项目（向后兼容）
   */
  async smartStart(files: CodeFile[]): Promise<void> {
    if (!this.instance) {
      this.log('❌ WebContainer未初始化，开始初始化...');
      await this.prestart();
    }

    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    try {
      this.log('🧠 开始智能启动流程...');
      
      // 1. 挂载文件
      await this.mountFiles(files);
      
      // 2. 检查是否需要安装依赖
      const hasPackageJson = files.some(f => f.filename === 'package.json');
      if (hasPackageJson && !this.dependenciesInstalled) {
        await this.installProjectDependencies();
        this.dependenciesInstalled = true;
      }
      
      // 3. 启动开发服务器
      await this.startDevServer();
      
    } catch (error) {
      this.log(`❌ 智能启动失败: ${error}`);
      throw error;
    }
  }

  /**
   * 渐进式启动 - 新的推荐启动方式
   */
  async progressiveStart(files: CodeFile[]): Promise<void> {
    // 分离package.json和其他文件
    const packageJsonFile = files.find(f => f.filename === 'package.json');
    const otherFiles = files.filter(f => f.filename !== 'package.json');

    if (packageJsonFile) {
      // 1. 先挂载package.json并安装依赖
      await this.mountPackageJson(packageJsonFile);
      
      // 2. 如果有其他文件，挂载并启动
      if (otherFiles.length > 0) {
        await this.mountOtherFilesAndStart(otherFiles);
      } else {
        // 只有package.json，添加默认文件并启动
        await this.addDefaultFilesAndStart();
      }
    } else {
      // 没有package.json，使用标准流程
      await this.smartStart(files);
    }
  }

  // ============== 内部方法 ==============

  /**
   * 安装基础依赖 - 只做最小化预安装
   */
  private async installBasicDependencies(): Promise<void> {
    if (!this.instance) return;

    try {
      this.log('📦 安装基础依赖...');

      // 🔧 简化基础依赖，只安装全局可用的工具
      // 避免在预启动阶段安装具体项目依赖，防止冲突
      const initProcess = await this.instance.spawn('npm', ['init', '-y']);
      
      await initProcess.exit;
      this.log('✅ 基础npm初始化完成');
      
      // 不要在预启动时安装具体依赖，等到项目package.json挂载后再安装
      this.log('✅ 基础依赖安装成功');
    } catch (error) {
      this.log(`⚠️ 基础依赖安装失败: ${error}`);
      // 基础依赖安装失败不应阻止启动
    }
  }

  /**
   * 安装项目依赖 - 增强的安装逻辑
   */
  private async installProjectDependencies(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    try {
      this.updateStatus('installing');
      this.log('📦 安装项目依赖...');
      
      // 🔧 使用更兼容的npm参数
      const installProcess = await this.instance.spawn('npm', [
        'install', 
        '--legacy-peer-deps',
        '--no-audit',
        '--no-fund',
        '--prefer-offline',
        '--progress=false'
      ]);
      
      this.runningProcesses.set('install', installProcess);
      
      // 🔧 增加超时处理
      const timeoutPromise = new Promise<number>((_, reject) => {
        setTimeout(() => reject(new Error('依赖安装超时')), 120000); // 2分钟超时
      });
      
      const exitCode = await Promise.race([
        installProcess.exit,
        timeoutPromise
      ]);
      
      this.runningProcesses.delete('install');
      
      if (exitCode === 0) {
        this.log('✅ 项目依赖安装成功');
        
        // 🆕 验证关键工具是否可用
        await this.verifyInstallation();
        
        // 🔧 设置依赖安装完成状态并触发事件
        this.dependenciesInstalled = true;
        this.updateStatus('ready');
        this.log('✅ npm依赖安装完成');
        this.dependenciesReadyListeners.forEach(listener => listener());
      } else {
        // 🔧 尝试使用yarn作为备选
        this.log(`⚠️ npm安装失败(退出码: ${exitCode})，尝试使用yarn...`);
        await this.tryYarnInstall();
      }
    } catch (error) {
      this.runningProcesses.delete('install');
      this.log(`❌ 项目依赖安装失败: ${error}`);
      
      // 🔧 最后尝试使用最小依赖
      await this.installMinimalDependencies();
    }
  }

  /**
   * 尝试使用yarn安装
   */
  private async tryYarnInstall(): Promise<void> {
    if (!this.instance) return;
    
    try {
      this.log('📦 尝试使用yarn安装依赖...');
      
      const yarnProcess = await this.instance.spawn('yarn', ['install', '--silent']);
      const exitCode = await yarnProcess.exit;
      
      if (exitCode === 0) {
        this.log('✅ yarn安装成功');
        await this.verifyInstallation();
        
        // 🔧 设置依赖安装完成状态并触发事件
        this.dependenciesInstalled = true;
        this.updateStatus('ready');
        this.log('✅ yarn依赖安装完成');
        this.dependenciesReadyListeners.forEach(listener => listener());
      } else {
        throw new Error(`yarn安装失败，退出码: ${exitCode}`);
      }
    } catch (error) {
      this.log(`⚠️ yarn安装也失败: ${error}`);
      throw error;
    }
  }

  /**
   * 安装最小依赖
   */
  private async installMinimalDependencies(): Promise<void> {
    if (!this.instance) return;
    
    try {
      this.log('📦 尝试安装最小依赖...');
      
      // 只安装最关键的依赖
      const minimalProcess = await this.instance.spawn('npm', [
        'install', 'vite@latest', 'react@latest', 'react-dom@latest',
        '--legacy-peer-deps', '--no-audit'
      ]);
      
      const exitCode = await minimalProcess.exit;
      if (exitCode === 0) {
        this.log('✅ 最小依赖安装成功');
        
        // 🔧 设置依赖安装完成状态并触发事件
        this.dependenciesInstalled = true;
        this.updateStatus('ready');
        this.log('✅ 最小依赖安装完成');
        this.dependenciesReadyListeners.forEach(listener => listener());
      } else {
        this.log('⚠️ 最小依赖安装也失败，但继续运行');
      }
    } catch (error) {
      this.log(`⚠️ 最小依赖安装失败: ${error}`);
    }
  }

  /**
   * 验证安装是否成功
   */
  private async verifyInstallation(): Promise<void> {
    if (!this.instance) return;
    
    try {
      // 检查vite是否可用
      const viteCheck = await this.instance.spawn('npx', ['vite', '--version']);
      const viteExitCode = await viteCheck.exit;
      
      if (viteExitCode === 0) {
        this.log('✅ vite工具验证成功');
      } else {
        this.log('⚠️ vite工具验证失败，但继续运行');
      }
    } catch (error) {
      this.log(`⚠️ 工具验证失败: ${error}`);
    }
  }

  /**
   * 添加默认文件并启动（当只有package.json时）
   */
  private async addDefaultFilesAndStart(): Promise<void> {
    if (!this.instance) return;

    try {
      this.log('📁 添加默认项目文件...');
      
      const defaultFiles: FileSystemTree = {};
      this.addRequiredFiles(defaultFiles);
      
      // 移除package.json（已经挂载）
      delete defaultFiles['package.json'];
      
      await this.instance.mount(defaultFiles);
      this.log('✅ 默认文件已添加');
      
      // 启动开发服务器
      await this.startDevServer();
    } catch (error) {
      this.log(`❌ 添加默认文件失败: ${error}`);
      throw error;
    }
  }

  /**
   * 挂载文件
   */
  async mountFiles(files: CodeFile[]): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    try {
      this.updateStatus('installing');
      this.log('📁 挂载项目文件...');

      const fileSystemTree = this.createFileSystemTree(files);
      await this.instance.mount(fileSystemTree);
      
      // 记录已挂载的文件
      files.forEach(f => this.mountedFiles.add(f.filename));
      
      this.log(`✅ 已挂载 ${files.length} 个文件`);
    } catch (error) {
      this.log(`❌ 文件挂载失败: ${error}`);
      throw error;
    }
  }

  /**
   * 启动开发服务器 - 增强的启动逻辑
   */
  async startDevServer(): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }

    try {
      this.updateStatus('building');
      this.log('🏗️ 启动开发服务器...');
      
      // 🔧 尝试多种启动方式
      let serverProcess;
      
      try {
        // 方式1: 使用npm run dev
        serverProcess = await this.instance.spawn('npm', ['run', 'dev']);
      } catch (error) {
        this.log('⚠️ npm run dev失败，尝试直接使用npx vite...');
        
        try {
          // 方式2: 使用npx vite
          serverProcess = await this.instance.spawn('npx', ['vite', '--host', '--port', '3000']);
        } catch (error2) {
          this.log('⚠️ npx vite也失败，尝试全局vite...');
          
          // 方式3: 尝试全局vite
          serverProcess = await this.instance.spawn('vite', ['--host', '--port', '3000']);
        }
      }
      
      this.runningProcesses.set('dev-server', serverProcess);
      
      // 处理输出，但不等待进程结束（开发服务器应该持续运行）
      this.handleProcessOutput(serverProcess.output.getReader(), 'dev');
      
      this.log('✅ 开发服务器启动完成');
    } catch (error) {
      this.runningProcesses.delete('dev-server');
      this.log(`❌ 开发服务器启动失败: ${error}`);
      
      // 🔧 最后尝试使用静态服务器
      await this.startStaticServer();
    }
  }

  /**
   * 启动静态服务器作为备选
   */
  private async startStaticServer(): Promise<void> {
    if (!this.instance) return;
    
    try {
      this.log('📡 尝试启动静态服务器...');
      
      // 使用Python或Node.js内置的静态服务器
      const staticProcess = await this.instance.spawn('npx', [
        'serve', '-s', '.', '-l', '3000'
      ]);
      
      this.runningProcesses.set('static-server', staticProcess);
      this.handleProcessOutput(staticProcess.output.getReader(), 'static');
      
      this.log('✅ 静态服务器启动成功');
    } catch (error) {
      this.log(`❌ 静态服务器启动也失败: ${error}`);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.instance) return;

    this.instance.on('server-ready', (port, url) => {
      this.log(`🌐 服务器就绪: ${url}`);
      this.currentServerUrl = url;
      this.updateStatus('running');
      this.serverReadyListeners.forEach(listener => listener(port, url));
    });

    this.instance.on('port', (port, type, url) => {
      if (type === 'open') {
        this.log(`🔌 端口开放: ${url}`);
        this.currentServerUrl = url;
        this.updateStatus('running');
        this.serverReadyListeners.forEach(listener => listener(port, url));
      }
    });

    this.instance.on('error', (error) => {
      this.log(`❌ WebContainer错误: ${error.message}`);
      this.updateStatus('error');
    });
  }

  /**
   * 处理进程输出
   */
  private async handleProcessOutput(reader: ReadableStreamDefaultReader<string>, prefix: string): Promise<void> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const cleanLine = this.cleanLogLine(String(value));
        if (cleanLine) {
          this.log(`${prefix}: ${cleanLine}`);
        }
      }
    } catch (error) {
      this.log(`❌ 处理进程输出失败: ${error}`);
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 清理日志行
   */
  private cleanLogLine(line: string): string {
    return line
      .replace(/\x1b\[[0-9;]*[mGKHF]/g, '') // 移除 ANSI 转义序列
      .replace(/\r/g, '') // 移除回车符
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // 移除控制字符
      .trim();
  }

  /**
   * 创建文件系统树
   */
  private createFileSystemTree(files: CodeFile[]): FileSystemTree {
    const tree: FileSystemTree = {};
    
    files.forEach(file => {
      const parts = file.filename.split('/');
      let current = tree;
      
      // 创建目录结构
      for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        if (!current[dirName]) {
          current[dirName] = { directory: {} };
        }
        current = (current[dirName] as any).directory;
      }
      
      // 添加文件
      const fileName = parts[parts.length - 1];
      current[fileName] = {
        file: { contents: file.content }
      };
    });

    // 自动生成必要的配置文件
    this.addRequiredFiles(tree);
    return tree;
  }

  /**
   * 添加必要的配置文件
   */
  private addRequiredFiles(tree: FileSystemTree): void {
    // 添加package.json（如果不存在）
    if (!tree['package.json']) {
      tree['package.json'] = {
        file: {
          contents: JSON.stringify({
            name: this.config.workdirName || 'heysme-project',
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.15',
              '@types/react-dom': '^18.2.7',
              '@vitejs/plugin-react': '^4.0.3',
              vite: '^4.4.5'
            }
          }, null, 2)
        }
      };
    }

    // 添加vite.config.js（如果不存在）
    if (!tree['vite.config.js']) {
      tree['vite.config.js'] = {
        file: {
          contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})`
        }
      };
    }

    // 添加index.html（如果不存在）
    if (!tree['index.html']) {
      tree['index.html'] = {
        file: {
          contents: `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HeysMe项目预览</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        }
      };
    }

    // 确保有src目录和入口文件
    if (!tree['src']) {
      tree['src'] = { directory: {} };
    }
    
    const srcDir = (tree['src'] as any).directory;
    
    if (!srcDir['main.tsx']) {
      srcDir['main.tsx'] = {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        }
      };
    }

    if (!srcDir['App.tsx']) {
      srcDir['App.tsx'] = {
        file: {
          contents: `import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>HeysMe 项目预览</h1>
      <p>项目正在运行中...</p>
    </div>
  )
}

export default App`
        }
      };
    }
  }

  // ============== 公共接口 ==============

  /**
   * 获取当前服务器URL
   */
  getCurrentServerUrl(): string | null {
    return this.currentServerUrl;
  }

  /**
   * 检查挂载状态
   */
  getMountStatus(): {
    packageJsonMounted: boolean;
    dependenciesInstalled: boolean;
    mountedFilesCount: number;
  } {
    return {
      packageJsonMounted: this.packageJsonMounted,
      dependenciesInstalled: this.dependenciesInstalled,
      mountedFilesCount: this.mountedFiles.size
    };
  }

  /**
   * 写入文件
   */
  async writeFile(path: string, content: string): Promise<void> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }
    await this.instance.fs.writeFile(path, content);
    this.log(`📝 文件已更新: ${path}`);
  }

  /**
   * 读取文件
   */
  async readFile(path: string): Promise<string> {
    if (!this.instance) {
      throw new Error('WebContainer实例未初始化');
    }
    return await this.instance.fs.readFile(path, 'utf-8');
  }

  /**
   * 终止所有进程
   */
  async killAllProcesses(): Promise<void> {
    this.runningProcesses.forEach((process, name) => {
      process.kill();
      this.log(`🛑 进程 ${name} 已终止`);
    });
    this.runningProcesses.clear();
  }

  // ============== 事件监听器 ==============

  onServerReady(listener: (port: number, url: string) => void): void {
    this.serverReadyListeners.push(listener);
  }

  removeServerReadyListener(listener: (port: number, url: string) => void): void {
    const index = this.serverReadyListeners.indexOf(listener);
    if (index > -1) {
      this.serverReadyListeners.splice(index, 1);
    }
  }

  onStatusChange(listener: (status: ContainerStatus) => void): void {
    this.statusListeners.push(listener);
  }

  onLog(listener: (log: string) => void): void {
    this.logListeners.push(listener);
  }

  onDependenciesReady(listener: () => void): void {
    this.dependenciesReadyListeners.push(listener);
  }

  removeDependenciesReadyListener(listener: () => void): void {
    const index = this.dependenciesReadyListeners.indexOf(listener);
    if (index > -1) {
      this.dependenciesReadyListeners.splice(index, 1);
    }
  }

  // ============== 内部工具方法 ==============

  private updateStatus(status: ContainerStatus): void {
    this.statusListeners.forEach(listener => listener(status));
  }

  private log(message: string): void {
    this.logListeners.forEach(listener => listener(message));
  }

  get status(): 'ready' | 'not-ready' {
    return this.isReady && this.instance ? 'ready' : 'not-ready';
  }

  // ============== 清理方法 ==============

  async destroy(): Promise<void> {
    try {
      await this.killAllProcesses();
      
      this.instance = null;
      this.isReady = false;
      this.packageJsonMounted = false;
      this.dependenciesInstalled = false;
      this.mountedFiles.clear();
      this.statusListeners = [];
      this.logListeners = [];
      this.serverReadyListeners = [];
      this.dependenciesReadyListeners = [];
      this.currentServerUrl = null;
      this.runningProcesses.clear();
      
      // 从清理管理器中注销
      WebContainerCleanupManager.unregisterService(this);
      
      this.log('✅ WebContainer服务已清理');
    } catch (error) {
      this.log(`❌ 销毁WebContainer时出错: ${error}`);
      throw error;
    }
  }

  /**
   * 重置项目状态（保留WebContainer实例）
   */
  async resetProjectState(): Promise<void> {
    this.log('🔄 重置项目状态...');
    
    // 终止所有运行中的进程
    await this.killAllProcesses();
    
    // 重置状态标志
    this.packageJsonMounted = false;
    this.dependenciesInstalled = false;
    this.mountedFiles.clear();
    this.currentServerUrl = null;
    
    this.log('✅ 项目状态已重置');
  }

  /**
   * 销毁全局实例
   */
  static async destroyGlobalInstance(): Promise<void> {
    await GlobalWebContainer.forceDestroy();
  }
}