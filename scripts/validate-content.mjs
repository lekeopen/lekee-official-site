import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import frontMatter from 'front-matter';

const NEWS_STATUSES = new Set(['draft', 'published']);
const PROJECT_STATUSES = new Set(['Live', 'Production', 'Alpha', 'Beta', 'Internal', 'Concept']);
const PROJECT_PUBLISH_STATUSES = new Set(['draft', 'published']);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isNonEmptyStringArray = (value) => (
  Array.isArray(value)
  && value.length > 0
  && value.every(isNonEmptyString)
);

const validateRequiredStrings = (attributes, fields, relativePath) => fields
  .filter((field) => !isNonEmptyString(attributes[field]))
  .map((field) => `${relativePath}: missing ${field}`);

const validateNews = (attributes, relativePath) => {
  const errors = validateRequiredStrings(attributes, ['title', 'date', 'category'], relativePath);

  if (isNonEmptyString(attributes.date) && Number.isNaN(Date.parse(attributes.date))) {
    errors.push(`${relativePath}: invalid date "${attributes.date}"`);
  }

  if (!isNonEmptyString(attributes.summary) && !isNonEmptyStringArray(attributes.summary)) {
    errors.push(`${relativePath}: missing summary`);
  }

  if (!isNonEmptyString(attributes.status)) {
    errors.push(`${relativePath}: missing status`);
  } else if (!NEWS_STATUSES.has(attributes.status)) {
    errors.push(`${relativePath}: invalid status "${attributes.status}"`);
  }

  return errors;
};

const validateProject = (attributes, relativePath) => {
  const errors = validateRequiredStrings(
    attributes,
    ['name', 'subtitle', 'summary', 'category'],
    relativePath,
  );

  if (!isNonEmptyString(attributes.status)) {
    errors.push(`${relativePath}: missing status`);
  } else if (!PROJECT_STATUSES.has(attributes.status)) {
    errors.push(`${relativePath}: invalid status "${attributes.status}"`);
  }

  if (!isNonEmptyString(attributes.publishStatus)) {
    errors.push(`${relativePath}: missing publishStatus`);
  } else if (!PROJECT_PUBLISH_STATUSES.has(attributes.publishStatus)) {
    errors.push(`${relativePath}: invalid publishStatus "${attributes.publishStatus}"`);
  }

  if (!isNonEmptyStringArray(attributes.tech_stack)) {
    errors.push(`${relativePath}: tech_stack must be a non-empty array`);
  }

  return errors;
};

const markdownFiles = async (directory) => {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
};

export const validateContent = async (rootDir) => {
  const contentTypes = [
    { directory: 'content/news', validate: validateNews },
    { directory: 'content/projects', validate: validateProject },
  ];
  const errors = [];

  for (const contentType of contentTypes) {
    const directoryPath = path.join(rootDir, contentType.directory);
    const files = await markdownFiles(directoryPath);

    for (const file of files) {
      const relativePath = path.posix.join(contentType.directory, file);
      const source = await readFile(path.join(directoryPath, file), 'utf8');

      try {
        const { attributes } = frontMatter(source);
        errors.push(...contentType.validate(attributes, relativePath));
      } catch (error) {
        errors.push(`${relativePath}: invalid frontmatter (${error.message})`);
      }
    }
  }

  return errors.sort();
};

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const errors = await validateContent(process.cwd());

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Content validation passed.');
  }
}
