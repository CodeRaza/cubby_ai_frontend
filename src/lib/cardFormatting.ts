interface CardDetails {
  player_name?: string;
  card_year?: number;
  brand?: string;
  card_number?: string;
  set_name?: string;
  condition?: string;
  is_graded?: boolean;
  grading_company?: string;
  grade?: number;
  special_attributes?: string[];
}

export const formatCardTitle = (name: string, cardDetails?: CardDetails): string => {
  if (!cardDetails) return name;

  const parts: string[] = [];
  
  // Year
  if (cardDetails.card_year) {
    parts.push(String(cardDetails.card_year));
  }
  
  // Brand
  if (cardDetails.brand) {
    parts.push(cardDetails.brand);
  }
  
  // Set name if available
  if (cardDetails.set_name) {
    parts.push(`– ${cardDetails.set_name}`);
  } else if (cardDetails.player_name) {
    // Only show player if no set
    parts.push(`– ${cardDetails.player_name}`);
  }
  
  // Card Number (normalize null/undefined)
  if (cardDetails.card_number && cardDetails.card_number !== 'null' && !cardDetails.card_number.toLowerCase().includes('null')) {
    parts.push(`#${cardDetails.card_number}`);
  }
  
  return parts.join(' ');
};

export const formatCardSubtitle = (cardDetails?: CardDetails): string => {
  if (!cardDetails) return '';

  const parts: string[] = [];
  
  // Player name (if not in title via set_name)
  if (cardDetails.player_name && !cardDetails.set_name) {
    parts.push(cardDetails.player_name);
  }
  
  // Grading info or condition
  if (cardDetails.is_graded && cardDetails.grading_company && cardDetails.grade) {
    parts.push(`${cardDetails.grading_company} ${cardDetails.grade}`);
  } else if (cardDetails.condition) {
    parts.push(cardDetails.condition);
  }
  
  // Special attributes
  if (cardDetails.special_attributes && cardDetails.special_attributes.length > 0) {
    const displayAttrs = cardDetails.special_attributes.slice(0, 2);
    parts.push(...displayAttrs);
  }
  
  return parts.join(' • ');
};

export const getCardBadges = (cardDetails?: CardDetails): { icon: string; label: string }[] => {
  if (!cardDetails) return [];

  const badges: { icon: string; label: string }[] = [];
  
  // Rookie badge
  if (cardDetails.special_attributes?.some(attr => 
    attr.toLowerCase().includes('rookie')
  )) {
    badges.push({ icon: '🟡', label: 'Rookie Card' });
  }
  
  // Graded badge
  if (cardDetails.is_graded) {
    badges.push({ icon: '🏆', label: 'Graded' });
  }
  
  // Insert/Special badge
  const hasInsert = cardDetails.special_attributes?.some(attr => 
    attr.toLowerCase().includes('insert') || 
    attr.toLowerCase().includes('refractor') ||
    attr.toLowerCase().includes('auto')
  );
  if (hasInsert) {
    badges.push({ icon: '🔥', label: 'Insert' });
  }
  
  return badges;
};
