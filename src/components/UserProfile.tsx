import React, { useState } from 'react';
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
import { BackupService } from './BackupService';

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
  const { exportData, importData, clearAllData } = useTransactions();
  const [userData, setUserData] = useState<UserData>({
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    currency: 'INR',
    lastBackup: '2024-12-25T10:30:00Z',
    autoBackup: true,
    backupFrequency: 'daily'
  });

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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Simulate password change
    setTimeout(() => {
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordDialogOpen(false);
    }, 1000);
  };

  const handleBackupToCloud = async () => {
    setIsBackupInProgress(true);
    
    try {
      // Authenticate with Google Drive
      await BackupService.authenticate();
      
      // Export current data
      const dataToBackup = exportData();
      
      // Upload to Google Drive
      const metadata = await BackupService.backupToGoogleDrive(dataToBackup);
      
      setUserData(prev => ({
        ...prev,
        lastBackup: metadata.timestamp
      }));
      
      toast.success('Data backed up to Google Drive successfully');
    } catch (error) {
      toast.error('Backup failed. Please try again.');
      console.error('Backup error:', error);
    } finally {
      setIsBackupInProgress(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) {
            const success = importData(content);
            if (success) {
              toast.success(`Data imported from ${file.name} successfully`);
            } else {
              toast.error('Failed to import data. Please check the file format.');
            }
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportData = () => {
    try {
      const dataToExport = exportData();
      const blob = new Blob([dataToExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

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
          <Button size="sm" className="w-full">
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
              onCheckedChange={(checked) => setUserData(prev => ({...prev, autoBackup: checked}))}
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
        </CardContent>
      </Card>
    </div>
  );
}