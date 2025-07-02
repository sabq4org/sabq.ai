import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// إنشاء pool للاتصالات
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4'
});

// Types for query results
export type QueryResult<T = any> = T & RowDataPacket;
export type InsertResult = ResultSetHeader;

// دالة مساعدة للاستعلامات
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<QueryResult<T>[]> {
  try {
    const [results] = await pool.execute<QueryResult<T>[]>(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// دالة لتنفيذ INSERT/UPDATE/DELETE
export async function execute(
  sql: string,
  params?: any[]
): Promise<InsertResult> {
  try {
    const [result] = await pool.execute<InsertResult>(sql, params);
    return result;
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

// دالة للحصول على صف واحد
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  const results = await query<T>(sql, params);
  return results[0] || null;
}

// دالة للتحقق من الاتصال
export async function checkConnection() {
  try {
    await pool.execute('SELECT 1');
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// دالة لإغلاق pool عند إيقاف التطبيق
export async function closePool() {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
}

// Helper functions للتعامل مع التواريخ
export function formatDateForMySQL(date: Date | string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Transaction helper
export async function withTransaction<T>(
  callback: (connection: mysql.Connection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool; 