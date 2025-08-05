import React, { useState } from 'react'
import SellerSidebar from './SellerSidebar'
import SellerMobileSidebar from './SellerMobileSidebar'
import SellerHeader from './SellerHeader'

interface SellerLayoutProps {
  children: React.ReactNode
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      <SellerMobileSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <SellerSidebar />

      <div className="lg:pl-72">
        <SellerHeader setSidebarOpen={setSidebarOpen} />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}