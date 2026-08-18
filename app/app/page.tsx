import Link from 'next/link'

import { AppShell } from '@/components/app/app-shell'
import { Badge } from '@/components/app/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/app/card'
import { Container } from '@/components/app/container'
import { Table, TBody, TD, TH, THead, TR } from '@/components/app/data-table'
import { Field, Input, Textarea } from '@/components/app/field'
import { NavBar, NavLink } from '@/components/app/nav-bar'
import { PageHeading } from '@/components/app/page-heading'
import { StatCard } from '@/components/app/stat-card'
import { Wordmark } from '@/components/wordmark'
import { Button } from '@/components/ui/button'

const metrics = [
  { label: 'Orders today', value: '48.2K', hint: 'Across all markets' },
  { label: 'Avg. delivery', value: '24m', hint: 'Door to door' },
  { label: 'Active riders', value: '9,410', hint: 'On shift now' },
  { label: 'Fill rate', value: '98%', hint: 'Orders fulfilled' },
]

const orders = [
  { id: '#DH-4821', market: 'Berlin', total: '€38.40', status: 'Delivered', tone: 'neutral' as const },
  { id: '#DH-4822', market: 'Madrid', total: '€21.10', status: 'In transit', tone: 'red' as const },
  { id: '#DH-4823', market: 'Seoul', total: '₩32,900', status: 'Delivered', tone: 'neutral' as const },
  { id: '#DH-4824', market: 'Cairo', total: 'EGP 210', status: 'Preparing', tone: 'outline' as const },
]

export default function AppDemoPage() {
  return (
    <AppShell
      nav={
        <NavBar
          actions={
            <>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
              <Button size="sm">New order</Button>
            </>
          }
        >
          <NavLink href="/app" active>
            Dashboard
          </NavLink>
          <NavLink href="/app">Orders</NavLink>
          <NavLink href="/app">Markets</NavLink>
          <NavLink href="/">Slide system</NavLink>
        </NavBar>
      }
      footer={
        <footer className="border-t border-dh-ink/10">
          <Container>
            <div className="flex flex-col gap-1 py-8">
              <Wordmark tone="red" className="text-lg" />
              <p className="text-xs font-[300] text-dh-muted">
                Delivery Hero design system — the same brand discipline, applied to apps.
              </p>
            </div>
          </Container>
        </footer>
      }
    >
      <Container>
        <div className="flex flex-col gap-10 py-12">
          <PageHeading
            eyebrow="Operations"
            title="Network overview"
            description="One red doing all the accent work — even in a dense app screen, the accent stays scarce and intentional."
            actions={<Button>Export report</Button>}
          />

          {/* Metrics grid */}
          <div className="grid grid-cols-1 gap-px bg-dh-ink/10 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} hint={m.hint} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
            {/* Orders table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>Live feed across active markets.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <THead>
                    <TR>
                      <TH>Order</TH>
                      <TH>Market</TH>
                      <TH>Total</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {orders.map((o) => (
                      <TR key={o.id}>
                        <TD className="font-[700]">{o.id}</TD>
                        <TD>{o.market}</TD>
                        <TD>{o.total}</TD>
                        <TD>
                          <Badge variant={o.tone}>{o.status}</Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add a market note</CardTitle>
                <CardDescription>Left-aligned form, red only on focus.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <Field label="Market" htmlFor="market">
                  <Input id="market" placeholder="e.g. Berlin" />
                </Field>
                <Field label="Note" htmlFor="note" hint="Keep it short.">
                  <Textarea id="note" placeholder="What's happening in this market?" />
                </Field>
              </CardContent>
              <CardFooter>
                <Button>Save note</Button>
                <Button variant="outline">Cancel</Button>
              </CardFooter>
            </Card>
          </div>

          <p className="text-sm font-[300] text-dh-muted">
            Looking for the deck primitives?{' '}
            <Link href="/" className="font-[700] text-dh-red underline underline-offset-4">
              View the slide system
            </Link>
            .
          </p>
        </div>
      </Container>
    </AppShell>
  )
}
