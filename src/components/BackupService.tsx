import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core'; 

// We still need gapi for Drive API calls, and 'google' for the web fallback.
declare const gapi: any;
declare const google: any;

export interface BackupMetadata {
  timestamp: string;
  fileId?: string;
  fileName?: string;
  version?: string;
}

export class GoogleDriveBackupService {
  private static readonly CLIENT_ID = '213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com';
  private static readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';
  
  // State for web-only fallback logic
  private static tokenClient: any; 
  private static accessToken: string | null = null;
  private static isInitialized = false;

  /** Initialize gapi client for all platforms, and auth clients based on platform */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('[BackupService] Initializing GAPI...');

    if (typeof gapi === 'undefined') {
      throw new Error('gapi not found. Add <script src="https://apis.google.com/js/api.js"></script> to index.html');
    }

    // 1. Initialize gapi client (required for all API calls)
    await new Promise<void>((resolve, reject) => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          console.log('[BackupService] GAPI client initialized successfully.');
          resolve();
        } catch (err) {
          console.error('[BackupService] Failed to initialize gapi client', err);
          reject(err);
        }
      });
    });

    // 2. Initialize GSI for Web platform ONLY
    if (!Capacitor.isNative) { // <-- CORRECTED: Capacitor.isNative
      console.log('[BackupService] Running on Web. Initializing GSI...');
      if (typeof google === 'undefined') {
         throw new Error('google identity services not found. Add <script src="https://accounts.google.com/gsi/client" async defer></script> to index.html');
      }

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.CLIENT_ID,
        scope: this.SCOPES,
        callback: (tokenResponse: any) => {
          console.log('[BackupService] Web OAuth token received (via init)');
        },
      });
      console.log('[BackupService] Web Token client initialized.');
    } else {
        // 3. Initialize Capacitor GoogleAuth for native
        console.log('[BackupService] Running on Native. Initializing Capacitor GoogleAuth...');
        // Note: Initializing the plugin here is generally recommended.
        GoogleAuth.initialize({
            clientId: this.CLIENT_ID, // Still your Web Client ID
            scopes: [this.SCOPES] 
        });
    }

    this.isInitialized = true;
  }

  /** Request access token based on platform */
  static async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    await this.initialize(); // Ensure initialization is done

    if (Capacitor.isNative) { // <-- CORRECTED: Capacitor.isNative
      // --- NATIVE (CAPACITOR) AUTHENTICATION ---
      console.log('[BackupService] Native auth flow via Capacitor GoogleAuth...');
      try {
        // Scopes can be passed again here, but are already set in initialize
        const result = await GoogleAuth.signIn(); 
        
        if (result.authentication && result.authentication.accessToken) {
          this.accessToken = result.authentication.accessToken;
          // Set the token for gapi to use it for all subsequent Drive API calls
          gapi.client.setToken({ access_token: this.accessToken });
          console.log('[BackupService] Access Token acquired from native plugin.');
          return this.accessToken;
        } else {
          throw new Error('Failed to get access token from Capacitor GoogleAuth plugin.');
        }
      } catch (e) {
        console.error('[BackupService] Native Google Sign-In failed:', e);
        throw new Error('Authentication failed in native environment.');
      }
    } else {
      // --- WEB (LOCALHOST) AUTHENTICATION ---
      console.log('[BackupService] Web auth flow via GSI token client...');
      
      if (!this.tokenClient) throw new Error('Web Token client not initialized');

      return new Promise((resolve, reject) => {
        this.tokenClient.callback = (tokenResponse: any) => {
          if (tokenResponse.error) {
             console.error('[BackupService] Web GSI error:', tokenResponse);
             reject(tokenResponse);
          } else {
            const token = tokenResponse.access_token; // <--- Extract token locally
            this.accessToken = token; // Update the global cache
            // Set the token for gapi to use it for all subsequent Drive API calls
            gapi.client.setToken({ access_token: token }); // Use the local string
            resolve(token); // <--- Resolve with the guaranteed string
          }
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    }
  }

  /** Get or create backup folder */
  private static async getOrCreateBackupFolder(): Promise<string> {
    const folderName = 'FinTrack Backups';
    console.log(`[BackupService] Checking if folder "${folderName}" exists...`);
    
    const listResp = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (listResp.result.files && listResp.result.files.length > 0) {
        console.log('[BackupService] Folder exists, ID:', listResp.result.files[0].id);
        return listResp.result.files[0].id;
    }

    console.log('[BackupService] Folder not found, creating folder...');
    const createResp = await gapi.client.drive.files.create({
        resource: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
    });

    console.log('[BackupService] Folder created with ID:', createResp.result.id);
    return createResp.result.id;
  }

  /** Upload JSON/text file to Drive */
  static async uploadFile(fileName: string, content: string): Promise<BackupMetadata> {
    console.log(`[BackupService] Uploading file "${fileName}"...`);
    await this.authenticate(); // Ensures token is set
    const parentId = await this.getOrCreateBackupFolder();

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = { name: fileName, parents: [parentId] };
    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      content +
      close_delim;

    const request = gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: multipartRequestBody,
    });

    const response = await request;
    console.log('[BackupService] File uploaded:', response.result);
    return {
      timestamp: new Date().toISOString(),
      fileId: response.result.id,
      fileName: response.result.name,
      version: '1.0',
    };
  }

  /** List JSON backups */
  static async listBackups(): Promise<BackupMetadata[]> {
    console.log('[BackupService] Listing backups...');
    await this.authenticate();
    const folderId = await this.getOrCreateBackupFolder();
    const resp = await gapi.client.drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc',
    });
    console.log('[BackupService] Found files:', resp.result.files);
    return (resp.result.files || []).map((f: any) => ({
      timestamp: f.createdTime,
      fileId: f.id,
      fileName: f.name,
      version: '1.0',
    }));
  }

  /** Download backup content by fileId */
  static async downloadFile(fileId: string): Promise<string> {
    console.log('[BackupService] Downloading file ID:', fileId);
    await this.authenticate();
    const resp = await gapi.client.drive.files.get({ fileId, alt: 'media' });
    console.log('[BackupService] File content retrieved.');
    return resp.body || JSON.stringify(resp.result) || '';
  }
}
// // GoogleDriveBackupService.ts
// import { gapi } from 'gapi-script';
// import{ GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
// import { Capacitor } from '@capacitor/core';

// export interface FileMeta {
//   id?: string;
//   name: string;
//   mimeType?: string;
//   timestamp?: string;
// }

// export class GoogleDriveBackupService {
//   private static accessToken: string | null = null;

//   // Authenticate and get access token
// static async authenticate(): Promise<string> {
//   if (Capacitor.isNativePlatform()) {
//     const user = await GoogleAuth.signIn({
//       scopes: 'https://www.googleapis.com/auth/drive.file',
//     });
//     this.accessToken = user.authentication.accessToken;
//     console.log('[BackupService] Native token received');
//   } else {
//     // Web auth (GAPI)
//     if (!gapi.client.getToken()) {
//       await new Promise<void>((resolve, reject) => {
//         gapi.load('client:auth2', async () => {
//           try {
//             await gapi.client.init({
//               clientId: '213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com',
//               discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
//               scope: 'https://www.googleapis.com/auth/drive.file',
//             });
//             const authInstance = gapi.auth2.getAuthInstance();
//             if (!authInstance.isSignedIn.get()) await authInstance.signIn();
//             const googleUser = authInstance.currentUser.get();
//             this.accessToken = googleUser.getAuthResponse().access_token;
//             gapi.client.setToken({ access_token: this.accessToken });
//             resolve();
//           } catch (err) {
//             console.error('[BackupService] GAPI auth failed', err);
//             reject(err);
//           }
//         });
//       });
//     } else {
//       this.accessToken = gapi.client.getToken().access_token;
//     }
//   }

//   return this.accessToken!;
// }


//   // Upload a file to Google Drive
//   static async uploadFile(fileName: string, content: string): Promise<FileMeta> {
//     if (!this.accessToken) {
//       await this.authenticate();
//     }

//     const boundary = '-------314159265358979323846';
//     const metadata = { name: fileName, mimeType: 'application/json' };
//     const body =
//       `\r\n--${boundary}\r\n` +
//       'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
//       JSON.stringify(metadata) +
//       `\r\n--${boundary}\r\n` +
//       'Content-Type: application/json\r\n\r\n' +
//       content +
//       `\r\n--${boundary}--`;

//     const res = await fetch(
//       'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${this.accessToken}`,
//           'Content-Type': `multipart/related; boundary=${boundary}`,
//         },
//         body,
//       }
//     );

//     const result = await res.json();
//     console.log('[BackupService] File uploaded', result);

//     return {
//       id: result.id,
//       name: result.name,
//       timestamp: new Date().toISOString(),
//     };
//   }
// }
