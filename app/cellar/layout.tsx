import { NavWrapper } from '@/components/layout/nav-wrapper';

export default function CellarLayout({
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
