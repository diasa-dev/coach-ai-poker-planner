import { EdgePlanShell } from "@/components/edgeplan-shell";

export default function EdgePlanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EdgePlanShell>{children}</EdgePlanShell>;
}
