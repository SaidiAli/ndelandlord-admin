'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, FileText, Filter, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { leasesApi } from '@/lib/api';
import { Lease } from '@/types';
import { CreateLeaseModal } from '@/components/leases/CreateLeaseModal';
import { EditLeaseModal } from '@/components/leases/EditLeaseModal';
import { EnhancedLeaseDetailsModal } from '@/components/leases/EnhancedLeaseDetailsModal';
import { getColumns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/hooks/useAuth';
import { formatUGX } from '@/lib/currency';

export default function LeasesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();

  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ['leases', user?.id],
    queryFn: () => leasesApi.getAll(),
    enabled: !!user,
  });

  const leases: Lease[] = leasesData?.data || [];
  
  // Filter leases based on search term and status
  const filteredLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.tenant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unit?.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.unit?.property?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lease.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate lease statistics
  const leaseStats = {
    total: leases.length,
    active: leases.filter(l => l.status === 'active').length,
    draft: leases.filter(l => l.status === 'draft').length,
    expiring: leases.filter(l => l.status === 'expiring').length,
    expired: leases.filter(l => l.status === 'expired').length,
    totalBalance: leases.reduce((sum, l) => sum + (l.balance || 0), 0),
    totalRent: leases.filter(l => l.status === 'active').reduce((sum, l) => sum + l.monthlyRent, 0)
  };
  
  const handleEdit = (lease: Lease) => {
    setSelectedLease(lease);
    setIsEditModalOpen(true);
  };

  const handleViewDetails = (leaseId: string) => {
    setSelectedLeaseId(leaseId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedLeaseId(null);
  };

  const columns = getColumns(handleEdit, handleViewDetails);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
            <p className="text-gray-600">Manage lease agreements and payment schedules</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Lease
          </Button>
        </div>

        {/* Lease Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaseStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {leaseStats.active} active, {leaseStats.draft} draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{leaseStats.active}</div>
              <p className="text-xs text-muted-foreground">
                {formatUGX(leaseStats.totalRent)} monthly revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{leaseStats.expiring}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <AlertCircle className={`h-4 w-4 ${leaseStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${leaseStats.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatUGX(leaseStats.totalBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total owed across all leases
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Leases</CardTitle>
            <CardDescription>Manage lease agreements and track payment schedules.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by tenant name, unit, or property..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {leasesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading leases...</p>
              </div>
            ) : filteredLeases.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-4 font-semibold">
                  {searchTerm || statusFilter !== 'all' ? 'No leases match your filters' : 'No leases found'}
                </p>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search criteria.' : 'Get started by creating a new lease.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Lease
                  </Button>
                )}
              </div>
            ) : (
                <DataTable columns={columns} data={filteredLeases} searchKey="tenant" />
            )}
          </CardContent>
        </Card>
      </div>
      <CreateLeaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
      <EditLeaseModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} lease={selectedLease} />
      <EnhancedLeaseDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={handleCloseDetailsModal} 
        leaseId={selectedLeaseId} 
      />
    </>
  );
}