'use client';

import { UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  File, 
  Palette,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/clients', icon: Users, label: 'Clients' },
    { href: '/projects', icon: Briefcase, label: 'Projects' },
    { href: '/proposals', icon: FileText, label: 'Proposals' },
    { href: '/proposal-items', icon: CheckSquare, label: 'Proposal Items' },
    { href: '/invoices', icon: Receipt, label: 'Invoices' },
    { href: '/invoice-items', icon: FileSpreadsheet, label: 'Invoice Items' },
    { href: '/files', icon: File, label: 'Files' },
    { href: '/branding', icon: Palette, label: 'Branding' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold text-gray-900">ClientDesk</h1>
        <UserButton />
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}