// 测试新的内容分离机制
const { separateVisibleAndHiddenContent, StreamContentProcessor } = require('./lib/agents/welcome/utils.ts');

// 测试1: 完整的响应
console.log('🧪 测试1: 完整的响应分离');
const testResponse1 = `太好了！我了解到你是一位设计师，想要创建作品集来展示给潜在客户。这是一个很棒的想法！

为了帮你打造最合适的作品集，你希望作品集呈现什么样的风格呢？比如：
• 简约专业型 - 干净整洁，突出作品本身
• 创意个性型 - 有独特的视觉风格，展现创意能力

\`\`\`HIDDEN_CONTROL
{
  "collected_info": {
    "user_role": "设计师",
    "use_case": "作品集展示给潜在客户"
  },
  "completion_status": "collecting"
}
\`\`\``;

const result1 = separateVisibleAndHiddenContent(testResponse1);
console.log('可见内容:', result1.visibleContent);
console.log('隐藏控制:', result1.hiddenControl);
console.log('是否完整:', result1.isComplete);

// 测试2: 流式处理
console.log('\n🧪 测试2: 流式内容处理');
const processor = new StreamContentProcessor();

const chunks = [
  '太好了！我了解到你是',
  '一位设计师，想要创建作品集',
  '来展示给潜在客户。\n\n为了帮你',
  '打造最合适的作品集\n\n```HIDDEN_CONTROL\n{',
  '\n  "collected_info": {',
  '\n    "user_role": "设计师"',
  '\n  },\n  "completion_status": "collecting"',
  '\n}\n```'
];

chunks.forEach((chunk, index) => {
  console.log(`\n--- 处理第${index + 1}个chunk: "${chunk}" ---`);
  const result = processor.processChunk(chunk);
  console.log('新可见内容:', result.newVisibleContent);
  console.log('当前完整可见内容:', processor.getCurrentVisibleContent());
  console.log('是否完整:', result.isComplete);
  if (result.hiddenControl) {
    console.log('检测到隐藏控制:', result.hiddenControl);
  }
});

console.log('\n✅ 测试完成！'); 