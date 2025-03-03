
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface LanguageToggleProps {
  language: 'en' | 'sw';
  label: string;
  onToggle: () => void;
}

export const LanguageToggle = ({ language, label, onToggle }: LanguageToggleProps) => {
  return (
    <div className="flex justify-end items-center mb-4">
      <div className="flex items-center space-x-2">
        <Switch 
          id="language-toggle" 
          checked={language === 'sw'}
          onCheckedChange={onToggle}
        />
        <Label htmlFor="language-toggle">{label}</Label>
      </div>
    </div>
  );
};
