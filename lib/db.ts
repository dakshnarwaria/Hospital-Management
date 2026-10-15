import mysql from 'mysql2/promise';

declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

const pool =
  global.__mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    dateStrings: true,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = pool;
}

export default pool;

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

export async function execute<T = any>(sql: string, params?: any[]): Promise<T> {
  const [result] = await pool.execute(sql, params);
  return result as T;
}
