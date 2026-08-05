import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App (reuse if already initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Drive full access scope as requested by user
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Listener for auth state changes
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User logged in via Firebase session but access token not cached yet
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google Popup and obtain Drive access token
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get Google access token from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current cached access token
 */
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Sign out user and clear token memory
 */
export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List files from Google Drive
 */
export const listDriveFiles = async (
  token: string,
  query: string = "trashed = false"
): Promise<DriveFile[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Find or create a specific folder in Google Drive
 */
export const getOrCreateDriveFolder = async (
  token: string,
  folderName: string = "PharmaForm AI Reports"
): Promise<string> => {
  // Query for existing folder
  const query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const existingFiles = await listDriveFiles(token, query);

  if (existingFiles.length > 0) {
    return existingFiles[0].id;
  }

  // Create folder
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    throw new Error('Failed to create PharmaForm AI folder in Google Drive.');
  }

  const folder = await res.json();
  return folder.id;
};

/**
 * Upload file to Google Drive using multipart upload
 */
export const uploadFileToDrive = async (
  token: string,
  fileName: string,
  mimeType: string,
  content: Blob | string,
  parentFolderId?: string
): Promise<DriveFile> => {
  const metadata: any = {
    name: fileName,
    mimeType
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let body: Blob;

  if (content instanceof Blob) {
    const metadataPart = new Blob([
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n${delimiter}Content-Type: ${mimeType}\r\n\r\n`
    ], { type: 'text/plain' });

    const endPart = new Blob([closeDelimiter], { type: 'text/plain' });
    body = new Blob([metadataPart, content, endPart]);
  } else {
    const multipartRequestBody =
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `${delimiter}Content-Type: ${mimeType}\r\n\r\n${content}` +
      closeDelimiter;
    body = new Blob([multipartRequestBody], { type: 'text/plain' });
  }

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload to Drive failed (${res.status}): ${errText}`);
  }

  return await res.json();
};

/**
 * Download / Read text content of a Drive file
 */
export const readDriveFileContent = async (
  token: string,
  fileId: string
): Promise<string> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`Failed to read file from Drive (${res.status})`);
  }

  return await res.text();
};

/**
 * Delete a file from Google Drive
 */
export const deleteDriveFile = async (
  token: string,
  fileId: string
): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete file from Drive (${res.status})`);
  }
};
