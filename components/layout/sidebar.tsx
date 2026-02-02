'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Building,
  Users,
  FileText,
  CreditCard,
  Wallet,
  BarChart3,
  Settings
} from 'lucide-react';
import Image from 'next/image';
import Logo from '@/assets/logos/logos-02.svg';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Properties', href: '/properties', icon: Building },
  { name: 'Units', href: '/units', icon: Home },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  // { name: 'Payment History', href: '/payments/history', icon: History },
  // { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <div className="relative w-40 h-10">
          <Image
            src={Logo}
            alt="Verit Logo"
            fill
            className="object-contain" // Ensures the logo scales correctly within the container
            priority
          />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200">
        <Link
          href="/settings"
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  );
}