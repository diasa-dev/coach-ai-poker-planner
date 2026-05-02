import { UplineaShell } from "@/components/uplinea-shell";

export default function UplineaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UplineaShell>{children}</UplineaShell>;
}
