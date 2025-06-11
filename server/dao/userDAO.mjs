import db from '../db.mjs';
import crypto from 'crypto';

export default function UserDao() {
    this.getUser = (email,password) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE email=?';
            db.get(query, [email], (err, row) => {
                if (err) {
                    reject(err);
                }
                if (row === undefined) {
                    resolve(false);
                } else {
                    const user = {id: row.user_id, email: row.email, name: row.name};
                    
                    crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
                      if (err) reject(err);
                      if(!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword))
                        resolve(false);
                      else
                        resolve(user);
                    });
                }
            });
        });
    };
}
 