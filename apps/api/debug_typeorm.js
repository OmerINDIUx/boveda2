const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

async function main() {
  // Read the compiled entities
  const entitiesPath = path.join(__dirname, '..', '..', '.npm-cache', 'api-build', 'modules');
  
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'holocron',
    entities: [entitiesPath + '/**/*.entity.js'],
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('DataSource initialized');
    
    const repo = dataSource.getRepository('Contract');
    
    try {
      const contract = await repo.findOne({
        where: { id: '80000000-0000-0000-0000-000000000001' },
        relations: ['project', 'responsibleUser', 'mainDocument'],
      });
      console.log('Contract found:', !!contract);
      if (contract) {
        console.log('Name:', contract.name);
        console.log('Project:', contract.project?.name);
        console.log('Responsible:', contract.responsibleUser?.name);
        console.log('MainDoc:', contract.mainDocument?.name);
      }
    } catch(e) {
      console.error('findOne error:', e.message);
      console.error('Stack:', e.stack);
    }
    
    await dataSource.destroy();
  } catch(e) {
    console.error('DataSource error:', e.message);
    console.error('Stack:', e.stack);
  }
}

main().catch(console.error);