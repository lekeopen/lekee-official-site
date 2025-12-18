import frontMatter from 'front-matter';

// News Types
export interface NewsItem {
    id: string;
    title: string;
    date: string;
    category: string;
    tags?: string[];
    summary: string[];
    cover?: string;
    status: 'draft' | 'published';
    content: {
        background?: string;
        status?: string;
        plans?: string[];
        links?: { label: string; url: string }[];
        body: string; // Full markdown body
    };
}

// Project Types
export interface ProjectItem {
    id: string;
    name: string;
    subtitle: string;
    status: 'Live' | 'Alpha' | 'Beta' | 'Internal' | 'Concept';
    publishStatus: 'draft' | 'published';
    summary: string;
    category: string;
    tech_stack: string[];
    image_bg: string;
    cover?: string;
    content: {
        why?: {
            background: string;
            techMotivation: string;
        };
        solution?: {
            tech: string;
            engineering: string;
        };
        currentStage?: string;
        links?: { label: string; url: string }[];
        body: string; // Full markdown body
    };
}

// Helper to parse markdown content
const parseMarkdown = (markdown: string): { attributes: Record<string, unknown>; body: string } => {
    const { attributes, body } = frontMatter<Record<string, unknown>>(markdown);
    return { attributes, body };
};

// Fetch all news
export const getAllNews = (): NewsItem[] => {
    const modules = import.meta.glob('/content/news/*.md', { query: '?raw', eager: true, import: 'default' });

    const news = Object.entries(modules).map(([path, content]) => {
        const id = path.split('/').pop()?.replace('.md', '') || '';

        // Skip invalid IDs
        if (!id || id === '---') return null;

        const { attributes, body } = parseMarkdown(content as string);

        // Normalize summary to always be an array
        const rawSummary = attributes.summary;
        const summary = Array.isArray(rawSummary) ? rawSummary : [rawSummary as string];

        // Parse complex fields from body if needed, or rely on structured frontmatter + body
        // For news, we used to have structured fields. Let's try to extract them from sections or just use body.
        // For now, let's map the flat frontmatter to our structure.

        // Note: The previous structure had split fields (background, status, plans). 
        // In MD, these are usually H2 sections. We can parse them or just render the whole body.
        // To keep compatibility with existing components that expect split fields, we might need a parser.
        // BUT, the better way for MD is to just render the body in the detail page.

        return {
            id,
            title: attributes.title as string,
            date: attributes.date as string,
            category: attributes.category as string,
            tags: (attributes.tags as string[]) || [],
            summary: [attributes.summary as string], // Frontmatter summary is string, array needed?
            cover: attributes.cover as string | undefined,
            status: (attributes.status as 'draft' | 'published') || 'published',
            content: {
                body: body,
                // We can keep these for structured data if we parse the body, 
                // but for now let's use the body for the main content area.
            }
        } as NewsItem;
    }).filter(item => item.status !== 'draft');

    return news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Fetch all projects
export const getAllProjects = (): ProjectItem[] => {
    const modules = import.meta.glob('/content/projects/*.md', { query: '?raw', eager: true, import: 'default' });

    const projects = Object.entries(modules).map(([path, content]) => {
        const id = path.split('/').pop()?.replace('.md', '') || '';
        const { attributes, body } = parseMarkdown(content as string);

        return {
            id,
            name: attributes.name as string,
            subtitle: attributes.subtitle as string,
            status: attributes.status as 'Live' | 'Alpha' | 'Beta' | 'Internal' | 'Concept',
            publishStatus: (attributes.publishStatus as 'draft' | 'published') || 'published',
            summary: attributes.summary as string,
            category: attributes.category as string,
            tech_stack: (attributes.tech_stack as string[]) || [],
            image_bg: (attributes.image_bg as string) || 'bg-gray-50',
            cover: attributes.cover as string | undefined,
            content: {
                links: attributes.links as { label: string; url: string }[],
                body: body
            }
        } as ProjectItem;
    }).filter((item): item is ProjectItem => item !== null && item.publishStatus !== 'draft');

    // Sort by defined order or date if available.  
    // For now, let's keep the order based on a hardcoded list or sort by name/status.
    // Let's rely on the file system order (unstable) or add a 'order' field. 
    // For simplicity, we can sort by ID or just return as is.
    return projects;
};
