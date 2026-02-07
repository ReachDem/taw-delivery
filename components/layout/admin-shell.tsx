'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';

export function AdminShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={() => setIsCollapsed(!isCollapsed)}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />
            <div className={cn(
                "transition-[margin] duration-300 ease-in-out min-h-screen flex flex-col",
                isCollapsed ? "lg:ml-20" : "lg:ml-64",
                "ml-0" // Always 0 margin on mobile (sidebar is overlay)
            )}>
                <Header onToggleSidebar={() => setIsMobileOpen(true)} />
                <main className="p-6 flex-1">{children}</main>
            </div>
        </div>
    );
}
