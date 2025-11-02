'use client';

import React, { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  Zap, 
  Calculator,
  CheckCircle,
  AlertCircle,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store/ui';
import { formatCurrency, formatDate } from '@/lib/utils';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock electricity bill data
// const mockElectricityBills = [
//   {
//     id: '1',
//     month: 'January 2024',
//     previousReading: 1250,
//     currentReading: 1350,
//     units: 100,
//     rate: 8.5,
//     amount: 850,
//     status: 'PAID',
//     submittedAt: '2024-01-15',
//     paidAt: '2024-01-20',
//     imageUrl: '/api/placeholder/400/300'
//   },
//   {
//     id: '2',
//     month: 'February 2024',
//     previousReading: 1350,
//     currentReading: 1420,
//     units: 70,
//     rate: 8.5,
//     amount: 595,
//     status: 'PENDING',
//     submittedAt: '2024-02-10',
//     imageUrl: '/api/placeholder/400/300'
//   }
// ];
// 
// const mockElectricitySettings = {
//   ratePerUnit: 8.5,
//   lastReading: 1350,
//   dueDate: '2024-02-28'
// };

export default function ElectricityBillPage() {
  const { addNotification } = useUIStore();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedReading, setExtractedReading] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReading, setCurrentReading] = useState<string>('');
  const [previousReading, setPreviousReading] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  const extractMeterReading = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    
    // Simulate image processing delay
    setTimeout(() => {
      // Mock extraction result
      const mockReading = Math.floor(Math.random() * 1000) + 1400;
      setExtractedReading(mockReading);
      setCurrentReading(mockReading.toString());
      setIsProcessing(false);
      
      addNotification({
        type: 'success',
        title: 'Reading Extracted',
        message: `Meter reading extracted: ${mockReading} units`,
        read: false,
      });
    }, 2000);
  };

  const calculateBill = () => {
    const current = parseFloat(currentReading);
    const previous = parseFloat(previousReading);
    
    if (isNaN(current) || isNaN(previous)) {
      addNotification({
        type: 'error',
        title: 'Invalid Reading',
        message: 'Please enter valid meter readings',
        read: false,
      });
      return;
    }

    const units = current - previous;
    const amount = units * 8; // Default rate: 8 per unit

    if (units < 0) {
      addNotification({
        type: 'error',
        title: 'Invalid Reading',
        message: 'Current reading cannot be less than previous reading',
        read: false,
      });
      return;
    }

    addNotification({
      type: 'success',
      title: 'Bill Calculated',
      message: `${units} units × ₹${amount.toFixed(2)} = ₹${amount.toFixed(2)}`,
      read: false,
    });
  };

  const submitBill = () => {
    if (!currentReading || !previousReading) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter both current and previous readings',
        read: false,
      });
      return;
    }

    addNotification({
      type: 'success',
      title: 'Bill Submitted',
      message: 'Electricity bill submitted successfully!',
      read: false,
    });

    // Reset form
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedReading(null);
    setCurrentReading('');
    setPreviousReading('');
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedReading(null);
    setCurrentReading('');
  };

  return (
    <RequireRole role="TENANT">
      <MainLayout>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-xl animate-float-delay"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-green-200/20 rounded-full blur-xl animate-float-delay-2"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-pink-200/20 rounded-full blur-xl animate-float"></div>
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
              <span className="text-sm font-semibold text-gray-700">Electricity Bill Management</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Electricity Bills
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto font-semibold">
              Submit your meter reading and manage electricity bills
            </p>
          </motion.div>

          {/* Current Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Zap className="h-6 w-6 text-blue-600 mr-2" />
                  Current Electricity Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600">Rate per Unit</p>
                    <p className="text-2xl font-bold text-blue-600">₹8</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600">Last Reading</p>
                    <p className="text-2xl font-bold text-green-600">N/A</p>
                  </div>
                  <div className="text-center p-4 bg-white/80 rounded-xl">
                    <p className="text-sm font-semibold text-gray-600">Due Date</p>
                    <p className="text-2xl font-bold text-orange-600">N/A</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit New Reading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Camera className="h-6 w-6 text-green-600 mr-2" />
                  Submit New Meter Reading
                </CardTitle>
                <CardDescription>Upload a photo of your electricity meter to automatically extract the reading</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={handleCameraCapture}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Take Photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload Image
                    </Button>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative max-w-md mx-auto"
                    >
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Meter reading"
                          className="w-full h-64 object-cover rounded-xl shadow-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={removeImage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {extractedReading && (
                        <div className="mt-4 p-4 bg-green-100 rounded-xl">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-semibold text-green-800">
                              Extracted Reading: {extractedReading}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex justify-center">
                        <Button
                          onClick={extractMeterReading}
                          disabled={isProcessing}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isProcessing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Extract Reading
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Manual Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previousReading">Previous Reading</Label>
                    <Input
                      id="previousReading"
                      type="number"
                      placeholder="Enter previous reading"
                      value={previousReading}
                      onChange={(e) => setPreviousReading(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentReading">Current Reading</Label>
                    <Input
                      id="currentReading"
                      type="number"
                      placeholder="Enter current reading"
                      value={currentReading}
                      onChange={(e) => setCurrentReading(e.target.value)}
                    />
                  </div>
                </div>

                {/* Calculate and Submit */}
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={calculateBill}
                    variant="outline"
                    className="px-6 py-3"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Bill
                  </Button>
                  <Button
                    onClick={submitBill}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Bill
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bill History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <FileText className="h-6 w-6 text-purple-600 mr-2" />
                  Bill History
                </CardTitle>
                <CardDescription>Your electricity bill submission history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* mockElectricityBills.map((bill, index) => ( */}
                  {/* <motion.div */}
                  {/*   key={bill.id} */}
                  {/*   initial={{ opacity: 0, x: -20 }} */}
                  {/*   animate={{ opacity: 1, x: 0 }} */}
                  {/*   transition={{ duration: 0.4, delay: index * 0.1 }} */}
                  {/*   className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300" */}
                  {/* > */}
                  {/*   <div className="flex items-center space-x-4"> */}
                  {/*     <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl"> */}
                  {/*       <Zap className="h-6 w-6 text-blue-600" /> */}
                  {/*     </div> */}
                  {/*     <div> */}
                  {/*       <p className="font-bold text-gray-900">{bill.month}</p> */}
                  {/*       <p className="text-sm text-gray-600"> */}
                  {/*         Reading: {bill.previousReading} → {bill.currentReading} ({bill.units} units) */}
                  {/*       </p> */}
                  {/*       <p className="text-sm text-gray-500"> */}
                  {/*         Submitted: {formatDate(bill.submittedAt)} */}
                  {/*       </p> */}
                  {/*     </div> */}
                  {/*   </div> */}
                  {/*   <div className="text-right"> */}
                  {/*     <p className="font-bold text-lg text-gray-900">{formatCurrency(bill.amount)}</p> */}
                  {/*     <Badge  */}
                  {/*       variant={bill.status === 'PAID' ? 'default' : 'secondary'} */}
                  {/*       className="mt-1" */}
                  {/*     > */}
                  {/*       {bill.status} */}
                  {/*     </Badge> */}
                  {/*     {bill.paidAt && ( */}
                  {/*       <p className="text-xs text-gray-500 mt-1"> */}
                  {/*         Paid: {formatDate(bill.paidAt)} */}
                  {/*       </p> */}
                  {/*     )} */}
                  {/*   </div> */}
                  {/* </motion.div> */}
                  {/* ))} */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

