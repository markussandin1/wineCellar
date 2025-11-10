import { NavWrapper } from '@/components/layout/nav-wrapper';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavWrapper />
      {children}
    </>
  );
}
