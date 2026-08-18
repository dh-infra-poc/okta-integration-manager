import { AppShell } from "@/components/app/app-shell"
import { Container } from "@/components/app/container"
import { NavBar, NavLink } from "@/components/app/nav-bar"
import { Badge } from "@/components/app/badge"
import { currentViewer } from "@/lib/auth"

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/apps", label: "Okta apps" },
  { href: "/connectors", label: "Connectors" },
  { href: "/projects", label: "Projects" },
  { href: "/api-docs", label: "API" },
]

/** The frame every console page renders inside. */
export async function ConsoleShell({
  current,
  children,
}: {
  current: string
  children: React.ReactNode
}) {
  const viewer = await currentViewer()

  return (
    <AppShell
      nav={
        <NavBar
          actions={
            viewer ? (
              <span className="hidden text-xs font-[300] text-dh-muted sm:inline">
                {viewer.email ?? viewer.subject}
                {!viewer.verified ? " (local)" : ""}
              </span>
            ) : (
              <Badge variant="outline">Unprotected</Badge>
            )
          }
        >
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} active={item.href === current}>
              {item.label}
            </NavLink>
          ))}
        </NavBar>
      }
      footer={
        <footer className="mt-16 border-t border-dh-ink/10 py-8">
          <Container>
            <p className="text-xs font-[300] text-dh-muted">
              Okta applications, Vercel Connect connectors, and project Passport — one control plane, two
              interfaces.
            </p>
          </Container>
        </footer>
      }
    >
      <Container className="flex flex-col gap-10 py-12">{children}</Container>
    </AppShell>
  )
}
