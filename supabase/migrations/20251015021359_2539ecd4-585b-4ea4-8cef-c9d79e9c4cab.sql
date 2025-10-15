-- Split set_brand into separate brand and set fields
ALTER TABLE card_details 
ADD COLUMN brand text,
ADD COLUMN set_name text;

-- Copy existing set_brand data to brand column as fallback
UPDATE card_details 
SET brand = set_brand 
WHERE set_brand IS NOT NULL;

-- Drop the old combined column
ALTER TABLE card_details 
DROP COLUMN set_brand;