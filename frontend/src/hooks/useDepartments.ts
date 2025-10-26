"use client";

import { useState, useEffect } from "react";

// Department interface
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

// Hook to fetch departments from API
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/departments`);
        const data = await response.json();
        
        if (data.success) {
          setDepartments(data.data);
        } else {
          setError('Failed to fetch departments');
        }
      } catch (err) {
        setError('Failed to fetch departments');
        console.error('Error fetching departments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}