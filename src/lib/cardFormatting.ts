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
  
  // Player Name
  if (cardDetails.player_name) {
    parts.push(`– ${cardDetails.player_name}`);
  }
  
  // Card Number
  if (cardDetails.card_number) {
    parts.push(`#${cardDetails.card_number}`);
  }
  
  // Special attributes (Rookie, Insert, etc.)
  if (cardDetails.special_attributes && cardDetails.special_attributes.length > 0) {
    const rookieAttr = cardDetails.special_attributes.find(attr => 
      attr.toLowerCase().includes('rookie')
    );
    if (rookieAttr) {
      parts.push('RC');
    }
  }
  
  return parts.join(' ');
};

export const formatCardSubtitle = (cardDetails?: CardDetails): string => {
  if (!cardDetails) return '';

  const parts: string[] = [];
  
  // Condition
  if (cardDetails.condition) {
    parts.push(cardDetails.condition);
  }
  
  // Grading info
  if (cardDetails.is_graded && cardDetails.grading_company && cardDetails.grade) {
    parts.push(`${cardDetails.grading_company} ${cardDetails.grade}`);
  } else {
    parts.push('Raw');
  }
  
  // Special attributes (excluding rookie which is in title)
  if (cardDetails.special_attributes && cardDetails.special_attributes.length > 0) {
    const nonRookieAttrs = cardDetails.special_attributes.filter(attr => 
      !attr.toLowerCase().includes('rookie')
    );
    if (nonRookieAttrs.length > 0) {
      parts.push(nonRookieAttrs[0]); // Add first special attribute
    }
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
