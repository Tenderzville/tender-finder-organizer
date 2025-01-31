import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface TenderFiltersProps {
  onFilterChange: (filters: {
    search: string;
    category: string;
    location: string;
    valueRange: string;
    deadline: string;
  }) => void;
}

export const TenderFilters = ({ onFilterChange }: TenderFiltersProps) => {
  const [filters, setFilters] = React.useState({
    search: "",
    category: "",
    location: "",
    valueRange: "",
    deadline: "",
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: "",
      category: "",
      location: "",
      valueRange: "",
      deadline: "",
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <Filter className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tenders..." 
            className="pl-9"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <Select 
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="construction">Construction & Infrastructure</SelectItem>
              <SelectItem value="it">IT & Technology</SelectItem>
              <SelectItem value="consulting">Consulting Services</SelectItem>
              <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
              <SelectItem value="energy">Energy & Utilities</SelectItem>
              <SelectItem value="education">Education & Training</SelectItem>
              <SelectItem value="transport">Transportation & Logistics</SelectItem>
              <SelectItem value="agriculture">Agriculture & Food</SelectItem>
              <SelectItem value="defense">Defense & Security</SelectItem>
              <SelectItem value="environmental">Environmental Services</SelectItem>
              <SelectItem value="telecom">Telecommunications</SelectItem>
              <SelectItem value="financial">Financial Services</SelectItem>
              <SelectItem value="research">Research & Development</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="mining">Mining & Resources</SelectItem>
              <SelectItem value="professional">Professional Services</SelectItem>
              <SelectItem value="supplies">General Supplies</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Location</label>
          <Select
            value={filters.location}
            onValueChange={(value) => handleFilterChange("location", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              <SelectItem value="Kenya">Kenya</SelectItem>
              <SelectItem value="Uganda">Uganda</SelectItem>
              <SelectItem value="Tanzania">Tanzania</SelectItem>
              <SelectItem value="Rwanda">Rwanda</SelectItem>
              <SelectItem value="Ethiopia">Ethiopia</SelectItem>
              <SelectItem value="Nigeria">Nigeria</SelectItem>
              <SelectItem value="South Africa">South Africa</SelectItem>
              <SelectItem value="International">International</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Value Range</label>
          <Select
            value={filters.valueRange}
            onValueChange={(value) => handleFilterChange("valueRange", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select value range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Ranges</SelectItem>
              <SelectItem value="0-50k">$0 - $50,000</SelectItem>
              <SelectItem value="50k-200k">$50,000 - $200,000</SelectItem>
              <SelectItem value="200k-1m">$200,000 - $1,000,000</SelectItem>
              <SelectItem value="1m+">$1,000,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Deadline</label>
          <Select
            value={filters.deadline}
            onValueChange={(value) => handleFilterChange("deadline", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select deadline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Deadlines</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="next-month">Next Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};