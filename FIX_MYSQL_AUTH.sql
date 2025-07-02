-- حل مشكلة authentication plugin في MySQL
-- نفّذ هذه الأوامر في phpMyAdmin

-- 1. تغيير طريقة المصادقة للمستخدم
ALTER USER 'j3uar_local_db'@'localhost' 
IDENTIFIED WITH mysql_native_password 
BY 'UR497nwMZZDAeP2E';

-- 2. تحديث الصلاحيات
FLUSH PRIVILEGES;

-- 3. التحقق من المستخدم
SELECT user, host, plugin FROM mysql.user WHERE user = 'j3uar_local_db'; 