'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';

interface UsePaymentUpdatesOptions {
  enabled?: boolean;
  interval?: number;
  onPaymentUpdate?: (paymentId: string, status: string) => void;
}

export function usePaymentUpdates({
  enabled = true,
  interval = 30000, // 30 seconds
  onPaymentUpdate,
}: UsePaymentUpdatesOptions = {}) {
  const queryClient = useQueryClient();

  const checkForUpdates = useCallback(async () => {
    try {
      // Get current payments data from cache
      const paymentsData = queryClient.getQueryData(['payments']);
      if (!paymentsData || !Array.isArray((paymentsData as any)?.data)) {
        return;
      }

      const currentPayments = (paymentsData as any).data;
      
      // Check for processing payments that might have status updates
      const processingPayments = currentPayments.filter(
        (payment: any) => payment.status === 'processing' || payment.status === 'pending'
      );

      // Check status for each processing payment
      for (const payment of processingPayments) {
        try {
          // Skip if no transaction ID
          if (!payment.transactionId) {
            continue;
          }
          
          const statusResponse = await paymentsApi.getStatus(payment.transactionId);
          const newStatus = statusResponse.data?.status;
          
          if (newStatus && newStatus !== payment.status) {
            // Update the specific payment in cache
            queryClient.setQueryData(['payments'], (oldData: any) => {
              if (!oldData?.data) return oldData;
              
              return {
                ...oldData,
                data: oldData.data.map((p: any) => 
                  p.id === payment.id 
                    ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
                    : p
                ),
              };
            });

            // Trigger callback if provided
            if (onPaymentUpdate) {
              onPaymentUpdate(payment.id, newStatus);
            }

            // Invalidate analytics if payment completed
            if (newStatus === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['payment-analytics'] });
            }
          }
        } catch (error) {
          console.warn('Failed to check status for payment:', payment.id, error);
        }
      }
    } catch (error) {
      console.error('Error checking for payment updates:', error);
    }
  }, [queryClient, onPaymentUpdate]);

  useEffect(() => {
    if (!enabled) return;

    // Run initial check
    checkForUpdates();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkForUpdates, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, interval, checkForUpdates]);

  return {
    checkForUpdates,
  };
}

// Hook for real-time notifications about payment updates
export function usePaymentNotifications() {
  const showNotification = useCallback((paymentId: string, status: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const title = status === 'completed' 
          ? 'Payment Received!' 
          : `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        
        const options = {
          body: `Payment ${paymentId.slice(-8)} is now ${status}`,
          icon: '/favicon.ico',
          tag: `payment-${paymentId}`,
        };

        new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            // Retry notification after permission granted
            showNotification(paymentId, status);
          }
        });
      }
    }
  }, []);

  return {
    showNotification,
  };
}