# InvoiceFlow

A modern, full-stack **Invoice Management System** built to simplify the process of managing companies, clients, products, invoices, and payments from a single platform.

InvoiceFlow provides a secure and user-friendly interface for creating and managing invoices, tracking payments, maintaining business information, and managing multiple companies independently.

---

## 🚀 Features

### 🔐 Authentication

* User registration and login
* Secure password hashing
* JWT-based authentication
* Google Login / Signup
* Support for both Google and email/password authentication
* Protected application routes
* Forgot password functionality

### 🏢 Multi-Company Management

* Create and manage multiple companies
* Switch between companies
* Separate business information for each company
* Company-level data isolation
* Manage clients, products, and invoices independently for each company

### 👥 Client Management

* Add new clients
* Edit client information
* View client details
* Delete clients
* Search clients
* Manage client contact and business information

### 📦 Product Management

* Add products and services
* Edit product information
* Delete products
* Product pricing
* Product descriptions
* Search and filter products
* Add products directly to invoices

### 🧾 Invoice Management

* Create invoices
* Edit invoices
* View invoice details
* Generate invoice pdf
* Download invoice pdf
* Send invoice pdf directly to client Mail
* Send Payment remainder directly to client Mail
* Delete invoices
* Add multiple products/items to invoices
* Automatic subtotal calculation
* Discount support
* Tax calculation
* Automatic grand total calculation
* Automatic amount due calculation
* Custom invoice numbering
* Currency support
* Business logo integration
* Invoice status management

### 💳 Payment Tracking

* Track invoice payments
* Record amount paid
* Automatically calculate remaining amount
* Payment status tracking
* Support for:

  * Unpaid
  * Partial
  * Paid

### 📊 Dashboard

The dashboard provides an overview of business invoicing activity, including:

* Total invoices
* Invoice amounts
* Paid amounts
* Outstanding amounts
* Invoice status
* Payment status
* Overall invoice statistics

### 🔎 Search & Filtering

* Search invoices
* Search by invoice number
* Search by client information
* Filter invoices by status
* Filter invoices by payment status
* Search and filter clients
* Search and filter products

### 🏪 Business Profile

* Manage business information
* Store business details
* Upload business logo
* Automatically use business information while creating invoices
* Company-specific business profiles

### 🕒 Invoice History

* View previously created invoices
* View invoice details
* Track invoice status
* Track payment status
* Monitor outstanding payments

### 🎨 User Interface

* Clean and modern interface
* Responsive design
* Desktop support
* Tablet support
* Mobile-friendly interface
* Light and dark theme support
* Reusable React components

---

# 🛠️ Tech Stack

## Frontend

* **React.js**
* **Vite**
* **JavaScript**
* **Tailwind CSS**
* **React Router**
* **Axios**

## Backend

* **Python**
* **FastAPI**
* **SQLAlchemy**
* **PostgreSQL**
* **bcrypt**
* **JWT**

## Authentication

* JWT Authentication
* Google OAuth

## Development Tools

* Git
* GitHub
* VS Code
* Postman

---

# 🏗️ Project Structure

```text
InvoiceFlow/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/
│   ├── routers/
│   ├── models/
│   ├── schemas/
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

---

# ⚙️ Installation & Setup

Follow the steps below to run InvoiceFlow locally.

## Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Python 3.10+
* PostgreSQL
* Git

---

# 1. Clone the Repository

```bash
git clone https://github.com/your-username/invoiceflow.git
```

Navigate to the project directory:

```bash
cd invoiceflow
```

---

# 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

## Create a Virtual Environment

### Windows

```bash
python -m venv venv
```

Activate the virtual environment:

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
```

Activate the virtual environment:

```bash
source venv/bin/activate
```

---

## Install Backend Dependencies

```bash
pip install -r requirements.txt
```

---

# 3. PostgreSQL Database Setup

Install and run PostgreSQL on your system.

Create a PostgreSQL database for InvoiceFlow.

Example:

```text
Database Name: invoiceflow
```

Configure your database connection using environment variables.

---

# 4. Backend Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/invoiceflow

SECRET_KEY=your_secret_key

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Replace the placeholder values with your actual configuration.

> **Important:** Never commit your `.env` file, database credentials, OAuth credentials, or secret keys to GitHub.

---

# 5. Start the Backend

From the `backend` directory, run:

```bash
uvicorn app.main:app --reload
```

The backend will start at:

```text
http://localhost:8000
```

FastAPI provides interactive API documentation at:

```text
http://localhost:8000/docs
```

---

# 6. Frontend Setup

Open a new terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

---

# 7. Frontend Environment Variables

Create a `.env` file inside the `frontend` directory.

Example:

```env
VITE_API_URL=http://localhost:8000
```

Make sure the URL points to your running backend.

---

# 8. Start the Frontend

Run:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Open the URL in your browser to use InvoiceFlow.

---

# 🔑 Google Authentication Setup

To enable Google Login / Signup:

1. Create a project in Google Cloud Console.
2. Configure OAuth credentials.
3. Create the required OAuth Client ID.
4. Add the required authorized origins and redirect URLs.
5. Add the Google credentials to the backend `.env` file.
6. Configure the frontend according to the authentication implementation.

Example environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> Do not expose the Google Client Secret in frontend code.

---

# 🌐 Running the Complete Application

InvoiceFlow requires both the frontend and backend to be running.

### Terminal 1 — Backend

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🔒 Security

InvoiceFlow implements several security practices, including:

* Password hashing using bcrypt
* JWT-based authentication
* Protected application routes
* Authenticated backend resources
* Environment variables for sensitive configuration
* Company-level data isolation
* Secure Google authentication configuration

Sensitive credentials should always be stored in environment variables and should never be committed to source control.

---

# 📱 Responsive Design

InvoiceFlow is designed to provide a consistent experience across different devices:

* 💻 Desktop
* 🖥️ Laptop
* 📱 Mobile
* 📟 Tablet

The interface uses Tailwind CSS and responsive layouts to adapt to different screen sizes.

---

# 📈 Future Improvements

Planned improvements for future versions may include:

* [ ] Recurring invoices
* [ ] Online payment integration
* [ ] Advanced financial analytics
* [ ] Expense management
* [ ] Custom invoice templates
* [ ] Mobile application
* [ ] Automated database backups

---

# 👨‍💻 Author

**Sujal Shukla**

B.Tech Computer Science (AI & ML)

---

# ⭐ Contributing

Contributions, suggestions, and improvements are welcome.

If you would like to contribute:

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Commit your changes

```bash
git commit -m "Add your feature"
```

5. Push the branch

```bash
git push origin feature/your-feature
```

6. Open a Pull Request

---

# 📄 License

MIT Licensed
