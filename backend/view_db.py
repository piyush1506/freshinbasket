import psycopg2

conn = psycopg2.connect(dbname='greenmart', user='postgres', password='1234', host='localhost', port='5432')
cur = conn.cursor()

# List all tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
tables = cur.fetchall()

print("=" * 60)
print(f"DATABASE: greenmart  |  Total tables: {len(tables)}")
print("=" * 60)

for (table_name,) in tables:
    cur.execute(f"SELECT COUNT(*) FROM \"{table_name}\"")
    count = cur.fetchone()[0]
    print(f"  {table_name:<45} {count:>5} rows")

# Show data from key tables
key_tables = ['users_user', 'store_product', 'store_category', 'orders_order', 'store_slide', 'store_storesettings']
for table in key_tables:
    cur.execute(f"SELECT COUNT(*) FROM \"{table}\"")
    count = cur.fetchone()[0]
    if count > 0:
        print(f"\n{'=' * 60}")
        print(f"TABLE: {table} ({count} rows)")
        print(f"{'=' * 60}")
        cur.execute(f"SELECT * FROM \"{table}\" LIMIT 10")
        cols = [desc[0] for desc in cur.description]
        print(" | ".join(cols))
        print("-" * 60)
        for row in cur.fetchall():
            print(" | ".join(str(v)[:30] for v in row))

cur.close()
conn.close()
