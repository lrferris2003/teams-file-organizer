
export interface TeamData {
  id: string;
  teamId: string;
  displayName: string;
  description?: string;
  webUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelData {
  id: string;
  channelId: string;
  displayName: string;
  description?: string;
  webUrl?: string;
  teamId: string;
}

export interface FileData {
  id: string;
  fileId: string;
  name: string;
  size: bigint;
  mimeType: string;
  extension?: string;
  webUrl: string;
  downloadUrl?: string;
  parentPath: string;
  relativePath: string;
  category: FileCategory;
  confidence: number;
  isManuallySet: boolean;
  status: FileStatus;
  organizedPath?: string;
  organizedAt?: Date;
  createdAt: Date;
  modifiedAt: Date;
  lastScannedAt: Date;
  teamId?: string;
  channelId?: string;
}

export enum FileCategory {
  OPERATIONS = 'OPERATIONS',
  ESTIMATING = 'ESTIMATING',
  ACCOUNTING = 'ACCOUNTING',
  FINANCE = 'FINANCE',
  OFFICE = 'OFFICE',
  COMPANY_LAYOUT = 'COMPANY_LAYOUT',
  UNCATEGORIZED = 'UNCATEGORIZED'
}

export enum FileStatus {
  DISCOVERED = 'DISCOVERED',
  CATEGORIZED = 'CATEGORIZED',
  ORGANIZED = 'ORGANIZED',
  ERROR = 'ERROR'
}

export interface ScanProgress {
  sessionId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  filesFound: number;
  filesProcessed: number;
  currentTeam?: string;
  currentChannel?: string;
  errors?: string[];
}

export interface GraphAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export interface MicrosoftGraphFile {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  downloadUrl?: string;
  file?: {
    mimeType: string;
  };
  lastModifiedDateTime: string;
  parentReference: {
    path: string;
  };
}

export interface MicrosoftTeam {
  id: string;
  displayName: string;
  description?: string;
  webUrl?: string;
}

export interface MicrosoftChannel {
  id: string;
  displayName: string;
  description?: string;
  webUrl?: string;
}

export interface CategorizationResult {
  category: FileCategory;
  confidence: number;
  reason: string;
}

export interface OrganizationStats {
  totalFiles: number;
  categorizedFiles: number;
  organizedFiles: number;
  filesByCategory: Record<FileCategory, number>;
  filesByDepartment: Record<Department, number>;
  lastScanDate?: Date;
  aiAnalyzedFiles: number;
  manualCategorizations: number;
}

// New Enhanced Types
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  VIEWER = 'VIEWER'
}

export enum Department {
  OPERATIONS = 'OPERATIONS',
  ESTIMATING = 'ESTIMATING',
  ACCOUNTING = 'ACCOUNTING',
  FINANCE = 'FINANCE',
  OFFICE = 'OFFICE',
  COMPANY_LAYOUT = 'COMPANY_LAYOUT',
  ALL_DEPARTMENTS = 'ALL_DEPARTMENTS'
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: Department;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileContentAnalysis {
  id: string;
  fileId: string;
  extractedText?: string;
  summary?: string;
  keywords: string[];
  entities?: any;
  contentType?: string;
  language?: string;
  confidence: number;
  aiModel?: string;
  analyzedAt: Date;
}

export interface DepartmentKeyword {
  id: string;
  keyword: string;
  department: Department;
  weight: number;
  isActive: boolean;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManualCategorization {
  id: string;
  fileId: string;
  userId: string;
  oldCategory?: FileCategory;
  newCategory: FileCategory;
  reason?: string;
  confidence: number;
  createdAt: Date;
}

export interface FileAction {
  id: string;
  fileId: string;
  userId: string;
  action: string;
  metadata?: any;
  createdAt: Date;
}

export interface ContentAnalysisJob {
  id: string;
  fileId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  jobType: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export interface AICategorizationResult {
  category: FileCategory;
  confidence: number;
  reason: string;
  keywords: string[];
  summary?: string;
  entities?: any[];
}

export interface DepartmentAnalytics {
  department: Department;
  totalFiles: number;
  categorizedFiles: number;
  recentActivity: number;
  topKeywords: string[];
  categoryDistribution: Record<FileCategory, number>;
}
