import React from 'react';

export function LockerGridV2({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{children}</div>;
}