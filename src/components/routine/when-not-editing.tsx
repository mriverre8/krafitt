'use client';

import { useEditMode } from '@/lib/edit-mode';
import type { ReactNode } from 'react';

/** Its children step aside while editing. */
export function WhenNotEditing({ children }: { children: ReactNode }) {
    return useEditMode() ? null : children;
}
