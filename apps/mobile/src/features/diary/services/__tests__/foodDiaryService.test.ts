declare const __dirname: string;
declare function require(moduleName: string): unknown;

const { readFileSync } = require('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};
const { join } = require('path') as {
  join: (...paths: string[]) => string;
};

describe('TASK-008 migration policies', () => {
  const migration = readFileSync(
    join(
      __dirname,
      '../../../../../../../supabase/migrations/20260810203000_editable_goals_and_food_diary_foundation.sql',
    ),
    'utf8',
  );
  const goalRpcFixMigration = readFileSync(
    join(
      __dirname,
      '../../../../../../../supabase/migrations/20260810205500_return_nutrition_goal_row_from_replace_rpc.sql',
    ),
    'utf8',
  );
  const servingSnapshotMigration = readFileSync(
    join(
      __dirname,
      '../../../../../../../supabase/migrations/20260810220000_food_log_per_serving_snapshots.sql',
    ),
    'utf8',
  );

  it('atomically replaces active goals and preserves custom target source', () => {
    expect(`${migration}\n${goalRpcFixMigration}`).toContain('replace_active_nutrition_goal');
    expect(goalRpcFixMigration).toContain('returns setof public.nutrition_goals');
    expect(goalRpcFixMigration).toContain('update public.nutrition_goals as ng');
    expect(goalRpcFixMigration).toContain('set is_active = false');
    expect(goalRpcFixMigration).toContain('return next v_new_goal');
    expect(goalRpcFixMigration).toContain('p_target_source');
    expect(goalRpcFixMigration).toContain('where ng.user_id = v_user_id');
    expect(goalRpcFixMigration).toContain('where ng.id = v_previous_goal.id');
    expect(goalRpcFixMigration).toContain('true');
  });

  it('keeps diary access owned by the authenticated user', () => {
    expect(migration).toContain('Food logs are viewable by owner');
    expect(migration).toContain('using (auth.uid() = user_id)');
    expect(migration).toContain('with check (auth.uid() = user_id)');
  });

  it('keeps per-serving snapshots for reliable diary edits', () => {
    expect(servingSnapshotMigration).toContain('serving_calories');
    expect(servingSnapshotMigration).toContain('serving_protein_g');
    expect(servingSnapshotMigration).toContain('serving_carbs_g');
    expect(servingSnapshotMigration).toContain('serving_fat_g');
    expect(servingSnapshotMigration).toContain('calories / quantity');
  });

  it('prevents mobile clients from modifying provider-owned foods', () => {
    expect(migration).toContain('Users can insert their own custom foods');
    expect(migration).toContain("source = 'user'");
    expect(migration).toContain('created_by = auth.uid()');
  });

  it('adds useful food and diary indexes', () => {
    expect(migration).toContain('foods_barcode_idx');
    expect(migration).toContain('foods_source_external_id_unique_idx');
    expect(migration).toContain('food_logs_user_logged_at_idx');
    expect(migration).toContain('food_logs_user_meal_logged_at_idx');
  });
});
