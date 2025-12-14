'use client';

import { Search, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Hello, {user?.firstName || user?.userName || 'User'}!
          </h1>
        </div>
      </div>

      <div className="flex flex-row items-center space-x-4 hover:cursor-pointer" onClick={handleLogout}>
        <p className='hover:underline'>Sign Out</p>
        <LogOut className="w-4 h-4" />
      </div>
    </header>
  );
}