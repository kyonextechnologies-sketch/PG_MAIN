'use client';

import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  CheckCircle
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
    scheme: 'tez://pay',
    fallbackUrl: 'https://gpay.app.link'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: '🟣',
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    textColor: 'text-purple-800',
    scheme: 'phonepe://pay',
    fallbackUrl: 'https://phonepe.com'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    textColor: 'text-blue-800',
    scheme: 'paytm://pay',
    fallbackUrl: 'https://paytm.com'
  },
  {
    id: 'bharatpe',
    name: 'BharatPe',
    icon: '🟠',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    textColor: 'text-orange-800',
    scheme: 'bharatpe://pay',
    fallbackUrl: 'https://bharatpe.com'
  },
  {
    id: 'mobikwik',
    name: 'MobiKwik',
    icon: '🟡',
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    textColor: 'text-yellow-800',
    scheme: 'mobikwik://pay',
    fallbackUrl: 'https://mobikwik.com'
  },
  {
    id: 'amazonpay',
    name: 'Amazon Pay',
    icon: '🛒',
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    textColor: 'text-orange-800',
    scheme: 'amazonpay://pay',
    fallbackUrl: 'https://amazon.in'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Pay',
    icon: '💬',
    color: 'bg-green-50 border-green-200 hover:bg-green-100',
    textColor: 'text-green-800',
    scheme: 'whatsapp://pay',
    fallbackUrl: 'https://whatsapp.com'
  },
];

export function UPIPaymentModal({ isOpen, onClose, invoice, upiId, upiName, onPaymentInitiated }: UPIPaymentModalProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [customUpiId, setCustomUpiId] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'failed' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  // Handle payment URL redirect in useEffect to avoid immutability issues
  useEffect(() => {
    if (!paymentUrl) return;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      const timer = setTimeout(() => {
        try {
          window.location.href = paymentUrl;
        } catch (err) {
          console.log('Direct redirect failed, trying alternative method');
          
          const link = document.createElement('a');
          link.href = paymentUrl;
          link.target = '_self';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 1000);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      try {
        window.open(paymentUrl, '_blank');
      } catch (err) {
        console.error('Failed to open UPI app:', err);
      }
    }
  }, [paymentUrl]);

  if (!isOpen) return null;

  const handleAppSelection = (appId: string) => {
    setSelectedApp(appId);
    
    const app = upiApps.find(a => a.id === appId);
    if (!app) return;

    const amount = invoice.amount;
    const transactionNote = `Rent payment for ${invoice.month}`;
    
    // Create UPI payment URL with proper encoding
    const upiParams = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    
    let url = '';
    
    if (appId === 'upi') {
      // Standard UPI deep link - works with any UPI app
      url = `upi://pay?${upiParams}`;
    } else {
      // App-specific deep links
      url = `${app.scheme}?${upiParams}`;
    }

    console.log(`Attempting to open ${app.name} with URL:`, url);

    // Set the payment URL which triggers the useEffect
    setPaymentUrl(url);

    // Notify parent component
    setTimeout(() => {
      onPaymentInitiated?.(app.name, amount);
    }, 200);

    // Show fallback message after a delay
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

  const handleCustomUpiRequest = async () => {
    if (!customUpiId.trim()) {
      alert('Please enter a valid UPI ID');
      return;
    }

    // Validate UPI ID format
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiIdRegex.test(customUpiId.trim())) {
      alert('Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }

    setIsSendingRequest(true);
    setPaymentStatus('pending');
    setTimeRemaining(300); // 5 minutes = 300 seconds

    try {
      const amount = invoice.amount;
      const transactionNote = `Rent payment for ${invoice.month}`;
      const transactionRef = `rent_${Date.now()}`;
      
      // Create UPI collect request - this will actually send a request to the tenant's UPI ID
      const collectRequest = {
        payeeAddress: customUpiId.trim(),
        payeeName: upiName,
        amount: amount,
        currency: 'INR',
        transactionNote: transactionNote,
        transactionRef: transactionRef,
        merchantId: upiId, // Your UPI ID (the one requesting payment)
        merchantName: upiName
      };
      
      console.log(`Sending UPI collect request TO: ${customUpiId.trim()}`);
      console.log(`From: ${upiName} (${upiId})`);
      console.log(`Amount: ₹${amount}`);
      console.log(`Collect Request:`, collectRequest);
      
      // Simulate sending UPI collect request through API
      try {
        // In a real implementation, this would call your backend API
        // which would then send the UPI collect request to the tenant's UPI ID
        const response = await fetch('/api/upi/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(collectRequest)
        });
        
        if (response.ok) {
          console.log('UPI collect request sent successfully');
        } else {
          throw new Error('Failed to send UPI collect request');
        }
      } catch (error) {
        console.log('API call failed, simulating UPI collect request');
        
        // Fallback: Create UPI collect URL for manual testing
        const upiCollectParams = `pa=${encodeURIComponent(customUpiId.trim())}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&tr=${transactionRef}`;
        const upiCollectUrl = `upi://pay?${upiCollectParams}`;
        
        console.log(`Fallback UPI Collect URL:`, upiCollectUrl);
        
        // Set the payment URL which will be handled by useEffect
        setPaymentUrl(upiCollectUrl);
      }
      
      setRequestSent(true);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setPaymentStatus('failed');
            setRequestSent(false);
            alert('Payment request timed out. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimeoutId(timer);
      
      // Notify parent component
      onPaymentInitiated?.('UPI Collect Request', invoice.amount);
      
    } catch (error) {
      console.error('Failed to send UPI collect request:', error);
      alert('Failed to send payment request. Please try again.');
      setPaymentStatus(null);
      setRequestSent(false);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handlePaymentApproval = () => {
    if (timeoutId) {
      clearInterval(timeoutId);
      setTimeoutId(null);
    }
    setPaymentStatus('approved');
    setRequestSent(false);
    setTimeRemaining(0);
    
    // Notify parent component about successful payment
    onPaymentInitiated?.('Payment Approved', invoice.amount);
    
    // Close modal after successful payment
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handlePaymentFailure = () => {
    if (timeoutId) {
      clearInterval(timeoutId);
      setTimeoutId(null);
    }
    setPaymentStatus('failed');
    setRequestSent(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleManualPayment = () => {
    copyUPIDetails();
  };

  const handleClose = () => {
    // Clean up timer if running
    if (timeoutId) {
      clearInterval(timeoutId);
      setTimeoutId(null);
    }
    
    // Reset all states
    setShowFallback(false);
    setSelectedApp(null);
    setCustomUpiId('');
    setRequestSent(false);
    setPaymentStatus(null);
    setTimeRemaining(0);
    setIsSendingRequest(false);
    
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
            <h3 className="font-bold text-gray-900 mb-2">Choose Your UPI App</h3>
            <p className="text-sm text-gray-600 mb-4">Select your preferred UPI app to make the payment</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {upiApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppSelection(app.id)}
                  className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 ${app.color} ${
                    selectedApp === app.id ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{app.icon}</div>
                    <div className={`font-semibold text-xs sm:text-sm ${app.textColor}`}>{app.name}</div>
                    {selectedApp === app.id && (
                      <div className="text-xs text-blue-600 font-medium mt-1">Selected</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
          </div>

          {/* Custom UPI ID Request */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-2">Send Payment Request</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your UPI ID to receive a payment request</p>
            
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="customUpiId" className="block text-sm font-medium text-gray-700 mb-2">
                    Your UPI ID
                  </label>
                  <input
                    id="customUpiId"
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder="Enter your UPI ID (e.g., user@paytm)"
                    className="text-black w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    disabled={isSendingRequest || requestSent}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: john@paytm, jane@phonepe, user@ybl
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleCustomUpiRequest}
                    disabled={!customUpiId.trim() || isSendingRequest || requestSent}
                    className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingRequest ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : requestSent ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Request Sent!
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {requestSent && paymentStatus === 'pending' && (
                <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
                      <p className="text-sm font-medium text-yellow-800">Payment request sent!</p>
                    </div>
                    <div className="text-lg font-bold text-yellow-800">
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                  <p className="text-xs text-yellow-700 mb-2">
                    A payment request has been sent to your UPI ID. Check your UPI app for the payment request. You have <strong>{formatTime(timeRemaining)}</strong> to approve the payment.
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    <strong>Amount:</strong> ₹{invoice.amount} | <strong>To:</strong> {customUpiId} | <strong>From:</strong> {upiName}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">📱 What to do next:</p>
                    <ol className="text-xs text-blue-700 space-y-1">
                      <li>1. Check your UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                      <li>2. Look for a payment request from "{upiName}"</li>
                      <li>3. Approve the payment of ₹{invoice.amount}</li>
                      <li>4. Come back here and click "✓ I Approved Payment"</li>
                    </ol>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePaymentApproval}
                      className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors font-medium"
                    >
                      ✓ I Approved Payment
                    </button>
                    <button
                      onClick={handlePaymentFailure}
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors font-medium"
                    >
                      ✗ Payment Failed
                    </button>
                    <button
                      onClick={() => {
                        const upiCollectParams = `pa=${encodeURIComponent(customUpiId.trim())}&pn=${encodeURIComponent(upiName)}&am=${invoice.amount}&cu=INR&tn=${encodeURIComponent(`Rent payment for ${invoice.month}`)}&tr=rent_${Date.now()}`;
                        const upiCollectUrl = `upi://pay?${upiCollectParams}`;
                        setPaymentUrl(upiCollectUrl);
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors font-medium"
                    >
                      🔄 Try Again
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus === 'approved' && (
                <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Payment approved successfully!</p>
                      <p className="text-xs text-green-600">
                        Your rent payment of ₹{invoice.amount} has been processed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="mt-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Payment request failed!</p>
                      <p className="text-xs text-red-600">
                        The payment request timed out or was not approved. Please try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                App didn&apos;t open?
              </h4>
              <p className="text-xs sm:text-sm text-yellow-800 mb-3">
                If the UPI app didn&apos;t open automatically, you can:
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-yellow-800">
                <p>1. Open your UPI app manually</p>
                <p>2. Use the &quot;Copy Details&quot; button below</p>
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
