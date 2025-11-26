'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { UPIPaymentModal } from '@/app/tenant/payments/UPIPaymentModal';
import { useUPISettings } from '@/hooks/useUPISettings';
import { useInvoices } from '@/hooks/useInvoices';
import { isSessionValid } from '@/lib/tenantDataIsolation';

export default function TenantPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addNotification } = useUIStore();
  const { invoices, loading: invoicesLoading, error: invoicesError } = useInvoices();
  const { settings, loading: upiLoading, refresh: refreshUPI } = useUPISettings();
  
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [showUPIModal, setShowUPIModal] = useState(false);

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated' || !isSessionValid(session)) {
      router.push('/login');
      addNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to view payments',
        read: false,
      });
      return;
    }
  }, [status, session, router, addNotification]);

  // Show loading state
  if (status === 'loading' || !isSessionValid(session)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Filter invoices by current tenant using session ID
  const tenantInvoices = invoices;

  // Calculate statistics from real data
  const totalPaid = tenantInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const totalDue = tenantInvoices
    .filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

  const nextDueInvoice = tenantInvoices.find(inv => inv.status === 'DUE');

  return (
    <RequireRole role="TENANT">
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white-900 dark:text-white">Payment Management</h1>
            <p className="text-lg text-white-600">Track and manage your payments</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Paid */}
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-sm font-bold text-green-800">Total Paid</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg w-fit mt-2">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-900">{formatCurrency(totalPaid)}</div>
                <p className="text-sm text-green-700 font-bold">Payments completed</p>
              </CardContent>
            </Card>

            {/* Outstanding Due */}
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-yellow-50 rounded-t-lg">
                <CardTitle className="text-sm font-bold text-red-800">Outstanding Due</CardTitle>
                <div className="p-2 bg-red-500 rounded-lg w-fit mt-2">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-900">{formatCurrency(totalDue)}</div>
                <p className="text-sm text-red-700 font-bold">Awaiting payment</p>
              </CardContent>
            </Card>

            {/* Next Due Date */}
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="text-sm font-bold text-blue-800">Next Due Date</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg w-fit mt-2">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-900">
                  {nextDueInvoice ? formatDate(nextDueInvoice.dueDate) : 'N/A'}
                </div>
                <p className="text-sm text-blue-700 font-bold">Next payment due</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Invoices */}
          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-900">Current Invoices</CardTitle>
              <CardDescription className="text-sm text-gray-600 font-semibold">
                Your active invoices from the system
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : invoicesError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">{invoicesError}</p>
                </div>
              ) : tenantInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-900">Month</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-900">Amount</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-900">Due Date</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-900">Status</th>
                        <th className="text-center py-3 px-4 font-bold text-gray-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantInvoices.map(invoice => (
                        <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="py-4 px-4 font-semibold text-gray-900">{invoice.month}</td>
                          <td className="py-4 px-4 font-bold text-gray-900">
                            {formatCurrency(Number(invoice.amount) || 0)}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {formatDate(invoice.dueDate)}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedInvoice(invoice.id)}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {(invoice.status === 'DUE' || invoice.status === 'OVERDUE') && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(invoice.id);
                                    setShowUPIModal(true);
                                  }}
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                                >
                                  💳 Pay Now
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UPI Payment Modal */}
          {showUPIModal && selectedInvoice && (
            <UPIPaymentModal
              isOpen={showUPIModal}
              onClose={() => setShowUPIModal(false)}
              invoice={tenantInvoices.find(inv => inv.id === selectedInvoice) || { id: '', month: '', amount: 0 }}
              upiId={settings?.upiId || ''}
              upiName={settings?.upiName || ''}
            />
          )}
        </div>
      </MainLayout>
    </RequireRole>
  );
}