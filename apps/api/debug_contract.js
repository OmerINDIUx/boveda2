const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'holocron',
    multipleStatements: true
  });
  
  const cid = '80000000-0000-0000-0000-000000000001';
  
  try {
    const [rows] = await conn.query(`
      SELECT c.*, 
        p.id as p_id, p.name as p_name, p.code as p_code,
        ru.id as ru_id, ru.name as ru_name, ru.email as ru_email,
        md.id as md_id, md.name as md_name, md.document_number as md_num
      FROM contracts c
      LEFT JOIN projects p ON p.id = c.project_id
      LEFT JOIN users ru ON ru.id = c.responsible_user_id
      LEFT JOIN documents md ON md.id = c.main_document_id
      WHERE c.id = '${cid}'
    `);
    console.log('Contract found:', rows.length > 0);
    if (rows.length > 0) {
      console.log('Status:', rows[0].status);
      console.log('Project:', rows[0].p_name ? 'OK' : 'MISSING');
      console.log('Responsible:', rows[0].ru_name ? rows[0].ru_name : 'NONE');
      console.log('MainDoc:', rows[0].md_name ? rows[0].md_name : 'NONE');
      console.log('parent_contract_id:', rows[0].parent_contract_id);
      console.log('alert_days_before:', rows[0].alert_days_before);
    }
  } catch(e) { console.error('SQL Error:', e.message); }
  
  try {
    const [tags] = await conn.query(`
      SELECT t.* FROM tags t
      INNER JOIN contract_tags ct ON ct.tag_id = t.id
      WHERE ct.contract_id = '${cid}'
    `);
    console.log('Tags count:', tags.length);
  } catch(e) { console.error('Tags Error:', e.message); }
  
  try {
    const [vers] = await conn.query('SELECT * FROM contract_versions WHERE contract_id = ?', [cid]);
    console.log('Versions count:', vers.length);
  } catch(e) { console.error('Versions Error:', e.message); }
  
  try {
    const [audit] = await conn.query('SELECT * FROM contract_audit_logs WHERE contract_id = ?', [cid]);
    console.log('Audit logs count:', audit.length);
  } catch(e) { console.error('Audit Error:', e.message); }
  
  await conn.end();
}
main().catch(console.error);
