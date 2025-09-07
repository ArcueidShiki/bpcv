# DeepSeek API Configuration Guide

## 安全配置 DeepSeek API 密钥

为了使AI聊天机器人功能正常工作，您需要安全地配置DeepSeek API密钥。

### 方案一：环境变量配置（推荐）

1. 创建 `.env` 文件在项目根目录：
```bash
DEEPSEEK_API_KEY=your_actual_api_key_here
```

2. 确保 `.env` 文件被添加到 `.gitignore`：
```bash
echo ".env" >> .gitignore
```

3. 创建后端端点 `/api/get-deepseek-key` 来安全地提供API密钥

### 方案二：后端代理（最安全）

创建后端代理服务器来处理API调用，避免暴露API密钥到前端：

```javascript
// backend/api/chat.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', 
      req.body, 
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'API call failed' });
  }
});
```

### 方案三：临时测试（仅用于演示）

如果只是为了演示功能，聊天机器人会提示您输入API密钥。这种方式不适合生产环境。

### 获取 DeepSeek API 密钥

1. 访问 [DeepSeek API 控制台](https://platform.deepseek.com/)
2. 注册账户并登录
3. 创建新的API密钥
4. 复制密钥并按照上述方案之一进行配置

### 注意事项

- 永远不要将API密钥直接写入代码或提交到版本控制
- 使用环境变量或安全的配置管理系统
- 考虑实现API调用限制和错误处理
- 在生产环境中使用后端代理是最佳实践

### 无API密钥时的后备功能

即使没有配置API密钥，聊天机器人也会使用预定义的响应来回答关于Jensen简历的常见问题，包括：
- 技能和技术栈
- 工作经验
- 教育背景
- 项目经历
- 联系方式

这确保了即使在没有API密钥的情况下，聊天机器人功能也能正常工作。
