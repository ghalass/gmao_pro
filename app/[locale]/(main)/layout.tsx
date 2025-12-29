// app/[locale]/(main)/layout.tsx
import { AppSidebar } from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-screen h-screen overflow-hidden bg-muted/40">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="sticky top-0 z-20 bg-background/70 backdrop-blur-md border-b mt-2 mr-2">
            <Navbar />
          </div>
          <main className="flex-1 overflow-y-auto p-4 bg-background rounded-b-lg shadow-innerbordermb-2 mr-2">
            <div className="max-w-400 mx-auto ">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
