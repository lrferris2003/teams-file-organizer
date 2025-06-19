
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { MicrosoftTeam, MicrosoftChannel, MicrosoftGraphFile } from './types';
import 'isomorphic-fetch';

class GraphAuthProvider implements AuthenticationProvider {
  private msalInstance: ConfidentialClientApplication;

  constructor() {
    // Check if we have the required environment variables
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Missing Azure credentials. Please check your environment variables.');
    }

    this.msalInstance = new ConfidentialClientApplication({
      auth: {
        clientId,
        clientSecret,
        authority: `https://login.microsoftonline.com/${tenantId}`,
      },
    });
  }

  async getAccessToken(): Promise<string> {
    try {
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.msalInstance.acquireTokenByClientCredential(clientCredentialRequest);
      return response?.accessToken || '';
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw new Error('Failed to acquire access token');
    }
  }
}

export class MicrosoftGraphService {
  private graphClient: Client | null = null;
  private authProvider: GraphAuthProvider | null = null;
  private initError: string | null = null;

  constructor() {
    try {
      this.authProvider = new GraphAuthProvider();
      this.graphClient = Client.initWithMiddleware({
        authProvider: this.authProvider,
      });
    } catch (error) {
      this.initError = error instanceof Error ? error.message : 'Failed to initialize Microsoft Graph service';
      console.warn('Microsoft Graph service initialization failed:', this.initError);
    }
  }

  private checkInitialization() {
    if (!this.graphClient || !this.authProvider) {
      throw new Error(this.initError || 'Microsoft Graph service not properly initialized');
    }
  }

  async getTeams(): Promise<MicrosoftTeam[]> {
    try {
      this.checkInitialization();
      const response = await this.graphClient!
        .api('/groups')
        .filter("resourceProvisioningOptions/Any(x:x eq 'Team')")
        .select('id,displayName,description,webUrl')
        .get();

      return response.value || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw new Error('Failed to fetch teams');
    }
  }

  async getChannels(teamId: string): Promise<MicrosoftChannel[]> {
    try {
      this.checkInitialization();
      const response = await this.graphClient!
        .api(`/teams/${teamId}/channels`)
        .select('id,displayName,description,webUrl')
        .get();

      return response.value || [];
    } catch (error) {
      console.error(`Error fetching channels for team ${teamId}:`, error);
      throw new Error(`Failed to fetch channels for team ${teamId}`);
    }
  }

  async getChannelFiles(teamId: string, channelId: string): Promise<MicrosoftGraphFile[]> {
    try {
      this.checkInitialization();
      // Get the drive associated with the channel
      const driveResponse = await this.graphClient!
        .api(`/teams/${teamId}/channels/${channelId}/filesFolder`)
        .get();

      if (!driveResponse.parentReference?.driveId) {
        return [];
      }

      const driveId = driveResponse.parentReference.driveId;
      const folderId = driveResponse.id;

      // Recursively get all files in the channel's folder
      return await this.getFilesRecursively(driveId, folderId);
    } catch (error) {
      console.error(`Error fetching files for channel ${channelId}:`, error);
      return [];
    }
  }

  private async getFilesRecursively(driveId: string, folderId: string, path: string = ''): Promise<MicrosoftGraphFile[]> {
    try {
      this.checkInitialization();
      const response = await this.graphClient!
        .api(`/drives/${driveId}/items/${folderId}/children`)
        .select('id,name,size,webUrl,file,folder,lastModifiedDateTime,parentReference')
        .get();

      const items = response.value || [];
      const files: MicrosoftGraphFile[] = [];

      for (const item of items) {
        const currentPath = path ? `${path}/${item.name}` : item.name;

        if (item.file) {
          // It's a file
          files.push({
            id: item.id,
            name: item.name,
            size: item.size || 0,
            webUrl: item.webUrl,
            downloadUrl: item['@microsoft.graph.downloadUrl'],
            file: {
              mimeType: item.file.mimeType || 'application/octet-stream',
            },
            lastModifiedDateTime: item.lastModifiedDateTime,
            parentReference: {
              path: currentPath,
            },
          });
        } else if (item.folder) {
          // It's a folder, recurse into it
          const subFiles = await this.getFilesRecursively(driveId, item.id, currentPath);
          files.push(...subFiles);
        }
      }

      return files;
    } catch (error) {
      console.error(`Error fetching files from folder ${folderId}:`, error);
      return [];
    }
  }

  async createFolder(driveId: string, parentFolderId: string, folderName: string): Promise<string> {
    try {
      this.checkInitialization();
      const response = await this.graphClient!
        .api(`/drives/${driveId}/items/${parentFolderId}/children`)
        .post({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });

      return response.id;
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error);
      throw new Error(`Failed to create folder ${folderName}`);
    }
  }

  async copyFile(driveId: string, fileId: string, targetFolderId: string, newName?: string): Promise<void> {
    try {
      this.checkInitialization();
      await this.graphClient!
        .api(`/drives/${driveId}/items/${fileId}/copy`)
        .post({
          parentReference: {
            driveId: driveId,
            id: targetFolderId,
          },
          name: newName,
        });
    } catch (error) {
      console.error(`Error copying file ${fileId}:`, error);
      throw new Error(`Failed to copy file ${fileId}`);
    }
  }

  async getTeamDrive(teamId: string): Promise<{ driveId: string; rootFolderId: string }> {
    try {
      this.checkInitialization();
      const response = await this.graphClient!
        .api(`/groups/${teamId}/drive`)
        .select('id')
        .get();

      const rootResponse = await this.graphClient!
        .api(`/drives/${response.id}/root`)
        .select('id')
        .get();

      return {
        driveId: response.id,
        rootFolderId: rootResponse.id,
      };
    } catch (error) {
      console.error(`Error getting drive for team ${teamId}:`, error);
      throw new Error(`Failed to get drive for team ${teamId}`);
    }
  }
}

export const graphService = new MicrosoftGraphService();
