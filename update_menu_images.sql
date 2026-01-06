-- Update menu codes with new image paths
UPDATE menu_items 
SET image_url = '/images/deluxesteakfriesv2.png' 
WHERE name = 'Deluxe Steak & Fries';

UPDATE menu_items 
SET image_url = '/images/steakfriesv2.png' 
WHERE name = 'Steak & Fries';

UPDATE menu_items 
SET image_url = '/images/steakonlyv2.png' 
WHERE name = 'Steak Only';

UPDATE menu_items 
SET image_url = '/images/friesonlyv2.png' 
WHERE name = 'Signature Fries';
