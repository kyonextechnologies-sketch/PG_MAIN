'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Zap, 
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { electricityService } from '@/services/electricityService';
import { showToast } from '@/lib/toast';
import { ElectricitySettings } from '@/lib/types';
import { ElectricityService } from '@/services/electricityService';

export const ElectricitySettingsForm: React.FC = () => {
  // ✅ FIXED: Initialize local state instead of using deleted useElectricityStore
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState<Partial<ElectricitySettings>>({});
  const [settings, setSettings] = useState<Partial<ElectricitySettings>>({
    ratePerUnit: 0,
    dueDate: 1,
    isEnabled: false,
    lateFeePercentage: 0,
    minimumUnits: 0,
    maximumUnits: 1000,
  });

  // ✅ FIXED: Initialize electricity settings when component mounts
  useEffect(() => {
    const initSettings = async () => {
      const electricityService = ElectricityService.getInstance();
      const result = await electricityService.initializeSettings('owner-1');
      if (result.success && result.data) {
        setSettings(result.data);
      }
    };
    initSettings();
  }, []);

  const handleEdit = () => {
    setTempSettings({
      ratePerUnit: settings?.ratePerUnit || 0,
      dueDate: settings?.dueDate || 1,
      isEnabled: settings?.isEnabled || false,
      lateFeePercentage: settings?.lateFeePercentage || 0,
      minimumUnits: settings?.minimumUnits || 0,
      maximumUnits: settings?.maximumUnits || 1000,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await electricityService.updateSettings(tempSettings as ElectricitySettings);
      setSettings(tempSettings as ElectricitySettings);
      setIsEditing(false);
      showToast.success('Electricity settings updated successfully!');
    } catch (error) {
      showToast.error('Failed to update settings. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempSettings({});
  };

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Electricity Settings
          </CardTitle>
          <CardDescription>
            Configure electricity billing settings for your properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No electricity settings found. Please contact support.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Electricity Settings
        </CardTitle>
        <CardDescription>
          Configure electricity billing settings for your properties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="ratePerUnit">Rate per Unit (₹)</Label>
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

            <div>
              <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
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

            <div>
              <Label htmlFor="lateFeePercentage">Late Fee Percentage (%)</Label>
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
            <div>
              <Label htmlFor="minimumUnits">Minimum Units</Label>
              <Input
                id="minimumUnits"
                type="number"
                value={isEditing ? tempSettings.minimumUnits : settings.minimumUnits}
                onChange={(e) => isEditing && setTempSettings({...tempSettings, minimumUnits: parseInt(e.target.value) || 0})}
                disabled={!isEditing}
                className="text-lg"
              />
            </div>

            <div>
              <Label htmlFor="maximumUnits">Maximum Units</Label>
              <Input
                id="maximumUnits"
                type="number"
                value={isEditing ? tempSettings.maximumUnits : settings.maximumUnits}
                onChange={(e) => isEditing && setTempSettings({...tempSettings, maximumUnits: parseInt(e.target.value) || 1000})}
                disabled={!isEditing}
                className="text-lg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isEnabled"
                checked={isEditing ? tempSettings.isEnabled : settings.isEnabled}
                onCheckedChange={(checked) => isEditing && setTempSettings({...tempSettings, isEnabled: checked})}
                disabled={!isEditing}
              />
              <Label htmlFor="isEnabled">Enable Electricity Billing</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Settings
            </Button>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={handleCancel} 
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};




