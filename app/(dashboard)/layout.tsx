'use client';

import { ReactNode } from 'react';
import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Receipt,
  FileSpreadsheet,
  Folder,
  Palette
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/proposal-items', label: 'Proposal Items', icon: FileSpreadsheet },
    { href: '/invoices', label: 'Invoices', icon: Receipt },
    { href: '/invoice-items', label: 'Invoice Items', icon: FileSpreadsheet },
    { href: '/files', label: 'Files', icon: Folder },
    { href: '/branding', label: 'Branding', icon: Palette }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <div className="p-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">ClientDesk</h1>
          <UserButton />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}