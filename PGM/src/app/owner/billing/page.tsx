'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InvoiceForm } from '@/components/ui/forms';
import { DataTable, Column, StatusBadge } from '@/components/ui/data-table';
import { LineChartComponent, BarChartComponent, PieChartComponent } from '@/components/ui/charts';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Download, 
  Send, 
  Eye,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useInvoices } from '@/hooks/useInvoices';
import { useTenants } from '@/hooks/useTenants';

// ❌ MOCK DATA DISABLED - Using real API instead

export default function BillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  // ✅ Using real API hooks - automatically fetches from backend database
  // ✅ Data is automatically isolated by ownerId/tenantId from backend
  const { invoices, loading, error, createInvoice, updateInvoice, deleteInvoice, fetchInvoices } = useInvoices();
  const { tenants } = useTenants();  // ✅ Fetch tenants for dropdown
  const { addNotification } = useUIStore();

  // ✅ Filter by search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.month.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // ✅ Calculate totals from real data
  const totalRevenue = filteredInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const outstandingDues = filteredInvoices
    .filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleInvoiceSubmit = async (data: any) => {
    try {
      if (editingInvoice) {
        // Update existing invoice
        const result = await updateInvoice(editingInvoice.id, data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Invoice Updated',
            message: `Invoice for ${data.month} has been updated successfully.`,
            read: false,
          });
          setShowForm(false);
          setEditingInvoice(null);
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update invoice. Please try again.',
            read: false,
          });
        }
      } else {
        // Add new invoice
        const result = await createInvoice(data);
        if (result) {
          addNotification({
            type: 'success',
            title: 'Invoice Created',
            message: `Invoice for ${data.month} has been created successfully.`,
            read: false,
          });
          setShowForm(false);
          setEditingInvoice(null);
          // Force refresh invoices list
          setTimeout(() => {
            fetchInvoices();
          }, 300);
        } else {
          addNotification({
            type: 'error',
            title: 'Creation Failed',
            message: 'Failed to create invoice. Please try again.',
            read: false,
          });
        }
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'An error occurred while processing the invoice.',
        read: false,
      });
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      const result = await deleteInvoice(invoiceId);
      if (result) {
        addNotification({
          type: 'success',
          title: 'Invoice Deleted',
          message: `Invoice has been deleted successfully.`,
          read: false,
        });
      }
    }
  };

  const handleViewInvoice = (invoice: any) => {
    addNotification({
      type: 'info',
      title: 'View Invoice',
      message: `Viewing invoice details...`,
      read: false,
    });
  };

  const handleSendReminder = (invoiceId: string) => {
    addNotification({
      type: 'success',
      title: 'Reminder Sent',
      message: 'Payment reminder has been sent to the tenant.',
      read: false,
    });
  };

  const handleDownloadReceipt = (receiptNo: string) => {
    addNotification({
      type: 'info',
      title: 'Download Receipt',
      message: `Downloading receipt ${receiptNo}...`,
      read: false,
    });
  };

  // Table columns
  const columns: Column<typeof invoices[0]>[] = [
    { key: 'month', label: 'Month', sortable: true },
    { 
      key: 'amount', 
      label: 'Amount', 
      sortable: true,
      render: (value: number) => formatCurrency(value)
    },
    { 
      key: 'status', 
      label: 'Status', 
      sortable: true,
      render: (value: string) => <StatusBadge status={value} />
    },
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'paidAt', label: 'Paid Date', sortable: true },
  ];

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl text-white font-bold text-gray-900">Billing</h1>
              <p className="text-gray-200 font-medium">Manage invoices and payments</p>
            </div>
            <Button 
              onClick={() => {
                setEditingInvoice(null);
                setShowForm(true);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-green-800 dark:text-green-800">Total Revenue</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-800">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold">
                  From paid invoices
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-orange-800 dark:text-orange-800">Outstanding Dues</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-800">
                  {formatCurrency(outstandingDues)}
                </div>
                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 font-semibold">
                  Pending payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-800">Total Invoices</CardTitle>
                <div className="p-2 bg-blue-500 rounded-lg">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-800">
                  {invoices.length}
                </div>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-semibold">
                  All invoices
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChartComponent
              data={[]}
              title="Revenue Trend"
              description="Monthly revenue over time"
            />
            <PieChartComponent
              data={[]}
              title="Payment Status"
              description="Distribution of payment statuses"
            />
          </div>

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <InvoiceForm
                  onSubmit={handleInvoiceSubmit}
                  initialData={editingInvoice}
                  isEditing={!!editingInvoice}
                  tenants={tenants}
                />
                <div className="p-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingInvoice(null);
                    }}
                    className="w-full"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <DataTable
            data={filteredInvoices}
            columns={columns}
            onRowClick={handleViewInvoice}
            actions={(row) => (
              <>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleViewInvoice(row)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Invoice
                </button>
                {row.status === 'DUE' && (
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                    onClick={() => handleSendReminder(row.id)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </button>
                )}
                {row.status === 'PAID' && row.receiptNo && (
                  <button 
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                    onClick={() => handleDownloadReceipt(row.receiptNo!)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </button>
                )}
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={() => handleEditInvoice(row)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={() => handleDeleteInvoice(row.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </>
            )}
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}