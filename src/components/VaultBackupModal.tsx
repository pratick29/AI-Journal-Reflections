import React, { useState } from 'react';
import { X, Download, Upload, ShieldCheck, AlertCircle, CheckCircle, Cloud, ExternalLink } from 'lucide-react';
import { Interaction } from '../types';
import { saveInteraction } from '../firebase/interactions';
import { useAuth } from '../context/AuthContext';

interface VaultBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  interactions: Interaction[];
  onRefreshData?: () => void;
}

export const VaultBackupModal: React.FC<VaultBackupModalProps> = ({
  isOpen,
  onClose,
  interactions,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(interactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `gemini-journal-vault-backup-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleGoogleDriveBackup = () => {
    handleExportJson();
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
    setImportStatus('Vault backup downloaded! Drag and drop this file into your Google Drive "MindScribe" folder.');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsImporting(true);
    setErrorMsg(null);
    setImportStatus(null);

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      if (!Array.isArray(importedData)) {
        throw new Error('Invalid backup format. Backup file must contain an array of manuscript entries.');
      }

      let count = 0;
      for (const item of importedData) {
        if (item && item.id && Array.isArray(item.messages)) {
          const restoredInteraction: Interaction = {
            ...item,
            userId: user.uid, // isolate to current user
            updatedAt: new Date().toISOString(),
          };
          await saveInteraction(user.uid, restoredInteraction);
          count++;
        }
      }

      setImportStatus(`Successfully restored ${count} manuscript entries into your private Cloud Vault.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Failed to import vault backup:', err);
      setErrorMsg(err.message || 'Failed to parse backup JSON file.');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2A28]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFDF9] border border-[#E2DDD5] border-t-4 border-t-[#C4432B] max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6 rounded-xs my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C4432B]/10 text-[#C4432B] rounded-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-sans uppercase tracking-[0.22em] font-bold text-[#C4432B]">
                Vault Security
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-[#2B2A28] font-light">
                Backup &amp; Restore Manuscript Vault
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8478] hover:text-[#2B2A28] hover:bg-[#EFECE6] transition-colors rounded-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-sans uppercase tracking-widest font-semibold text-[#2B2A28]">
                Export Portable Vault
              </h3>
              <p className="text-xs text-[#595652] font-serif">
                Download all {interactions.length} inquiry entries as a structured JSON archive.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={handleExportJson}
                disabled={interactions.length === 0}
                className="px-4 py-2.5 bg-[#2B2A28] text-[#F7F4EE] hover:bg-[#C4432B] disabled:opacity-40 text-xs font-sans uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 rounded-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={handleGoogleDriveBackup}
                disabled={interactions.length === 0}
                className="px-4 py-2.5 bg-[#4285F4] text-white hover:bg-[#3367D6] disabled:opacity-40 text-xs font-sans uppercase tracking-widest font-semibold transition-colors flex items-center gap-2 rounded-xs cursor-pointer shadow-xs"
                title="Download backup and open Google Drive"
              >
                <Cloud className="w-4 h-4" />
                <span>Save to Google Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Restore Section */}
        <div className="bg-[#F7F4EE] border border-[#E2DDD5] p-5 space-y-3">
          <h3 className="text-sm font-sans uppercase tracking-widest font-semibold text-[#2B2A28]">
            Restore Manuscript Backup
          </h3>
          <p className="text-xs text-[#595652] font-serif">
            Upload a previously exported `.json` vault backup file. Entries will be safely merged into your user isolation path.
          </p>

          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
            />
            <div className="border-2 border-dashed border-[#E2DDD5] hover:border-[#C4432B] bg-[#FFFDF9] p-6 text-center cursor-pointer transition-colors space-y-2 rounded-xs">
              <Upload className="w-6 h-6 text-[#C4432B] mx-auto" />
              <span className="text-xs font-sans uppercase tracking-wider text-[#2B2A28] block font-semibold">
                {isImporting ? 'Restoring Entries...' : 'Choose JSON Backup File to Restore'}
              </span>
            </div>
          </label>
        </div>

        {/* Notices */}
        {importStatus && (
          <div className="p-3 bg-[#C4432B]/10 border border-[#C4432B]/30 text-xs text-[#C4432B] flex items-center gap-2 font-sans">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-[#C4432B]/10 border border-[#C4432B]/30 text-xs text-[#C4432B] flex items-center gap-2 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Close Button */}
        <div className="border-t border-[#E2DDD5] pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2B2A28] text-[#F7F4EE] text-xs font-sans uppercase tracking-widest font-semibold hover:bg-[#C4432B] transition-colors rounded-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
