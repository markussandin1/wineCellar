import { NavWrapper } from '@/components/layout/nav-wrapper';

export default function BottleLayout({
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
