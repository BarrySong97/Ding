import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Sidebar } from '@/components/layout/sidebar'

export const Route = createRootRoute({
  component: () => (
    <div className="flex overflow-hidden bg-[#f7fffb4f] dark:bg-[#121212] min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto ">
        <div className="h-[30px] fixed w-full  draggable"></div>
        <div className="h-[calc(100vh-30px)]">
          <Outlet />
        </div>
      </main>
    </div>
  )
})
