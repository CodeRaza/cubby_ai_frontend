import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CardDetails {
  player_name: string;
  card_year: string;
  set_brand: string;
  sport: string;
  card_number: string;
  condition: string;
  is_graded: boolean;
  grading_company: string;
  grade: string;
  estimated_value: string;
  special_attributes: string[];
}

interface CardDetailsFormProps {
  details: CardDetails;
  onChange: (details: CardDetails) => void;
}

export const CardDetailsForm = ({ details, onChange }: CardDetailsFormProps) => {
  const updateField = (field: keyof CardDetails, value: any) => {
    onChange({ ...details, [field]: value });
  };

  const toggleSpecialAttribute = (attribute: string) => {
    const current = details.special_attributes || [];
    const updated = current.includes(attribute)
      ? current.filter(a => a !== attribute)
      : [...current, attribute];
    updateField('special_attributes', updated);
  };

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
      <h3 className="font-semibold text-sm text-primary">Card Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="player_name">Player Name</Label>
          <Input
            id="player_name"
            value={details.player_name}
            onChange={(e) => updateField('player_name', e.target.value)}
            placeholder="e.g., Michael Jordan"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="card_year">Card Year</Label>
          <Input
            id="card_year"
            type="number"
            value={details.card_year}
            onChange={(e) => updateField('card_year', e.target.value)}
            placeholder="e.g., 1986"
            min="1950"
            max="2025"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sport">Sport</Label>
          <Select value={details.sport} onValueChange={(value) => updateField('sport', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Baseball">Baseball</SelectItem>
              <SelectItem value="Basketball">Basketball</SelectItem>
              <SelectItem value="Football">Football</SelectItem>
              <SelectItem value="Hockey">Hockey</SelectItem>
              <SelectItem value="Soccer">Soccer</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="set_brand">Set/Brand</Label>
          <Select value={details.set_brand} onValueChange={(value) => updateField('set_brand', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select set/brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Topps">Topps</SelectItem>
              <SelectItem value="Panini">Panini</SelectItem>
              <SelectItem value="Upper Deck">Upper Deck</SelectItem>
              <SelectItem value="Bowman">Bowman</SelectItem>
              <SelectItem value="Donruss">Donruss</SelectItem>
              <SelectItem value="Fleer">Fleer</SelectItem>
              <SelectItem value="Prizm">Prizm</SelectItem>
              <SelectItem value="Select">Select</SelectItem>
              <SelectItem value="Optic">Optic</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card_number">Card Number</Label>
          <Input
            id="card_number"
            value={details.card_number}
            onChange={(e) => updateField('card_number', e.target.value)}
            placeholder="e.g., #57"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Select value={details.condition} onValueChange={(value) => updateField('condition', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mint">Mint</SelectItem>
              <SelectItem value="Near Mint">Near Mint</SelectItem>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Very Good">Very Good</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grading Section */}
      <div className="space-y-3 pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_graded"
            checked={details.is_graded}
            onCheckedChange={(checked) => updateField('is_graded', checked)}
          />
          <Label htmlFor="is_graded" className="cursor-pointer">
            This card is professionally graded
          </Label>
        </div>

        {details.is_graded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
            <div className="space-y-2">
              <Label htmlFor="grading_company">Grading Company</Label>
              <Select value={details.grading_company} onValueChange={(value) => updateField('grading_company', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PSA">PSA</SelectItem>
                  <SelectItem value="BGS">BGS (Beckett)</SelectItem>
                  <SelectItem value="CGC">CGC</SelectItem>
                  <SelectItem value="SGC">SGC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                type="number"
                value={details.grade}
                onChange={(e) => updateField('grade', e.target.value)}
                placeholder="e.g., 9.5"
                min="1"
                max="10"
                step="0.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Special Attributes */}
      <div className="space-y-3 pt-2 border-t">
        <Label>Special Attributes</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['Rookie Card', 'Autographed', 'Jersey Card', 'Numbered', 'Refractor', 'Insert'].map((attr) => (
            <div key={attr} className="flex items-center space-x-2">
              <Checkbox
                id={attr}
                checked={(details.special_attributes || []).includes(attr)}
                onCheckedChange={() => toggleSpecialAttribute(attr)}
              />
              <Label htmlFor={attr} className="cursor-pointer text-sm">
                {attr}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Value */}
      <div className="space-y-2 pt-2 border-t">
        <Label htmlFor="estimated_value">Estimated Value ($)</Label>
        <Input
          id="estimated_value"
          type="number"
          value={details.estimated_value}
          onChange={(e) => updateField('estimated_value', e.target.value)}
          placeholder="e.g., 150.00"
          min="0"
          step="0.01"
        />
      </div>
    </div>
  );
};
