'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  List,
  Receipt,
  ListChecks,
  FolderOpen,
  Palette
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Projects', href: '/projects', icon: Briefcase },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Proposal Line Items', href: '/proposal-line-items', icon: List },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Invoice Line Items', href: '/invoice-line-items', icon: ListChecks },
    { name: 'Files', href: '/files', icon: FolderOpen },
    { name: 'Branding', href: '/branding', icon: Palette },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">ClientDesk</h1>
        <UserButton />
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}