import { useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import type { MutationStatus } from '@/components/mutation-status-drawer';

export function useMutationFeedback() {
  const [status, setStatus] = useState<MutationStatus>('idle');
  const [message, setMessage] = useState('');

  return {
    message,
    status,
    closeFeedback: () => setStatus('idle'),
    showError: (error: unknown) => {
      setMessage(getApiErrorMessage(error));
      setStatus('error');
    },
    showSuccess: (successMessage: string) => {
      setMessage(successMessage);
      setStatus('success');
    },
  };
}
