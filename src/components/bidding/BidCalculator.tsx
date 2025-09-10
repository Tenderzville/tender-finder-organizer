import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, Percent } from "lucide-react";
import { Tender } from "@/types/tender";

interface BidCalculatorProps {
  tender: Tender;
}

export function BidCalculator({ tender }: BidCalculatorProps) {
  const [costs, setCosts] = useState({
    materials: 0,
    labor: 0,
    equipment: 0,
    overhead: 0,
    other: 0
  });
  const [profitMargin, setProfitMargin] = useState(15);
  const [contingency, setContingency] = useState(10);

  const totalDirectCosts = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
  const contingencyAmount = (totalDirectCosts * contingency) / 100;
  const subtotal = totalDirectCosts + contingencyAmount;
  const profitAmount = (subtotal * profitMargin) / 100;
  const totalBidAmount = subtotal + profitAmount;

  const handleCostChange = (category: keyof typeof costs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCosts(prev => ({ ...prev, [category]: numValue }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Bid Cost Calculator
          </CardTitle>
          <CardDescription>
            Calculate your competitive bid amount for {tender.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Direct Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materials">Materials (KSH)</Label>
              <Input
                id="materials"
                type="number"
                value={costs.materials || ''}
                onChange={(e) => handleCostChange('materials', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labor">Labor (KSH)</Label>
              <Input
                id="labor"
                type="number"
                value={costs.labor || ''}
                onChange={(e) => handleCostChange('labor', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment (KSH)</Label>
              <Input
                id="equipment"
                type="number"
                value={costs.equipment || ''}
                onChange={(e) => handleCostChange('equipment', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="overhead">Overhead (KSH)</Label>
              <Input
                id="overhead"
                type="number"
                value={costs.overhead || ''}
                onChange={(e) => handleCostChange('overhead', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other">Other Costs (KSH)</Label>
              <Input
                id="other"
                type="number"
                value={costs.other || ''}
                onChange={(e) => handleCostChange('other', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          {/* Percentages */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contingency">Contingency (%)</Label>
              <Input
                id="contingency"
                type="number"
                value={contingency}
                onChange={(e) => setContingency(parseFloat(e.target.value) || 0)}
                placeholder="10"
                min="0"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit">Profit Margin (%)</Label>
              <Input
                id="profit"
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                placeholder="15"
                min="0"
                max="100"
              />
            </div>
          </div>

          <Separator />

          {/* Calculation Summary */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span>Direct Costs:</span>
              <span className="font-medium">KSH {totalDirectCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Contingency ({contingency}%):</span>
              <span className="font-medium">KSH {contingencyAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">KSH {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Profit ({profitMargin}%):</span>
              <span className="font-medium">KSH {profitAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Bid Amount:</span>
              <span className="text-primary">KSH {totalBidAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <p className="text-sm text-blue-800">Break-even</p>
              <p className="font-bold text-blue-900">KSH {subtotal.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Percent className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <p className="text-sm text-green-800">Profit Amount</p>
              <p className="font-bold text-green-900">KSH {profitAmount.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}