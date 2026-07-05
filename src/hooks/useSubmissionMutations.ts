import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '../contexts/DataContext';
import { toast } from '../components/ui';

/**
 * Mutations for submission approval/denial.
 * Pairs TanStack Query with the localStorage DataContext so the UI reflects
 * changes immediately and the query cache stays in sync.
 */
export function useSubmissionMutations() {
  const { approveSubmission, denySubmission } = useData();
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['submissions'] });

  const approve = useMutation({
    mutationFn: ({ id, adminId }: { id: string; adminId: string }) => {
      approveSubmission(id, adminId);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Submission approved!');
      invalidate();
    },
    onError: () => toast.error('Failed to approve submission.'),
  });

  const deny = useMutation({
    mutationFn: ({ id, adminId, comment }: { id: string; adminId: string; comment?: string }) => {
      denySubmission(id, adminId, comment);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Submission denied.');
      invalidate();
    },
    onError: () => toast.error('Failed to deny submission.'),
  });

  return { approve, deny };
}
