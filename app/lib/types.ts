
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
  MARKETING = 'MARKETING',
  OFFICE = 'OFFICE',
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
  lastScanDate?: Date;
}
