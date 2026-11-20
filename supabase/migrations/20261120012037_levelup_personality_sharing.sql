ALTER TABLE levelup.world_profiles ADD COLUMN share_personality
  INTEGER NOT NULL DEFAULT 0 CHECK (share_personality IN (0, 1));
