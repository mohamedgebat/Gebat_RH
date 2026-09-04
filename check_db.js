const db = require('./backend/database.js');

setTimeout(() => {
    db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, rows) => {
        console.log(rows);
    });
}, 2000);
