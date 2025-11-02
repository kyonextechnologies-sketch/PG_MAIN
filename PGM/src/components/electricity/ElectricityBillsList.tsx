'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  FileText,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { ElectricityBill } from '@/lib/types';
import { useDebounce } from '@/hooks/useDebounce';

export const ElectricityBillsList: React.FC = () => {
  // ❌ DELETED: useElectricityStore removed - using local state instead
  // const { bills } = useElectricityStore();
  const [bills, setBills] = useState<ElectricityBill[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Debounce search term to avoid excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredBills = useMemo(() => {
    return bills.filter(bill => {
      const matchesSearch = debouncedSearchTerm === '' || 
        bill.tenant?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        bill.tenant?.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, debouncedSearchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      case 'PAID':
        return <Badge variant="outline" className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Electricity Bills
        </CardTitle>
        <CardDescription>
          Review and manage electricity bill submissions from tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search by tenant name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-4">
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No electricity bills found</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{bill.tenant?.name || 'Unknown Tenant'}</h3>
                      {getStatusBadge(bill.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{bill.tenant?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{bill.month}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold text-foreground">{formatCurrency(bill.amount)}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Previous Reading:</span>
                        <p className="font-medium">{bill.previousReading}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current Reading:</span>
                        <p className="font-medium">{bill.currentReading}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Units Used:</span>
                        <p className="font-medium">{bill.units}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rate per Unit:</span>
                        <p className="font-medium">₹{bill.ratePerUnit}</p>
                      </div>
                    </div>

                    {bill.notes && (
                      <div className="mt-3">
                        <span className="text-muted-foreground text-sm">Notes:</span>
                        <p className="text-sm mt-1">{bill.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {bill.status === 'PENDING' && (
                      <>
                        <Button size="sm" className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm" className="flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {bill.imageUrl && (
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};


