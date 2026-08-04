import time
import psycopg2
import os
import sys

def main():
    db_host = os.environ.get('DB_HOST', 'db')
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'postgres')
    db_name = os.environ.get('DB_NAME', 'bioone')
    db_port = os.environ.get('DB_PORT', '5432')

    print(f"Waiting for database {db_name} at {db_host}:{db_port} to be ready...", flush=True)
    
    start_time = time.time()
    timeout = 180  # wait up to 3 minutes
    
    while True:
        try:
            conn = psycopg2.connect(
                host=db_host,
                user=db_user,
                password=db_password,
                dbname=db_name,
                port=db_port,
                connect_timeout=3
            )
            # Try to run a simple query to ensure the DB is queryable
            cur = conn.cursor()
            cur.execute("SELECT 1;")
            cur.close()
            conn.close()
            print("Database is ready and accepting queries!", flush=True)
            sys.exit(0)
        except Exception as e:
            # Print connection errors, clean up output a bit
            err_msg = str(e).split('\n')[0]
            print(f"Waiting for database... (Error: {err_msg})", flush=True)
        
        if time.time() - start_time > timeout:
            print("Timeout waiting for database to become ready.", flush=True)
            sys.exit(1)
            
        time.sleep(2)

if __name__ == '__main__':
    main()
