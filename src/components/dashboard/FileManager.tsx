
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Folder, File, Upload, Plus, Settings, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FileManager = () => {
  const [currentPath, setCurrentPath] = useState('/var/www/html');
  const [files, setFiles] = useState([
    { name: 'index.html', type: 'file', size: '2.4 KB', modified: '2024-01-15 10:30' },
    { name: 'css', type: 'folder', size: '-', modified: '2024-01-15 09:15' },
    { name: 'js', type: 'folder', size: '-', modified: '2024-01-15 09:15' },
    { name: 'images', type: 'folder', size: '-', modified: '2024-01-14 16:20' },
    { name: 'config.php', type: 'file', size: '1.8 KB', modified: '2024-01-15 14:45' },
  ]);

  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const { toast } = useToast();

  const handleFileClick = (fileName: string, type: string) => {
    if (type === 'folder') {
      setCurrentPath(`${currentPath}/${fileName}`);
    } else {
      setSelectedFile(fileName);
      // Simulate loading file content
      setFileContent(`// Content of ${fileName}\n// This is a sample file content`);
    }
  };

  const handleSaveFile = () => {
    toast({
      title: "File Saved",
      description: `${selectedFile} has been saved successfully`
    });
  };

  const handleDeleteFile = (fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
    toast({
      title: "File Deleted",
      description: `${fileName} has been deleted`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">File Manager</h2>
          <p className="text-gray-600">Browse and manage your server files</p>
        </div>
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New File
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Create New File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">File Name</Label>
                  <Input id="filename" placeholder="index.html" />
                </div>
                <Button className="w-full">Create File</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Navigation Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Path:</span>
            <Input value={currentPath} onChange={(e) => setCurrentPath(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Folder className="mr-2 h-5 w-5" />
              Files & Folders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleFileClick(file.name, file.type)}
                >
                  <div className="flex items-center space-x-3">
                    {file.type === 'folder' ? (
                      <Folder className="h-5 w-5 text-blue-600" />
                    ) : (
                      <File className="h-5 w-5 text-gray-600" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{file.modified}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{file.size}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Editor */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <File className="mr-2 h-5 w-5" />
                {selectedFile || 'Select a file to edit'}
              </CardTitle>
              {selectedFile && (
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button size="sm" onClick={handleSaveFile}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedFile ? (
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="File content will appear here..."
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-gray-500">
                Select a file from the list to view or edit its content
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>File Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <p className="font-medium">Owner</p>
              <p className="text-sm text-gray-600">Read, Write, Execute</p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="font-medium">Group</p>
              <p className="text-sm text-gray-600">Read, Execute</p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="font-medium">Others</p>
              <p className="text-sm text-gray-600">Read</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
