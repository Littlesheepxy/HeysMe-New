#!/bin/bash

echo "🧪 信息收集 Agent 测试工具"
echo "=================================="

# 检查开发服务器是否运行
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ 开发服务器未运行！"
    echo "请先运行: npm run dev"
    exit 1
fi

echo "✅ 开发服务器正在运行"
echo ""
echo "选择测试方式:"
echo "1. 🌐 网页界面测试 (推荐)"
echo "2. 💻 命令行测试"
echo "3. 📋 显示测试说明"
echo ""

read -p "请选择 [1-3]: " choice

case $choice in
    1)
        echo "🌐 正在打开网页测试界面..."
        if command -v open &> /dev/null; then
            open "http://localhost:3000/test-info-collection"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:3000/test-info-collection"
        else
            echo "请手动打开: http://localhost:3000/test-info-collection"
        fi
        ;;
    2)
        echo "💻 启动命令行测试..."
        node scripts/test-info-collection-agent.js
        ;;
    3)
        echo "📋 测试说明:"
        echo ""
        echo "🎯 测试目标:"
        echo "  • 验证工具调用功能 (GitHub/LinkedIn/网页链接)"
        echo "  • 验证信息收集结束条件"
        echo "  • 验证欢迎消息只发送一次"
        echo ""
        echo "🔧 测试用例:"
        echo "  1. 发送 GitHub 链接: https://github.com/username"
        echo "  2. 发送 LinkedIn 链接: https://linkedin.com/in/username"  
        echo "  3. 发送普通网站链接"
        echo "  4. 进行多轮对话测试推进条件"
        echo "  5. 重置会话测试欢迎消息"
        echo ""
        echo "📊 观察要点:"
        echo "  • 是否检测到链接并执行工具"
        echo "  • 对话多少轮后自动推进"
        echo "  • 欢迎消息是否只显示一次"
        echo "  • 工具执行结果是否正确显示"
        echo ""
        echo "🌐 网页测试: http://localhost:3000/test-info-collection"
        echo "💻 命令行测试: node scripts/test-info-collection-agent.js"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac
