const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/index');
const Product = require('../src/models/Product');

// Mock do middleware de autenticação
jest.mock('../src/middleware/auth', () => (req, res, next) => {
  req.user = { userId: 'mockUserId' };
  next();
});

// Mock do módulo de banco de dados
jest.mock('../src/database', () => jest.fn());

// Mock do scraper para não fazer chamadas externas
jest.mock('../src/api/scrape-gemini', () => ({
  scrapeProductDetails: jest.fn().mockResolvedValue({
    name: 'Produto Scraped',
    price: 149.99,
    urlOrigin: 'https://loja.com',
  }),
}));


let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Product.deleteMany({});
  jest.clearAllMocks();
});

describe('API de Produtos - /api/products', () => {

  it('deve criar um novo produto com sucesso via POST', async () => {
    const response = await request(app)
      .post('/api/products')
      .send({
        // CORREÇÃO FINAL: Adicionamos o userId ao corpo da requisição
        userId: 'mockUserId',
        url: 'http://loja.com/produto',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('name', 'Produto Scraped');
    expect(response.body).toHaveProperty('price', 149.99);
  });

  it('deve listar os produtos existentes via GET', async () => {
    await new Product({
        name: 'Produto 1',
        url: 'http://url1.com',
        userId: 'mockUserId',
        price: 99,
        status: 'pendente',
        urlOrigin: 'http://url1.com'
    }).save();

    const response = await request(app).get('/api/products?userId=mockUserId');

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
  });

});