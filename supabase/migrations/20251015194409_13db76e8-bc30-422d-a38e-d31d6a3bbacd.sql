-- Queue all existing card_details that don't have a pending/processing job in the pricing_queue
-- This will queue all 63 unqueued cards for pricing update

INSERT INTO pricing_queue (card_details_id, user_id, card_key, priority, status)
SELECT 
  cd.id as card_details_id,
  i.user_id,
  generate_card_key(cd.card_year, cd.brand, cd.player_name, cd.card_number, cd.sport) as card_key,
  CASE 
    WHEN cd.estimated_value >= 1000 THEN 100
    WHEN cd.estimated_value >= 100 THEN 80
    WHEN cd.estimated_value >= 10 THEN 60
    ELSE 50
  END as priority,
  'pending' as status
FROM card_details cd
JOIN items i ON i.id = cd.item_id
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_queue pq 
  WHERE pq.card_details_id = cd.id 
  AND pq.status IN ('pending', 'processing')
)
ON CONFLICT DO NOTHING;