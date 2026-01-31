# Person-Data-Store-Application

A secure person data management application with user authentication and permission-based access control. Built with Flask backend and vanilla JavaScript frontend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.3+-green.svg)

## Features

- 🔐 **User Authentication** - Secure registration and login system
- 🛡️ **Permission-Based Access Control** - Users can only perform actions they have permission for
- 👥 **Person CRUD Operations** - Create, Read, Update, Delete person records
- 👑 **Ownership Control** - Users can only modify their own records (admin users have full access)
- 🎯 **Role Management** - Flexible permission system with comma-separated permissions
- 💻 **Modern UI** - Clean, responsive interface with permission badges
- 🔄 **RESTful API** - Well-structured backend API

## Tech Stack

<img width="1880" height="972" alt="image" src="https://github.com/user-attachments/assets/453cafc1-f59b-4895-8c90-15f704771918" />

### Backend
- **Python** with **Flask** web framework
- **SQLAlchemy** ORM for database management
- **SQLite** database (easily switchable to PostgreSQL/MySQL)
- **Werkzeug** for password hashing and security

### Frontend
- **Vanilla JavaScript** (no frameworks)
- **HTML5** & **CSS3** with modern styling
- **Fetch API** for HTTP requests

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/person-data-store.git
cd person-data-store
```

2. **Create a virtual environment (recommended)**
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the application**
```bash
python app.py
```

5. **Access the application**
- Backend API: `http://localhost:5000`
- Frontend: Open `index.html` in your browser or serve it through Flask

## Database Schema

### User Table
```sql
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    permissions VARCHAR(500) DEFAULT 'read'
);
```

### Person Table
```sql
CREATE TABLE person (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(200),
    created_by INTEGER FOREIGN KEY REFERENCES user(id)
);
```

## Default Users

On first run, the application creates a default admin user:

- **Username:** `admin`
- **Password:** `admin123`
- **Permissions:** `read,create,update,delete,admin`

## Permission System

The application uses a flexible permission system with these predefined permissions:

| Permission | Description |
|------------|-------------|
| `read` | View person records |
| `create` | Add new person records |
| `update` | Edit existing person records |
| `delete` | Delete person records |
| `admin` | Full access to all records (bypasses ownership checks) |

### Ownership Rules
- Regular users can only edit/delete persons they created
- Users with `admin` permission can edit/delete all persons
- All users with `read` permission can view all persons

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
    "username": "newuser",
    "password": "password123",
    "permissions": "read,create"
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}
```

#### Logout
```http
POST /api/logout
```

### Person Endpoints

#### Get All Persons
```http
GET /api/persons
Requires: read permission
```

#### Get Single Person
```http
GET /api/persons/{id}
Requires: read permission
```

#### Create Person
```http
POST /api/persons
Content-Type: application/json
Requires: create permission

{
    "name": "John Doe",
    "age": 30,
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St"
}
```

#### Update Person
```http
PUT /api/persons/{id}
Content-Type: application/json
Requires: update permission + ownership or admin permission

{
    "name": "John Updated",
    "age": 31
}
```

#### Delete Person
```http
DELETE /api/persons/{id}
Requires: delete permission + ownership or admin permission
```

## Frontend Usage Guide

### 1. Registration
1. Enter username, password, and permissions (comma-separated)
2. Click "Register"
3. Permissions default to "read" if not specified

### 2. Login
1. Enter username and password
2. Click "Login"
3. Your permissions will be displayed as badges

### 3. Managing Persons
- **View Persons:** All logged-in users with `read` permission can view the persons table
- **Add Person:** Click "Add New Person" button (requires `create` permission)
- **Edit Person:** Click "Edit" button next to a person (requires `update` permission and ownership)
- **Delete Person:** Click "Delete" button (requires `delete` permission and ownership)

## Code Examples

### Using for...of Loop (Frontend)
```javascript
// Example from persons.js - iterating through persons
for (const person of persons) {
    console.log(`Processing: ${person.name}, Age: ${person.age}`);
    // Process each person
}
```

### Permission Decorator (Backend)
```python
@app.route('/api/persons', methods=['POST'])
@permission_required('create')
def create_person():
    # Only users with 'create' permission can access this endpoint
    pass
```

### Creating Custom Permissions
You can extend the permission system by adding new permission strings:
```python
# In app.py
EXPORT_PERMISSION = 'export'
ADVANCED_EDIT_PERMISSION = 'advanced_edit'

# When registering user
permissions = 'read,create,update,export'
```

## Project Structure
```
person-data-store/
├── app.py                 # Flask backend application
├── index.html            # Frontend HTML/JavaScript/CSS
├── requirements.txt      # Python dependencies
├── README.md            # This file
└── people.db            # SQLite database (created automatically)
```

## Security Features

- 🔒 **Password Hashing**: Uses Werkzeug's secure password hashing
- 🚫 **SQL Injection Protection**: SQLAlchemy provides parameterized queries
- 🔑 **Session Management**: Secure session handling with Flask
- 🛡️ **CSRF Protection**: Implemented through session tokens
- 👁️ **Input Validation**: Server-side validation for all inputs
- 🔍 **Ownership Verification**: Users can only modify their own data

## Error Handling

The application provides meaningful error messages:
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Resource already exists (e.g., duplicate email)

## Deployment

### Production Deployment Considerations

1. **Use a Production Server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. **Use a Production Database**
   ```python
   # In app.py
   app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/dbname'
   ```

3. **Set a Strong Secret Key**
   ```python
   app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-production-secret-key')
   ```

4. **Enable HTTPS**
   - Use a reverse proxy like Nginx
   - Obtain SSL certificates from Let's Encrypt

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support
Om Gedam

GitHub: @itsomg134

Email: omgedam123098@gmail.com

Twitter (X): @omgedam

LinkedIn: Om Gedam

Portfolio: https://ogworks.lovable.app



## Acknowledgments

- Built with [Flask](https://flask.palletsprojects.com/)
- Inspired by real-world permission-based systems
- Thanks to all contributors who help improve this project

