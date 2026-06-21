from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quote', '0001_initial'),
        ('users', '0011_user_is_admin'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql='''
                    ALTER TABLE public."quote"
                    ADD COLUMN IF NOT EXISTS user_id bigint NULL;

                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1
                            FROM pg_constraint
                            WHERE conname = 'quote_user_id_fkey'
                        ) THEN
                            ALTER TABLE public."quote"
                            ADD CONSTRAINT quote_user_id_fkey
                            FOREIGN KEY (user_id)
                            REFERENCES public.users(id)
                            ON DELETE SET NULL;
                        END IF;
                    END $$;

                    CREATE INDEX IF NOT EXISTS quote_user_id_idx
                    ON public."quote" (user_id);
                    ''',
                    reverse_sql='''
                    DROP INDEX IF EXISTS public.quote_user_id_idx;
                    ALTER TABLE public."quote" DROP CONSTRAINT IF EXISTS quote_user_id_fkey;
                    ALTER TABLE public."quote" DROP COLUMN IF EXISTS user_id;
                    ''',
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='quote',
                    name='user',
                    field=models.ForeignKey(
                        blank=True,
                        db_column='user_id',
                        null=True,
                        on_delete=models.SET_NULL,
                        related_name='quotes',
                        to='users.user',
                    ),
                ),
            ],
        ),
    ]
