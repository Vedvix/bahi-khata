import React, { useState, useEffect, useCallback } from 'react';
import { User, Settings, Lock, Shield, Download, Upload, Cloud, Smartphone, Eye, EyeOff, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { useTransactions } from './TransactionContext';
import { Analytics } from './Analytics';
// import { BackupService } from './BackupService';
import { GoogleDriveBackupService } from './BackupService';
import CryptoJS from 'crypto-js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { gapi } from 'gapi-script';

import { changePassword, updateUserInfo, logout } from '../auth/auth-direct';
import { useAuth } from './AuthContext';

interface UserData {
  name: string;
  email: string;
  phone: string;
  currency: string;
  lastBackup: string;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
}

export function UserProfile() {
  const {logoutFn, user } = useAuth();
  const { exportData, importData, clearAllData } = useTransactions();
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currency: user?.currency || 'INR',
    lastBackup: '', // can fetch last backup if stored
    autoBackup: true,
    backupFrequency: 'daily',
  });

  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await GoogleDriveBackupService.initialize();
        console.log('Google Drive initialized');
      } catch (err) {
        console.error('Drive init failed', err);
        toast.error('Failed to initialize Google Drive. Check console.');
      }
    })();
  }, []);

const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.error('New passwords do not match');
    return;
  }

  if (passwordForm.newPassword.length < 8) {
    toast.error('Password must be at least 8 characters long');
    return;
  }

  try {
    // You need user ID, assume it's stored in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await changePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword);

    toast.success(res.message || 'Password updated successfully');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordDialogOpen(false);
  } catch (err: any) {
    toast.error(err.error || err.message || 'Failed to change password');
    console.error('Change password error:', err);
  }
};

const handleUpdateInfo = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await updateUserInfo(user.id, {
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    });
    setUserData(prev => ({ ...prev, ...res.user }));
    localStorage.setItem('me', JSON.stringify(res.user));
    toast.success(res.message || 'User info updated successfully');
  } catch (err: any) {
    toast.error(err.error || err.message || 'Failed to update user info');
    console.error('Update info error:', err);
  }
};

const handleBackupToCloud = async () => {
  setIsBackupInProgress(true);

  try {
    const password = prompt('Enter a password to encrypt this backup (remember this password to restore):');
    if (!password) {
      toast.error('Backup cancelled — password is required.');
      return;
    }

    const dataToBackup = exportData();
    if (!dataToBackup) {
      toast.error('No data to backup.');
      return;
    }

    const encrypted = CryptoJS.AES.encrypt(dataToBackup, password).toString();

    // Authenticate and get access token
    const accessToken = await GoogleDriveBackupService.authenticate();
    gapi.client.setToken({ access_token: accessToken });

    const timestamp = new Date().toISOString();
    const fileName = `fintrack-backup-${timestamp}.json.enc`;
    const meta = await GoogleDriveBackupService.uploadFile(fileName, encrypted);

    setUserData(prev => ({
      ...prev,
      lastBackup: meta.timestamp || timestamp
    }));

    toast.success('Data backed up to Google Drive successfully');
  } catch (err: any) {
    console.error('Backup error:', err);
    if (err?.error === 'popup_closed_by_user') {
      toast.error('Authentication was cancelled. Backup aborted.');
    } else {
      toast.error(err.message || 'Backup failed. Please try again.');
    }
  } finally {
    setIsBackupInProgress(false);
  }
};



  // const handleImportData = () => {
  //   const input = document.createElement('input');
  //   input.type = 'file';
  //   input.accept = '.json';
  //   input.onchange = (e) => {
  //     const file = (e.target as HTMLInputElement).files?.[0];
  //     if (file) {
  //       const reader = new FileReader();
  //       reader.onload = (event) => {
  //         const content = event.target?.result as string;
  //         if (content) {
  //           const success = importData(content);
  //           if (success) {
  //             toast.success(`Data imported from ${file.name} successfully`);
  //           } else {
  //             toast.error('Failed to import data. Please check the file format.');
  //           }
  //         }
  //       };
  //       reader.readAsText(file);
  //     }
  //   };
  //   input.click();
  // };
  const handleImportData = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const password = prompt('Enter the password to decrypt this backup:');
    if (!password) {
      toast.error('Password is required for decryption');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importData(content, password); // pass password
        if (success) {
          toast.success(`Data imported from ${file.name} successfully`);
        } else {
          toast.error('Failed to import data. Check password or file.');
        }
      }
    };
    reader.readAsText(file);
  };
  input.click();
};


const [status, setStatus] = useState('Ready to export data.');

    const handleExportData = useCallback(async () => {
        setStatus('Processing export...');
        
        try {
            const dataToExport = exportData();
            if (!dataToExport) {
                toast.error('No data to export');
                setStatus('Export failed: No data.');
                return;
            }

            const password = prompt('Enter a password to encrypt this backup:');
            if (!password) {
                toast.error('Password is required to encrypt the backup');
                setStatus('Export cancelled.');
                return;
            }

            const encryptedData = CryptoJS.AES.encrypt(dataToExport, password).toString();
            const date = new Date().toISOString().split('T')[0];
            const fileName = `fintrack-backup-${date}.json`;
            const isNative = Capacitor.getPlatform() !== 'web';

            if (isNative) {
                // --- NATIVE EXPORT STRATEGY: Write to Cache, then Share ---

                // 1. Write the file to the app's temporary, guaranteed-writable CACHE directory.
                // This location is easy to write to and is designed for temporary files like share payloads.
                await Filesystem.writeFile({
                    path: fileName,
                    data: encryptedData,
                    directory: Directory.Cache, 
                    encoding: Encoding.UTF8,
                });
                toast.success(`Encrypted backup file created temporarily in app cache: ${fileName}`);

                // 2. Get the file URI from the Cache directory.
                const uriResult = await Filesystem.getUri({
                    directory: Directory.Cache,
                    path: fileName,
                });
                
                // 3. Share the file. This prompts the user to select a target.
                // The user MUST choose a saving app (like "Files" or "Drive") to move it to a permanent location.
                await Share.share({
                    title: 'FinTrack Encrypted Backup',
                    text: 'FinTrack Data Backup (Encrypted)',
                    files: [uriResult.uri], 
                    dialogTitle: 'Select "Files" or "Drive" to save your backup externally',
                });
                
                // Cleanup: Delete the temporary file from cache after sharing
                await Filesystem.deleteFile({
                    path: fileName,
                    directory: Directory.Cache,
                });

                toast.success('Backup file shared successfully. Please choose a save location.');
                setStatus('Export successful: Shared via native sheet.');

            } else {
                // --- WEB EXPORT STRATEGY ---
                const blob = new Blob([encryptedData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success('Data exported successfully (encrypted)');
                setStatus('Export successful: Downloaded to browser.');
            }
        } catch (err) {
            console.error('Export error:', err);
            toast.error(err.message || 'Failed to export data');
            setStatus(`Export failed: ${err.message}`);
        }
    }, []);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#059669'];

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1>Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={userData.name}
                onChange={(e) => setUserData(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={userData.phone}
                onChange={(e) => setUserData(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleUpdateInfo}
          >
            Update Information
          </Button>

        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, currentPassword: e.target.value}))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({...prev, current: !prev.current}))}
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, newPassword: e.target.value}))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({...prev, new: !prev.new}))}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {passwordForm.newPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${(passwordStrength / 5) * 100}%`,
                              backgroundColor: strengthColors[passwordStrength - 1] || '#EF4444'
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{color: strengthColors[passwordStrength - 1] || '#EF4444'}}>
                          {strengthLabels[passwordStrength - 1] || 'Very Weak'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
                          {passwordForm.newPassword.length >= 8 ? 
                            <Check className="w-3 h-3 text-green-500" /> : 
                            <X className="w-3 h-3 text-red-500" />
                          }
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[A-Z]/.test(passwordForm.newPassword) ? 
                            <Check className="w-3 h-3 text-green-500" /> : 
                            <X className="w-3 h-3 text-red-500" />
                          }
                          <span>Uppercase letter</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/[0-9]/.test(passwordForm.newPassword) ? 
                            <Check className="w-3 h-3 text-green-500" /> : 
                            <X className="w-3 h-3 text-red-500" />
                          }
                          <span>Number</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({...prev, confirmPassword: e.target.value}))}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPasswords(prev => ({...prev, confirm: !prev.confirm}))}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Update Password
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Your data is stored locally on your device for privacy and security.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      {/* Quick Analytics CTA */}
        <div className="flex items-center justify-between gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Want a quick overview?</p>
            <p className="text-xs text-muted-foreground">Open full analytics to explore charts & trends</p>
          </div>

          <Button
            onClick={() => setIsAnalyticsOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            View Analytics
          </Button>
        </div>
           
      {/* Backup & Sync */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Backup & Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm">Auto Backup to Google Drive</p>
              <p className="text-xs text-muted-foreground">
                Last backup: {new Date(userData.lastBackup).toLocaleDateString()}
              </p>
            </div>
            <Switch
              checked={userData.autoBackup}
              onCheckedChange={(checked: any) => setUserData(prev => ({...prev, autoBackup: checked}))}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleBackupToCloud}
              disabled={isBackupInProgress}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs">
                {isBackupInProgress ? 'Backing up...' : 'Backup Now'}
              </span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExportData}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">Export Data</span>
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={handleImportData}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>

          <Alert>
            <Smartphone className="w-4 h-4" />
            <AlertDescription>
              <strong>Local Storage:</strong> All your financial data is stored securely on your device. 
              Backups are encrypted and saved to your Google Drive for safekeeping.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="currency">Currency</Label>
            <Badge variant="secondary">₹ INR</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="backupFreq">Backup Frequency</Label>
            <select 
              className="text-sm border rounded px-2 py-1"
              value={userData.backupFrequency}
              onChange={(e) => setUserData(prev => ({...prev, backupFrequency: e.target.value as any}))}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all local data? This action cannot be undone. Make sure you have a backup.')) {
                  clearAllData();
                  toast.success('All local data cleared');
                }
              }}
            >
              Clear Local Data
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              This will remove all data from your device. Make sure you have a backup.
            </p>
          </div>

          <Separator />

    {/* Logout Button */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full text-red-700 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (window.confirm("Are you sure you want to logout?")) {
                  try {
                    logoutFn(); // clears user & tokens
                    toast.success("Logged out successfully");
                    // no need to navigate; AuthGate will automatically render AuthPage
                  } catch (err) {
                    console.error("Logout failed", err);
                    toast.error("Failed to logout. Try again.");
                  }
                }
              }}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dialog — ~90% screen */}
{isAnalyticsOpen && (
  <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
    {/* Top bar */}
    <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
      <h3 className="text-lg font-semibold">Analytics</h3>
      <Button variant="ghost" onClick={() => setIsAnalyticsOpen(false)}>
        Close
      </Button>
    </div>

    {/* Analytics content */}
    <div className="flex-1 overflow-auto p-6">
      <Analytics />
    </div>
  </div>
)}



    </div>
  );
}