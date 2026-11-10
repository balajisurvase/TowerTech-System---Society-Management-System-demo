import React, { useState, useEffect } from 'react';
import { User, Resident } from '../../../types';
import { VisitorRecord } from '../types/visitor';
import { visitorService } from '../services/visitorService';
import VisitorHistoryTable from '../components/VisitorHistoryTable';
import VisitorDetails from '../components/VisitorDetails';

interface VisitorHistoryPageProps {
  user: User;
  residents?: Resident[];
}

export default function VisitorHistoryPage({ user }: VisitorHistoryPageProps) {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecord | null>(null);

  useEffect(() => {
    async function load() {
      const all = await visitorService.getVisitors();
      // If resident, filter for their flat
      if (user.role === 'resident' || !user.role || (user as any).flat) {
        const myFlat = (user as any).flat;
        const myResId = (user as any).resident_id || user.id;
        const filtered = all.filter(v => 
          (myResId && String(v.resident_id) === String(myResId)) ||
          (myFlat && String(v.flat_number).toLowerCase().trim() === String(myFlat).toLowerCase().trim())
        );
        setVisitors(filtered);
      } else {
        setVisitors(all);
      }
    }
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <VisitorHistoryTable
        visitors={visitors}
        onViewDetails={(v) => setSelectedVisitor(v)}
        title="Visitor Gate Entry & Movement Records"
      />

      {selectedVisitor && (
        <VisitorDetails
          visitor={selectedVisitor}
          userRole={user.role}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
}
