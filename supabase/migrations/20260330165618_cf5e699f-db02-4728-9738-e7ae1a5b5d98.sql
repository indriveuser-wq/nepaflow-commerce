
-- Clean up test data
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM profiles WHERE email LIKE '%yopmail.com' OR email LIKE '%himal.com');
DELETE FROM profiles WHERE email LIKE '%yopmail.com' OR email LIKE '%himal.com';
DELETE FROM branches;
DELETE FROM businesses;
