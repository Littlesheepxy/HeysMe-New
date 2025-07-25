// 智能选项生成示例 - 展示如何根据用户表达动态生成个性化选项

/**
 * ❌ 传统固定选项方式 - 限制用户表达
 */
const TRADITIONAL_FIXED_OPTIONS = {
  user_roles: [
    "学生",
    "开发者", 
    "设计师",
    "产品经理",
    "自由职业者"
  ],
  use_cases: [
    "求职找工作",
    "项目展示", 
    "个人品牌",
    "商务合作"
  ],
  styles: [
    "极简禅意",
    "科技未来",
    "商务专业", 
    "创意炫酷"
  ]
};

/**
 * ✅ 智能动态选项生成 - 基于用户真实表达
 */
interface SmartOptionGeneration {
  userInput: string;
  aiAnalysis: {
    extractedInfo: {
      identity: string[];
      goals: string[];
      styleHints: string[];
    };
    generatedOptions: {
      user_role: string[];
      use_case: string[];
      style: string[];
    };
  };
}

export const SMART_OPTION_EXAMPLES: SmartOptionGeneration[] = [
  {
    userInput: "我是刚毕业的计算机专业学生，想找AI相关的工作",
    aiAnalysis: {
      extractedInfo: {
        identity: ["应届毕业生", "计算机专业", "AI求职者"],
        goals: ["求职", "AI领域工作", "技能展示"],
        styleHints: ["专业", "技术导向"]
      },
      generatedOptions: {
        user_role: [
          "应届毕业生",
          "计算机专业学生", 
          "AI求职者",
          "✏️ 让我自己描述"
        ],
        use_case: [
          "AI岗位求职",
          "技术能力展示",
          "校招面试准备",
          "✏️ 其他目的"
        ],
        style: [
          "科技专业风格",
          "简洁学术风格", 
          "现代求职风格",
          "🎨 我有其他想法"
        ]
      }
    }
  },
  
  {
    userInput: "我是独立设计师，想展示我的创意作品给潜在客户",
    aiAnalysis: {
      extractedInfo: {
        identity: ["独立设计师", "创意工作者", "自由职业者"],
        goals: ["作品展示", "客户获取", "创意能力证明"],
        styleHints: ["创意", "视觉冲击", "作品导向"]
      },
      generatedOptions: {
        user_role: [
          "独立设计师",
          "创意工作者",
          "自由职业设计师",
          "✏️ 其他身份"
        ],
        use_case: [
          "作品集展示",
          "客户吸引",
          "创意能力证明",
          "✏️ 我有其他目的"
        ],
        style: [
          "创意作品集风格",
          "视觉冲击风格",
          "艺术展示风格", 
          "🎨 我有其他风格想法"
        ]
      }
    }
  },

  {
    userInput: "我在做AI创业，需要一个能展示我们团队和产品的页面",
    aiAnalysis: {
      extractedInfo: {
        identity: ["AI创业者", "团队创始人", "科技企业家"],
        goals: ["团队展示", "产品宣传", "投资者吸引"],
        styleHints: ["科技", "商务", "前沿", "专业"]
      },
      generatedOptions: {
        user_role: [
          "AI创业者",
          "团队创始人",
          "科技企业家",
          "✏️ 让我自己描述"
        ],
        use_case: [
          "团队和产品展示",
          "投资者展示",
          "商业合作洽谈",
          "✏️ 其他用途"
        ],
        style: [
          "科技创业风格",
          "商务展示风格",
          "前沿科技风格",
          "🎨 我有其他想法"
        ]
      }
    }
  },

  {
    userInput: "我是一个热爱摄影的文艺青年，想分享我的旅行经历和摄影作品",
    aiAnalysis: {
      extractedInfo: {
        identity: ["摄影爱好者", "文艺青年", "旅行博主"],
        goals: ["作品分享", "经历记录", "个人表达"],
        styleHints: ["文艺", "个性", "视觉", "情感"]
      },
      generatedOptions: {
        user_role: [
          "摄影爱好者",
          "文艺青年", 
          "旅行博主",
          "✏️ 其他描述"
        ],
        use_case: [
          "摄影作品分享",
          "旅行经历记录",
          "个人表达空间",
          "✏️ 我有其他想法"
        ],
        style: [
          "文艺摄影风格",
          "旅行日记风格",
          "个性表达风格",
          "🎨 我有其他风格偏好"
        ]
      }
    }
  }
];

/**
 * 智能选项生成的核心原则
 */
export const SMART_GENERATION_PRINCIPLES = {
  // 1. 贴近用户表达
  userExpression: {
    principle: "选项用词应接近用户的自然表达方式",
    example: "用户说'AI相关工作' → 生成'AI岗位求职'而不是'技术工作'"
  },
  
  // 2. 提供足够选择
  adequateChoices: {
    principle: "为每个维度提供2-4个相关但不重复的选项",
    example: "身份选项既要有具体的也要有概括的，满足不同表达习惯"
  },
  
  // 3. 始终包含开放选项
  openOptions: {
    principle: "每个维度都要提供自定义选项",
    example: "'✏️ 让我自己描述'、'✏️ 其他选项'、'🎨 我有其他想法'"
  },
  
  // 4. 上下文相关性
  contextRelevance: {
    principle: "选项应该考虑用户的整体情境",
    example: "AI创业者的风格选项应该偏向商务和科技，而不是文艺"
  },
  
  // 5. 渐进式收集
  progressiveCollection: {
    principle: "根据已有信息智能推荐后续选项",
    example: "确定是学生后，目标选项重点推荐求职和学习相关"
  }
};

/**
 * 动态选项生成的技术实现
 */
export const IMPLEMENTATION_STRATEGY = {
  // 1. LLM Prompt工程
  promptEngineering: {
    task: "训练LLM理解用户表达并生成个性化选项",
    keyPoints: [
      "强调理解用户真实意图",
      "避免强制分类思维",
      "生成贴近用户表达的选项",
      "始终提供开放性选择"
    ]
  },
  
  // 2. 前端交互设计
  frontendInteraction: {
    task: "设计支持动态选项的交互界面",
    features: [
      "动态渲染选项列表",
      "支持自定义输入", 
      "选项和自由输入的组合",
      "智能推荐标识"
    ]
  },
  
  // 3. 数据处理流程
  dataProcessing: {
    task: "处理动态选项和自定义输入",
    workflow: [
      "LLM分析用户表达",
      "生成个性化选项",
      "用户选择或自定义",
      "将结果标准化存储"
    ]
  }
};

/**
 * 用户体验对比
 */
export const UX_COMPARISON = {
  fixedOptions: {
    pros: ["实现简单", "数据标准化"],
    cons: [
      "限制用户表达",
      "可能不符合用户真实情况", 
      "感觉像填表而不是对话",
      "缺乏个性化"
    ],
    userFeedback: "感觉很死板，我的情况比较特殊，没有合适的选项"
  },
  
  smartOptions: {
    pros: [
      "贴近用户真实表达",
      "提供充分的个性化",
      "保持对话的自然感",
      "兼顾结构化和灵活性"
    ],
    cons: ["实现复杂度较高", "需要更好的LLM能力"],
    userFeedback: "太棒了！系统真的理解了我的需求，选项都很贴切"
  }
}; 