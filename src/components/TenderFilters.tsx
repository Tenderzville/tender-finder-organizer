import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TenderFilters = () => {
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <Input placeholder="Search tenders..." />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="construction">Construction</SelectItem>
            <SelectItem value="it">IT Services</SelectItem>
            <SelectItem value="consulting">Consulting</SelectItem>
            <SelectItem value="supplies">Supplies</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="national">National</SelectItem>
            <SelectItem value="international">International</SelectItem>
            <SelectItem value="regional">Regional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Value Range</label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select value range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-50k">$0 - $50,000</SelectItem>
            <SelectItem value="50k-200k">$50,000 - $200,000</SelectItem>
            <SelectItem value="200k+">$200,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full">Apply Filters</Button>
    </div>
  );
};