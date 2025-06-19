
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  ExternalLink, 
  FolderOpen,
  Calendar,
  HardDrive,
  Tag,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { FileCategory, FileStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface FileData {
  id: string;
  fileId: string;
  name: string;
  size: string;
  mimeType: string;
  extension?: string;
  webUrl: string;
  parentPath: string;
  category: FileCategory;
  confidence: number;
  isManuallySet: boolean;
  status: FileStatus;
  organizedPath?: string;
  organizedAt?: string;
  modifiedAt: string;
  team?: { displayName: string; teamId: string };
  channel?: { displayName: string; channelId: string };
}

interface FileBrowserProps {
  onFilesSelected?: (fileIds: string[]) => void;
}

export function FileBrowser({ onFilesSelected }: FileBrowserProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/files?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPage, categoryFilter, statusFilter, searchTerm]);

  useEffect(() => {
    onFilesSelected?.(Array.from(selectedFiles));
  }, [selectedFiles, onFilesSelected]);

  const handleFileSelect = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(files.map(f => f.id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleCategoryChange = async (fileId: string, newCategory: FileCategory) => {
    try {
      const response = await fetch(`/api/files/${fileId}/categorize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });

      if (response.ok) {
        toast({
          title: "Category Updated",
          description: "File category has been updated successfully",
        });
        fetchFiles(); // Refresh the list
      } else {
        throw new Error('Failed to update category');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update file category",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (sizeStr: string) => {
    const size = parseInt(sizeStr);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getCategoryColor = (category: FileCategory) => {
    const colors = {
      [FileCategory.OPERATIONS]: 'bg-blue-100 text-blue-800',
      [FileCategory.ESTIMATING]: 'bg-green-100 text-green-800',
      [FileCategory.ACCOUNTING]: 'bg-yellow-100 text-yellow-800',
      [FileCategory.FINANCE]: 'bg-purple-100 text-purple-800',
      [FileCategory.MARKETING]: 'bg-pink-100 text-pink-800',
      [FileCategory.OFFICE]: 'bg-gray-100 text-gray-800',
      [FileCategory.UNCATEGORIZED]: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.ORGANIZED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case FileStatus.CATEGORIZED:
        return <Tag className="h-4 w-4 text-blue-500" />;
      case FileStatus.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          File Browser
        </CardTitle>
        <CardDescription>
          Browse, search, and manage discovered files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(FileCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(FileStatus).map(status => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selection Controls */}
        {files.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedFiles.size === files.length && files.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({selectedFiles.size} selected)
              </span>
            </div>
          </div>
        )}

        {/* File List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files found</p>
            <p className="text-sm">Try adjusting your filters or run a new scan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedFiles.has(file.id)}
                  onCheckedChange={(checked) => handleFileSelect(file.id, checked as boolean)}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">{file.name}</span>
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(file.size)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(file.modifiedAt).toLocaleDateString()}
                    </span>
                    {file.team && (
                      <span className="truncate">
                        {file.team.displayName}
                        {file.channel && ` / ${file.channel.displayName}`}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {file.parentPath}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={file.category}
                    onValueChange={(value) => handleCategoryChange(file.id, value as FileCategory)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(FileCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0) + category.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Badge className={getCategoryColor(file.category)}>
                    {file.confidence > 0 && (
                      <span className="mr-1">{Math.round(file.confidence * 100)}%</span>
                    )}
                    {file.isManuallySet && '✓'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.webUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
