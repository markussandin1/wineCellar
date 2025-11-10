import { NavWrapper } from '@/components/layout/nav-wrapper';

export default function SettingsLayout({
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
