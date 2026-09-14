'use client';

import { useEditMode } from '@/lib/edit-mode';
import type { ReactNode } from 'react';

/** Its children exist only while editing. */
export function WhenEditing({ children }: { children: ReactNode }) {
    return useEditMode() ? children : null;
}
