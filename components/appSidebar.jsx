import { useRouter } from "next/router"
import Link from "next/link"
import {
  Tags,
  Euro,
  BookCheck,
  Gauge,
  LayoutDashboard,
  User2,
  Cable,
  UserRoundCog,
  BriefcaseBusiness,
  ChevronRight,
  Wallet,
} from "lucide-react"
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
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const AppSidebar = () => {
  const { toggleSidebar, state } = useSidebar()
  const router = useRouter()

  const links = [
    { label: "Dashboard", icon: LayoutDashboard, pageLink: "/projects/specific" },
    { label: "Sales", icon: Tags, pageLink: "/sales" },
    { label: "Invoices", icon: BookCheck, pageLink: "/invoices" },
    { label: "Transactions", icon: Euro, pageLink: "/transactions" },
    { label: "Expenses", icon: Gauge, pageLink: "/expenses" },
  ]

  const secLinks = [
    { label: "Accounts", icon: Wallet, pageLink: "/accounts" },
    { label: "Clients", icon: User2, pageLink: "/clients" },
    { label: "Suppliers", icon: Cable, pageLink: "/suppliers" },
    { label: "Agents", icon: UserRoundCog, pageLink: "/agents" },
    // { label: "Staff", icon: BriefcaseBusiness, pageLink: "/staff" },
  ]

  return (
    <Sidebar
      className="py-2 bg-gradient-to-b from-primary/10 to-primary/5 border-r border-primary/10"
      variant="floating"
      collapsible="icon"
    >
      <SidebarHeader className=" py-2">
        <div className="flex items-center justify-between">
          <SidebarTrigger />
        </div>
        {/* {state === "expanded" && <h1 className="text-xl font-bold mt-2 text-primary">Company Name</h1>} */}
      </SidebarHeader>
      <SidebarContent className="">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-primary/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="group transition-all duration-300 ease-in-out">
                    <Link
                      href={item.pageLink}
                      className={`flex items-center space-x-3 rounded-md px-3 py-2 ${
                        router.pathname === item.pageLink ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4 bg-primary/20" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-primary/70">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secLinks.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="group transition-all duration-300 ease-in-out">
                    <Link
                      href={item.pageLink}
                      className={`flex items-center space-x-3 rounded-md px-3 py-2 ${
                        router.pathname === item.pageLink ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter className="mt-auto px-3 py-2">
        <Button variant="outline" className="w-full justify-start">
          <User2 className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </Button>
      </SidebarFooter> */}
    </Sidebar>
  )
}

export default AppSidebar