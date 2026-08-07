import React from 'react';

export function LockerStatusBadgeV2({ status }: { status: string }) {
    return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-600">{status}</span>;
}