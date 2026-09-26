import psycopg2


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "cacao_gradeai",
    "user": "postgres",
    "password": "Pangit123"
}


def get_connection():
    return psycopg2.connect(**DB_CONFIG)


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS classifications (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL,
            predicted_class TEXT NOT NULL,
            confidence REAL NOT NULL,
            recommendation TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    cursor.close()
    conn.close()

    print("Database table is ready!")


def save_classification(
    filename: str,
    label: str,
    confidence: float,
    recommendation: str
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO classifications (
            filename,
            predicted_class,
            confidence,
            recommendation
        )
        VALUES (%s, %s, %s, %s)
    """, (
        filename,
        label,
        confidence,
        recommendation
    ))

    conn.commit()

    cursor.close()
    conn.close()


def get_all_classifications():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            filename,
            predicted_class,
            confidence,
            recommendation,
            created_at
        FROM classifications
        ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return rows


if __name__ == "__main__":
    init_db()