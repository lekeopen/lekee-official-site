---
name: 小乐 · AI 智能体实践
subtitle: 面向个人任务协作的智能体探索
status: Live
publishStatus: published
summary: 一个试图解决“AI 不仅能聊，还能做事”的智能体项目，聚焦于个人任务管理与信息整理场景。
category: AI Product
tech_stack:
  - LLM Agent 架构
  - RAG (检索增强生成)
  - 自动化工作流
image_bg: bg-blue-50
cover: /images/projects/xiaole-agent.png
links:
  - label: Web (Live)
    url: https://github.com/rockts/xiaole-web
  - label: Backend (Repo)
    url: https://github.com/rockts/xiaole-backend
  - label: Docs (Repo)
    url: https://github.com/rockts/xiaole-ai
---

## 为什么要做这个项目

### 背景问题
通用大模型（LLM）虽然具备强大的对话能力，但在处理具体、连续的任务时，往往缺乏上下文记忆与工具调用能力。用户需要一个能真正融入工作流的助手，而不是一个仅仅用于闲聊的窗口。

### 技术动机
我们希望探索 Agent 架构在实际应用中的边界，验证 LLM 如何与传统的任务管理系统（Todo List, Calendar）进行有效结合，以及如何通过 Prompt Engineering 和 RAG 技术提升意图识别的准确率。

## 我们解决了什么

### 技术层面
基于 LangChain 构建智能体核心，接入 OpenAI/Anthropic 等主流大模型 API。实现了基于 ReAct 模式的任务规划与执行机制，能够自主拆解复杂指令。

### 工程层面
采用微服务架构，将核心 Agent 服务与业务逻辑解耦。前端使用 Next.js 构建响应式交互界面，支持流式输出与多模态交互。引入向量数据库（Pinecone/Milvus）实现长期记忆存储。

## 当前阶段说明

已正式上线（Live）。核心对话与任务创建流程稳定运行，正在重点优化多轮对话中的上下文保持能力。
