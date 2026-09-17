declare const __dirname: string;
declare function require(moduleName: string): unknown;

const { readFileSync } = require('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};
const { join } = require('path') as {
  join: (...paths: string[]) => string;
};

describe('progress migration', () => {
  it('adds local-date uniqueness, updated timestamps, atomic upsert, and preserves owner RLS', () => {
    const migration = readFileSync(
      join(
        __dirname,
        '../../../../../../../supabase/migrations/20260915120000_progress_weight_check_ins.sql',
      ),
      'utf8',
    );
    expect(migration).toContain('add column local_date date');
    expect(migration).toContain('body_metrics_user_local_date_unique_idx');
    expect(migration).toContain('on conflict (user_id, local_date)');
    expect(migration).toContain('security invoker');
    expect(migration).toContain('auth.uid()');
    expect(migration).toContain('update public.profiles');

    const initialSchema = readFileSync(
      join(
        __dirname,
        '../../../../../../../supabase/migrations/20260810103000_initial_user_schema.sql',
      ),
      'utf8',
    );
    expect(initialSchema).toContain('Body metrics are viewable by owner');
    expect(initialSchema).toContain('Body metrics are insertable by owner');
    expect(initialSchema).toContain('Body metrics are updatable by owner');
    expect(initialSchema).toContain('Body metrics are deletable by owner');
  });
});
