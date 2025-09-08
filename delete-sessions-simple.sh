#!/bin/bash

echo "正在删除所有 session 项目..."

# 当前第一页的 session 项目
session_projects=(
  "session-1756995786645-a4p27u64q"
  "session-1756994346473-eo1obn4gf"
  "session-1756990325684-icnskespe"
  "session-1754138454090-ak5ea6a2p"
  "session-1754141502919-tjml4pfpu"
  "session-1754649878670-3mmmkgofi"
  "session-1754907968463-9akmxrw0k"
)

# 第二页的 session 项目
session_projects+=(
  "session-1754643826395-z5rakla60"
  "session-1755065873658-e5xj0o42a"
  "session-1755067719008-fv9g32cll"
  "session-1755073985281-73cb4na55"
  "session-1755075010376-h4dtnsk07"
  "session-1755076555401-ms9i82lgq"
  "session-1755082177969-ggyyklf42"
  "session-1755140790648-vlwf6ekph"
  "session-1755158740015-mn3h7ejc5"
  "session-1755140168605-p4d21dpe9"
  "session-1755146085878-dm1hp9odk"
  "session-1755141175117-zh1mbepyv"
  "session-1755163495475-y7ge9l573"
  "session-1755165022686-ppf2lqpqi"
  "session-1755164814145-mcdnyddvjqj"
  "session-1755763835234-7l9x5tbc5"
  "session-1755246405416-zhma22l4v"
  "session-1755166672078-uvxm3fosz"
  "session-1755762566684-mtw34ska2"
  "session-1755507215515-sh7wufv3s"
)

echo "总共要删除 ${#session_projects[@]} 个 session 项目"

# 确认删除
read -p "确认要删除所有这些 session 项目吗？(y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "开始删除项目..."
    
    for project in "${session_projects[@]}"; do
        echo "删除项目: $project"
        vercel remove "$project" --yes
        sleep 0.5  # 避免API限制
    done
    
    echo "所有 session 项目删除完成！"
else
    echo "取消删除操作"
fi
