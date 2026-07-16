import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, '../content/news');
const QUEUE_FILE = path.join(__dirname, '../publish-queue.json');

function generatePublishQueue() {
    // 读取现有队列
    let existingQueue = { items: [] };
    if (fs.existsSync(QUEUE_FILE)) {
        try {
            existingQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
        } catch (e) {
            console.warn('队列文件解析失败，将创建新文件');
        }
    }

    // 构建已存在的文章映射
    const existingMap = new Map();
    (existingQueue.items || []).forEach(item => {
        existingMap.set(item.slug, item);
    });

    // 扫描 news 目录
    const files = fs.readdirSync(NEWS_DIR).filter(file => file.endsWith('.md'));

    const newItems = [];

    files.forEach(file => {
        const filePath = path.join(NEWS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(fileContent);

        // 仅处理 publish: true 的文章
        if (data.publish !== true) {
            return;
        }

        const slug = file.replace('.md', '');

        // 检查是否已存在且状态不是 pending
        const existing = existingMap.get(slug);
        if (existing && existing.status !== 'pending') {
            newItems.push(existing);
            return;
        }

        // 新文章或 pending 状态的文章
        newItems.push({
            slug,
            title: data.title || slug,
            date: data.date || new Date().toISOString().split('T')[0],
            summary: data.summary || '',
            channels: ['wechat', 'github', 'x'],
            status: 'pending'
        });
    });

    // 生成新的队列文件
    const queue = {
        generatedAt: new Date().toISOString(),
        items: newItems
    };

    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
    console.log(`✅ 发布队列已生成: ${QUEUE_FILE}`);
    console.log(`📝 待发布文章数: ${newItems.filter(i => i.status === 'pending').length}`);
}

generatePublishQueue();
