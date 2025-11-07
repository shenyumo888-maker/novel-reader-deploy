// // server.js (后端代码 - Moonshot AI 防爆最终版)

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');

// const app = express();
// app.use(express.json({ limit: '5mb' }));
// app.use(cors());

// if (!process.env.MOONSHOT_API_KEY) {
//   throw new Error("FATAL ERROR: MOONSHOT_API_KEY is not defined in your .env file!");
// }
// const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
// const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

// app.post('/api/analyze', async (req, res) => {
//   try {
//     const { text } = req.body;
//     if (!text) {
//       return res.status(400).json({ error: '缺少文本内容' });
//     }

//     // 【核心改动】对输入文本进行截断，确保不超过模型限制
//     // 8000 个字符约等于 4000-5000 Token，留出足够余量给 Prompt
//     const truncatedText = text.substring(0, 6000); 

//     const prompt = `
//       你是一个专业的小说分析师。请仔细阅读以下小说章节内容，并严格按照下面的JSON格式，提取出本章出现的【主要角色】、【关键设定】以及生成【本章大纲】。

//       要求：
//       1. 描述要简洁精炼，不超过50字。
//       2. 严格返回一个可被解析的JSON对象，不要包含任何额外的解释或代码标记。

//       JSON格式:
//       {
//         "outline": "本章内容的精炼总结。",
//         "characters": [ { "name": "角色名", "description": "本章关于该角色的核心描述或行为" } ],
//         "settings": [ { "type": "地点/物品/概念", "name": "设定名", "description": "本章关于该设定的核心描述" } ]
//       }
      
//       章节内容如下：
//       ---
//       ${truncatedText} 
//       ---
//     `;

//     console.log(`正在向 Moonshot AI 发送请求 (文本长度: ${truncatedText.length} chars)...`);

//     const response = await axios.post(
//       MOONSHOT_API_URL,
//       {
//         model: 'moonshot-v1-8k',
//         messages: [{ role: 'user', content: prompt }],
//         response_format: { type: "json_object" },
//         temperature: 0.3,
//       },
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${MOONSHOT_API_KEY}`
//         }
//       }
//     );

//     const analysisText = response.data.choices[0].message.content;
//     console.log("----------- AI 原始响应 -----------");
//     console.log(analysisText);
//     console.log("------------------------------------");

//     const analysisJson = JSON.parse(analysisText);
//     res.json(analysisJson);

//   } catch (error) {
//     console.error("!!!!!!!!!! AI 分析时发生严重错误 !!!!!!!!!!");
//     if (error.response) {
//       console.error('Error Data:', error.response.data);
//       console.error('Error Status:', error.response.status);
//     } else {
//       console.error('Error Message:', error.message);
//     }
//     console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
//     const errorMessage = error.response?.data?.error?.message || error.message;
//     res.status(500).json({ error: `AI分析时发生内部错误: ${errorMessage}` });
//   }
// });

// const PORT = 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Kimi AI 分析服务器正在 http://localhost:${PORT} 上运行...`);
// });

// server.js (Hugging Face 最终部署版)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // 引入 Node.js 内置的 path 模块

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors());

// --- 检查并配置 AI 服务 ---
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY;
const MOONSHOT_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

if (!MOONSHOT_API_KEY) {
  console.warn("警告: 未在环境变量中找到 MOONSHOT_API_KEY。AI 分析功能将不可用。");
}

// --- 核心功能 1: AI 分析 API 接口 ---
app.post('/api/analyze', async (req, res) => {
  if (!MOONSHOT_API_KEY) {
    return res.status(503).json({ error: 'AI 服务未配置，无法进行分析。' });
  }

  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '缺少文本内容' });
    }

    const truncatedText = text.substring(0, 6000);

    const prompt = `
      你是一个专业的小说分析师。请仔细阅读以下小说章节内容，并严格按照下面的JSON格式，提取出本章出现的【主要角色】、【关键设定】以及生成【本章大纲】。

      要求：
      1. 描述要简洁精炼，不超过50字。
      2. 严格返回一个可被解析的JSON对象，不要包含任何额外的解释或代码标记。

      JSON格式:
      {
        "outline": "本章内容的精炼总结。",
        "characters": [ { "name": "角色名", "description": "本章关于该角色的核心描述或行为" } ],
        "settings": [ { "type": "地点/物品/概念", "name": "设定名", "description": "本章关于该设定的核心描述" } ]
      }
      
      章节内容如下：
      ---
      ${truncatedText} 
      ---
    `;

    console.log(`正在向 Moonshot AI 发送请求 (文本长度: ${truncatedText.length} chars)...`);

    const response = await axios.post(
      MOONSHOT_API_URL,
      {
        model: 'moonshot-v1-8k',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOONSHOT_API_KEY}`
        }
      }
    );

    const analysisText = response.data.choices[0].message.content;
    console.log("AI 响应已收到。");
    
    const analysisJson = JSON.parse(analysisText);
    res.json(analysisJson);

  } catch (error) {
    console.error("AI 分析时发生严重错误:", error.response ? error.response.data : error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    res.status(500).json({ error: `AI分析时发生内部错误: ${errorMessage}` });
  }
});

// --- 核心功能 2: 托管前端静态文件 ---
// 告诉 Express，我们所有的前端文件都放在 'dist' 文件夹里
// path.join(__dirname, 'dist') 会生成一个绝对路径，指向当前文件所在目录下的 dist 文件夹
app.use(express.static(path.join(__dirname, 'dist')));

// --- 核心功能 3: 处理 React-Router 的路由 ---
// 对于所有其他未匹配的 GET 请求 (例如 /book/123)，都返回前端的 index.html
// 这样浏览器就会加载 React 应用，然后由 React Router 来处理后续的路由逻辑
app.get(/^(?!\/api).*/, (req, res) => {
  // 总是返回前端的入口文件 index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- 服务器启动 ---
const PORT = process.env.PORT || 7860; // Hugging Face 会通过 PORT 环境变量告诉我们应该监听哪个端口，7860是其默认值
app.listen(PORT, () => {
  console.log(`🚀 AI 分析及前端托管服务器正在 http://localhost:${PORT} 上运行...`);
});
