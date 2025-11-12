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
import { 
  Settings, 
  Zap, 
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  FileText,
  TrendingUp,
  Sparkles,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OwnerElectricityPage() {
  const { addNotification } = useUIStore();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    ratePerUnit: 0,
    dueDate: 1,
    isEnabled: false,
    lateFeePercentage: 0,
    minimumUnits: 0,
    maximumUnits: 0,
    billingCycle: 'MONTHLY',
    lastUpdated: 'N/A'
  });
  const [tempSettings, setTempSettings] = useState({
    ratePerUnit: 0,
    dueDate: 1,
    isEnabled: false,
    lateFeePercentage: 0,
    minimumUnits: 0,
    maximumUnits: 0,
    billingCycle: 'MONTHLY',
    lastUpdated: 'N/A'
  });

  const handleEdit = () => {
    setTempSettings(settings);
    setIsEditing(true);
  };

  const handleSave = () => {
    setSettings(tempSettings);
    setIsEditing(false);
    addNotification({
      type: 'success',
      title: 'Settings Updated',
      message: 'Electricity settings have been updated successfully',
      read: false,
    });
  };

  const handleCancel = () => {
    setTempSettings(settings);
    setIsEditing(false);
  };

  const handleApproveBill = (billId: string) => {
    addNotification({
      type: 'success',
      title: 'Bill Approved',
      message: 'Electricity bill has been approved and added to rent',
      read: false,
    });
  };

  const handleRejectBill = (billId: string) => {
    addNotification({
      type: 'info',
      title: 'Bill Rejected',
      message: 'Electricity bill has been rejected',
      read: false,
    });
  };

  const handleViewImage = (imageUrl: string) => {
    addNotification({
      type: 'info',
      title: 'View Image',
      message: 'Opening meter reading image',
      read: false,
    });
  };

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        {/* Background Elements */}
        <div className="text-black absolute inset-0 overflow-hidden pointer-events-none">
          <div className="text-black absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-float"></div>
          <div className="text-black absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-xl animate-float-delay"></div>
          <div className="text-black absolute bottom-20 left-1/4 w-28 h-28 bg-green-200/20 rounded-full blur-xl animate-float-delay-2"></div>
          <div className="text-black absolute bottom-40 right-1/3 w-20 h-20 bg-pink-200/20 rounded-full blur-xl animate-float"></div>
        </div>

        <div className="relative space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full shadow-lg">
              <Sparkles className="h-5 w-5 text-yellow-500 mr-2 animate-pulse" />
              <span className="text-black text-sm font-semibold text-gray-700">Electricity Bill Management</span>
            </div>
            <h1 className="text-black text-4xl text-white sm:text-5xl font-bold text-black dark:text-black">
              Electricity Settings
            </h1>
            <p className="text-black text-black text-xl text-gray-800 max-w-2xl text-white mx-auto font-semibold">
              Manage electricity rates and review tenant bill submissions
            </p>
          </motion.div>

          {/* Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <Card className="text-black bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black text-sm font-bold text-blue-800">Total Bills</p>
                    <p className="text-3xl font-bold text-blue-900">0</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black text-sm font-bold text-orange-800">Pending Bills</p>
                    <p className="text-3xl font-bold text-orange-900">0</p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black text-sm font-bold text-green-800">Approved Bills</p>
                    <p className="text-black text-3xl font-bold text-green-900">0</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black text-sm font-bold text-purple-800">Total Amount</p>
                    <p className="text-black text-3xl font-bold text-purple-900">₹0</p>
                  </div>
                  <div className="text-black p-3 bg-purple-500 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Electricity Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Electricity Settings</CardTitle>
                      <CardDescription className="text-black text-sm">Configure electricity billing parameters</CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={handleCancel} variant="outline">
                          <X className="text-white h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ratePerUnit" className='text-black'>Rate per Unit (₹)</Label>
                      <Input
                        id="ratePerUnit"
                        type="number"
                        step="0.1"
                        value={isEditing ? tempSettings.ratePerUnit : settings.ratePerUnit}
                        onChange={(e) => isEditing && setTempSettings({...tempSettings, ratePerUnit: parseFloat(e.target.value) || 0})}
                        disabled={!isEditing}
                        className="text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dueDate" className='text-black'>Due Date (Day of Month)</Label>
                      <Input
                        id="dueDate"
                        type="number"
                        min="1"
                        max="31"
                        value={isEditing ? tempSettings.dueDate : settings.dueDate}
                        onChange={(e) => isEditing && setTempSettings({...tempSettings, dueDate: parseInt(e.target.value) || 1})}
                        disabled={!isEditing}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lateFeePercentage" className='text-black'>Late Fee Percentage (%)</Label>
                      <Input
                        id="lateFeePercentage"
                        type="number"
                        step="0.1"
                        value={isEditing ? tempSettings.lateFeePercentage : settings.lateFeePercentage}
                        onChange={(e) => isEditing && setTempSettings({...tempSettings, lateFeePercentage: parseFloat(e.target.value) || 0})}
                        disabled={!isEditing}
                        className="text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minimumUnits" className='text-black'>Minimum Units</Label>
                      <Input
                        id="minimumUnits"
                        type="number"
                        value={isEditing ? tempSettings.minimumUnits : settings.minimumUnits}
                        onChange={(e) => isEditing && setTempSettings({...tempSettings, minimumUnits: parseInt(e.target.value) || 0})}
                        disabled={!isEditing}
                        className="text-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maximumUnits" className='text-black'>Maximum Units</Label>
                      <Input
                        id="maximumUnits"
                        type="number"
                        value={isEditing ? tempSettings.maximumUnits : settings.maximumUnits}
                        onChange={(e) => isEditing && setTempSettings({...tempSettings, maximumUnits: parseInt(e.target.value) || 0})}
                        disabled={!isEditing}
                        className="text-lg"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={isEditing ? tempSettings.isEnabled : settings.isEnabled}
                        onCheckedChange={(checked) => isEditing && setTempSettings({...tempSettings, isEnabled: checked})}
                        disabled={!isEditing}
                      />
                      <Label className='text-black '>Enable Electricity Billing</Label>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Last Updated:</span>
                    <span className="text-blue-700">{settings.lastUpdated}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tenant Bill Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="text-black bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-black text-xl font-bold text-gray-900 dark:!text-black-900 flex items-center">
                  <Users className=" text-black h-6 w-6 text-green-600 mr-2" />
                  Tenant Bill Submissions
                </CardTitle>
                <CardDescription className='text-black dark:!text-black-200'>Review and approve electricity bills submitted by tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-center text-gray-500">No bill submissions to display.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}
