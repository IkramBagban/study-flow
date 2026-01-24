import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Authentication - StudyFlow',
    description: 'Login or create an account to start learning.',
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                {children}
            </div>
        </div>
    );
}
