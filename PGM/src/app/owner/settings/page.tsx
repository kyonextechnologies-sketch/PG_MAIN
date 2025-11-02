'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertCircle
} from 'lucide-react';
import { crudToasts } from '@/lib/toast';

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'owner@example.com',
    phone: '+91-9876543210',
    company: 'Smart PG Management',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    // razorpayKeyId: 'rzp_test_xxxxx', // Commented out - using UPI instead
    // razorpayKeySecret: '••••••••••••••••', // Commented out - using UPI instead
    upiId: 'owner@paytm', // UPI ID for payments
    upiName: 'Smart PG Manager', // UPI display name
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

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Load saved data on component mount
  React.useEffect(() => {
    const savedProfile = localStorage.getItem('ownerProfile');
    const savedPaymentSettings = localStorage.getItem('ownerPaymentSettings');
    const savedNotificationSettings = localStorage.getItem('ownerNotificationSettings');

    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
    if (savedPaymentSettings) {
      setPaymentSettings(JSON.parse(savedPaymentSettings));
    }
    if (savedNotificationSettings) {
      setNotificationSettings(JSON.parse(savedNotificationSettings));
    }
  }, []);

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

      // Save to localStorage
      localStorage.setItem('ownerProfile', JSON.stringify(profileData));
      
      // In real app, make API call here
      // await api.updateProfile(profileData);
      
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
      // Validate UPI ID format
      const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
      if (!upiIdRegex.test(paymentSettings.upiId)) {
        throw new Error('Please enter a valid UPI ID (e.g., owner@paytm)');
      }

      if (paymentSettings.invoiceReminderDays < 1 || paymentSettings.invoiceReminderDays > 30) {
        throw new Error('Invoice reminder days must be between 1 and 30');
      }

      if (paymentSettings.lateFeePercentage < 0 || paymentSettings.lateFeePercentage > 50) {
        throw new Error('Late fee percentage must be between 0 and 50');
      }

      // Save to localStorage
      localStorage.setItem('ownerPaymentSettings', JSON.stringify(paymentSettings));
      
      // Save UPI settings for payment modal
      localStorage.setItem('upiSettings', JSON.stringify({
        upiId: paymentSettings.upiId,
        upiName: paymentSettings.upiName
      }));
      
      // In real app, make API call here
      // await api.updatePaymentSettings(paymentSettings);
      
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
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-700 font-bold">Manage your account and application settings</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 text-black font-bold bg-gradient-to-r from-gray-100 to-gray-200 p-1 rounded-xl shadow-lg">
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
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile">
              <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
                    Update your personal information and contact details
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
                        className="text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className=" text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-black font-semibold">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-gray-700 font-semibold">Company</Label>
                      <Input
                        id="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        className="text-black bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl font-medium transition-all duration-300"
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
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    Payment Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
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
                          placeholder="9259782478@pnb"
                          className=" text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="upiName" className="text-gray-700 font-semibold">UPI Display Name</Label>
                        <Input
                          id="upiName"
                          value={paymentSettings.upiName}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, upiName: e.target.value })}
                          placeholder="Smart PG Manager"
                          className="text-black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                    </div>
                    {/* Commented out Razorpay configuration
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 text-lg">Razorpay Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="razorpayKeyId" className="text-gray-700 font-semibold">Razorpay Key ID</Label>
                          <Input
                            id="razorpayKeyId"
                            value={paymentSettings.razorpayKeyId}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayKeyId: e.target.value })}
                            className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="razorpayKeySecret" className="text-gray-700 font-semibold">Razorpay Key Secret</Label>
                          <Input
                            id="razorpayKeySecret"
                            type="password"
                            value={paymentSettings.razorpayKeySecret}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, razorpayKeySecret: e.target.value })}
                            className="bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>
                    */}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">Billing Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="autoGenerate" className="text-gray-700 font-semibold">Auto-generate Invoices</Label>
                          <p className="text-sm text-gray-600 font-medium">Automatically generate monthly invoices</p>
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
                            className="text black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lateFee" className="text-gray-700 font-semibold">Late Fee (%)</Label>
                          <Input
                            id="lateFee"
                            type="number"
                            value={paymentSettings.lateFeePercentage}
                            onChange={(e) => setPaymentSettings({ ...paymentSettings, lateFeePercentage: Number(e.target.value) })}
                            className="text black bg-gradient-to-r from-gray-50 to-green-50 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl font-medium transition-all duration-300"
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
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-yellow-500 rounded-lg mr-3">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
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
                  <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                    <div className="p-2 bg-red-500 rounded-lg mr-3">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 font-semibold">
                    Manage your account security and privacy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 text-lg">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="currentPassword" className="text-gray-700 font-semibold">Current Password</Label>
                        <Input 
                          id="currentPassword" 
                          type="password" 
                          className="bg-gradient-to-r from-gray-50 to-red-50 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-gray-700 font-semibold">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password" 
                          className="bg-gradient-to-r from-gray-50 to-red-50 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">Confirm Password</Label>
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          className="bg-gradient-to-r from-gray-50 to-red-50 border-2 border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl font-medium transition-all duration-300"
                        />
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
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
          </Tabs>
        </div>
      </MainLayout>
    </RequireRole>
  );
}