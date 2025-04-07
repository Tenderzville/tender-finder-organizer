
import React from "react";

export function useTenderSharingActions() {
  const handleShareViaEmail = (id: number) => {
    const subject = encodeURIComponent("Check out this tender");
    const body = encodeURIComponent(`I found this tender that might interest you: ${window.location.origin}/tenders/${id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareViaWhatsApp = (id: number) => {
    const text = encodeURIComponent(`Check out this tender: ${window.location.origin}/tenders/${id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return {
    handleShareViaEmail,
    handleShareViaWhatsApp
  };
}
