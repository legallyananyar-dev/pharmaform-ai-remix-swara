import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  FileText, 
  Folder, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  LogOut, 
  FileSpreadsheet,
  FolderOpen,
  Info
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  getAccessToken, 
  listDriveFiles, 
  getOrCreateDriveFolder, 
  uploadFileToDrive, 
  readDriveFileContent, 
  deleteDriveFile, 
  DriveFile 
} from '../utils/googleDrive';
import { CompatibilityPrediction } from '../types';
import { generatePDFBlob } from '../utils/pdfExporter';

interface GoogleDriveManagerProps {
  history: CompatibilityPrediction[];
  onRestoreHistory?: (restoredHistory: CompatibilityPrediction[]) => void;
  currentPrediction?: CompatibilityPrediction | null;
  isDarkMode: boolean;
}

export const GoogleDriveManager: React.FC<GoogleDriveManagerProps> = ({
  history,
  onRestoreHistory,
  currentPrediction,
  isDarkMode
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [pharmaFolderId, setPharmaFolderId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal for destructive confirmation (Delete Drive file)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        loadDriveContent(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const showNotify = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        showNotify('success', `Signed in as ${res.user.email}. Google Drive connected.`);
        await loadDriveContent(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      showNotify('error', err.message || 'Failed to sign in with Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await googleSignOut();
      setUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      showNotify('info', 'Signed out of Google Drive.');
    } catch (err: any) {
      showNotify('error', 'Error signing out.');
    }
  };

  const loadDriveContent = async (token: string) => {
    setIsSyncing(true);
    try {
      // Get or create PharmaForm AI Reports folder
      const folderId = await getOrCreateDriveFolder(token, 'PharmaForm AI Reports');
      setPharmaFolderId(folderId);

      // List files inside that folder or with PharmaForm in name
      const query = `'${folderId}' in parents and trashed = false`;
      const files = await listDriveFiles(token, query);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      showNotify('error', `Drive sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Upload current single PDF report to Drive
  const handleUploadCurrentPDF = async () => {
    if (!currentPrediction) {
      showNotify('info', 'No active prediction report to upload.');
      return;
    }
    if (!accessToken) {
      showNotify('error', 'Please sign in to Google Drive first.');
      return;
    }

    setIsSyncing(true);
    try {
      const pdfBlob = generatePDFBlob(currentPrediction);
      const folderId = pharmaFolderId || (await getOrCreateDriveFolder(accessToken, 'PharmaForm AI Reports'));
      const filename = `PharmaForm_${currentPrediction.drug.name.replace(/\s+/g, '_')}_${currentPrediction.excipient.name.replace(/\s+/g, '_')}_${currentPrediction.id.slice(0,6)}.pdf`;

      const uploaded = await uploadFileToDrive(accessToken, filename, 'application/pdf', pdfBlob, folderId);
      showNotify('success', `Successfully saved report "${uploaded.name}" to Google Drive!`);
      await loadDriveContent(accessToken);
    } catch (err: any) {
      console.error(err);
      showNotify('error', `Failed to upload PDF report: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Upload CSV History to Drive
  const handleUploadCSVHistory = async () => {
    if (history.length === 0) {
      showNotify('info', 'No prediction history to export.');
      return;
    }
    if (!accessToken) {
      showNotify('error', 'Please sign in to Google Drive first.');
      return;
    }

    setIsSyncing(true);
    try {
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : `"${str}"`;
      };

      const headers = [
        'Report ID', 'Timestamp', 'Drug Name', 'Drug SMILES', 'Therapeutic Category',
        'Excipient Name', 'Excipient Category', 'Status', 'Confidence Score (%)',
        'Compatibility Coeff', 'Delta LogP', 'Delta MW', 'Delta TPSA',
        'Maillard Risk', 'Metal Chelation Risk', 'SHAP Summary', 'Recommendation'
      ];

      const rows = history.map(item => [
        item.id,
        new Date(item.timestamp).toISOString(),
        item.drug.name,
        item.drug.smiles,
        item.drug.therapeuticCategory || 'N/A',
        item.excipient.name,
        item.excipient.category || 'N/A',
        item.status,
        item.confidenceScore,
        item.features?.compatibilityCoeff ?? '',
        item.features?.diffLogP ?? '',
        item.features?.diffMW ?? '',
        item.features?.diffTPSA ?? '',
        item.features?.maillardReactionRisk ? 'YES' : 'NO',
        item.features?.metalChelationRisk ? 'YES' : 'NO',
        item.shapExplanationSummary || '',
        item.recommendation || ''
      ]);

      const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows.map(r => r.map(escapeCSV).join(','))].join('\r\n');
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const folderId = pharmaFolderId || (await getOrCreateDriveFolder(accessToken, 'PharmaForm AI Reports'));
      const timestampStr = new Date().toISOString().slice(0, 10);
      const filename = `PharmaForm_History_Export_${timestampStr}.csv`;

      const uploaded = await uploadFileToDrive(accessToken, filename, 'text/csv', csvBlob, folderId);
      showNotify('success', `Saved history CSV (${history.length} records) to Google Drive!`);
      await loadDriveContent(accessToken);
    } catch (err: any) {
      console.error(err);
      showNotify('error', `CSV Drive upload failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Full Backup JSON to Drive
  const handleBackupToDrive = async () => {
    if (!accessToken) {
      showNotify('error', 'Please sign in to Google Drive first.');
      return;
    }
    setIsSyncing(true);
    try {
      const backupData = JSON.stringify({
        app: 'PharmaForm AI',
        version: '2.4',
        timestamp: new Date().toISOString(),
        recordCount: history.length,
        history
      }, null, 2);

      const folderId = pharmaFolderId || (await getOrCreateDriveFolder(accessToken, 'PharmaForm AI Reports'));
      const timestampStr = new Date().toISOString().slice(0, 10);
      const filename = `pharmaform_backup_${timestampStr}.json`;

      const uploaded = await uploadFileToDrive(accessToken, filename, 'application/json', backupData, folderId);
      showNotify('success', `Backed up history (${history.length} items) to "${uploaded.name}" on Drive.`);
      await loadDriveContent(accessToken);
    } catch (err: any) {
      showNotify('error', `Backup failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Restore JSON Backup from Drive
  const handleRestoreFileFromDrive = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsSyncing(true);
    try {
      const content = await readDriveFileContent(accessToken, file.id);
      const parsed = JSON.parse(content);
      if (parsed.history && Array.isArray(parsed.history) && onRestoreHistory) {
        onRestoreHistory(parsed.history);
        showNotify('success', `Successfully restored ${parsed.history.length} records from Google Drive backup!`);
      } else {
        showNotify('error', 'Selected JSON file is not a valid PharmaForm AI backup.');
      }
    } catch (err: any) {
      showNotify('error', `Failed to restore file: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Confirm delete file from Drive (DESTRUCTIVE OPERATION MANDATE)
  const confirmDeleteFile = async () => {
    if (!fileToDelete || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, fileToDelete.id);
      showNotify('success', `Deleted "${fileToDelete.name}" from Google Drive.`);
      setFileToDelete(null);
      await loadDriveContent(accessToken);
    } catch (err: any) {
      showNotify('error', `Failed to delete file from Drive: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDarkMode 
        ? 'bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl shadow-cyan-950/20' 
        : 'bg-white border-slate-200 text-slate-800 shadow-lg shadow-slate-200/50'
    }`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cloud className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold tracking-tight">Google Drive Integration</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Workspace Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sync analytical certificates, batch CSVs, and backup reports directly to your Google Drive
            </p>
          </div>
        </div>

        {/* Auth Button */}
        <div>
          {user ? (
            <div className="flex items-center space-x-3 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full border border-cyan-500/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold leading-tight text-slate-200">{user.displayName || 'Google Account'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out of Google Drive"
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-cyan-500/50 transition-all flex items-center space-x-2.5 shadow-md shadow-slate-950/40"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`mt-4 p-3 rounded-xl border flex items-center space-x-2.5 text-xs font-medium animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : notification.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {notification.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notification.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {!user ? (
        <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Connect Google Drive</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Sign in with your Google account to enable automatic PDF report uploads, cloud backup of prediction history, and Google Drive file imports.
          </p>
          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="mt-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-lg shadow-cyan-600/20 transition-all flex items-center space-x-2"
          >
            <CloudUpload className="w-4 h-4" />
            <span>Connect Drive Account</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          
          {/* Action Quick Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Action 1: Save Active PDF */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Export Active PDF Report</h4>
                  <p className="text-[11px] text-slate-400">Save current certificate to Drive</p>
                </div>
              </div>
              <button
                onClick={handleUploadCurrentPDF}
                disabled={isSyncing || !currentPrediction}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Save Report to Drive</span>
              </button>
            </div>

            {/* Action 2: Save History CSV */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Sync History CSV</h4>
                  <p className="text-[11px] text-slate-400">Upload all {history.length} records to Drive</p>
                </div>
              </div>
              <button
                onClick={handleUploadCSVHistory}
                disabled={isSyncing || history.length === 0}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Upload CSV to Drive</span>
              </button>
            </div>

            {/* Action 3: Cloud Backup */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Full Cloud Backup</h4>
                  <p className="text-[11px] text-slate-400">Save complete JSON snapshot</p>
                </div>
              </div>
              <button
                onClick={handleBackupToDrive}
                disabled={isSyncing}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 disabled:opacity-40 transition-colors flex items-center justify-center space-x-1.5"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Create Drive Backup</span>
              </button>
            </div>

          </div>

          {/* Drive Files Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  "PharmaForm AI Reports" Folder in Google Drive
                </h3>
              </div>
              <button
                onClick={() => accessToken && loadDriveContent(accessToken)}
                disabled={isSyncing}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Refresh Google Drive files"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </div>

            {driveFiles.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No files saved in your PharmaForm AI Google Drive folder yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Use the upload buttons above to save your first PDF report or CSV export.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Last Modified</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {driveFiles.map((file) => {
                      const isPDF = file.mimeType.includes('pdf');
                      const isCSV = file.name.endsWith('.csv');
                      const isJSON = file.name.endsWith('.json');

                      return (
                        <tr key={file.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium flex items-center space-x-2">
                            {isPDF && <FileText className="w-4 h-4 text-sky-400 shrink-0" />}
                            {isCSV && <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {isJSON && <Cloud className="w-4 h-4 text-amber-400 shrink-0" />}
                            {!isPDF && !isCSV && !isJSON && <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                            <span className="truncate max-w-xs">{file.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400 uppercase font-mono">
                            {isPDF ? 'PDF Report' : isCSV ? 'CSV Export' : isJSON ? 'JSON Backup' : 'Document'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-2">
                            {isJSON && (
                              <button
                                onClick={() => handleRestoreFileFromDrive(file)}
                                title="Restore history from this JSON backup"
                                className="px-2 py-1 text-[11px] rounded font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 transition-colors"
                              >
                                Restore
                              </button>
                            )}

                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 px-2 py-1 text-[11px] rounded font-semibold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <button
                              onClick={() => setFileToDelete(file)}
                              title="Delete file from Google Drive"
                              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Confirmation Dialog for Destructive File Deletion (Workspace API Compliance) */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Delete File from Google Drive?</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete <strong className="text-white font-mono">{fileToDelete.name}</strong> from your Google Drive?
            </p>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <p>File ID: {fileToDelete.id}</p>
              <p>Type: {fileToDelete.mimeType}</p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFile}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
