
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, Search, Award, Star, MapPin, Building, 
  CheckCircle, Filter, UserPlus, MessageSquare 
} from "lucide-react";

export const FindPartners = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  
  const [partners] = useState([
    {
      id: 1,
      name: "EcoTech Solutions",
      description: "Specialized in eco-friendly construction materials and methods",
      category: "Construction",
      location: "Eastern Region",
      rating: 4.8,
      verified: true,
      yearsInBusiness: 7,
      specialties: ["Green building", "Sustainable materials", "Energy efficiency"]
    },
    {
      id: 2,
      name: "DigiServe IT",
      description: "IT infrastructure and networking specialists for government projects",
      category: "IT",
      location: "Capital City",
      rating: 4.5,
      verified: true,
      yearsInBusiness: 5,
      specialties: ["Network security", "Cloud migration", "System integration"]
    },
    {
      id: 3,
      name: "MedSupply Logistics",
      description: "Medical supplies and logistics for healthcare facilities",
      category: "Healthcare",
      location: "Western Region",
      rating: 4.3,
      verified: true,
      yearsInBusiness: 4,
      specialties: ["Medical equipment", "Pharmaceutical logistics", "Hospital supplies"]
    }
  ]);
  
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = searchTerm === "" || 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      partner.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = category === "" || partner.category === category;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, specialty or description..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="Construction">Construction</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="Healthcare">Healthcare</SelectItem>
              <SelectItem value="Transport">Transport</SelectItem>
              <SelectItem value="Agriculture">Agriculture</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="flex items-center gap-1">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>
      
      {filteredPartners.length === 0 ? (
        <Alert variant="default" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Partners Found</AlertTitle>
          <AlertDescription>
            No partners match your search criteria. Try adjusting your filters or search term.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">Showing {filteredPartners.length} potential partners</p>
          
          {filteredPartners.map(partner => (
            <Card key={partner.id} className="mb-4">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <CardTitle className="text-lg font-medium flex items-center">
                      {partner.name}
                      {partner.verified && (
                        <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <Badge variant="outline" className="mt-0.5">
                      {partner.category}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{partner.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{partner.description}</p>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      Location
                    </h4>
                    <p className="text-sm mt-1">{partner.location}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium flex items-center">
                      <Building className="h-4 w-4 mr-1 text-gray-500" />
                      Years in Business
                    </h4>
                    <p className="text-sm mt-1">{partner.yearsInBusiness} years</p>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="mt-3">
                  <h4 className="text-sm font-medium flex items-center mb-2">
                    <Award className="h-4 w-4 mr-1 text-gray-500" />
                    Specialties
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.map((specialty, index) => (
                      <Badge key={index} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Contact
                </Button>
                <Button variant="default" size="sm" className="flex items-center">
                  <UserPlus className="mr-1 h-4 w-4" />
                  Invite to Collaborate
                </Button>
              </CardFooter>
            </Card>
          ))}
        </>
      )}
    </div>
  );
};
