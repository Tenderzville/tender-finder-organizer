
import { useNavigate } from "react-router-dom";

export function useDashboardNavigation() {
  const navigate = useNavigate();
  
  const handleViewTenderDetails = (id: number) => {
    navigate(`/tenders/${id}`);
  };

  return {
    handleViewTenderDetails,
    navigate
  };
}
