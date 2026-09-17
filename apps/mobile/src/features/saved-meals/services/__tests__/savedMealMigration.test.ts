declare const __dirname: string;
declare function require(moduleName: string): unknown;

const { readFileSync } = require('fs') as {
  readFileSync: (filePath: string, encoding: 'utf8') => string;
};
const { join } = require('path') as {
  join: (...paths: string[]) => string;
};

describe('TASK-012 favorites and saved meals migration', () => {
  const migration = readFileSync(
    join(
      __dirname,
      '../../../../../../../supabase/migrations/20260819090000_favorites_saved_meals.sql',
    ),
    'utf8',
  );

  it('adds owner-scoped favorite foods without modifying shared foods', () => {
    expect(migration).toContain('create table public.favorite_foods');
    expect(migration).toContain(
      'constraint favorite_foods_user_food_unique unique (user_id, food_id)',
    );
    expect(migration).toContain('alter table public.favorite_foods enable row level security');
    expect(migration).toContain('using (auth.uid() = user_id)');
    expect(migration).toContain('with check (auth.uid() = user_id)');
  });

  it('adds saved meal tables with snapshot item nutrition', () => {
    expect(migration).toContain('create table public.saved_meals');
    expect(migration).toContain('create table public.saved_meal_items');
    expect(migration).toContain('serving_calories numeric not null');
    expect(migration).toContain('serving_equivalent numeric not null');
    expect(migration).toContain('calories numeric not null');
    expect(migration).toContain('saved_meal_items_saved_meal_id_idx');
  });

  it('logs saved meals atomically through an authenticated RPC', () => {
    expect(migration).toContain('create or replace function public.log_saved_meal');
    expect(migration).toContain('returns setof public.food_logs');
    expect(migration).toContain('saved_meals.user_id = auth.uid()');
    expect(migration).toContain('insert into public.food_logs');
    expect(migration).toContain('grant execute on function public.log_saved_meal');
  });

  it('returns inserted food log rows from the saved meal RPC', () => {
    const fixMigration = readFileSync(
      join(
        __dirname,
        '../../../../../../../supabase/migrations/20260915090000_fix_log_saved_meal_returning.sql',
      ),
      'utf8',
    );

    expect(fixMigration).toContain('return query');
    expect(fixMigration).toContain('returning food_logs.*;');
  });
});
