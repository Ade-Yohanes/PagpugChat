/**
 * Puter.js File System API Wrapper
 */

import type {
  FileSystemItem,
  CreateFolderOptions,
  DeleteOptions,
} from './puter-fs-types';

function normalizeFSPath(path: string): string {
  if (!path || path.trim() === '' || path === './') {
    return './';
  }

  let normalized = path.trim();
  while (normalized.startsWith('/')) {
    normalized = normalized.substring(1);
  }
  while (normalized.endsWith('/')) {
    normalized = normalized.substring(0, normalized.length - 1);
  }

  if (!normalized.startsWith('./')) {
    normalized = `./${normalized}`;
  }

  return normalized;
}

export async function listDirectory(path: string): Promise<FileSystemItem[]> {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter not initialized');
  }

  const readPath = normalizeFSPath(path);
  const items = (await window.puter.fs.readdir(readPath)) as unknown as Array<Record<string, unknown>>;

  return (items || []).map((item) => {
    const isDir = Boolean(item.is_dir);

    return {
      id: (item.id as string) || (item.uid as string) || (item.path as string) || '',
      uid: item.uid as string,
      name: item.name as string,
      path: item.path as string,
      type: isDir ? 'directory' : 'file',
      is_dir: isDir,
      size: isDir ? null : ((item.size as number) ?? 0),
      modified: typeof item.modified === 'number' ? item.modified as number : undefined,
    };
  });
}

export async function createFolder(
  parentPath: string,
  folderName: string,
  options: CreateFolderOptions = {}
): Promise<FileSystemItem | string> {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter not initialized');
  }

  if (!folderName || folderName.trim() === '') {
    throw new Error('Folder name cannot be empty');
  }

  let normalizedParent = parentPath ? parentPath.trim() : '';
  while (normalizedParent.startsWith('/')) {
    normalizedParent = normalizedParent.substring(1);
  }
  while (normalizedParent.endsWith('/')) {
    normalizedParent = normalizedParent.substring(0, normalizedParent.length - 1);
  }

  const fullPath = normalizeFSPath(normalizedParent ? `${normalizedParent}/${folderName.trim()}` : folderName.trim());
  const result = await window.puter.fs.mkdir(fullPath, options);
  const resultItem = result as unknown as Record<string, unknown>;
  return (resultItem?.name as string) || fullPath;
}

export async function deleteItem(
  path: string,
  options: DeleteOptions = {},
  basePath?: string
): Promise<void> {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter not initialized');
  }

  if (!path || path.trim() === '') {
    throw new Error('Path cannot be empty');
  }

  const rawPath = path.trim();
  if (!rawPath) {
    throw new Error('Path cannot be empty');
  }

  const buildCandidates = (): string[] => {
    const candidates = new Set<string>();
    const clean = (p: string) => p.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    const cleanedPath = clean(rawPath);

    if (cleanedPath) {
      candidates.add(cleanedPath);
      candidates.add(`./${cleanedPath}`);
      candidates.add(`/${cleanedPath}`);
    }

    if (cleanedPath.startsWith('./')) {
      candidates.add(cleanedPath.slice(2));
      candidates.add(cleanedPath.replace(/^\.\//, '/'));
    }

    if (basePath && basePath.trim()) {
      const base = clean(basePath);
      if (base) {
        const maybePath = clean(`${base}/${cleanedPath}`);
        candidates.add(maybePath);
        candidates.add(`./${maybePath}`);
        candidates.add(`/${maybePath}`);
      }
    }

    return Array.from(candidates).filter(Boolean);
  };

  const candidates = buildCandidates();
  console.log('[deleteItem] Delete candidates:', { rawPath, basePath, candidates });
  console.log('[deleteItem] Options:', { recursive: options.recursive, descendantsOnly: options.descendantsOnly });

  let lastError: string | null = null;

  for (const candidate of candidates) {
    try {
      console.log('[deleteItem] Trying delete candidate:', candidate);
      await window.puter.fs.delete(candidate, {
        recursive: options.recursive ?? false,
        descendantsOnly: options.descendantsOnly ?? false,
      });
      console.log('[deleteItem] Delete successful for candidate:', candidate);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : error && typeof error === 'object'
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);
      console.warn('[deleteItem] Delete failed for candidate:', candidate, errorMessage);
      lastError = errorMessage;
      if (!errorMessage.includes('subject_does_not_exist')) {
        break;
      }
    }
  }

  throw new Error(lastError || 'File system delete failed');
}

export async function moveItem(
  sourcePath: string,
  destinationPath: string
): Promise<FileSystemItem> {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter not initialized');
  }

  const source = normalizeFSPath(sourcePath);
  const destination = normalizeFSPath(destinationPath);
  const result = await window.puter.fs.move(source, destination);
  const item = result as unknown as Record<string, unknown>;
  const isDir = Boolean(item.is_dir);

  return {
    id: (item.id as string) || (item.uid as string) || (item.path as string) || '',
    uid: item.uid as string,
    name: item.name as string,
    path: item.path as string,
    type: isDir ? 'directory' : 'file',
    is_dir: isDir,
    size: isDir ? null : ((item.size as number) ?? 0),
    modified: typeof item.modified === 'number' ? item.modified as number : undefined,
  };
}

export async function uploadFileToPath(
  file: File,
  targetPath: string
): Promise<FileSystemItem> {
  if (typeof window === 'undefined' || !window.puter) {
    throw new Error('Puter not initialized');
  }

  if (!file || !file.name) {
    throw new Error('File is required');
  }

  let normalizedTarget = targetPath ? targetPath.trim() : '';
  while (normalizedTarget.startsWith('/')) {
    normalizedTarget = normalizedTarget.substring(1);
  }
  while (normalizedTarget.endsWith('/')) {
    normalizedTarget = normalizedTarget.substring(0, normalizedTarget.length - 1);
  }

  const destinationPath = normalizeFSPath(normalizedTarget ? `${normalizedTarget}/${file.name}` : file.name);
  const result = await window.puter.fs.write(destinationPath, file);
  const item = result as unknown as Record<string, unknown>;
  const isDir = Boolean(item.is_dir);

  return {
    id: (item.id as string) || (item.uid as string) || (item.path as string) || '',
    uid: item.uid as string,
    name: item.name as string,
    path: item.path as string,
    type: isDir ? 'directory' : 'file',
    is_dir: isDir,
    size: isDir ? null : ((item.size as number) ?? 0),
    modified: typeof item.modified === 'number' ? item.modified as number : undefined,
  };
}

export function getParentPath(currentPath: string): string {
  if (!currentPath || currentPath === '' || currentPath === '.' || currentPath === './') {
    return '';
  }

  const parts = currentPath.split('/').filter((segment) => segment);
  if (parts.length <= 1) {
    return '';
  }

  parts.pop();
  return parts.join('/');
}

export function isRootPath(path: string): boolean {
  return !path || path === '' || path === '.' || path === './';
}

