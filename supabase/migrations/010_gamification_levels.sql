-- 010_gamification_levels.sql

-- Calculate level from XP with 50 levels
CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer AS $$
DECLARE
  thresholds integer[] := ARRAY[0, 150, 300, 500, 750, 1050, 1450, 1900, 2450, 3100, 3800, 4600, 5500, 6550, 7700, 8950, 10350, 11850, 13500, 15300, 17250, 19350, 21600, 24000, 26550, 29250, 32150, 35200, 38450, 41850, 45450, 49200, 53150, 57300, 61650, 66200, 70950, 75900, 81100, 86500, 92100, 97950, 104000, 110300, 116800, 123550, 130550, 137800, 145250, 152950];
  i integer;
BEGIN
  FOR i IN REVERSE array_length(thresholds, 1)..1 LOOP
    IF xp >= thresholds[i] THEN
      RETURN i;
    END IF;
  END LOOP;
  RETURN 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
