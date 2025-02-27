
import { useState, useEffect } from "react";
import { Check, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [valueRange, setValueRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Fetch available categories and locations from the database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch unique categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('tenders')
          .select('category')
          .order('category');
        
        if (!categoryError && categoryData) {
          const uniqueCategories = [...new Set(categoryData.map(item => item.category))];
          setCategories(['All', ...uniqueCategories.filter(Boolean)]);
        }
        
        // Fetch unique locations
        const { data: locationData, error: locationError } = await supabase
          .from('tenders')
          .select('location')
          .order('location');
        
        if (!locationError && locationData) {
          const uniqueLocations = [...new Set(locationData.map(item => item.location))];
          setLocations(['All', ...uniqueLocations.filter(Boolean)]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    onFilterChange({
      search,
      category,
      location,
      valueRange,
      deadline,
    });
  }, [search, category, location, valueRange, deadline, onFilterChange]);

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setLocation("");
    setValueRange("");
    setDeadline("");
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Filters</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClearFilters}
          className="text-xs"
        >
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="search"
            placeholder="Search tenders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {category || "All Categories"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                {categories.map((cat) => (
                  <DropdownMenuItem 
                    key={cat} 
                    onClick={() => setCategory(cat === 'All' ? '' : cat)}
                    className="flex justify-between"
                  >
                    {cat}
                    {(cat === 'All' && !category) || cat === category ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {location || "All Locations"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuGroup>
                {locations.map((loc) => (
                  <DropdownMenuItem 
                    key={loc} 
                    onClick={() => setLocation(loc === 'All' ? '' : loc)}
                    className="flex justify-between"
                  >
                    {loc}
                    {(loc === 'All' && !location) || loc === location ? (
                      <Check className="h-4 w-4" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {deadline === "today"
                  ? "Today"
                  : deadline === "this-week"
                  ? "This Week"
                  : deadline === "this-month"
                  ? "This Month"
                  : deadline === "next-month"
                  ? "Next Month"
                  : "Any Deadline"}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem 
                onClick={() => setDeadline("")}
                className="flex justify-between"
              >
                Any Deadline
                {!deadline && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeadline("today")}
                className="flex justify-between"
              >
                Today
                {deadline === "today" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeadline("this-week")}
                className="flex justify-between"
              >
                This Week
                {deadline === "this-week" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeadline("this-month")}
                className="flex justify-between"
              >
                This Month
                {deadline === "this-month" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setDeadline("next-month")}
                className="flex justify-between"
              >
                Next Month
                {deadline === "next-month" && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
