
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function SheetDBDiagnostics() {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const checkSheetDBEndpoints = async () => {
    setIsChecking(true);
    try {
      const endpoints = [
        "https://sheetdb.io/api/v1/zktjeixgjfqal",
        "https://sheetdb.io/api/v1/odxdpd8mfgoa0"
      ];

      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing ${endpoint}`);
          const response = await fetch(endpoint);
          const data = await response.json();
          
          results.push({
            endpoint,
            status: response.status,
            dataCount: Array.isArray(data) ? data.length : 0,
            sampleData: Array.isArray(data) ? data.slice(0, 2) : data,
            error: null
          });
        } catch (error) {
          results.push({
            endpoint,
            status: 'Error',
            dataCount: 0,
            sampleData: null,
            error: error.message
          });
        }
      }

      setResults(results);
      
      toast({
        title: "SheetDB Check Complete",
        description: `Checked ${endpoints.length} endpoints`,
      });
      
    } catch (error) {
      console.error("Error checking SheetDB:", error);
      toast({
        title: "Error",
        description: "Failed to check SheetDB endpoints",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const addSampleTenders = async () => {
    try {
      const sampleTenders = [
        {
          title: "Supply of Office Furniture and Equipment",
          description: "Procurement of office furniture including desks, chairs, and filing cabinets for government offices.",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          category: "Supplies",
          location: "Nairobi",
          procuring_entity: "Ministry of Public Works",
          tender_no: "SAMPLE-001-2025",
          source: "sample-fallback",
          contact_info: "procurement@works.go.ke",
          requirements: "Valid business permit, tax compliance certificate",
          points_required: 0
        },
        {
          title: "Construction of Rural Access Roads",
          description: "Construction and rehabilitation of rural access roads in various counties across Kenya.",
          deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          category: "Construction",
          location: "Nationwide",
          procuring_entity: "Kenya Rural Roads Authority",
          tender_no: "SAMPLE-002-2025",
          source: "sample-fallback",
          contact_info: "tenders@kerra.go.ke",
          requirements: "Valid contractor license, financial capacity demonstration",
          points_required: 0
        },
        {
          title: "IT Infrastructure Upgrade Services",
          description: "Upgrade of IT infrastructure including servers, networking equipment, and security systems.",
          deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          category: "IT",
          location: "Mombasa",
          procuring_entity: "Kenya Ports Authority",
          tender_no: "SAMPLE-003-2025",
          source: "sample-fallback",
          contact_info: "ict@kpa.co.ke",
          requirements: "ISO 27001 certification, minimum 5 years experience",
          points_required: 0
        }
      ];

      const { data, error } = await supabase
        .from('tenders')
        .insert(sampleTenders)
        .select();

      if (error) {
        console.error("Error inserting sample tenders:", error);
        toast({
          title: "Error",
          description: "Failed to add sample tenders: " + error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sample Tenders Added",
        description: `Added ${data.length} sample tenders to the database`,
      });

    } catch (error) {
      console.error("Error adding sample tenders:", error);
      toast({
        title: "Error",
        description: "Failed to add sample tenders",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>SheetDB Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkSheetDBEndpoints}
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Test SheetDB Endpoints"}
          </Button>
          
          <Button 
            onClick={addSampleTenders}
            variant="outline"
          >
            Add Sample Tenders
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Results:</h3>
            {results.map((result: any, index: number) => (
              <div key={index} className="border rounded p-4">
                <div className="font-medium">{result.endpoint}</div>
                <div className="text-sm text-gray-600">
                  Status: {result.status} | Records: {result.dataCount}
                </div>
                {result.error && (
                  <div className="text-red-500 text-sm mt-1">
                    Error: {result.error}
                  </div>
                )}
                {result.sampleData && result.dataCount > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Sample Data:</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.sampleData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
