export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function spotsLeft(event: { max_capacity: number; current_participants: number }): number {
  return event.max_capacity - event.current_participants;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Draft',
    published: 'Published',
    cancelled: 'Cancelled',
    completed: 'Completed',
    confirmed: 'Confirmed',
  };
  return map[status] || status;
}
