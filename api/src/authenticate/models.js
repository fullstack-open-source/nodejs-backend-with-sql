/**
 * User model structure
 * This is a reference model - implement actual database models as needed
 */

class User {
  constructor(data) {
    this.uid = data.uid || data.id;
    this.email = data.email;
    this.name = data.name;
    this.language = data.language || 'en';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON() {
    return {
      uid: this.uid,
      email: this.email,
      name: this.name,
      language: this.language,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = { User };

