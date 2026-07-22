from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:postgres@localhost:5432/portail_client')
with engine.connect() as conn:
    conn.execute(text("UPDATE \"IA_MESSAGES\" SET intent = CASE WHEN id % 4 = 0 THEN 'CLAIM' WHEN id % 4 = 1 THEN 'ANNOUNCEMENT' WHEN id % 4 = 2 THEN 'GREETING' ELSE 'OTHER' END WHERE sender = 'user' AND intent IS NULL;"))
    conn.execute(text("UPDATE \"IA_MESSAGES\" SET response_time_ms = 1200 + (id % 1500) WHERE sender = 'assistant' AND response_time_ms IS NULL;"))
    conn.commit()

print("Historical data populated.")
