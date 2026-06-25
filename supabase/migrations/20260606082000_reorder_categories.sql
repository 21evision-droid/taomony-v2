-- Move Harmony Resonance above Governance
UPDATE categories SET sort_order = 5 WHERE slug = 'harmony-resonance';
UPDATE categories SET sort_order = 6 WHERE slug = 'governance';
