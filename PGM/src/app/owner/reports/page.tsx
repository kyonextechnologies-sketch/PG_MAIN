'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChartComponent, BarChartComponent, PieChartComponent } from '@/components/ui/charts';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Building,
  FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// ❌ MOCK DATA DISABLED - Showing raw/empty state
// Mock data for reports
// const mockRevenueData = [
//   { month: 'Jan 2024', revenue: 270000, occupancy: 85 },
//   { month: 'Feb 2024', revenue: 240000, occupancy: 80 },
//   { month: 'Mar 2024', revenue: 300000, occupancy: 90 },
//   { month: 'Apr 2024', revenue: 285000, occupancy: 88 },
// ];

// const mockOccupancyData = [
//   { property: 'Sunshine PG', totalBeds: 20, occupiedBeds: 18, occupancy: 90 },
//   { property: 'Green Valley PG', totalBeds: 16, occupiedBeds: 12, occupancy: 75 },
// ];

// const mockAgingReport = [
//   { tenant: 'Jane Smith', property: 'Sunshine PG', amount: 15000, daysOverdue: 5 },
//   { tenant: 'Mike Johnson', property: 'Sunshine PG', amount: 12000, daysOverdue: 10 },
//   { tenant: 'Sarah Wilson', property: 'Green Valley PG', amount: 8000, daysOverdue: 15 },
// ];

export default function ReportsPage() {
  const [reportType, setReportType] = useState('REVENUE');
  const [dateRange, setDateRange] = useState('LAST_3_MONTHS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = (format: 'PDF' | 'CSV' | 'EXCEL') => {
    console.log(`Exporting ${reportType} report as ${format}`);
    // In real app, trigger download
  };

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-700 font-medium">Generate and export detailed reports</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => handleExport('PDF')}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('CSV')}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Report Filters */}
          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-900">Report Configuration</CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">Select report type and date range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="reportType" className="text-gray-900 font-semibold">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVENUE">Revenue Report</SelectItem>
                      <SelectItem value="OCCUPANCY">Occupancy Report</SelectItem>
                      <SelectItem value="AGING">Aging Report</SelectItem>
                      <SelectItem value="TENANT">Tenant Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateRange" className="text-gray-900 font-semibold">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="bg-white text-gray-900 border-gray-300">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                      <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                      <SelectItem value="LAST_3_MONTHS">Last 3 Months</SelectItem>
                      <SelectItem value="LAST_6_MONTHS">Last 6 Months</SelectItem>
                      <SelectItem value="LAST_YEAR">Last Year</SelectItem>
                      <SelectItem value="CUSTOM">Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {dateRange === 'CUSTOM' && (
                  <>
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Report */}
          {reportType === 'REVENUE' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-200 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-green-900">
                    <div className="p-2 bg-green-500 rounded-lg mr-3">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    Revenue Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* {mockRevenueData.map((data, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-bold text-gray-900">{data.month}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-green-700 font-semibold bg-green-100 px-2 py-1 rounded-full">{data.occupancy}% occupancy</span>
                          <span className="font-bold text-green-800 text-lg">
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                      </div>
                    ))} */}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-t-lg">
                  <CardTitle className="flex items-center text-lg font-bold text-blue-900">
                    <div className="p-2 bg-blue-500 rounded-lg mr-3">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    Revenue Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900">Total Revenue</span>
                      <span className="font-bold text-blue-900 text-xl">
                        {/* {formatCurrency(mockRevenueData.reduce((sum, data) => sum + data.revenue, 0))} */}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900">Average Monthly</span>
                      <span className="font-bold text-blue-800 text-lg">
                        {/* {formatCurrency(mockRevenueData.reduce((sum, data) => sum + data.revenue, 0) / mockRevenueData.length)} */}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900">Growth Rate</span>
                      <span className="font-bold text-green-700 text-lg bg-green-100 px-3 py-1 rounded-full">+12.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Occupancy Report */}
          {reportType === 'OCCUPANCY' && (
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
                <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                  <div className="p-2 bg-blue-500 rounded-lg mr-3">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  Occupancy by Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* {mockOccupancyData.map((property, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-gray-900 text-lg">{property.property}</h4>
                        <span className="text-sm text-gray-700 font-semibold bg-blue-100 px-3 py-1 rounded-full">
                          {property.occupiedBeds}/{property.totalBeds} beds
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full shadow-sm"
                          style={{ width: `${property.occupancy}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-700">Occupancy Rate</span>
                        <span className="font-bold text-blue-800 text-lg">{property.occupancy}%</span>
                      </div>
                    </div>
                  ))} */}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aging Report */}
          {reportType === 'AGING' && (
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
                <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                  <div className="p-2 bg-red-500 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Aging Report
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 font-medium">Outstanding dues by tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* {mockAgingReport.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6 hover:shadow-md transition-all duration-300">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{item.tenant}</h4>
                        <p className="text-sm text-gray-700 font-semibold">{item.property}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-700">
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-sm text-red-600 font-semibold bg-red-100 px-3 py-1 rounded-full mt-1">
                          {item.daysOverdue} days overdue
                        </div>
                      </div>
                    </div>
                  ))} */}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tenant Report */}
          {reportType === 'TENANT' && (
            <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                  <div className="p-2 bg-purple-500 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  Tenant Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-4xl font-bold text-blue-800">18</div>
                    <div className="text-sm text-blue-700 font-semibold mt-2">Active Tenants</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-4xl font-bold text-green-800">85%</div>
                    <div className="text-sm text-green-700 font-semibold mt-2">Occupancy Rate</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-4xl font-bold text-purple-800">2</div>
                    <div className="text-sm text-purple-700 font-semibold mt-2">Properties</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          <Card className="bg-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-lg font-bold text-gray-900">Export Options</CardTitle>
              <CardDescription className="text-sm text-gray-600 font-medium">Download your report in various formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button onClick={() => handleExport('PDF')} className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </Button>
                <Button variant="outline" onClick={() => handleExport('CSV')} className="!text-white flex items-center">
                  <Download className="mr-2 h-4 w-4 text-white" />
                  Export as CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('EXCEL')} className="flex items-center !text-white">
                  <Download className="mr-2 h-4 w-4 text-white" />
                  Export as Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RequireRole>
  );
}