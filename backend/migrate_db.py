from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:postgres@localhost:5432/portail_client')
with engine.connect() as conn:
    conn.execute(text('ALTER TABLE "IA_MESSAGES" ADD COLUMN IF NOT EXISTS intent VARCHAR;'))
    conn.execute(text('ALTER TABLE "IA_MESSAGES" ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;'))
    conn.commit()

print("Migration done")
