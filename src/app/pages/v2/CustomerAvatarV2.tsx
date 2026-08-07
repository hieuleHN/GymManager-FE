import React from 'react';

export function CustomerAvatarV2({ name }: { name: string }) {
    return <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">{name?.charAt(0)}</div>;
}