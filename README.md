# 🧾 InvoiceFlow

<p align="center">
  <img src="https://img.shields.io/badge/InvoiceFlow-Invoice%20Management%20Platform-2563EB?style=for-the-badge&logo=invoice&logoColor=white" alt="InvoiceFlow"/>
</p>

<p align="center">
  <strong>A modern, full-stack invoice management platform for creating, managing, tracking and sharing professional invoices.</strong>
</p>

<p align="center">
  Built with React, FastAPI, PostgreSQL and modern UI technologies.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-overview">API</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

---

## ✨ Overview

**InvoiceFlow** is a full-stack invoice management application designed to simplify the complete invoicing workflow for small businesses, freelancers and independent professionals.

Instead of managing invoices through spreadsheets or manually created documents, InvoiceFlow provides a centralized platform where users can:

- Create professional invoices
- Manage clients
- Manage products and services
- Track invoice and payment status
- Monitor revenue and pending payments
- Search and filter invoices
- View invoice history
- Export financial reports
- Send payment reminders
- Manage business/profile information
- Use multi-currency invoices
- Authenticate securely
- And more

The project follows a modern **React + FastAPI + PostgreSQL** architecture with a responsive dashboard and RESTful APIs.

---

# 🚀 Features

## 🔐 Authentication

Secure user authentication system with:

- User registration
- User login
- Password hashing using BCrypt
- Forgot password workflow
- Password validation
- Password strength validation
- Google Authentication
- Email/password authentication
- Protected application routes
- Persistent authentication state

---

## 📊 Dashboard

A dynamic dashboard that provides a quick overview of business performance.

### Dashboard statistics

- 💰 Total Revenue
- 🧾 Total Invoices
- ✅ Received Amount
- ⏳ Pending Amount

### Analytics

- Revenue overview
- Invoice status distribution
- Paid invoices
- Partially paid invoices
- Unpaid invoices
- Draft invoices
- Cancelled invoices

### Revenue filters

- Last 6 months
- Last year
- All time

---

## 🧾 Invoice Management

Complete invoice lifecycle management.

### Create invoices

Create professional invoices with:

- Invoice number
- Invoice date
- Due date
- Client information
- Products/services
- Quantity
- Unit price
- Tax
- Discount
- Subtotal
- Grand total
- Currency
- Payment status
- Notes

### Invoice statuses

InvoiceFlow supports:

```text
Draft
Unpaid
Partial
Paid
Cancelled