// HeysMe 应用核心类型定义
// 从 flowid.ts 重新导出核心类型

export type {
  User,
  FlowPage,
  PageBlock,
  BlockType,
  UserInput,
  GeneratedPageStructure
} from './flowid';

// 重新导出以保持向后兼容性
export type { FlowPage as HeysPage } from './flowid'; 