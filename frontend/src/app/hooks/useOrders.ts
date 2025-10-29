"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useOrders() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const getToken = () => {
    return localStorage.getItem('token');
  };

  const createOrder = async (data: {
    serviceType: string;
    address: string;
    city: string;
    district: string;
    scheduledTime: string;
    comment?: string;
    price?: number; 
  }) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMyOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/orders/my`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/orders/available`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        router.push('/auth');
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/orders/${orderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to accept order');
      }

      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to accept order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
  setLoading(true);
  setError(null);

  try {
    const token = getToken();
    if (!token) {
      router.push('/auth');
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update status');
    }

    return result;
  } catch (err: any) {
    setError(err.message || 'Failed to update status');
    throw err;
  } finally {
    setLoading(false);
  }
};

const markPaymentReceived = async (orderId: string) => {
  setLoading(true);
  setError(null);

  try {
    const token = getToken();
    if (!token) {
      router.push('/auth');
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/orders/${orderId}/payment-received`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to mark payment');
    }

    return result;
  } catch (err: any) {
    setError(err.message || 'Failed to mark payment');
    throw err;
  } finally {
    setLoading(false);
  }
};

const getOrderById = async (orderId: string) => {
  setLoading(true);
  setError(null);

  try {
    const token = getToken();
    if (!token) {
      router.push('/auth');
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch order');
    }

    return result;
  } catch (err: any) {
    setError(err.message || 'Failed to fetch order');
    throw err;
  } finally {
    setLoading(false);
  }
};

return { 
  createOrder, 
  getMyOrders, 
  getAvailableOrders, 
  acceptOrder, 
  updateOrderStatus,
  markPaymentReceived,
  getOrderById,
  loading, 
  error 
};
}