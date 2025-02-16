import "@/styles/globals.css";
import AppSidebar from "@/components/appSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function App({ Component, pageProps }) {
  const pathname = usePathname()
  const router = useRouter();
  console.log(pathname);

  return (
    <SidebarProvider style={{ "--sidebar-width": "12rem", "--sidebar-width-mobile": "20rem",}}>
      { pathname !== "/" && <AppSidebar /> }
      <main className="p-4 flex-1 space-y-2">
        {
          pathname !== "/" && 
          <div className="flex items-center p-1 w-full h-10 border rounded-lg" >
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()} className="w-8 h-8">
                <ArrowLeft />
              </Button>
              <Button variant="outline" onClick={() => router.replace('/')} className="w-8 h-8">
                <Home />
              </Button>
            </div>
            
          </div>
        }
        
        <Component {...pageProps} />
      </main>
    </SidebarProvider>
  );
}
