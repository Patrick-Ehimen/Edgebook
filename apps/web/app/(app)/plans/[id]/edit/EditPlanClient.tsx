'use client';

import { usePlan } from '@/features/plans';
import Link from 'next/link';
import { PlanForm } from '../../_components/PlanForm';

const shell: React.CSSProperties = {
  padding: '22px 26px 60px',
  maxWidth: 1200,
  width: '100%',
  alignSelf: 'center',
};

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 14,
  padding: '20px 22px',
  color: 'var(--eb-muted)',
  fontSize: 13,
};

export function EditPlanClient({ planId }: { planId: string }) {
  const { data: plan, isLoading, isError } = usePlan(planId);

  if (isLoading) {
    return (
      <div style={shell}>
        <div style={panel}>Loading plan…</div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div style={shell}>
        <div style={panel}>
          That plan could not be found. <Link href="/plans">Back to plans</Link>
        </div>
      </div>
    );
  }

  // Keyed on the plan id so the form's initial state is rebuilt if the id changes.
  return <PlanForm key={plan.id} plan={plan} />;
}
