
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Tag,
  Brain,
  User,
  Save,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import { FileCategory, FileStatus, FileData } from '@/lib/types';

interface ManualCategorizationProps {
  fileId?: string;
  onCategorized?: () => void;
}

interface FileWithAnalysis extends FileData {
  contentAnalysis?: {
    summary?: string;
    keywords: string[];
    confidence: number;
    aiModel?: string;
  };
}

export function ManualCategorization({ fileId, onCategorized }: ManualCategorizationProps) {
  const [files, setFiles] = useState<FileWithAnalysis[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileWithAnalysis | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>(FileCategory.UNCATEGORIZED);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FileStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | 'ALL'>('ALL');
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      let url = '/api/files?include=contentAnalysis';
      
      if (fileId) {
        // If specific file ID is provided, fetch only that file
        url = `/api/files/${fileId}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFiles(Array.isArray(data) ? data : [data]);
        
        if (fileId && data) {
          setSelectedFile(data);
          setSelectedCategory(data.category);
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch files',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fileId]);

  const handleAIAnalysis = async (file: FileWithAnalysis) => {
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/files/${file.id}/analyze`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the file with analysis results
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, contentAnalysis: result.analysis }
            : f
        ));

        if (selectedFile?.id === file.id) {
          setSelectedFile({ ...file, contentAnalysis: result.analysis });
          setSelectedCategory(result.categorization.category);
        }

        toast({
          title: 'AI Analysis Complete',
          description: `File analyzed with ${(result.categorization.confidence * 100).toFixed(1)}% confidence`,
        });
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze file with AI',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCategorize = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/files/${selectedFile.id}/categorize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: selectedCategory,
          reason: reason || 'Manual categorization by user',
        }),
      });

      if (response.ok) {
        const updatedFile = await response.json();
        
        // Update the file in the list
        setFiles(prev => prev.map(f => 
          f.id === selectedFile.id 
            ? { ...f, category: selectedCategory, isManuallySet: true }
            : f
        ));

        toast({
          title: 'Success',
          description: `File categorized as ${selectedCategory}`,
        });

        setSelectedFile(null);
        setReason('');
        onCategorized?.();
      }
    } catch (error) {
      console.error('Error categorizing file:', error);
      toast({
        title: 'Error',
        description: 'Failed to categorize file',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: FileCategory) => {
    const colors = {
      [FileCategory.OPERATIONS]: 'bg-blue-100 text-blue-800',
      [FileCategory.ESTIMATING]: 'bg-green-100 text-green-800',
      [FileCategory.ACCOUNTING]: 'bg-yellow-100 text-yellow-800',
      [FileCategory.FINANCE]: 'bg-purple-100 text-purple-800',
      [FileCategory.COMPANY_LAYOUT]: 'bg-pink-100 text-pink-800',
      [FileCategory.OFFICE]: 'bg-gray-100 text-gray-800',
      [FileCategory.UNCATEGORIZED]: 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case FileStatus.DISCOVERED:
        return <Clock className="h-4 w-4 text-gray-500" />;
      case FileStatus.CATEGORIZED:
        return <Tag className="h-4 w-4 text-blue-500" />;
      case FileStatus.ORGANIZED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case FileStatus.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCategoryName = (category: string) => {
    if (category === 'COMPANY_LAYOUT') return 'Company Layout';
    return category.charAt(0) + category.slice(1).toLowerCase();
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = searchTerm === '' || 
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.parentPath.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || file.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || file.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (fileId && selectedFile) {
    // Single file categorization mode
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Manual Categorization
          </CardTitle>
          <CardDescription>
            Manually categorize this file or use AI analysis for suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium">{selectedFile.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedFile.parentPath}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(selectedFile.status)}
                  <span className="text-sm">{selectedFile.status}</span>
                  <Badge className={getCategoryColor(selectedFile.category)}>
                    {formatCategoryName(selectedFile.category)}
                  </Badge>
                  {selectedFile.isManuallySet && (
                    <Badge variant="outline">
                      <User className="h-3 w-3 mr-1" />
                      Manual
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAIAnalysis(selectedFile)}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    AI Analysis
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* AI Analysis Results */}
          {selectedFile.contentAnalysis && (
            <div className="p-4 border rounded-lg bg-purple-50">
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4" />
                AI Analysis Results
              </h4>
              {selectedFile.contentAnalysis.summary && (
                <div className="mb-3">
                  <p className="text-sm font-medium">Summary:</p>
                  <p className="text-sm text-muted-foreground">{selectedFile.contentAnalysis.summary}</p>
                </div>
              )}
              {selectedFile.contentAnalysis.keywords.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedFile.contentAnalysis.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Confidence: {(selectedFile.contentAnalysis.confidence * 100).toFixed(1)}%
              </p>
            </div>
          )}

          {/* Categorization Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FileCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FileCategory).map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatCategoryName(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Why did you choose this category?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button onClick={handleCategorize} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Categorization
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multi-file categorization mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Manual Categorization
        </CardTitle>
        <CardDescription>
          Manually categorize files or use AI analysis for suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Files</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by filename or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FileStatus | 'ALL')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                {Object.values(FileStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category-filter">Category</Label>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as FileCategory | 'ALL')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.values(FileCategory).map((category) => (
                  <SelectItem key={category} value={category}>
                    {formatCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Files List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files found matching your criteria
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div key={file.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">{file.parentPath}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(file.status)}
                      <span className="text-sm">{file.status}</span>
                      <Badge className={getCategoryColor(file.category)}>
                        {formatCategoryName(file.category)}
                      </Badge>
                      {file.isManuallySet && (
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          Manual
                        </Badge>
                      )}
                      {file.contentAnalysis && (
                        <Badge variant="outline">
                          <Brain className="h-3 w-3 mr-1" />
                          AI Analyzed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAIAnalysis(file)}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <Sparkles className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(file);
                            setSelectedCategory(file.category);
                            setReason('');
                          }}
                        >
                          <Tag className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Categorize File</DialogTitle>
                          <DialogDescription>
                            Choose the appropriate category for "{file.name}"
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="dialog-category">Category</Label>
                            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FileCategory)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(FileCategory).map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {formatCategoryName(category)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="dialog-reason">Reason (Optional)</Label>
                            <Textarea
                              id="dialog-reason"
                              placeholder="Why did you choose this category?"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleCategorize} disabled={loading}>
                            {loading ? (
                              <>
                                <Save className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
