import { useEffect, useState } from 'react';
import { Tender } from '../../types/tender';
import { TenderCard } from '../TenderCard';
import { useNavigate } from 'react-router-dom';

export default function TenderFeed() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTenders = async () => {
      try {
        const response = await fetch('/api/tenders');
        const data = await response.json();
        
        // Filter only for active tenders based on deadline
        const activeTenders = data.filter((tender: Tender) => {
          const deadline = new Date(tender.deadline);
          return deadline > new Date();
        });
        
        setTenders(activeTenders);
      } catch (error) {
        console.error('Error fetching tenders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTenders();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4">Loading tenders...</div>;
  }

  if (tenders.length === 0) {
    return <div className="text-center p-4">No active tenders found</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tenders.map((tender) => (
        <TenderCard
          key={tender.id}
          id={tender.id}
          title={tender.title}
          organization={tender.category}
          deadline={tender.deadline}
          category={tender.category}
          value={tender.fees || "Contact for pricing"}
          location={tender.location}
          pointsRequired={tender.points_required || 0}
          tender_url={tender.tender_url}
          onViewDetails={() => navigate(`/tenders/${tender.id}`)}
          hasAffirmativeAction={tender.affirmative_action?.type !== undefined && tender.affirmative_action?.type !== 'none'}
          affirmativeActionType={tender.affirmative_action?.type || 'none'}
        />
      ))}
    </div>
  );
}
