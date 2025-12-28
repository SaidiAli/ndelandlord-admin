import Image from 'next/image';
import Logo from '@/assets/logos/logos-02.svg';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center flex flex-col items-center">
          <div className="relative w-64 h-16">
            <Image
              src={Logo}
              alt="Verit Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="mt-2 text-gray-600">Property Management Dashboard</p>
        </div>
        {children}
      </div>
    </div>
  );
}