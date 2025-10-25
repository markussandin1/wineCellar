import { Nav } from '@/components/layout/nav';

export default function CellarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
