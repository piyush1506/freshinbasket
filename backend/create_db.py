import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT



try:
    conn = psycopg2.connect(user='postgres',password=1234,host='localhost',port='5432')
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE greenmart')
    print('databse created successfully')
except Exception as e:
    print(f"Error: {e} ")

finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals():
        conn.close()            
