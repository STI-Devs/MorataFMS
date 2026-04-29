import { useEffect, useRef, useState } from 'react';
import type { VesselGroup } from '../../../tracking/types/tracking.types';
import type { AdminReviewQueueItem } from '../../types/document.types';

/**
 * Manages the local UI state for the AdminReviewQueuePane:
 * - which vessel groups are expanded (auto-opens new groups, removes stale)
 * - filter popover open/close with outside-click dismissal
 */
export function useAdminReviewQueueGroups(groups: VesselGroup<AdminReviewQueueItem>[]) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        () => new Set(groups.map((group) => group.vesselKey)),
    );
    const seenGroupsRef = useRef<Set<string>>(new Set(groups.map((group) => group.vesselKey)));

    // Close popover on outside click
    useEffect(() => {
        if (!popoverOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPopoverOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [popoverOpen]);

    useEffect(() => {
        setExpandedGroups((previous) => {
            let hasNewGroup = false;
            const next = new Set(previous);

            for (const group of groups) {
                if (!seenGroupsRef.current.has(group.vesselKey)) {
                    seenGroupsRef.current.add(group.vesselKey);
                    next.add(group.vesselKey);
                    hasNewGroup = true;
                }
            }

            for (const key of Array.from(next)) {
                if (!groups.some((group) => group.vesselKey === key)) {
                    next.delete(key);
                }
            }

            return hasNewGroup ? next : new Set(next);
        });
    }, [groups]);

    const toggleGroup = (key: string) => {
        setExpandedGroups((previous) => {
            const next = new Set(previous);

            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }

            return next;
        });
    };

    return {
        popoverOpen,
        setPopoverOpen,
        popoverRef,
        expandedGroups,
        toggleGroup,
    };
}
