'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  FileText, 
  Package, 
  Receipt, 
  ShoppingCart, 
  Files, 
  Palette 
} from 'lucide-react';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/proposal-items', label: 'Proposal Items', icon: Package },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/invoice-items', label: 'Invoice Items', icon: ShoppingCart },
  { href: '/project-files', label: 'Project Files', icon: Files },
  { href: '/branding', label: 'Branding', icon: Palette },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">ClientDesk</h1>
          <UserButton />
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}