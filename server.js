const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 连接数据库（自动创建 yanxin.db 文件）
const db = new sqlite3.Database('yanxin.db');

// 初始化四张表（如果不存在则创建）
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, phone TEXT, role TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, phone TEXT, address TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, price REAL, duration INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER, customer_id INTEGER, service_id INTEGER,
    order_date TEXT, status TEXT,
    FOREIGN KEY(employee_id) REFERENCES employees(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(service_id) REFERENCES services(id)
  )`);
});

// ========== 通用 CRUD 辅助函数 ==========
const getAll = (table, res) => {
  db.all(`SELECT * FROM ${table}`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};
const getOne = (table, id, res) => {
  db.get(`SELECT * FROM ${table} WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    row ? res.json(row) : res.status(404).json({ error: '未找到' });
  });
};
const createOne = (table, fields, values, res) => {
  const placeholders = values.map(() => '?').join(',');
  db.run(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
};
const updateOne = (table, id, fields, values, res) => {
  const setClause = fields.map(f => `${f} = ?`).join(',');
  db.run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    this.changes ? res.json({ updated: true }) : res.status(404).json({ error: '未找到' });
  });
};
const deleteOne = (table, id, res) => {
  db.run(`DELETE FROM ${table} WHERE id = ?`, [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    this.changes ? res.status(204).send() : res.status(404).json({ error: '未找到' });
  });
};

// ========== 员工 API ==========
app.get('/api/employees', (req, res) => getAll('employees', res));
app.get('/api/employees/:id', (req, res) => getOne('employees', req.params.id, res));
app.post('/api/employees', (req, res) => {
  const { name, phone, role } = req.body;
  createOne('employees', ['name','phone','role'], [name, phone, role], res);
});
app.put('/api/employees/:id', (req, res) => {
  const { name, phone, role } = req.body;
  updateOne('employees', req.params.id, ['name','phone','role'], [name, phone, role], res);
});
app.delete('/api/employees/:id', (req, res) => deleteOne('employees', req.params.id, res));

// ========== 客户 API ==========
app.get('/api/customers', (req, res) => getAll('customers', res));
app.get('/api/customers/:id', (req, res) => getOne('customers', req.params.id, res));
app.post('/api/customers', (req, res) => {
  const { name, phone, address } = req.body;
  createOne('customers', ['name','phone','address'], [name, phone, address], res);
});
app.put('/api/customers/:id', (req, res) => {
  const { name, phone, address } = req.body;
  updateOne('customers', req.params.id, ['name','phone','address'], [name, phone, address], res);
});
app.delete('/api/customers/:id', (req, res) => deleteOne('customers', req.params.id, res));

// ========== 服务项目 API ==========
app.get('/api/services', (req, res) => getAll('services', res));
app.get('/api/services/:id', (req, res) => getOne('services', req.params.id, res));
app.post('/api/services', (req, res) => {
  const { name, price, duration } = req.body;
  createOne('services', ['name','price','duration'], [name, price, duration], res);
});
app.put('/api/services/:id', (req, res) => {
  const { name, price, duration } = req.body;
  updateOne('services', req.params.id, ['name','price','duration'], [name, price, duration], res);
});
app.delete('/api/services/:id', (req, res) => deleteOne('services', req.params.id, res));

// ========== 服务订单 API ==========
app.get('/api/orders', (req, res) => getAll('orders', res));
app.get('/api/orders/:id', (req, res) => getOne('orders', req.params.id, res));
app.post('/api/orders', (req, res) => {
  const { employee_id, customer_id, service_id, order_date, status } = req.body;
  createOne('orders', ['employee_id','customer_id','service_id','order_date','status'], 
    [employee_id, customer_id, service_id, order_date, status], res);
});
app.put('/api/orders/:id', (req, res) => {
  const { employee_id, customer_id, service_id, order_date, status } = req.body;
  updateOne('orders', req.params.id, ['employee_id','customer_id','service_id','order_date','status'],
    [employee_id, customer_id, service_id, order_date, status], res);
});
app.delete('/api/orders/:id', (req, res) => deleteOne('orders', req.params.id, res));

// ========== 根路径 ==========
app.get('/', (req, res) => res.send('易安心API运行中 (永久存储)'));

// ========== 启动 ==========
app.listen(port, () => {
  console.log(`易安心API运行中，端口: ${port}`);
  console.log('数据存储在 yanxin.db 中，重启不会丢失');
});