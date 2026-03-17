'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  List, 
  Receipt, 
  Hash, 
  File, 
  Settings 
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/projects', label: 'Projects', icon: Briefcase },
    { href: '/proposals', label: 'Proposals', icon: FileText },
    { href: '/proposal-line-items', label: 'Proposal Line Items', icon: List },
    { href: '/invoices', label: 'Invoices', icon: Receipt },
    { href: '/invoice-line-items', label: 'Invoice Line Items', icon: Hash },
    { href: '/files', label: 'Files', icon: File },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white h-full border-r border-gray-200">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">ClientDesk</h1>
          <UserButton />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}