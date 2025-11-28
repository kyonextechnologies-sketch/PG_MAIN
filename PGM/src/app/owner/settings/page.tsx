'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  CreditCard, 
  Bell, 
  Shield,
  Save,
  Key,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  FileText,
  Upload,
  File,
  X,
  Clock,
  Eye,
  Download,
  Loader2
} from 'lucide-react';
import { crudToasts, showToast } from '@/lib/toast';
import { apiClient } from '@/lib/apiClient';

type OwnerDocument = {
  id?: string;
  filename: string;
  originalname?: string;
  url?: string;
  fileSize?: number;
  mimetype?: string;
  uploadedAt?: string;
  propertyName?: string;
};

type VerificationApiResponse = {
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  legalDocuments: OwnerDocument[];
  rejectionReason?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
};

const ALLOWED_VERIFICATION_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const MAX_VERIFICATION_FILES = 5;
const MAX_VERIFICATION_FILE_SIZE_MB = 50;

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    // razorpayKeyId: '', // Commented out - using UPI instead
    // razorpayKeySecret: '', // Commented out - using UPI instead
    upiId: '', // UPI ID for payments
    upiName: '', // UPI display name
    autoGenerateInvoices: true,
    invoiceReminderDays: 3,
    lateFeePercentage: 2,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    paymentReminders: true,
    maintenanceAlerts: true,
    monthlyReports: true,
  });

  const [verificationInfo, setVerificationInfo] = useState<{
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    documents: OwnerDocument[];
    rejectionReason: string;
    submittedAt?: string | null;
    verifiedAt?: string | null;
    separateDocuments?: {
      aadhaarFront?: { url: string | null; status: string; rejectionReason: string | null };
      aadhaarBack?: { url: string | null; status: string; rejectionReason: string | null };
      pan?: { url: string | null; status: string; rejectionReason: string | null };
      gst?: { url: string | null; status: string; rejectionReason: string | null };
      addressProof?: { url: string | null; status: string; rejectionReason: string | null };
      ownerPhoto?: { url: string | null; status: string; rejectionReason: string | null };
    };
  }>({
    status: 'PENDING',
    documents: [],
    rejectionReason: '',
    submittedAt: null,
    verifiedAt: null,
    separateDocuments: {},
  });
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  
  // Change password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Load saved data from backend on component mount (not localStorage)
  React.useEffect(() => {
    // Load profile and payment settings from backend API
    const loadOwnerData = async () => {
      try {
        // Load profile data
        const profileResponse = await apiClient.get<{ name: string; email: string; phone: string | null; company: string | null }>('/owners/profile/me');
        if (profileResponse.success && profileResponse.data) {
          const data = profileResponse.data as any;
          setProfileData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            company: data.company || '',
          });
        }

        // Load payment settings
        const paymentResponse = await apiClient.get<{ upiId: string | null; upiName: string | null; autoGenerateInvoices: boolean; invoiceReminderDays: number; lateFeePercentage: number }>('/owners/payment-settings');
        if (paymentResponse.success && paymentResponse.data) {
          const data = paymentResponse.data as any;
          setPaymentSettings({
            upiId: data.upiId || '',
            upiName: data.upiName || '',
            autoGenerateInvoices: data.autoGenerateInvoices ?? true,
            invoiceReminderDays: data.invoiceReminderDays ?? 3,
            lateFeePercentage: data.lateFeePercentage ?? 2,
          });

          // Also update localStorage for payment modal compatibility
          if (data.upiId || data.upiName) {
            localStorage.setItem('upiSettings', JSON.stringify({
              upiId: data.upiId || '',
              upiName: data.upiName || '',
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load owner data:', error);
        // Don't show error to user - fields will remain empty
      }
    };
    
    loadOwnerData();
    
    // Only load notification settings from localStorage (these are UI preferences)
    const savedNotificationSettings = localStorage.getItem('ownerNotificationSettings');
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
  }, []);

  const fetchVerificationInfo = React.useCallback(async () => {
    setVerificationLoading(true);
    try {
      const response = await apiClient.get<any>('/owners/verification');
      const payload = response.data;
      if (response.success && payload) {
        setVerificationInfo({
          status: payload.verificationStatus || 'PENDING',
          documents: Array.isArray(payload.legalDocuments) ? payload.legalDocuments : [],
          rejectionReason: payload.rejectionReason || '',
          submittedAt: payload.submittedAt || null,
          verifiedAt: payload.verifiedAt || null,
          separateDocuments: payload.documents || {},
        });
      }
    } catch (error) {
      console.error('Failed to load verification info:', error);
    } finally {
      setVerificationLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVerificationInfo();
  }, [fetchVerificationInfo]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      // Validate required fields
      if (!profileData.name.trim() || !profileData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate phone format
      if (profileData.phone && profileData.phone.trim()) {
        const phoneRegex = /^\+?[\d\s-()]+$/;
        if (!phoneRegex.test(profileData.phone)) {
          throw new Error('Please enter a valid phone number');
        }
      }

      // Save to backend API
      const response = await apiClient.put('/owners/profile/me', {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone?.trim() || null,
        company: profileData.company?.trim() || null,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }

      // Update local state with response data
      if (response.data) {
        const data = response.data as any;
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
        });
      }
      
      setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
      crudToasts.update.success('Profile');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save profile' 
      });
      crudToasts.update.error('Profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      // Validate UPI ID format if provided
      if (paymentSettings.upiId && paymentSettings.upiId.trim()) {
        const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        if (!upiIdRegex.test(paymentSettings.upiId)) {
          throw new Error('Please enter a valid UPI ID (e.g., owner@paytm)');
        }
      }

      if (paymentSettings.invoiceReminderDays < 1 || paymentSettings.invoiceReminderDays > 30) {
        throw new Error('Invoice reminder days must be between 1 and 30');
      }

      if (paymentSettings.lateFeePercentage < 0 || paymentSettings.lateFeePercentage > 50) {
        throw new Error('Late fee percentage must be between 0 and 50');
      }

      // Save to backend API
      const response = await apiClient.put('/owners/payment-settings', {
        upiId: paymentSettings.upiId?.trim() || null,
        upiName: paymentSettings.upiName?.trim() || null,
        autoGenerateInvoices: paymentSettings.autoGenerateInvoices,
        invoiceReminderDays: paymentSettings.invoiceReminderDays,
        lateFeePercentage: paymentSettings.lateFeePercentage,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update payment settings');
      }

      // Update local state with response data
      if (response.data) {
        const data = response.data as any;
        setPaymentSettings({
          upiId: data.upiId || '',
          upiName: data.upiName || '',
          autoGenerateInvoices: data.autoGenerateInvoices ?? true,
          invoiceReminderDays: data.invoiceReminderDays ?? 3,
          lateFeePercentage: data.lateFeePercentage ?? 2,
        });
      }

      // Also save UPI settings to localStorage for payment modal (temporary compatibility)
      localStorage.setItem('upiSettings', JSON.stringify({
        upiId: paymentSettings.upiId,
        upiName: paymentSettings.upiName
      }));
      
      setSaveStatus({ type: 'success', message: 'Payment settings updated successfully!' });
      crudToasts.update.success('Payment settings');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save payment settings' 
      });
      crudToasts.update.error('Payment settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setIsLoading(true);
    setSaveStatus({ type: null, message: '' });
    
    try {
      // Save to localStorage
      localStorage.setItem('ownerNotificationSettings', JSON.stringify(notificationSettings));
      
      // In real app, make API call here
      // await api.updateNotificationSettings(notificationSettings);
      
      setSaveStatus({ type: 'success', message: 'Notification settings updated successfully!' });
      crudToasts.update.success('Notification settings');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save notification settings' 
      });
      crudToasts.update.error('Notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationFileSelect = (files: FileList | null) => {
    if (!files) return;

    setSelectedDocuments((prev) => {
      let remainingSlots = MAX_VERIFICATION_FILES - prev.length;

      if (remainingSlots <= 0) {
        showToast.warning(`Maximum ${MAX_VERIFICATION_FILES} files allowed per submission.`);
        return prev;
      }

      const nextFiles: File[] = [];

      for (const file of Array.from(files)) {
        if (!ALLOWED_VERIFICATION_FILE_TYPES.includes(file.type)) {
          showToast.error(`${file.name} has an unsupported file type.`);
          continue;
        }

        if (file.size > MAX_VERIFICATION_FILE_SIZE_MB * 1024 * 1024) {
          showToast.error(`${file.name} exceeds ${MAX_VERIFICATION_FILE_SIZE_MB}MB.`);
          continue;
        }

        if (remainingSlots <= 0) break;
        nextFiles.push(file);
        remainingSlots -= 1;
      }

      if (nextFiles.length === 0) {
        return prev;
      }

      return [...prev, ...nextFiles];
    });
  };

  const handleRemoveSelectedDocument = (index: number) => {
    setSelectedDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitVerificationDocuments = async () => {
    if (selectedDocuments.length === 0) return;

    setUploadingDocuments({ legacy: true });
    try {
      const formData = new FormData();
      selectedDocuments.forEach((file) => formData.append('documents', file));

      const response = await apiClient.post<VerificationApiResponse>('/owners/verification/documents', formData);
      const payload = response.data;

      if (!response.success || !payload) {
        throw new Error(response.error || response.message || 'Failed to upload documents');
      }

      setVerificationInfo({
        status: payload.verificationStatus || 'PENDING',
        documents: Array.isArray(payload.legalDocuments) ? payload.legalDocuments : [],
        rejectionReason: payload.rejectionReason || '',
        submittedAt: payload.submittedAt || null,
        verifiedAt: payload.verifiedAt || null,
      });
      setSelectedDocuments([]);
      crudToasts.create.success('Verification documents');
      fetchVerificationInfo(); // Refresh to get updated separate documents
    } catch (error) {
      console.error('Failed to submit verification documents:', error);
      crudToasts.create.error('Verification documents');
    } finally {
      setUploadingDocuments({});
    }
  };

  const handleUploadSeparateDocument = async (docType: string, file: File) => {
    setIsUploadingDocument(true);
    setUploadingDocuments(prev => ({ ...prev, [docType]: true }));
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('docType', docType);

      const response = await apiClient.post('/owners/verification/document', formData);

      if (!response.success) {
        throw new Error(response.error || response.message || 'Failed to upload document');
      }

      crudToasts.create.success(`${docType} document`);
      fetchVerificationInfo(); // Refresh to get updated status
    } catch (error) {
      console.error(`Failed to upload ${docType}:`, error);
      crudToasts.create.error(`${docType} document`);
    } finally {
      setIsUploadingDocument(false);
      setUploadingDocuments(prev => {
        const updated = { ...prev };
        delete updated[docType];
        return updated;
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast.error('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast.error('Password must be at least 8 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await apiClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        showToast.success('Password changed successfully');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        throw new Error(response.error || response.message || 'Failed to change password');
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to change password';
      showToast.error(errorMsg);
      console.error('Failed to change password:', error);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Status Message */}
          {saveStatus.type && (
            <div className={`p-4 rounded-lg border ${
              saveStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                {saveStatus.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {saveStatus.message}
              </div>
            </div>
          )}
          {/* Header */}
          <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:!text-white">Settings</h1>
        <p className="text-gray-700 font-bold dark:!text-white">Manage your account and application settings</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 text-black font-bold bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl shadow-lg">
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="payments"
                className=" data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="security"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="verification"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#f5c518] data-[state=active]:to-[#ffd000] data-[state=active]:text-black data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Verification
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:!text-black">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3 dark:!text-black">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm font-semibold dark:!text-black">
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="!text-black font-semibold">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="!text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter your email address"
                        className=" !text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-black font-semibold">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="!text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-gray-700 font-semibold">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        placeholder="Enter your company name"
                        className="!text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payments">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:!text-black">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    Payment Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold  dark:!text-black">
                    Configure payment gateway and billing settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">UPI Payment Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="upiId" className="text-gray-700 font-semibold">UPI ID</Label>
                        <Input
                          id="upiId"
                          value={paymentSettings.upiId}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, upiId: e.target.value })}
                          placeholder="Enter your UPI ID (e.g., yourname@paytm)"
                          className=" !text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="upiName" className="text-gray-700 font-semibold">UPI Display Name</Label>
                        <Input
                          id="upiName"
                          value={paymentSettings.upiName}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, upiName: e.target.value })}
                          placeholder="Enter UPI display name"
                          className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">Billing Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autoGenerate" className="text-gray-700 font-semibold">Auto-generate Invoices</Label>
                          <p className="!text-sm text-gray-600 font-medium">Automatically generate monthly invoices</p>
                        </div>
                        <Switch
                          id="autoGenerate"
                          checked={paymentSettings.autoGenerateInvoices}
                          onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, autoGenerateInvoices: checked })}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reminderDays" className="text-gray-700 font-semibold">Reminder Days</Label>
                          <Input
                            id="reminderDays"
                            type="number"
                            value={paymentSettings.invoiceReminderDays}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, invoiceReminderDays: Number(e.target.value) })}
                            className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lateFee" className="text-gray-700 font-semibold">Late Fee (%)</Label>
                          <Input
                            id="lateFee"
                            type="number"
                            value={paymentSettings.lateFeePercentage}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, lateFeePercentage: Number(e.target.value) })}
                            className="!text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSavePaymentSettings}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Payment Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:!text-black">
                    <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold dark:!text-black">
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications" className="text-gray-700 font-semibold">Email Notifications</Label>
                        <p className="text-sm text-gray-600 font-medium">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications" className="text-gray-700 font-semibold">SMS Notifications</Label>
                        <p className="text-sm text-gray-600 font-medium">Receive notifications via SMS</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, smsNotifications: checked })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="paymentReminders" className="text-gray-700 font-semibold">Payment Reminders</Label>
                        <p className="text-sm text-gray-600 font-medium">Get reminded about due payments</p>
                      </div>
                      <Switch
                        id="paymentReminders"
                        checked={notificationSettings.paymentReminders}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, paymentReminders: checked })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maintenanceAlerts" className="text-gray-700 font-semibold">Maintenance Alerts</Label>
                        <p className="text-sm text-gray-600 font-medium">Get notified about maintenance requests</p>
                      </div>
                      <Switch
                        id="maintenanceAlerts"
                        checked={notificationSettings.maintenanceAlerts}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, maintenanceAlerts: checked })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="monthlyReports" className="text-gray-700 font-semibold">Monthly Reports</Label>
                        <p className="text-sm text-gray-600 font-medium">Receive monthly performance reports</p>
                      </div>
                      <Switch
                        id="monthlyReports"
                        checked={notificationSettings.monthlyReports}
                        onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, monthlyReports: checked })}
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveNotificationSettings}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Notification Settings'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:!text-black">
                    <div className="p-2 bg-red-500 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold dark:!text-black">
                    Manage your account security and privacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-gray-800 text-lg">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currentPassword" className="text-gray-900 dark:text-gray-800 font-semibold">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-white-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-gray-900 dark:text-gray-800 font-semibold">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-800 font-semibold">Confirm Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      {changingPassword ? 'Changing Password...' : 'Change Password'}
                    </Button>
                    {passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-sm text-red-600 font-medium">Passwords do not match</p>
                    )}
                    {passwordData.newPassword && passwordData.newPassword.length < 8 && (
                      <p className="text-sm text-red-600 font-medium">Password must be at least 8 characters</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="twoFactor" className="text-gray-700 font-semibold">Enable 2FA</Label>
                        <p className="text-sm text-gray-600 font-medium">Add an extra layer of security</p>
                      </div>
                      <Switch id="twoFactor"
                       className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                       />

                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">Session Management</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500">Active Sessions</p>
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Current Session</p>
                            <p className="text-sm text-gray-500">Windows • Chrome • IP: 192.168.1.1</p>
                          </div>
                          <Button variant="outline" size="sm">End Session</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Verification Documents Tab */}
            <TabsContent value="verification">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-[#f5c518]/20 to-[#ffd000]/20 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900 dark:!text-black">
                    <div className="p-2 bg-gradient-to-br from-[#f5c518] to-[#ffd000] rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-black" />
                    </div>
                    Owner Verification Documents
                  </CardTitle>
                  <CardDescription className="text-gray-700 dark:!text-black">
                    Upload legal documents for admin verification to unlock all features
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Verification Status */}
                  <div className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Verification Status</h3>
                      <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                        verificationInfo.status === 'VERIFIED' 
                          ? 'bg-green-100 text-green-700'
                          : verificationInfo.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {verificationInfo.status === 'VERIFIED' && <><CheckCircle className="w-4 h-4 inline mr-1" /> Verified</>}
                        {verificationInfo.status === 'REJECTED' && <><AlertCircle className="w-4 h-4 inline mr-1" /> Rejected</>}
                        {verificationInfo.status === 'PENDING' && <><Clock className="w-4 h-4 inline mr-1" /> Pending Review</>}
                      </div>
                    </div>

                    {verificationInfo.status === 'PENDING' && (
                      <p className="text-gray-600">
                        Your documents are under review. Admin will verify within 24-48 hours.
                      </p>
                    )}

                    {verificationLoading && (
                      <p className="text-xs text-gray-500 mt-2">
                        Refreshing verification status...
                      </p>
                    )}

                    {verificationInfo.status === 'VERIFIED' && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900">Verification Complete!</p>
                          <p className="text-sm text-green-700 mt-1">
                            Your account has been verified. You now have full access to all features.
                          </p>
                        </div>
                      </div>
                    )}

                    {verificationInfo.status === 'REJECTED' && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900">Verification Rejected</p>
                            <p className="text-sm text-red-700 mt-1">
                              {verificationInfo.rejectionReason || 'Please upload valid documents and try again.'}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          Re-upload Documents
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Separate Document Upload Sections */}
                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-bold text-gray-900 dark:!text-black mb-3 block">
                        Upload Legal Documents
                      </Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload each document separately. All documents are required for verification (PDF, JPG, PNG - Max 50MB each)
                      </p>
                    </div>

                    {/* Document Upload Sections */}
                    {[
                      { key: 'aadhaarFront', label: 'Aadhar Card (Front)', required: true, placeholder: 'aadhar_front.jpg' },
                      { key: 'aadhaarBack', label: 'Aadhar Card (Back)', required: true, placeholder: 'aadhar_back.jpg' },
                      { key: 'pan', label: 'PAN Card', required: true, placeholder: 'pan.jpg' },
                      { key: 'gst', label: 'GST Certificate', required: false, placeholder: 'gst.pdf' },
                      { key: 'addressProof', label: 'Address Proof', required: true, placeholder: 'address_proof.pdf' },
                      { key: 'ownerPhoto', label: 'Owner Photo', required: true, placeholder: 'owner_photo.jpg' },
                    ].map(({ key, label, required, placeholder }) => {
                      const doc = verificationInfo.separateDocuments?.[key as keyof typeof verificationInfo.separateDocuments];
                      const isUploading = uploadingDocuments[key] || false;
                      const docId = `doc-${key}`;
                      
                      return (
                        <div key={key} className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-[#f5c518] transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <Label className="text-sm font-bold text-gray-900">
                                {label} {required && <span className="text-red-500">*</span>}
                              </Label>
                              {doc?.status && (
                                <Badge className={`ml-2 ${
                                  doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                  doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {doc.status}
                                </Badge>
                              )}
                            </div>
                            {doc?.url && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(doc.url!, '_blank')}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {doc?.rejectionReason && (
                            <p className="text-xs text-red-600 mb-2">{doc.rejectionReason}</p>
                          )}
                          
                          <input
                            type="file"
                            id={docId}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleUploadSeparateDocument(key, file);
                              }
                            }}
                            disabled={isUploading || isUploadingDocument}
                          />
                          <label
                            htmlFor={docId}
                            className={`flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg border-2 border-dashed ${
                              doc?.url ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                            } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-8 h-8 text-gray-400 mb-2 animate-spin" />
                                <p className="text-sm text-gray-600">Uploading...</p>
                              </>
                            ) : doc?.url ? (
                              <>
                                <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                                <p className="text-sm font-semibold text-green-700">Uploaded</p>
                                <p className="text-xs text-gray-500 mt-1">Click to replace</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <p className="text-sm font-semibold text-gray-700">Click to upload</p>
                                <p className="text-xs text-gray-500 mt-1">{placeholder}</p>
                              </>
                            )}
                          </label>
                        </div>
                      );
                    })}

                    {/* Uploaded Files List */}
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-semibold text-gray-700">
                          Uploaded Documents ({verificationInfo.documents.length})
                        </Label>
                        {verificationInfo.documents.length > 0 ? (
                          <div className="space-y-2 mt-2">
                            {verificationInfo.documents.map((doc, index) => (
                              <div
                                key={`${doc.filename}-${index}`}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <File className="w-5 h-5 text-[#f5c518]" />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{doc.originalname || doc.filename}</p>
                                    <p className="text-xs text-gray-500">
                                      Uploaded {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                                      {doc.fileSize && ` • ${formatFileSize(doc.fileSize)}`}
                                    </p>
                                  </div>
                                </div>
                                {doc.url && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                      onClick={() => window.open(doc.url, '_blank')}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 border-green-300 hover:bg-green-50"
                                      onClick={() => {
                                        if (doc.url) {
                                          const link = document.createElement('a');
                                          link.href = doc.url;
                                          link.download = doc.originalname || doc.filename;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 mt-2">
                            No documents uploaded yet. Add files below to begin verification.
                          </p>
                        )}
                      </div>

                      {selectedDocuments.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">
                            Selected Files ({selectedDocuments.length})
                          </Label>
                          <div className="space-y-2">
                            {selectedDocuments.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-200"
                              >
                                <div className="flex items-center gap-3">
                                  <File className="w-5 h-5 text-[#f5c518]" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveSelectedDocument(index)}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      onClick={handleSubmitVerificationDocuments}
                      disabled={selectedDocuments.length === 0 || isUploadingDocument}
                      className="w-full bg-gradient-to-r from-[#f5c518] to-[#ffd000] hover:from-[#ffd000] hover:to-[#f5c518] text-black font-bold py-6 text-lg"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      {isUploadingDocument ? 'Uploading documents...' : 'Submit Documents for Verification'}
                    </Button>

                    {/* Requirements */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Required Documents:</h4>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• Property ownership proof (Registry/Sale Deed)</li>
                        <li>• Aadhar Card (Owner)</li>
                        <li>• PAN Card (Owner)</li>
                        <li>• Property Tax Receipt (latest)</li>
                        <li>• NOC from local authority (if applicable)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </RequireRole>
  );
}