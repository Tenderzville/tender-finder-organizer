
import { SheetDBDiagnostics } from "@/components/dashboard/SheetDBDiagnostics";

export default function TenderDiagnostics() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tender Data Diagnostics</h1>
      <SheetDBDiagnostics />
    </div>
  );
}
