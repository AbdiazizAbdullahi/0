import "@/styles/globals.css";
import AppSidebar from "@/components/appSidebar";
import { NewITES } from "@/components/commonComp/newITES";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DatabaseBackup, Home, LogOut, RefreshCw } from "lucide-react";
import useLoginStore from "@/stores/loginStore";
import { useEffect, useState } from "react";

function SplashScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h1 className="text-2xl font-semibold">Loading...</h1>
      </div>
    </div>
  );
}

export default function App({ Component, pageProps }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoginStoreReady, setIsLoginStoreReady] = useState(false);
  const logout = useLoginStore((state) => state.logout);
  const loginStatus = useLoginStore((state) => state.isLoggedIn);
  const userInfo = useLoginStore((state) => state.user);
  console.log('isLoggedIn', isLoggedIn, 'user', user);

  // Update login store data
  useEffect(() => {
    if (loginStatus !== undefined && userInfo !== undefined) {
      setIsLoginStoreReady(true);
      setIsLoggedIn(loginStatus);
      setUser(userInfo);
    }
  }, [loginStatus, userInfo]);

  // Authentication initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!isLoginStoreReady) return;

        if (!isLoggedIn) {
          await checkAdmin();
          if (pathname !== "/auth/login") {
            await router.replace("/auth/login", undefined, { shallow: true });
          }
        }
        setIsAuthChecked(true);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setIsAuthChecked(true);
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isLoggedIn, userInfo, isLoginStoreReady]);

  // Separate effect for handling route protection
  useEffect(() => {
    if (isAuthChecked && !isLoading) {
      if (!isLoggedIn && pathname !== "/auth/login") {
        router.replace("/auth/login", undefined, { shallow: true });
      }
    }
  }, [isLoggedIn, pathname, isAuthChecked, isLoading]);

  const checkAdmin = async () => {
    try {
      const response = await window.electronAPI.mainOperation("seedAdminIfNeeded");
      if (response.success) {
        console.log("Admin seeded successfully");
      } else {
        console.error("Failed to seed admin:", response.error);
      }
    } catch (error) {
      console.error("Error seeding admin:", error);
    }
  };

  // Always show splash screen until auth is checked
  if (isLoading || !isAuthChecked || !isLoginStoreReady) {
    return <SplashScreen />;
  }

  // Don't show layout for login page
  if (pathname === "/auth/login") {
    return <Component {...pageProps} />;
  }

  // Protect all other routes
  if (!isLoggedIn) {
    return <SplashScreen />;
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "14rem", "--sidebar-width-mobile": "20rem" }}>
      {pathname !== "/" && <AppSidebar />}
      <main className="p-4 flex-1 space-y-2">
        {pathname !== "/" && (
          <div className="flex items-center justify-between p-1 w-full h-10 border rounded-lg">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()} className="w-8 h-8">
                <ArrowLeft />
              </Button>
              <Button variant="outline" onClick={() => router.replace('/')} className="w-8 h-8">
                <Home />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push('/bulk')} className="w-8 h-8">
                <DatabaseBackup />
              </Button>
              <NewITES />
              <Button variant="outline" onClick={logout} className="w-8 h-8">
                <LogOut />
              </Button>
            </div>
          </div>
        )}
        <Component {...pageProps} />
      </main>
    </SidebarProvider>
  );
}
