import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
