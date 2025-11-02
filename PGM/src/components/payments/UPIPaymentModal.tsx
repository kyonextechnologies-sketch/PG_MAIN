'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  CreditCard, 
  Wallet, 
  Banknote, 
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    month: string;
    amount: number;
  };
  upiId: string;
  upiName: string;
  onPaymentInitiated?: (appName: string, amount: number) => void;
}

const upiApps = [
  {
    id: 'gpay',
    name: 'Google Pay',
    icon: '🟢',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    textColor: 'text-green-800',
    scheme: 'googlepay://pay'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: '🟣',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    textColor: 'text-purple-800',
    scheme: 'phonepe://pay'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    textColor: 'text-blue-800',
    scheme: 'paytm://pay'
  },
  {
    id: 'bharatpe',
    name: 'BharatPe',
    icon: '🟠',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    textColor: 'text-orange-800',
    scheme: 'bharatpe://pay'
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    icon: '🟡',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    textColor: 'text-yellow-800',
    scheme: 'mobikwik://pay'
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    icon: '🛒',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    textColor: 'text-orange-800',
    scheme: 'amazonpay://pay'
  },
  {
    id: 'upi',
    name: 'Any UPI App',
    icon: '💳',
    color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
    textColor: 'text-gray-800',
    scheme: 'upi://pay'
  }
];

export function UPIPaymentModal({ isOpen, onClose, invoice, upiId, upiName, onPaymentInitiated }: UPIPaymentModalProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  if (!isOpen) return null;

  const handleAppSelection = (appId: string) => {
    setSelectedApp(appId);
    
    const app = upiApps.find(a => a.id === appId);
    if (!app) return;

    const amount = invoice.amount;
    const transactionNote = `Rent payment for ${invoice.month}`;
    
    // Create UPI payment URL
    const upiParams = `pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    let paymentUrl = '';
    
    if (appId === 'upi') {
      // Standard UPI deep link
      paymentUrl = `upi://pay?${upiParams}`;
    } else {
      // App-specific deep links
      paymentUrl = `${app.scheme}?${upiParams}`;
    }

    // For mobile devices, try different approaches
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Method 1: Try to open the app directly using window.location
      try {
        window.location.href = paymentUrl;
      } catch (error) {
        console.log('Direct redirect failed, trying alternative method');
        
        // Method 2: Create a temporary link and click it
        const link = document.createElement('a');
        link.href = paymentUrl;
        link.target = '_self';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a short delay
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
      }
    } else {
      // For desktop, use window.open
      try {
        window.open(paymentUrl, '_blank');
      } catch (error) {
        console.error('Failed to open UPI app:', error);
        copyUPIDetails();
      }
    }

    // Show success message
    setTimeout(() => {
      onPaymentInitiated?.(app.name, amount);
    }, 200);

    // Show fallback message after 3 seconds if app doesn't open
    setTimeout(() => {
      setShowFallback(true);
    }, 3000);
  };

  const copyUPIDetails = async () => {
    const upiDetails = `UPI ID: ${upiId}\nAmount: ₹${invoice.amount}\nNote: Rent payment for ${invoice.month}`;
    
    try {
      await navigator.clipboard.writeText(upiDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleManualPayment = () => {
    copyUPIDetails();
  };

  const handleClose = () => {
    setShowFallback(false);
    setSelectedApp(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Smartphone className="h-6 w-6 mr-2 text-blue-600" />
                Choose UPI App
              </CardTitle>
              <CardDescription className="text-gray-700 font-semibold">
                Select your preferred UPI app to make the payment
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleClose}
              className="hover:bg-red-50 hover:border-red-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Payment Details */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 sm:p-4 mb-6 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Payment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-600 font-medium">Amount:</span>
                <span className="sm:ml-2 font-bold text-green-600 text-lg sm:text-base">₹{invoice.amount.toLocaleString()}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-600 font-medium">Month:</span>
                <span className="sm:ml-2 font-bold text-gray-900">{invoice.month}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-600 font-medium">Payee:</span>
                <span className="sm:ml-2 font-bold text-gray-900 break-all">{upiName}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-gray-600 font-medium">UPI ID:</span>
                <span className="sm:ml-2 font-bold text-blue-600 break-all">{upiId}</span>
              </div>
            </div>
          </div>

          {/* UPI Apps Grid */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Select UPI App</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppSelection(app.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 ${app.color} ${
                    selectedApp === app.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{app.icon}</div>
                    <div className={`font-semibold text-xs sm:text-sm ${app.textColor}`}>{app.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Payment Option */}
          <div className="border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Manual Payment</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Copy UPI details to pay manually in any UPI app
                </p>
              </div>
              <Button
                onClick={handleManualPayment}
                variant="outline"
                className="flex items-center space-x-2 w-full sm:w-auto"
                size="sm"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Details</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Fallback Message */}
          {showFallback && (
            <div className="mt-4 sm:mt-6 bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 mr-2" />
                App didn't open?
              </h4>
              <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                If the UPI app didn't open automatically, you can:
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-yellow-800">
                <p>1. Open your UPI app manually</p>
                <p>2. Use the "Copy Details" button below</p>
                <p>3. Enter the UPI ID and amount in your app</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 sm:mt-6 bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center text-sm sm:text-base">
              <ExternalLink className="h-4 w-4 mr-2" />
              How to Pay
            </h4>
            <ol className="text-xs sm:text-sm text-blue-800 space-y-1">
              <li>1. Select your preferred UPI app above</li>
              <li>2. The app will open with payment details pre-filled</li>
              <li>3. Complete the payment in the UPI app</li>
              <li>4. Return to this page to confirm payment</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              Payment Complete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
