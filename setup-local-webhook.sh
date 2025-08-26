#!/bin/bash

# HeysMe 本地Webhook开发环境设置脚本

echo "🚀 HeysMe 本地Webhook开发环境设置"
echo "================================="

# 检查ngrok是否已安装
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok未安装，正在安装..."
    brew install ngrok
else
    echo "✅ ngrok已安装"
fi

# 检查Next.js是否在运行
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js开发服务器正在运行 (localhost:3000)"
else
    echo "⚠️  Next.js开发服务器未运行"
    echo "请在另一个终端窗口运行: npm run dev"
    echo ""
    read -p "按Enter键继续设置ngrok隧道..."
fi

echo ""
echo "📝 设置步骤:"
echo "1. 访问 https://ngrok.com 注册免费账户"
echo "2. 获取您的认证令牌 (Authtoken)"
echo "3. 运行: ngrok config add-authtoken YOUR_AUTHTOKEN"
echo "4. 运行此脚本继续设置"
echo ""

# 询问是否已设置认证令牌
read -p "您是否已经设置了ngrok认证令牌? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "请先设置ngrok认证令牌，然后重新运行此脚本"
    exit 1
fi

echo ""
echo "🔗 启动ngrok隧道..."

# 启动ngrok隧道
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# 等待ngrok启动
echo "等待ngrok启动..."
sleep 3

# 获取公开URL
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
    if [[ $NGROK_URL != "null" && $NGROK_URL != "" ]]; then
        break
    fi
    echo "等待ngrok启动... ($i/10)"
    sleep 2
done

if [[ $NGROK_URL == "null" || $NGROK_URL == "" ]]; then
    echo "❌ 无法获取ngrok URL，请手动检查"
    echo "访问 http://localhost:4040 查看ngrok状态"
    exit 1
fi

echo ""
echo "🎉 设置完成！"
echo "================================="
echo "📍 您的公开URL: $NGROK_URL"
echo "🔗 Webhook端点: $NGROK_URL/api/webhooks/clerk"
echo "🌐 ngrok控制台: http://localhost:4040"
echo ""
echo "📝 在Clerk Dashboard中配置Webhook:"
echo "1. 访问 https://clerk.com/dashboard"
echo "2. 进入您的应用 > Configure > Webhooks"
echo "3. 点击 'Add Endpoint'"
echo "4. 端点URL: $NGROK_URL/api/webhooks/clerk"
echo "5. 选择事件: user.created, user.updated, user.deleted"
echo "6. 保存配置"
echo ""
echo "🧪 测试webhook:"
echo "curl -X POST $NGROK_URL/api/webhooks/clerk"
echo ""
echo "⚠️  注意: 每次重启ngrok，URL都会变化，需要更新Clerk配置"
echo ""

# 保存URL到文件
echo $NGROK_URL > .ngrok-url
echo "💾 URL已保存到 .ngrok-url 文件"

# 询问是否打开浏览器
read -p "是否打开ngrok控制台? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open http://localhost:4040
fi

echo "按Ctrl+C停止ngrok隧道"
wait $NGROK_PID 