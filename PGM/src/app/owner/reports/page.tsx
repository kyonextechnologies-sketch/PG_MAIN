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
import { PageHeader } from '@/components/common/PageHeader';
import { motion } from 'framer-motion';

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
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <PageHeader
            title="Reports"
            description="Generate and export detailed reports"
            breadcrumbs={[
              { label: 'Dashboard', href: '/owner/dashboard' },
              { label: 'Reports' }
            ]}
            actions={
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('PDF')}
                  className="w-full sm:w-auto text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('CSV')}
                  className="w-full sm:w-auto text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
              </div>
            }
          />

          {/* Report Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-lg">
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">Report Configuration</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 font-medium">Select report type and date range</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportType" className="text-gray-900 dark:text-gray-100 font-semibold text-sm">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="!text-black bg-white dark:bg-gray-700 dark:!text-white border-gray-300 dark:border-gray-600 w-full [&>span]:!text-black dark:[&>span]:!text-white">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="REVENUE" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Revenue Report</SelectItem>
                        <SelectItem value="OCCUPANCY" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Occupancy Report</SelectItem>
                        <SelectItem value="AGING" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Aging Report</SelectItem>
                        <SelectItem value="TENANT" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Tenant Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateRange" className="text-gray-900 dark:text-gray-100 font-semibold text-sm">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="!text-black bg-white dark:bg-gray-700 dark:!text-white border-gray-300 dark:border-gray-600 w-full [&>span]:!text-black dark:[&>span]:!text-white">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800">
                        <SelectItem value="LAST_7_DAYS" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Last 7 Days</SelectItem>
                        <SelectItem value="LAST_30_DAYS" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Last 30 Days</SelectItem>
                        <SelectItem value="LAST_3_MONTHS" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Last 3 Months</SelectItem>
                        <SelectItem value="LAST_6_MONTHS" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Last 6 Months</SelectItem>
                        <SelectItem value="LAST_YEAR" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Last Year</SelectItem>
                        <SelectItem value="CUSTOM" className="!text-black dark:!text-white hover:!text-white focus:!text-white">Custom Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {dateRange === 'CUSTOM' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="text-gray-900 dark:text-gray-100 text-sm">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="text-gray-900 dark:text-gray-100 text-sm">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 w-full"
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue Report */}
          {reportType === 'REVENUE' && (
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-green-900 dark:text-green-100">
                    <div className="p-2 bg-green-500 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span>Revenue Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Chart or data visualization would go here */}
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Revenue trend chart will appear here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100">
                    <div className="p-2 bg-blue-500 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span>Revenue Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Total Revenue</span>
                      <span className="font-bold text-blue-900 dark:text-blue-300 text-lg sm:text-xl">
                        ₹0.00
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Average Monthly</span>
                      <span className="font-bold text-blue-800 dark:text-blue-300 text-base sm:text-lg">
                        ₹0.00
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Growth Rate</span>
                      <span className="font-bold text-green-700 dark:text-green-400 text-base sm:text-lg bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full inline-block w-fit">+12.5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Occupancy Report */}
          {reportType === 'OCCUPANCY' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-blue-500 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Building className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span>Occupancy by Property</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Occupancy data will appear here */}
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Occupancy data will appear here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Aging Report */}
          {reportType === 'AGING' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-red-500 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span>Aging Report</span>
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-2">Outstanding dues by tenant</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {/* Aging data will appear here */}
                    <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aging report data will appear here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tenant Report */}
          {reportType === 'TENANT' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-t-lg p-4 sm:p-6">
                  <CardTitle className="flex items-center text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                    <div className="p-2 bg-purple-500 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span>Tenant Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-blue-800 dark:text-blue-300">18</div>
                      <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-400 font-semibold mt-2">Active Tenants</div>
                    </div>
                    <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-green-800 dark:text-green-300">85%</div>
                      <div className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-semibold mt-2">Occupancy Rate</div>
                    </div>
                    <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-purple-800 dark:text-purple-300">2</div>
                      <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 font-semibold mt-2">Properties</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 rounded-t-lg p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Export Options</CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">Download your report in various formats</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button 
                    onClick={() => handleExport('PDF')} 
                    className="flex items-center justify-center w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export as PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('CSV')} 
                    className="flex items-center justify-center w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export as CSV</span>
                    <span className="sm:hidden">CSV</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleExport('EXCEL')} 
                    className="flex items-center justify-center w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Export as Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}