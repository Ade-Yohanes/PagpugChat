'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Folder, File, Trash2, Upload, Plus, ChevronUp, RotateCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { FileSystemItem } from '@/lib/puter-fs-types';
import { listDirectory, createFolder, deleteItem, getParentPath, uploadFileToPath } from '@/lib/puter-fs';

interface FileSystemBrowserProps {
  user: { username?: string; id?: string; uid?: string } | null;
  isAuthChecking?: boolean;
}

type ModalType = 'createFolder' | 'upload' | 'deleteConfirm' | null;

export default function FileSystemBrowser({ user, isAuthChecking = false }: FileSystemBrowserProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [folderName, setFolderName] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<FileSystemItem | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const directoryItems = await listDirectory(path);
      setItems(directoryItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.username || user.uid)) {
      loadDirectory(currentPath);
    }
  }, [user, currentPath, loadDirectory]);

  useEffect(() => {
    if (success) {
      const timer = window.setTimeout(() => setSuccess(null), 3000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = window.setTimeout(() => setError(null), 5000);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createFolder(currentPath, folderName);
      setSuccess(`Folder "${folderName}" created successfully`);
      setFolderName('');
      setOpenModal(null);
      await loadDirectory(currentPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    setLoading(true);
    setError(null);

    try {
      console.log('[FileSystemBrowser] Deleting item:', selectedItem.name, 'path:', selectedItem.path, 'type:', selectedItem.type);

      const rawPath = selectedItem.path?.trim() || selectedItem.name.trim();
      let pathToDelete = rawPath;

      if (
        currentPath &&
        !rawPath.startsWith('./') &&
        !rawPath.startsWith('/') &&
        !rawPath.startsWith(`${currentPath}/`) &&
        rawPath !== currentPath
      ) {
        pathToDelete = `${currentPath}/${rawPath}`;
      }

      console.log('[FileSystemBrowser] Path for deletion:', pathToDelete, '(raw:', rawPath, ', currentPath:', currentPath, ')');

      await deleteItem(pathToDelete, { recursive: selectedItem.is_dir }, currentPath);
      setSuccess(`"${selectedItem.name}" deleted successfully`);
      setSelectedItem(null);
      setOpenModal(null);
      await loadDirectory(currentPath);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : err && typeof err === 'object'
          ? JSON.stringify(err, Object.getOwnPropertyNames(err))
          : String(err);
      console.error('[FileSystemBrowser] Delete error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const file = files[0];
      await uploadFileToPath(file, currentPath);
      setSuccess(`File "${file.name}" uploaded successfully`);
      setOpenModal(null);
      await loadDirectory(currentPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToFolder = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      const newPath = item.path?.startsWith('/') ? item.path.slice(1) : item.path || '';
      setCurrentPath(newPath);
    }
  };

  const handleGoUp = () => {
    if (!currentPath) return;
    setCurrentPath(getParentPath(currentPath));
  };

  const handleRefresh = () => {
    loadDirectory(currentPath);
  };

  const breadcrumbs = currentPath === '' ? ['Root'] : ['Root', ...currentPath.split('/').filter(Boolean)];

  return (
    <div className="flex flex-col h-full gap-4 p-6 bg-background">
      {isAuthChecking && (
        <Alert className="border-blue-200 bg-blue-50 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Checking authentication...</AlertDescription>
        </Alert>
      )}

      {!isAuthChecking && !user && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to access the file system. Please log in first.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">File System</h1>
        <Button variant="ghost" size="sm" disabled={!user}>
          Welcome, {user?.username || 'Not logged in'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border">
        <div className="flex items-center gap-2">
          <span>Path:</span>
          <strong>{currentPath || '(root)'}</strong>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <Button
                variant="ghost"
                size="sm"
                className="px-2"
                onClick={() => {
                  if (index === 0) {
                    setCurrentPath('');
                  } else {
                    const pathSegments = breadcrumbs.slice(1, index + 1);
                    setCurrentPath(pathSegments.join('/'));
                  }
                }}
              >
                {crumb === 'Root' ? 'Root' : crumb}
              </Button>
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => setOpenModal('createFolder')} disabled={loading} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
        <Button onClick={() => setOpenModal('upload')} disabled={loading} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        {currentPath && (
          <Button onClick={handleGoUp} disabled={loading} variant="outline" title="Go to parent folder">
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
        <Button onClick={handleRefresh} disabled={loading} variant="outline" title="Refresh">
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (!Array.isArray(items) || items.length === 0) ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">This folder is empty</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.uid || item.id}-${item.path}`} className="hover:bg-muted/50">
                    <TableCell>
                      {item.is_dir ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-gray-500" />}
                    </TableCell>
                    <TableCell className="font-medium cursor-pointer hover:underline truncate" onClick={() => handleNavigateToFolder(item)} title={item.name}>
                      {item.name}
                    </TableCell>
                    <TableCell>{item.type === 'directory' ? 'Folder' : 'File'}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setOpenModal('deleteConfirm'); }} disabled={loading} title="Delete" className="h-8 w-8 p-0">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </Card>

      <Dialog open={openModal === 'createFolder'} onOpenChange={(open) => { if (!open) setOpenModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter the name for the new folder in {currentPath || 'root'}</DialogDescription>
          </DialogHeader>
          <Input placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); }} disabled={loading} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)} disabled={loading}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openModal === 'upload'} onOpenChange={(open) => { if (!open) setOpenModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>Select a file to upload to {currentPath || 'root'}</DialogDescription>
          </DialogHeader>
          <Input type="file" onChange={handleUploadFile} disabled={loading} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(null)} disabled={loading}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openModal === 'deleteConfirm'} onOpenChange={(open) => { if (!open) { setOpenModal(null); setSelectedItem(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{selectedItem?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the selected item from your file system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteItem} disabled={loading} className="bg-red-600 hover:bg-red-700">{loading ? 'Deleting...' : 'Delete'}</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
