'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  Building2,
  Users,
  FileText,
  Download,
  AlertCircle,
  Shield,
  Eye,
  Image,
  File,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';

const formatFileSize = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function OwnerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const ownerId = params.id as string;

  const [owner, setOwner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'VERIFIED' | 'REJECTED' | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');

  useEffect(() => {
    loadOwnerDetails();
  }, [ownerId]);

  const loadOwnerDetails = async () => {
    try {
      const response = await apiClient.get(`/admin/owners/${ownerId}`);
      if (response.success) {
        setOwner(response.data);
      }
    } catch (error) {
      console.error('Failed to load owner details:', error);
      toast.error('Failed to load owner details');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (action: 'VERIFIED' | 'REJECTED') => {
    setVerifyAction(action);
    setVerifyNotes('');
    setShowVerifyModal(true);
  };

  const handleVerifyOwner = async () => {
    if (!verifyAction) return;

    if (verifyAction === 'REJECTED' && !verifyNotes.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      const response = await apiClient.post(`/admin/owners/${ownerId}/verify`, {
        status: verifyAction,
        notes: verifyNotes,
        rejectionReason: verifyAction === 'REJECTED' ? verifyNotes : undefined,
      });

      if (response.success) {
        toast.success(`Owner ${verifyAction.toLowerCase()} successfully!`);
        setShowVerifyModal(false);
        loadOwnerDetails();
      }
    } catch (error) {
      toast.error('Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 bg-[#1a1a1a] rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Owner not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const verificationStatus = owner.ownerVerification?.verificationStatus || 'PENDING';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        onClick={() => router.back()}
        variant="ghost"
        className="text-white hover:bg-[#252525]"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Owners
      </Button>

      {/* Owner Info Header */}
      <Card className="bg-[#1a1a1a] border-[#333333]">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-4">{owner.name}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="w-5 h-5" />
                  <span>{owner.email}</span>
                </div>
                {owner.phone && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <Phone className="w-5 h-5" />
                    <span>{owner.phone}</span>
                    {owner.phoneVerified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="w-5 h-5" />
                  <span>Joined {new Date(owner.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Verification Actions */}
            {verificationStatus === 'PENDING' && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => openVerifyModal('VERIFIED')}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Owner
                </Button>
                <Button
                  onClick={() => openVerifyModal('REJECTED')}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}

            {verificationStatus === 'VERIFIED' && (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-6 h-6" />
                <span className="font-semibold">Verified</span>
              </div>
            )}

            {verificationStatus === 'REJECTED' && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-6 h-6" />
                <span className="font-semibold">Rejected</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1a1a1a] border-[#333333]">
          <CardContent className="p-6 text-center">
            <Building2 className="w-8 h-8 text-[#f5c518] mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{owner._count.properties}</p>
            <p className="text-gray-400 text-sm">Properties</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#333333]">
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-[#f5c518] mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">{owner._count.ownedTenants}</p>
            <p className="text-gray-400 text-sm">Tenants</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#333333]">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-[#f5c518] mx-auto mb-2" />
            <p className="text-3xl font-bold text-white">
              {owner.ownerVerification?.documents?.length || 0}
            </p>
            <p className="text-gray-400 text-sm">Documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Legal Documents - Premium Design */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-2 border-[#333333]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-[#f5c518]" />
                Verification Documents
              </CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                Review uploaded legal documents for verification
              </CardDescription>
            </div>
            {owner.ownerVerification?.legalDocuments && (
              <div className={`px-4 py-2 rounded-full font-semibold text-sm ${
                verificationStatus === 'VERIFIED' 
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : verificationStatus === 'REJECTED'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                {verificationStatus === 'VERIFIED' && <><CheckCircle className="w-4 h-4 inline mr-1" /> Verified</>}
                {verificationStatus === 'REJECTED' && <><XCircle className="w-4 h-4 inline mr-1" /> Rejected</>}
                {verificationStatus === 'PENDING' && <><AlertCircle className="w-4 h-4 inline mr-1" /> Pending Review</>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {owner.ownerVerification?.legalDocuments && owner.ownerVerification.legalDocuments.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#333333] bg-[#111111]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1f1f1f] text-[#bbbbbb] uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {owner.ownerVerification.legalDocuments.map((doc: any, index: number) => (
                    <tr key={`${doc.filename}-${index}`} className="hover:bg-[#1c1c1c] transition">
                      <td className="px-4 py-3 text-[#f5c518] font-semibold">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#f5c518]/10 rounded-lg">
                            {doc.filename?.endsWith('.pdf') ? (
                              <File className="w-4 h-4 text-[#f5c518]" />
                            ) : (
                              <Image className="w-4 h-4 text-[#f5c518]" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-semibold truncate max-w-[220px]">
                              {doc.originalname || doc.filename || `Document ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {doc.propertyName || 'All Properties'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {doc.mimetype?.toUpperCase() || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {formatFileSize(doc.fileSize)}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#f5c518]/50 text-[#f5c518] hover:bg-[#f5c518]/10"
                            onClick={() => doc.url && window.open(doc.url, '_blank')}
                            disabled={!doc.url}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            disabled={!doc.url}
                            onClick={() => {
                              if (doc.url) {
                                const link = document.createElement('a');
                                link.href = doc.url;
                                link.download = doc.originalname || doc.filename;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No documents uploaded yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Owner needs to upload verification documents
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties */}
      {owner.properties && owner.properties.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {owner.properties.map((property: any) => (
                <div
                  key={property.id}
                  className="p-4 bg-[#252525] rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-semibold">{property.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{property.address}</p>
                      <div className="flex gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          {property.totalRooms} Rooms
                        </span>
                        <span className="text-xs text-gray-500">
                          {property.totalBeds} Beds
                        </span>
                        <span className="text-xs text-gray-500">
                          {property._count?.tenants || 0} Tenants
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.active
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {property.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Notes */}
      {owner.ownerVerification?.notes && (
        <Card className="bg-[#1a1a1a] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Verification Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">{owner.ownerVerification.notes}</p>
            {owner.ownerVerification.verifiedAt && (
              <p className="text-sm text-gray-500 mt-2">
                Verified on {new Date(owner.ownerVerification.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {owner.ownerVerification?.rejectionReason && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-500">Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{owner.ownerVerification.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Verification Modal */}
      {showVerifyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVerifyModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-[#1a1a1a] border-2 border-[#333333]">
              <CardHeader className={`${
                verifyAction === 'VERIFIED' 
                  ? 'bg-gradient-to-r from-green-500/20 to-green-600/20' 
                  : 'bg-gradient-to-r from-red-500/20 to-red-600/20'
              }`}>
                <CardTitle className="text-white flex items-center gap-3">
                  {verifyAction === 'VERIFIED' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      Approve Owner Verification
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-400" />
                      Reject Owner Verification
                    </>
                  )}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {verifyAction === 'VERIFIED' 
                    ? 'Confirm that all documents are valid and approve this owner'
                    : 'Provide a clear reason for rejection'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-[#252525] rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Owner Name</p>
                  <p className="text-white font-semibold">{owner.name}</p>
                </div>

                <div>
                  <Label className="text-white mb-2 block">
                    {verifyAction === 'VERIFIED' ? 'Verification Notes (Optional)' : 'Rejection Reason (Required)'}
                  </Label>
                  <Textarea
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder={
                      verifyAction === 'VERIFIED'
                        ? 'Add any additional notes...'
                        : 'Explain why the documents are being rejected...'
                    }
                    className="bg-[#252525] border-[#333333] text-white placeholder:text-gray-500 min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowVerifyModal(false)}
                    variant="outline"
                    className="flex-1 border-[#333333] text-gray-400 hover:bg-[#252525]"
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerifyOwner}
                    className={`flex-1 ${
                      verifyAction === 'VERIFIED'
                        ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    } text-white shadow-lg`}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        {verifyAction === 'VERIFIED' ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

