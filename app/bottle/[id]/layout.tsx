import { Nav } from '@/components/layout/nav';

export default function BottleLayout({
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
