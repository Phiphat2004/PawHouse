const { MongoClient, ObjectId } = require('mongodb');

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('pawcare');

  const result = await db.collection('warehouses').updateOne(
    { _id: new ObjectId('699d769d9133b03203e9a38d') },
    { $set: { name: 'CanTho XN', code: 'WH-CT-XN' } }
  );
  console.log('Đã cập nhật:', result.modifiedCount, 'kho');

  const wh = await db.collection('warehouses').findOne({ _id: new ObjectId('699d769d9133b03203e9a38d') });
  console.log('Kết quả:', JSON.stringify(wh, null, 2));

  await client.close();
}

run().catch(console.error);
