import React from 'react';
import { User, Resident } from '../../../types';
import VisitorInvitationComponent from '../components/VisitorInvitation';

interface VisitorInvitationsPageProps {
  user: User | Resident;
}

export default function VisitorInvitationsPage({ user }: VisitorInvitationsPageProps) {
  const residentId = (user as any).resident_id || user.id || 'R083';
  const residentName = user.name || 'Resident';
  const residentFlat = (user as any).flat || '101';
  const residentTower = (user as any).tower || 'A';

  return (
    <div className="space-y-6">
      <VisitorInvitationComponent
        resident={{
          resident_id: residentId,
          name: residentName,
          flat: residentFlat,
          tower: residentTower
        }}
      />
    </div>
  );
}
