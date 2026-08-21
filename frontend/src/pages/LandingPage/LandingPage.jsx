import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  FiZap,
  FiShield,
  FiGlobe,
  FiCreditCard,
  FiBarChart2,
  FiUsers,
  FiMail,
  FiPhone,
  FiStar,
  FiChevronDown,
  FiFileText,
  FiMoon,
  FiSun,
  FiArrowRight,
  FiSend,
  FiDownload,
  FiPackage,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";

import Avatar from "../../components/ui/Avatar";
import { useTheme } from "../../context/ThemeContext";

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();

  // =========================================================
  // FEATURES
  // =========================================================

  const features = [
    {
      icon: FiFileText,
      title: "Professional Invoices",
      description:
        "Create professional invoices with products, quantities, prices, taxes, discounts, client details, and automatically calculated totals.",
    },
    {
      icon: FiUsers,
      title: "Client Management",
      description:
        "Create and manage client profiles with important contact and business information in one centralized place.",
    },
    {
      icon: FiPackage,
      title: "Product Management",
      description:
        "Maintain your product catalog and quickly add products to invoices with pricing and quantity information.",
    },
    {
      icon: FiCreditCard,
      title: "Payment Tracking",
      description:
        "Track paid, partially paid, and unpaid invoices while keeping an eye on exactly how much is still outstanding.",
    },
    {
      icon: FiSend,
      title: "Payment Reminders",
      description:
        "Select a client, view their outstanding invoices, choose one or multiple invoices, and prepare payment reminders.",
    },
    {
      icon: FiDownload,
      title: "Export Reports",
      description:
        "Export your invoice and payment information into a CSV report for analysis, record keeping, or further processing.",
    },
    {
      icon: FiBarChart2,
      title: "Business Dashboard",
      description:
        "Get a clear overview of revenue, invoices, received payments, pending amounts, and overall business activity.",
    },
    {
      icon: FiTrendingUp,
      title: "Revenue Analytics",
      description:
        "Visualize your business revenue with monthly, yearly, and all-time revenue insights.",
    },
    {
      icon: FiCheckCircle,
      title: "Invoice Status Tracking",
      description:
        "Monitor invoice statuses including paid, partial, unpaid, draft, and cancelled invoices.",
    },
    {
      icon: FiGlobe,
      title: "Multiple Currencies",
      description:
        "Create and manage invoices using different currencies with accurate currency formatting throughout the application.",
    },
    {
      icon: FiShield,
      title: "Secure Authentication",
      description:
        "Protect your account with secure registration, login, password handling, and authenticated access to your business data.",
    },
    {
      icon: FiMoon,
      title: "Light & Dark Mode",
      description:
        "Switch between light and dark themes for a comfortable invoicing experience throughout the day.",
    },
  ];

  // =========================================================
  // TESTIMONIALS
  // =========================================================

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Freelance Designer",
      company: "DesignStudio",
      content:
        "InvoiceFlow has transformed how I handle billing. It is fast, professional, and incredibly easy to use.",
      avatar: "SJ",
    },
    {
      name: "Michael Chen",
      role: "Business Owner",
      company: "TechStart Inc",
      content:
        "We have significantly reduced the time spent creating and managing invoices since using InvoiceFlow.",
      avatar: "MC",
    },
    {
      name: "Emily Rodriguez",
      role: "Project Manager",
      company: "Global Solutions",
      content:
        "The clean interface makes managing clients and invoices simple. Everything I need is in one place.",
      avatar: "ER",
    },
  ];

  // =========================================================
  // HOW IT WORKS
  // =========================================================

  const steps = [
    {
      number: "01",
      title: "Add Clients & Products",
      description:
        "Create your client profiles and product catalog once, then reuse them whenever you create an invoice.",
    },
    {
      number: "02",
      title: "Create & Track Invoices",
      description:
        "Generate professional invoices, manage invoice statuses, and track received and pending payments from your dashboard.",
    },
    {
      number: "03",
      title: "Follow Up & Export",
      description:
        "Send reminders for outstanding invoices and export your invoice and payment data whenever you need it.",
    },
  ];

  // =========================================================
  // FAQ
  // =========================================================

  const faqs = [
    {
      question: "What is InvoiceFlow?",
      answer:
        "InvoiceFlow is a modern invoicing and business management platform that helps you create invoices, manage clients and products, track payments, send reminders, and monitor your business from one dashboard.",
    },
    {
      question: "Can I create professional invoices?",
      answer:
        "Yes. You can create professional invoices with client details, products, quantities, prices, taxes, discounts, currency, and automatically calculated totals.",
    },
    {
      question: "Can I track partial and unpaid payments?",
      answer:
        "Yes. InvoiceFlow tracks paid, partially paid, and unpaid invoices so you can see how much has been received and how much is still pending.",
    },
    {
      question: "Can I send payment reminders to clients?",
      answer:
        "Yes. You can select a client, view their outstanding invoices, choose one or multiple invoices, and prepare a payment reminder addressed to the client email associated with their profile.",
    },
    {
      question: "Can I export my invoice data?",
      answer:
        "Yes. You can export your invoice and payment information as a CSV report containing invoice numbers, clients, dates, totals, paid amounts, pending amounts, and payment status.",
    },
    {
      question: "Can I manage clients and products?",
      answer:
        "Yes. InvoiceFlow provides dedicated client and product management so you can organize your business information and reuse it while creating invoices.",
    },
    {
      question: "Does InvoiceFlow provide business analytics?",
      answer:
        "Yes. The dashboard provides revenue insights, invoice statistics, received amounts, pending amounts, invoice status breakdowns, recent invoices, and recent activity.",
    },
    {
      question: "Does InvoiceFlow support multiple currencies?",
      answer:
        "Yes. InvoiceFlow supports invoice currency selection and displays amounts using the appropriate currency formatting.",
    },
    {
      question: "Is InvoiceFlow secure?",
      answer:
        "InvoiceFlow uses authenticated accounts and secure backend practices to help protect your account and business information.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between h-16">

            {/* Logo */}

            <Link to="/" className="flex items-center gap-2.5">

              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <FiFileText
                  className="text-white"
                  size={19}
                />
              </div>

              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                InvoiceFlow
              </span>

            </Link>

            {/* Desktop Navigation */}

            <div className="hidden md:flex items-center gap-8">

              <a
                href="#features"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Features
              </a>

              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                How It Works
              </a>

              <a
                href="#testimonials"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                Testimonials
              </a>

              <a
                href="#faq"
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
              >
                FAQ
              </a>

            </div>

            {/* Right Navigation */}

            <div className="flex items-center gap-2 sm:gap-3">

              {/* Theme Toggle */}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="
                  w-10 h-10
                  flex items-center justify-center
                  rounded-xl
                  text-gray-600 dark:text-gray-300
                  bg-gray-100 dark:bg-gray-800
                  hover:bg-gray-200 dark:hover:bg-gray-700
                  transition-all duration-200
                "
              >
                {theme === "dark" ? (
                  <FiSun size={19} />
                ) : (
                  <FiMoon size={19} />
                )}
              </button>

              {/* Sign In */}

              <Link
                to="/login"
                className="
                  hidden sm:inline-flex
                  items-center justify-center
                  px-4 py-2
                  rounded-xl
                  text-sm font-semibold
                  text-gray-700 dark:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  transition-all duration-200
                "
              >
                Sign In
              </Link>

              {/* Get Started */}

              <Link
                to="/register"
                className="
                  inline-flex items-center justify-center
                  px-4 sm:px-5 py-2.5
                  rounded-xl
                  text-sm font-semibold
                  text-white
                  bg-primary
                  hover:bg-primary-dark
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                "
              >
                Get Started
              </Link>

            </div>

          </div>

        </div>

      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden py-20 lg:py-28">

        {/* Background */}

        <div className="absolute inset-0 pointer-events-none">

          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent dark:from-primary/10" />

          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="absolute -bottom-40 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-4xl mx-auto">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >

              {/* Badge */}

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/10 text-primary text-sm font-semibold mb-7">

                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />

                Simple invoicing for modern businesses

              </div>

              {/* Heading */}

              <h1
                className="
                  text-4xl
                  sm:text-5xl
                  lg:text-6xl
                  font-bold
                  tracking-tight
                  text-gray-900
                  dark:text-white
                  leading-tight
                  mb-6
                "
              >
                Professional Invoicing

                <br />

                <span className="text-primary">
                  Made Simple
                </span>
              </h1>

              {/* Description */}

              <p
                className="
                  text-lg
                  sm:text-xl
                  text-gray-600
                  dark:text-gray-400
                  max-w-2xl
                  mx-auto
                  leading-relaxed
                  mb-10
                "
              >
                Create professional invoices, manage clients and products,
                track payments, send payment reminders, and export your
                business data — all from one powerful workspace.
              </p>

              {/* Hero Buttons */}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                <Link
                  to="/register"
                  className="
                    group
                    inline-flex items-center justify-center
                    px-7 py-3.5
                    rounded-xl
                    bg-primary
                    text-white
                    font-semibold
                    shadow-lg shadow-primary/20
                    hover:bg-primary-dark
                    hover:shadow-xl
                    hover:-translate-y-0.5
                    transition-all duration-200
                  "
                >
                  Get Started Free

                  <FiArrowRight
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                    size={18}
                  />

                </Link>

                <Link
                  to="/login"
                  className="
                    inline-flex items-center justify-center
                    px-7 py-3.5
                    rounded-xl
                    bg-white
                    dark:bg-dark-card
                    text-gray-900
                    dark:text-white
                    font-semibold
                    border border-gray-200
                    dark:border-gray-700
                    shadow-sm
                    hover:bg-gray-50
                    dark:hover:bg-gray-800
                    transition-all duration-200
                  "
                >
                  Sign In
                </Link>

              </div>

            </motion.div>

          </div>

          {/* Dashboard Preview */}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
            }}
            className="mt-16 lg:mt-20"
          >

            <div className="relative max-w-5xl mx-auto">

              <div className="
                absolute
                -inset-4
                bg-primary/10
                rounded-3xl
                blur-2xl
              " />

              <div className="
                relative
                rounded-2xl
                p-1.5
                bg-gradient-to-br
                from-primary
                to-primary-dark
                shadow-2xl
              ">

                <div className="
                  rounded-xl
                  overflow-hidden
                  bg-gray-100
                  dark:bg-gray-800
                  border
                  border-white/20
                ">

                  <img
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=700&fit=crop"
                    alt="InvoiceFlow dashboard preview"
                    className="w-full h-auto opacity-95"
                  />

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ===================================================== */}

      <section
        id="features"
        className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Features
            </span>

            <h2
              className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Everything you need to manage your invoicing workflow
            </h2>

            <p
              className="
                mt-4
                text-lg
                text-gray-600
                dark:text-gray-400
              "
            >
              From creating invoices to tracking payments, sending reminders,
              and exporting reports, InvoiceFlow brings your essential
              business tools together in one place.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {features.map((feature, index) => {

              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                  }}
                  viewport={{
                    once: true,
                  }}
                >

                  <div
                    className="
                      h-full
                      p-7
                      rounded-2xl
                      bg-white
                      dark:bg-dark-card
                      border
                      border-gray-200
                      dark:border-gray-800
                      shadow-sm
                      hover:shadow-lg
                      hover:-translate-y-1
                      transition-all duration-300
                    "
                  >

                    <div
                      className="
                        w-12 h-12
                        rounded-xl
                        bg-primary/10
                        flex items-center justify-center
                        mb-5
                      "
                    >

                      <Icon
                        className="text-primary"
                        size={24}
                      />

                    </div>

                    <h3
                      className="
                        text-lg
                        font-semibold
                        text-gray-900
                        dark:text-white
                        mb-2
                      "
                    >
                      {feature.title}
                    </h3>

                    <p
                      className="
                        text-gray-600
                        dark:text-gray-400
                        leading-relaxed
                      "
                    >
                      {feature.description}
                    </p>

                  </div>

                </motion.div>
              );
            })}

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how-it-works"
        className="py-20 lg:py-24"
      >

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              How it works
            </span>

            <h2
              className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Start managing invoices in minutes
            </h2>

            <p
              className="
                mt-4
                text-lg
                text-gray-600
                dark:text-gray-400
                max-w-2xl
                mx-auto
              "
            >
              A simple workflow designed to help you spend less time
              managing invoices and more time growing your business.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {steps.map((step, index) => (

              <motion.div
                key={step.number}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
                className="text-center"
              >

                <div
                  className="
                    w-14 h-14
                    mx-auto
                    rounded-2xl
                    bg-primary
                    text-white
                    flex items-center justify-center
                    text-lg
                    font-bold
                    shadow-lg
                    shadow-primary/20
                    mb-5
                  "
                >
                  {step.number}
                </div>

                <h3
                  className="
                    text-xl
                    font-semibold
                    text-gray-900
                    dark:text-white
                    mb-3
                  "
                >
                  {step.title}
                </h3>

                <p
                  className="
                    text-gray-600
                    dark:text-gray-400
                    leading-relaxed
                  "
                >
                  {step.description}
                </p>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURE HIGHLIGHT
      ===================================================== */}

      <section className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Content */}

            <motion.div
              initial={{
                opacity: 0,
                x: -30,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              viewport={{
                once: true,
              }}
            >

              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Stay on top of payments
              </span>

              <h2
                className="
                  mt-3
                  text-3xl
                  md:text-4xl
                  font-bold
                  text-gray-900
                  dark:text-white
                "
              >
                Know exactly what is paid and what is pending
              </h2>

              <p
                className="
                  mt-5
                  text-lg
                  text-gray-600
                  dark:text-gray-400
                  leading-relaxed
                "
              >
                InvoiceFlow gives you a clear picture of your outstanding
                payments. Quickly identify partial and unpaid invoices,
                select a client, and send payment reminders for the invoices
                that need attention.
              </p>

              <div className="mt-7 space-y-4">

                {[
                  "Track paid, partial, and unpaid invoices",
                  "See received and pending amounts",
                  "Select individual or multiple invoices for reminders",
                  "Send reminders directly to the client's email",
                  "Keep payment information organized",
                ].map((item) => (

                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >

                    <div
                      className="
                        mt-0.5
                        w-6 h-6
                        rounded-full
                        bg-primary/10
                        flex items-center justify-center
                        flex-shrink-0
                      "
                    >
                      <FiCheckCircle
                        className="text-primary"
                        size={15}
                      />
                    </div>

                    <span className="text-gray-700 dark:text-gray-300">
                      {item}
                    </span>

                  </div>

                ))}

              </div>

            </motion.div>

            {/* Visual */}

            <motion.div
              initial={{
                opacity: 0,
                x: 30,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
              }}
              viewport={{
                once: true,
              }}
            >

              <div
                className="
                  relative
                  rounded-3xl
                  bg-white
                  dark:bg-dark-card
                  border
                  border-gray-200
                  dark:border-gray-800
                  shadow-xl
                  p-6
                "
              >

                <div className="flex items-center justify-between mb-6">

                  <div>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pending Payments
                    </p>

                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      ₹24,500
                    </h3>

                  </div>

                  <div
                    className="
                      w-12 h-12
                      rounded-xl
                      bg-yellow-100
                      dark:bg-yellow-900/30
                      flex items-center justify-center
                    "
                  >
                    <FiClock
                      className="text-yellow-600 dark:text-yellow-400"
                      size={22}
                    />
                  </div>

                </div>

                <div className="space-y-3">

                  {[
                    {
                      invoice: "INV-001",
                      client: "Rahul Enterprises",
                      amount: "₹8,500",
                    },
                    {
                      invoice: "INV-004",
                      client: "ABC Solutions",
                      amount: "₹12,000",
                    },
                    {
                      invoice: "INV-007",
                      client: "Tech Services",
                      amount: "₹4,000",
                    },
                  ].map((item) => (

                    <div
                      key={item.invoice}
                      className="
                        flex items-center justify-between
                        gap-3
                        p-4
                        rounded-xl
                        bg-gray-50
                        dark:bg-gray-800/60
                      "
                    >

                      <div className="min-w-0">

                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                          {item.invoice}
                        </p>

                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {item.client}
                        </p>

                      </div>

                      <span className="font-semibold text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {item.amount}
                      </span>

                    </div>

                  ))}

                </div>

                <div className="mt-5">

                  <div
                    className="
                      w-full
                      py-3
                      rounded-xl
                      bg-primary
                      text-white
                      text-center
                      text-sm
                      font-semibold
                    "
                  >
                    Send Payment Reminder
                  </div>

                </div>

              </div>

            </motion.div>

          </div>

        </div>

      </section>

      {/* =====================================================
          TESTIMONIALS
      ===================================================== */}

      <section
        id="testimonials"
        className="py-20 lg:py-24"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              Testimonials
            </span>

            <h2
              className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Built to make business easier
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {testimonials.map((testimonial, index) => (

              <motion.div
                key={testimonial.name}
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{
                  once: true,
                }}
              >

                <div
                  className="
                    h-full
                    p-7
                    rounded-2xl
                    bg-white
                    dark:bg-dark-card
                    border
                    border-gray-200
                    dark:border-gray-800
                    shadow-sm
                  "
                >

                  <div className="flex items-center gap-1 mb-5">

                    {[...Array(5)].map((_, i) => (

                      <FiStar
                        key={i}
                        className="text-yellow-400 fill-yellow-400"
                        size={16}
                      />

                    ))}

                  </div>

                  <p
                    className="
                      text-gray-600
                      dark:text-gray-400
                      leading-relaxed
                      mb-7
                    "
                  >
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-3">

                    <Avatar
                      name={testimonial.avatar}
                      size="md"
                    />

                    <div>

                      <p
                        className="
                          font-semibold
                          text-gray-900
                          dark:text-white
                        "
                      >
                        {testimonial.name}
                      </p>

                      <p
                        className="
                          text-sm
                          text-gray-500
                          dark:text-gray-400
                        "
                      >
                        {testimonial.role}, {testimonial.company}
                      </p>

                    </div>

                  </div>

                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section
        id="faq"
        className="py-20 lg:py-24 bg-gray-50 dark:bg-gray-900/50"
      >

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">

            <span className="text-sm font-semibold text-primary uppercase tracking-wider">
              FAQ
            </span>

            <h2
              className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
                text-gray-900
                dark:text-white
              "
            >
              Frequently asked questions
            </h2>

            <p
              className="
                mt-4
                text-lg
                text-gray-600
                dark:text-gray-400
              "
            >
              Everything you need to know about InvoiceFlow.
            </p>

          </div>

          <div className="space-y-3">

            {faqs.map((faq, index) => (

              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />

            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section
        className="
          relative
          overflow-hidden
          py-20
          lg:py-24
          bg-primary
        "
      >

        <div
          className="
            absolute
            -top-32
            -right-32
            w-96
            h-96
            bg-white/10
            rounded-full
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-32
            -left-32
            w-96
            h-96
            bg-black/10
            rounded-full
            blur-3xl
          "
        />

        <div
          className="
            relative
            max-w-4xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            text-center
          "
        >

          <h2
            className="
              text-3xl
              md:text-4xl
              font-bold
              text-white
              mb-5
            "
          >
            Simplify your invoicing workflow today.

            <br className="hidden sm:block" />

            Focus on your business, not paperwork.
          </h2>

          <p
            className="
              text-lg
              md:text-xl
              text-white/80
              max-w-2xl
              mx-auto
              mb-9
            "
          >
            Create invoices, manage clients, track payments,
            send reminders, and understand your business
            from one simple workspace.
          </p>

          <div
            className="
              flex
              flex-col
              sm:flex-row
              items-center
              justify-center
              gap-4
            "
          >

            <Link
              to="/register"
              className="
                inline-flex
                items-center
                justify-center
                px-8
                py-3.5
                rounded-xl
                bg-white
                text-primary
                font-semibold
                shadow-lg
                hover:bg-gray-100
                hover:shadow-xl
                hover:-translate-y-0.5
                transition-all duration-200
              "
            >
              Start Free Trial

              <FiArrowRight
                className="ml-2"
                size={18}
              />

            </Link>

            <Link
              to="/login"
              className="
                inline-flex
                items-center
                justify-center
                px-8
                py-3.5
                rounded-xl
                bg-transparent
                text-white
                font-semibold
                border
                border-white/50
                hover:bg-white/10
                hover:border-white
                transition-all duration-200
              "
            >
              Sign In
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-gray-950 py-12">

        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
          "
        >

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-10
              mb-10
            "
          >

            {/* Brand */}

            <div>

              <Link
                to="/"
                className="flex items-center gap-2.5 mb-4"
              >

                <div
                  className="
                    w-9
                    h-9
                    rounded-xl
                    bg-primary
                    flex
                    items-center
                    justify-center
                  "
                >
                  <FiFileText
                    className="text-white"
                    size={19}
                  />
                </div>

                <span
                  className="
                    text-xl
                    font-bold
                    text-white
                  "
                >
                  InvoiceFlow
                </span>

              </Link>

              <p
                className="
                  text-gray-400
                  text-sm
                  leading-relaxed
                  max-w-xs
                "
              >
                Professional invoicing and business management
                made simple.
              </p>

            </div>

            {/* Product */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Product
              </h4>

              <ul className="space-y-3">

                <li>
                  <a
                    href="#features"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>

                <li>
                  <a
                    href="#how-it-works"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>

                <li>
                  <a
                    href="#faq"
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    FAQ
                  </a>
                </li>

              </ul>

            </div>

            {/* Features */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Features
              </h4>

              <ul className="space-y-3">

                <li>
                  <span className="text-sm text-gray-400">
                    Invoice Management
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Payment Tracking
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Payment Reminders
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Business Analytics
                  </span>
                </li>

              </ul>

            </div>

            {/* Support */}

            <div>

              <h4 className="font-semibold text-white mb-4">
                Support
              </h4>

              <ul className="space-y-3">

                <li>
                  <span className="text-sm text-gray-400">
                    Help Center
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Privacy
                  </span>
                </li>

                <li>
                  <span className="text-sm text-gray-400">
                    Terms
                  </span>
                </li>

              </ul>

            </div>

          </div>

          {/* Footer Bottom */}

          <div
            className="
              border-t
              border-gray-800
              pt-7
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-4
            "
          >

            <p className="text-gray-500 text-sm">
              © 2026 InvoiceFlow. All rights reserved.
            </p>

            <div className="flex items-center gap-5">

              <a
                href="mailto:support@invoiceflow.com"
                className="
                  text-gray-500
                  hover:text-white
                  transition-colors
                "
                aria-label="Email"
              >
                <FiMail size={19} />
              </a>

              <a
                href="tel:+10000000000"
                className="
                  text-gray-500
                  hover:text-white
                  transition-colors
                "
                aria-label="Phone"
              >
                <FiPhone size={19} />
              </a>

            </div>

          </div>

        </div>

      </footer>

    </div>
  );
};

// =========================================================
// FAQ ITEM
// =========================================================

const FAQItem = ({ question, answer }) => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="
        border
        border-gray-200
        dark:border-gray-800
        rounded-2xl
        overflow-hidden
        bg-white
        dark:bg-dark-card
      "
    >

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full
          flex
          items-center
          justify-between
          px-5
          sm:px-6
          py-5
          text-left
          hover:bg-gray-50
          dark:hover:bg-gray-800/60
          transition-colors
        "
      >

        <span
          className="
            font-semibold
            text-gray-900
            dark:text-white
            pr-6
          "
        >
          {question}
        </span>

        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{
            duration: 0.2,
          }}
          className="flex-shrink-0"
        >

          <FiChevronDown
            className="text-gray-400"
            size={20}
          />

        </motion.div>

      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.25,
        }}
        className="overflow-hidden"
      >

        <div
          className="
            px-5
            sm:px-6
            pb-5
            text-gray-600
            dark:text-gray-400
            leading-relaxed
          "
        >
          {answer}
        </div>

      </motion.div>

    </div>
  );
};

export default LandingPage;