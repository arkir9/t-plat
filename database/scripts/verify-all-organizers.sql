-- Set all pending organizer profiles to verified (Plat Pro "accept all reviews")
UPDATE organizer_profiles
SET verification_status = 'verified', updated_at = CURRENT_TIMESTAMP
WHERE verification_status = 'pending';
