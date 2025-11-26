'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Home, 
  FileText, 
  Shield,
  Save,
  Upload,
  Eye,
  Download,
  Edit,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { crudToasts } from '@/lib/toast';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';
import { CreditCard, Copy, CheckCircle2 } from 'lucide-react';
import { useUPISettings } from '@/hooks/useUPISettings';


export default function TenantProfilePage() {
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    property: '',
    room: '',
    bed: '',
    moveInDate: '',
    kycStatus: '',
    emergencyContact: '',
    address: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const { addNotification } = useUIStore();
  const { data: session } = useSession();
  const { settings: upiSettings } = useUPISettings();
  const [copiedUPI, setCopiedUPI] = useState(false);

  // Load saved data on component mount
  React.useEffect(() => {
    const loadProfile = async () => {
      if (session?.user?.id) {
        try {
          setIsLoading(true);
          // Fetch tenant profile from API
          const response = await apiClient.get(`/tenants/profile/me`);
          if (response.success && response.data) {
            const tenant = response.data as any;
            setProfileData({
              id: tenant.id || '',
              name: tenant.name || '',
              email: tenant.email || '',
              phone: tenant.phone || '',
              property: tenant.property?.name || '',
              room: tenant.room?.roomNumber || '',
              bed: tenant.bed?.bedNumber || '',
              moveInDate: tenant.moveInDate || '',
              kycStatus: tenant.kycStatus || '',
              emergencyContact: tenant.emergencyContact || '',
              address: tenant.address || '',
            });
          }
        } catch (error) {
          console.error('Failed to fetch tenant profile:', error);
          // Fallback to localStorage
          const savedProfile = localStorage.getItem('tenantProfile');
          if (savedProfile) {
            setProfileData(JSON.parse(savedProfile));
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadProfile();
  }, [session?.user?.id, addNotification]);

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
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!phoneRegex.test(profileData.phone)) {
        throw new Error('Please enter a valid phone number');
      }

      // Validate emergency contact
      if (!phoneRegex.test(profileData.emergencyContact)) {
        throw new Error('Please enter a valid emergency contact number');
      }

      // Make API call to update profile
      const response = await apiClient.put('/tenants/profile/me', {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        emergencyContact: profileData.emergencyContact,
        address: profileData.address,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to update profile');
      }

      // Also save to localStorage as backup
      localStorage.setItem('tenantProfile', JSON.stringify(profileData));
      
      setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
      crudToasts.update.success('Profile');
      
      addNotification({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!',
        read: false
      });
      
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      setSaveStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to save profile' 
      });
      
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save profile',
        read: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = (type: string) => {
    addNotification({
      type: 'info',
      title: 'Upload Document',
      message: `Uploading ${type} document...`,
      read: false
    });
  };

  const handleDownloadDocument = (documentUrl: string) => {
    addNotification({
      type: 'success',
      title: 'Download Document',
      message: 'Downloading document...',
      read: false
    });
  };

  const handleRequestRoomTransfer = () => {
    addNotification({
      type: 'info',
      title: 'Room Transfer Request',
      message: 'Your room transfer request has been submitted!',
      read: false
    });
  };


  return (
    <RequireRole role="TENANT">
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

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <p className="text-gray-600 font-medium">Loading your profile...</p>
            </div>
          )}
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
        <h1 className="text-3xl font-bold text-white dark:!text-white">Profile</h1>
        <p className="text-white-700 dark:!text-white-700 font-semibold">Manage your personal information and documents</p>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl shadow-lg">
              <TabsTrigger 
                value="personal"
                className="text-black dark:!text-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Personal Info
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="text-black dark:!text-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                KYC Documents
              </TabsTrigger>
              <TabsTrigger 
                value="accommodation"
                className="text-black dark:!text-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Accommodation
              </TabsTrigger>
              <TabsTrigger 
                value="payment"
                className="text-black dark:!text-black data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all duration-300"
              >
                Payment Details
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Personal Information
                  </CardTitle>
        <CardDescription className="text-sm text-gray-600 font-semibold">
          Update your personal details and contact information
        </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-700 font-semibold">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!isEditing}
                        className={` text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                            : 'border-gray-200'
                        } rounded-xl font-medium`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                        className={`text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                            : 'border-gray-200'
                        } rounded-xl font-medium`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700 font-semibold">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                            : 'border-gray-200'
                        } rounded-xl font-medium`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContact" className="text-gray-700 font-semibold">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={profileData.emergencyContact}
                        onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
                        disabled={!isEditing}
                        className={`text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 transition-all duration-300 ${
                          isEditing 
                            ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                            : 'border-gray-200'
                        } rounded-xl font-medium`}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="text-gray-700 font-semibold">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      disabled={!isEditing}
                      className={`text-black bg-white border-1 transition-all duration-300 ${
                        isEditing 
                          ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
                          : 'border-gray-200'
                      } rounded-xl font-medium`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC Documents */}
            <TabsContent value="documents">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    KYC Documents
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
                    Upload and manage your identity documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* {mockKycDocuments.map((doc) => (
                      <div key={doc.id} className="bg-gradient-to-r from-white to-green-50 border border-green-200 rounded-lg p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{doc.type}</h4>
                              <p className="text-sm text-gray-600 font-medium">
                                Uploaded: {formatDate(doc.uploadedAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <Badge className={doc.status === 'VERIFIED' ? 'bg-green-200 text-green-800 font-semibold' : 'bg-yellow-200 text-yellow-800 font-semibold'}>
                              {doc.status}
                            </Badge>
                            
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
                                onClick={() => handleDownloadDocument(doc.documentUrl)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {doc.status === 'PENDING' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300"
                                  onClick={() => handleUploadDocument(doc.type)}
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))} */}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Required Documents</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Aadhaar Card (Government ID)</li>
                      <li>• PAN Card (Tax ID)</li>
                      <li>• Bank Statement (Last 3 months)</li>
                      <li>• Passport size photo</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Accommodation Details */}
            <TabsContent value="accommodation">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-purple-500 rounded-lg mr-3">
                      <Home className="h-5 w-5 text-white" />
                    </div>
                    Accommodation Details
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
                    Your current room and property information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Current Allocation</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-2 border-b border-purple-100">
                            <span className="text-gray-700 font-semibold">Property:</span>
                            <span className="font-bold text-purple-800">{profileData.property}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-purple-100">
                            <span className="text-gray-700 font-semibold">Room:</span>
                            <span className="font-bold text-purple-800">{profileData.room}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-purple-100">
                            <span className="text-gray-700 font-semibold">Bed:</span>
                            <span className="font-bold text-purple-800">{profileData.bed}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-700 font-semibold">Move-in Date:</span>
                            <span className="font-bold text-purple-800">{formatDate(profileData.moveInDate)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Property Amenities</h4>
                        <div className="flex flex-wrap gap-3">
                          {['WiFi', 'AC', 'Parking', 'Security', 'CCTV'].map((amenity) => (
                            <Badge 
                              key={amenity} 
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                      <h4 className="font-bold text-gray-900 mb-4 text-lg">Room Transfer Request</h4>
                      <p className="text-sm text-gray-700 font-medium mb-4">
                        Need to change your room? Submit a transfer request.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={handleRequestRoomTransfer}
                      >
                        Request Room Transfer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Details */}
            <TabsContent value="payment">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    Owner Payment Details
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
                    Use these payment details to make rent payments to your owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {upiSettings?.upiId ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">UPI Payment Information</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b border-green-100">
                            <span className="text-gray-700 font-semibold">UPI Display Name:</span>
                            <span className="font-bold text-green-800">{upiSettings.upiName || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b border-green-100">
                            <span className="text-gray-700 font-semibold">UPI ID:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-800 break-all">{upiSettings.upiId}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(upiSettings.upiId);
                                    setCopiedUPI(true);
                                    setTimeout(() => setCopiedUPI(false), 2000);
                                    addNotification({
                                      type: 'success',
                                      title: 'Copied!',
                                      message: 'UPI ID copied to clipboard',
                                      read: false,
                                    });
                                  } catch (error) {
                                    console.error('Failed to copy:', error);
                                  }
                                }}
                                className="border-green-300 text-green-700 hover:bg-green-100 hover:border-green-400"
                              >
                                {copiedUPI ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h5 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h5>
                        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                          <li>Use the UPI ID above to make rent payments</li>
                          <li>You can use any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                          <li>Always include the invoice number in the payment note</li>
                          <li>Keep the transaction receipt for your records</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Payment details not available</p>
                      <p className="text-sm text-gray-500 mt-2">Please contact your owner to set up payment information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </RequireRole>
  );
}