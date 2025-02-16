import React from "react";
import { useRouter } from "next/router";
import {
  Tags,
  Euro,
  SidebarIcon,
  BookCheck,
  Gauge,
  LayoutDashboard,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "./ui/button";

const AppSidebar = () => {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      pageLink: "/projects/specific"
    },
  {
    label: "Sales",
    icon: Tags,
    pageLink: "/sales",
  },
  {
    label: "Invoices",
    icon: BookCheck,
    pageLink: "/invoices",
  },
  {
    label: "Transaction",
    icon: Euro,
    pageLink: "/transactions",
  },
  {
    label: "Expense",
    icon: Gauge,
    pageLink: "/finances",
  }
];

  return (
    <Sidebar className="py-4" variant="floating" collapsible="icon" >
      <SidebarHeader >
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem className="my-1" key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.pageLink} className={router.pathname === item.pageLink ? "bg-neutral-300" : ""}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
