export interface FileSystemItem {
  id: string;
  uid?: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  is_dir: boolean;
  size: number | null;
  modified?: number;
}

export interface DirectoryContents {
  path: string;
  items: FileSystemItem[];
  totalSize: number;
  itemCount: number;
}

export interface FSOperationError {
  code: string;
  message: string;
  path?: string;
}

export interface CreateFolderOptions {
  dedupeName?: boolean;
  createMissingParents?: boolean;
  overwrite?: boolean;
}

export interface DeleteOptions {
  recursive?: boolean;
  descendantsOnly?: boolean;
}

export interface MoveOptions {
  overwrite?: boolean;
  dedupeName?: boolean;
  createMissingParents?: boolean;
}
