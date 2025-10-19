import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useUserStore } from "@/store/userStore"
import Link from "next/link"

export function SiteHeader() {
  const { isLogedIn} = useUserStore()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* <h1 className="text-base font-medium">Documents</h1> */}
        { !isLogedIn &&
          <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden cursor-pointer sm:flex bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>
        }
      </div>
    </header>
  )
}
